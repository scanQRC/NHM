import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {after, before, test} from 'node:test';
import express from 'express';
import {createApp} from '../server/app.ts';
import {OTP_TTL_MS} from '../server/auth.ts';
import {initDatabase} from '../server/db.ts';
import {
  type OutboundEmailPayload,
  ResendDeliveryError,
  createResendMailSender,
  isMailConfigured,
} from '../server/mailer.ts';

function extractCookieValue(setCookieHeaders: string[], name: string): string | null {
  for (const header of setCookieHeaders) {
    if (header.startsWith(`${name}=`)) {
      return header.split(';')[0].slice(name.length + 1);
    }
  }
  return null;
}

function extractSixDigitOtp(payload: OutboundEmailPayload): string {
  const match = /\b(\d{6})\b/.exec(payload.text);
  if (!match) {
    throw new Error(`No 6-digit OTP found in email: ${payload.text}`);
  }
  return match[1];
}

let tempDir: string;
let dbPath: string;
let server: http.Server;
let baseUrl: string;
let db: ReturnType<typeof initDatabase>;
let sentEmails: OutboundEmailPayload[] = [];
let mailEnabled = true;

before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nmh-owner-auth-test-'));
  dbPath = path.join(tempDir, 'nmh-test.db');
  db = initDatabase(dbPath);

  const app = createApp(db, {
    mailConfiguredOverride: true,
    sendMail: async (payload) => {
      if (!mailEnabled) {
        throw new Error('RESEND_DISABLED_FOR_TEST');
      }
      sentEmails.push(payload);
    },
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('<html><body>SPA</body></html>');
    }
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (db) {
    db.close();
  }
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, {recursive: true, force: true});
  }
});

test('1. Setup status never exposes authorized email & rejects any unauthorized email', async () => {
  const statusRes = await fetch(`${baseUrl}/api/auth/setup-status`);
  assert.equal(statusRes.status, 200);
  const statusText = await statusRes.text();
  assert.ok(!statusText.includes('scaninfoqr@gmail.com'), 'Authorized email must never be leaked to client');

  // Public registration routes permanently return 403
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {method: 'POST'});
  assert.equal(regRes.status, 403);
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {method: 'POST'});
  assert.equal(signupRes.status, 403);

  // Any other email is strictly rejected during initial setup
  const unauthSetup = await fetch(`${baseUrl}/api/auth/setup`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      username: 'intruder',
      email: 'intruder@gmail.com',
      displayName: 'Intruder',
      password: 'StrongPassword!99',
    }),
  });
  assert.equal(unauthSetup.status, 403);
});

test('2. Initial Main Admin one-time setup succeeds ONLY for scaninfoqr@gmail.com and never skips OTP login', async () => {
  const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      username: 'nmhowner',
      email: 'scaninfoqr@gmail.com',
      displayName: 'NMH Owner',
      password: 'OwnerPassword!2026',
    }),
  });
  assert.equal(setupRes.status, 201);
  // Setup must NOT set a session cookie without 6-digit OTP login
  assert.equal(extractCookieValue(setupRes.headers.getSetCookie(), 'nmh_admin_session'), null);

  // Setup endpoint is permanently disabled afterwards
  const secondSetup = await fetch(`${baseUrl}/api/auth/setup`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      username: 'nmhowner2',
      email: 'scaninfoqr@gmail.com',
      password: 'OwnerPassword!2026',
    }),
  });
  assert.equal(secondSetup.status, 403);
});

test('3. Login requires authorized email + password + real 6-digit OTP sent to scaninfoqr@gmail.com', async () => {
  sentEmails = [];

  // Unknown email does not trigger OTP or auto-create an account
  const unknownLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'someone@gmail.com', password: 'OwnerPassword!2026'}),
  });
  assert.equal(unknownLogin.status, 401);
  assert.equal(sentEmails.length, 0);

  // Valid email + password dispatches real 6-digit OTP to scaninfoqr@gmail.com
  const step1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'scaninfoqr@gmail.com', password: 'OwnerPassword!2026'}),
  });
  assert.equal(step1.status, 200);
  const step1Body = (await step1.json()) as {
    otpRequired: boolean;
    challengeId: string;
    maskedEmail: string;
    otp?: string;
  };
  assert.equal(step1Body.otpRequired, true);
  assert.equal(step1Body.otp, undefined, 'OTP must never be leaked in HTTP response');
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'scaninfoqr@gmail.com');

  const realOtp = extractSixDigitOtp(sentEmails[0]);

  // Wrong OTP is rejected
  const wrongOtp = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId: step1Body.challengeId, otp: '000000'}),
  });
  assert.equal(wrongOtp.status, 401);

  // Correct 6-digit OTP completes sign-in and issues HttpOnly cookie
  const step2 = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId: step1Body.challengeId, otp: realOtp}),
  });
  assert.equal(step2.status, 200);
  const step2Body = (await step2.json()) as {
    user: {email: string; role: string};
    isTemporaryTestEmail: boolean;
  };
  assert.equal(step2Body.user.email, 'scaninfoqr@gmail.com');
  assert.equal(step2Body.user.role, 'main_admin');
  assert.equal(step2Body.isTemporaryTestEmail, true);

  const cookieVal = extractCookieValue(step2.headers.getSetCookie(), 'nmh_admin_session');
  assert.ok(cookieVal);

  // Reusing the same OTP is blocked
  const replayOtp = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId: step1Body.challengeId, otp: realOtp}),
  });
  assert.equal(replayOtp.status, 401);
});

test('4. Only Main Admin can invite staff and assign granular permissions enforced on APIs', async () => {
  // Login as Main Admin via OTP
  sentEmails = [];
  const step1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'scaninfoqr@gmail.com', password: 'OwnerPassword!2026'}),
  });
  const {challengeId} = (await step1.json()) as {challengeId: string};
  const otp = extractSixDigitOtp(sentEmails[0]);
  const step2 = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId, otp}),
  });
  const ownerCookie = `nmh_admin_session=${extractCookieValue(step2.headers.getSetCookie(), 'nmh_admin_session')}`;

  // Invite a staff member with view-only permission (no add, no delete, no settings)
  const inviteRes = await fetch(`${baseUrl}/api/admin/staff/invite`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Cookie: ownerCookie},
    body: JSON.stringify({
      email: 'counterstaff@nationalmedicalhall.in',
      displayName: 'Counter Pharmacist',
      permissions: {
        canViewRecords: true,
        canAddRecords: false,
        canDeleteRecords: false,
        canPrintRecords: true,
        canExportBackup: false,
        canManageSettings: false,
      },
    }),
  });
  assert.equal(inviteRes.status, 201);
  const {invitePath} = (await inviteRes.json()) as {invitePath: string};
  const inviteToken = new URL(`http://localhost${invitePath}`).searchParams.get('token')!;
  assert.ok(inviteToken);

  // Attempting to accept invite with mismatched email fails (403)
  const badEmailAccept = await fetch(`${baseUrl}/api/auth/accept-invite`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      token: inviteToken,
      email: 'wrong@example.com',
      username: 'staff1',
      password: 'StaffPassword!2026',
    }),
  });
  assert.equal(badEmailAccept.status, 403);

  // Valid acceptance activates staff account
  const acceptRes = await fetch(`${baseUrl}/api/auth/accept-invite`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      token: inviteToken,
      email: 'counterstaff@nationalmedicalhall.in',
      username: 'counterstaff1',
      password: 'StaffPassword!2026',
    }),
  });
  assert.equal(acceptRes.status, 201);

  // Staff signs in using email + password + 6-digit OTP
  sentEmails = [];
  const staffLogin1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'counterstaff@nationalmedicalhall.in',
      password: 'StaffPassword!2026',
    }),
  });
  assert.equal(staffLogin1.status, 200);
  const staffChallenge = (await staffLogin1.json()) as {challengeId: string};
  const staffOtp = extractSixDigitOtp(sentEmails[0]);
  const staffLogin2 = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId: staffChallenge.challengeId, otp: staffOtp}),
  });
  assert.equal(staffLogin2.status, 200);
  const staffCookie = `nmh_admin_session=${extractCookieValue(staffLogin2.headers.getSetCookie(), 'nmh_admin_session')}`;

  // Staff CAN view records
  const staffView = await fetch(`${baseUrl}/api/admin/records`, {headers: {Cookie: staffCookie}});
  assert.equal(staffView.status, 200);

  // Staff CANNOT upload records (403) or invite other staff (403)
  const staffAdd = await fetch(`${baseUrl}/api/admin/records`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Cookie: staffCookie},
    body: JSON.stringify({patientName: 'Test'}),
  });
  assert.equal(staffAdd.status, 403);

  const staffInviteOther = await fetch(`${baseUrl}/api/admin/staff/invite`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Cookie: staffCookie},
    body: JSON.stringify({email: 'other@example.com', displayName: 'Other'}),
  });
  assert.equal(staffInviteOther.status, 403);
});

test('5. Owner-controlled email replacement updates authorized Main Admin email via password + new-email OTP', async () => {
  // Sign in as current Main Admin (scaninfoqr@gmail.com)
  sentEmails = [];
  const l1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'scaninfoqr@gmail.com', password: 'OwnerPassword!2026'}),
  });
  const {challengeId} = (await l1.json()) as {challengeId: string};
  const l2 = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId, otp: extractSixDigitOtp(sentEmails[0])}),
  });
  const ownerCookie = `nmh_admin_session=${extractCookieValue(l2.headers.getSetCookie(), 'nmh_admin_session')}`;

  // Request email replacement to official NMH owner email
  sentEmails = [];
  const reqChange = await fetch(`${baseUrl}/api/admin/owner-email/request-change`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Cookie: ownerCookie},
    body: JSON.stringify({
      currentPassword: 'OwnerPassword!2026',
      newEmail: 'owner@nationalmedicalhall.in',
    }),
  });
  assert.equal(reqChange.status, 200);
  const changeBody = (await reqChange.json()) as {challengeId: string};
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'owner@nationalmedicalhall.in');

  const confirmChange = await fetch(`${baseUrl}/api/admin/owner-email/confirm-change`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Cookie: ownerCookie},
    body: JSON.stringify({
      challengeId: changeBody.challengeId,
      otp: extractSixDigitOtp(sentEmails[0]),
    }),
  });
  assert.equal(confirmChange.status, 200);
  const confirmJson = (await confirmChange.json()) as {newEmail: string; isTemporaryTestEmail: boolean};
  assert.equal(confirmJson.newEmail, 'owner@nationalmedicalhall.in');
  assert.equal(confirmJson.isTemporaryTestEmail, false);

  // Old test email is now rejected; new official email works
  const oldEmailLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'scaninfoqr@gmail.com', password: 'OwnerPassword!2026'}),
  });
  assert.equal(oldEmailLogin.status, 401);

  sentEmails = [];
  const newEmailLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'owner@nationalmedicalhall.in', password: 'OwnerPassword!2026'}),
  });
  assert.equal(newEmailLogin.status, 200);
  assert.equal(sentEmails[0].to, 'owner@nationalmedicalhall.in');
});

test('6. OTP expires after 5 minutes, resend enforces cooldown, and failed logins enforce rate-limit lockout', async () => {
  assert.equal(OTP_TTL_MS, 5 * 60 * 1000, 'OTP TTL must be 5 minutes');
  sentEmails = [];

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'owner@nationalmedicalhall.in', password: 'OwnerPassword!2026'}),
  });
  assert.equal(loginRes.status, 200);
  const loginBody = (await loginRes.json()) as {
    challengeId: string;
    expiresInSeconds: number;
  };
  assert.equal(loginBody.expiresInSeconds, 300);
  const otp = extractSixDigitOtp(sentEmails[0]);

  // Immediate resend hits 30s cooldown (429 + Retry-After)
  const cooldownRes = await fetch(`${baseUrl}/api/auth/login/resend-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId: loginBody.challengeId}),
  });
  assert.equal(cooldownRes.status, 429);
  assert.ok(cooldownRes.headers.get('retry-after'));

  // Force challenge expiry > 5 minutes ago in SQLite and verify OTP is rejected
  db.prepare('UPDATE login_otp_challenges SET expires_at = ? WHERE id = ?').run(
    Date.now() - 1000,
    loginBody.challengeId
  );
  const expiredVerify = await fetch(`${baseUrl}/api/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({challengeId: loginBody.challengeId, otp}),
  });
  assert.equal(expiredVerify.status, 401);

  // Repeated invalid password attempts trigger rate-limit lockout (429)
  let lockedStatus = 0;
  for (let i = 0; i < 6; i++) {
    const attempt = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.42',
      },
      body: JSON.stringify({email: 'ratelimit-check@example.com', password: 'WrongPassword!1'}),
    });
    lockedStatus = attempt.status;
    if (lockedStatus === 429) break;
  }
  assert.equal(lockedStatus, 429);
  db.prepare('DELETE FROM login_attempts').run();
});

test('7. Password recovery status reports resend and delivers single-use 6-digit reset OTP', async () => {
  const statusRes = await fetch(`${baseUrl}/api/auth/recovery-status`);
  assert.equal(statusRes.status, 200);
  const statusJson = (await statusRes.json()) as {configured: boolean; method: string};
  assert.equal(statusJson.configured, true);
  assert.equal(statusJson.method, 'resend');

  sentEmails = [];
  const reqRes = await fetch(`${baseUrl}/api/auth/recovery/request`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'owner@nationalmedicalhall.in'}),
  });
  assert.equal(reqRes.status, 200);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'owner@nationalmedicalhall.in');

  const resetOtp = extractSixDigitOtp(sentEmails[0]);

  const confirmRes = await fetch(`${baseUrl}/api/auth/recovery/confirm`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'owner@nationalmedicalhall.in',
      otp: resetOtp,
      newPassword: 'UpdatedOwnerPass!2026',
    }),
  });
  assert.equal(confirmRes.status, 200);

  // Reusing the same recovery OTP fails
  const replayConfirm = await fetch(`${baseUrl}/api/auth/recovery/confirm`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'owner@nationalmedicalhall.in',
      otp: resetOtp,
      newPassword: 'AnotherOwnerPass!2026',
    }),
  });
  assert.equal(replayConfirm.status, 401);

  // New password works for Step 1 login
  sentEmails = [];
  const newPassLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'owner@nationalmedicalhall.in', password: 'UpdatedOwnerPass!2026'}),
  });
  assert.equal(newPassLogin.status, 200);
  assert.equal(sentEmails.length, 1);
});

test('8. Resend HTTPS API client validates credentials, sender, acceptance ID, and rejects unverified senders & missing API keys', async () => {
  const prevKey = process.env.RESEND_API_KEY;
  const prevFrom = process.env.RESEND_FROM_EMAIL;
  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    assert.equal(isMailConfigured(), false);

    // Missing API key throws RESEND_NOT_CONFIGURED (503)
    const missingSender = createResendMailSender({apiKey: '', fromEmail: ''});
    await assert.rejects(
      () =>
        missingSender({
          to: 'scaninfoqr@gmail.com',
          subject: 'Test',
          text: '123456',
          html: '<p>123456</p>',
        }),
      (err: unknown) => err instanceof ResendDeliveryError && err.code === 'RESEND_NOT_CONFIGURED'
    );

    // Invalid sender format throws RESEND_INVALID_SENDER
    const badFormatSender = createResendMailSender({
      apiKey: 're_test_dummy_key',
      fromEmail: 'not-an-email',
    });
    await assert.rejects(
      () =>
        badFormatSender({
          to: 'scaninfoqr@gmail.com',
          subject: 'Test',
          text: '123456',
          html: '<p>123456</p>',
        }),
      (err: unknown) => err instanceof ResendDeliveryError && err.code === 'RESEND_INVALID_SENDER'
    );

    // Resend API 403 unverified domain response maps to RESEND_INVALID_SENDER
    const unverifiedSender = createResendMailSender({
      apiKey: 're_test_dummy_key',
      fromEmail: 'noreply@unverified.example.com',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            statusCode: 403,
            name: 'validation_error',
            message: 'The unverified.example.com domain is not verified.',
          }),
          {status: 403, headers: {'Content-Type': 'application/json'}}
        ),
    });
    await assert.rejects(
      () =>
        unverifiedSender({
          to: 'scaninfoqr@gmail.com',
          subject: 'Test',
          text: '123456',
          html: '<p>123456</p>',
        }),
      (err: unknown) => err instanceof ResendDeliveryError && err.code === 'RESEND_INVALID_SENDER'
    );

    // Resend API 200 without acceptance id is rejected
    const missingIdSender = createResendMailSender({
      apiKey: 're_test_dummy_key',
      fromEmail: 'National Medical Hall <noreply@nationalmedicalhall.in>',
      fetchImpl: async () =>
        new Response(JSON.stringify({ok: true}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        }),
    });
    await assert.rejects(
      () =>
        missingIdSender({
          to: 'scaninfoqr@gmail.com',
          subject: 'Test',
          text: '123456',
          html: '<p>123456</p>',
        }),
      (err: unknown) => err instanceof ResendDeliveryError && err.code === 'RESEND_INVALID_RESPONSE'
    );

    // Valid Resend API response verifies Bearer header, payload, and returns id
    let capturedAuth = '';
    let capturedBody: Record<string, unknown> = {};
    const validSender = createResendMailSender({
      apiKey: 're_test_dummy_key',
      fromEmail: 'National Medical Hall <noreply@nationalmedicalhall.in>',
      fetchImpl: async (_url, init) => {
        const headers = init?.headers as Record<string, string>;
        capturedAuth = headers.Authorization;
        capturedBody = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
        return new Response(JSON.stringify({id: 'email_123456'}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        });
      },
    });
    const delivered = await validSender({
      to: 'scaninfoqr@gmail.com',
      subject: 'OTP',
      text: '654321',
      html: '<p>654321</p>',
    });
    assert.equal(capturedAuth, 'Bearer re_test_dummy_key');
    assert.deepEqual(capturedBody.to, ['scaninfoqr@gmail.com']);
    assert.equal(capturedBody.from, 'National Medical Hall <noreply@nationalmedicalhall.in>');
    assert.deepEqual(delivered, {id: 'email_123456', provider: 'resend'});

    // Unconfigured server app returns 503 on login and recovery, and setup-status mailConfigured=false
    const unconfiguredApp = createApp(db);
    const unconfServer = await new Promise<http.Server>((resolve) => {
      const s = unconfiguredApp.listen(0, '127.0.0.1', () => resolve(s));
    });
    try {
      const addr = unconfServer.address() as {port: number};
      const unconfUrl = `http://127.0.0.1:${addr.port}`;

      const sRes = await fetch(`${unconfUrl}/api/auth/setup-status`);
      const sBody = (await sRes.json()) as {mailConfigured: boolean};
      assert.equal(sBody.mailConfigured, false);

      const lRes = await fetch(`${unconfUrl}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: 'owner@nationalmedicalhall.in',
          password: 'UpdatedOwnerPass!2026',
        }),
      });
      assert.equal(lRes.status, 503);

      const rRes = await fetch(`${unconfUrl}/api/auth/recovery/request`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: 'owner@nationalmedicalhall.in'}),
      });
      assert.equal(rRes.status, 503);
    } finally {
      await new Promise<void>((resolve) => unconfServer.close(() => resolve()));
    }
  } finally {
    if (prevKey !== undefined) process.env.RESEND_API_KEY = prevKey;
    else delete process.env.RESEND_API_KEY;
    if (prevFrom !== undefined) process.env.RESEND_FROM_EMAIL = prevFrom;
    else delete process.env.RESEND_FROM_EMAIL;
  }
});
