import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {after, before, test} from 'node:test';
import express from 'express';
import {createApp} from '../server/app.ts';
import {initDatabase} from '../server/db.ts';
import type {OutboundEmailPayload} from '../server/mailer.ts';

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
        throw new Error('SMTP_DISABLED_FOR_TEST');
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
