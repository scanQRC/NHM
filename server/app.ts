import type Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';
import express from 'express';
import type {NextFunction, Request, Response} from 'express';
import crypto from 'node:crypto';
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  SESSION_COOKIE_NAME,
  checkLoginLockout,
  clearLoginAttempts,
  createSession,
  deleteAllUserSessions,
  deleteSessionByRawToken,
  generateOpaqueToken,
  generateSixDigitOtp,
  getAuthorizedMainAdminConfig,
  getClientIp,
  getSessionCookieOptions,
  getSessionTtlMs,
  getValidSession,
  hashOtp,
  hashPassword,
  hashToken,
  maskEmail,
  parsePermissionsJson,
  recordFailedLogin,
  sanitizePermissions,
  timingSafeEqualStrings,
  validatePasswordStrength,
  verifyPassword,
} from './auth.ts';
import type {
  AdminUserRow,
  LoginOtpChallengeRow,
  OwnerEmailChangeRow,
  PrescriptionRow,
  SessionJoinRow,
  StaffInvitationRow,
  StaffPermissions,
} from './db.ts';
import {
  type MailDispatchFn,
  ResendDeliveryError,
  buildLoginOtpEmail,
  buildOwnerTransferOtpEmail,
  buildPasswordResetOtpEmail,
  buildStaffInviteEmail,
  createResendMailSender,
  isMailConfigured,
} from './mailer.ts';

interface AuthenticatedRequest extends Request {
  adminSession?: SessionJoinRow;
  permissions?: StaffPermissions;
}

export interface CreateAppOptions {
  sendMail?: MailDispatchFn;
  mailConfiguredOverride?: boolean;
}

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;

function mapPrescriptionRow(row: PrescriptionRow) {
  return {
    id: row.id,
    recordNumber: row.record_number,
    patientName: row.patient_name,
    phone: row.phone,
    doctorName: row.doctor_name,
    visitDate: row.visit_date,
    archiveMonth: row.archive_month,
    photoUrl: row.photo_url,
    photoFilename: row.photo_filename,
    notes: row.notes,
    loggedBy: row.logged_by,
    createdAt: row.created_at,
  };
}

function getBaseAppUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured.startsWith('http')) {
    return configured.replace(/\/+$/, '');
  }
  const proto =
    (typeof req.headers['x-forwarded-proto'] === 'string' &&
      req.headers['x-forwarded-proto'].split(',')[0].trim()) ||
    req.protocol ||
    'http';
  const host =
    (typeof req.headers['x-forwarded-host'] === 'string' &&
      req.headers['x-forwarded-host'].split(',')[0].trim()) ||
    req.headers.host ||
    'localhost:3000';
  return `${proto}://${host}`;
}

export function createApp(
  db: Database.Database,
  options: CreateAppOptions = {}
): express.Express {
  const app = express();
  app.set('trust proxy', 1);

  const sendMail: MailDispatchFn = options.sendMail || createResendMailSender();
  const isMailAvailable = () =>
    typeof options.mailConfiguredOverride === 'boolean'
      ? options.mailConfiguredOverride
      : isMailConfigured();

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.startsWith('/api/') || req.path === '/admin' || req.path.startsWith('/admin/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  app.use(cookieParser());
  app.use(express.json({limit: '12mb'}));

  // Same-origin CSRF check for mutating API requests when Origin is sent
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      next();
      return;
    }

    const origin = req.headers.origin;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (typeof origin === 'string' && typeof host === 'string') {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          res.status(403).json({error: 'Cross-origin request rejected.'});
          return;
        }
      } catch {
        res.status(403).json({error: 'Invalid request origin.'});
        return;
      }
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ok: true});
  });

  // Publicly check ONLY whether one-time Main Admin setup is needed (NEVER leaks authorized email)
  app.get('/api/auth/setup-status', (_req, res) => {
    const countRow = db
      .prepare(`SELECT COUNT(*) AS total FROM admin_users WHERE role = 'main_admin'`)
      .get() as {total: number};
    const setupRequired = countRow.total === 0;
    const setupTokenRequired = Boolean(process.env.ADMIN_SETUP_TOKEN?.trim());

    res.json({
      setupRequired,
      setupTokenRequired: setupRequired ? setupTokenRequired : false,
      mailConfigured: isMailAvailable(),
      publicSignupEnabled: false,
      staffInviteSupported: true,
    });
  });

  // One-time Main Admin initial setup (enforces backend-only authorized email; permanently disabled once created)
  app.post('/api/auth/setup', async (req: Request, res: Response) => {
    const existingMainCount = db
      .prepare(`SELECT COUNT(*) AS total FROM admin_users WHERE role = 'main_admin'`)
      .get() as {total: number};

    if (existingMainCount.total > 0) {
      res.status(403).json({
        error:
          'Initial Main Admin setup is already complete. Public signup and registration are permanently disabled.',
      });
      return;
    }

    const requiredSetupToken = process.env.ADMIN_SETUP_TOKEN?.trim();
    if (requiredSetupToken) {
      const providedToken = String(req.body?.setupToken || '').trim();
      if (!providedToken || !timingSafeEqualStrings(providedToken, requiredSetupToken)) {
        res.status(403).json({error: 'Valid ADMIN_SETUP_TOKEN is required to initialize Main Admin.'});
        return;
      }
    }

    const username = String(req.body?.username || '')
      .trim()
      .toLowerCase();
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const displayName = String(req.body?.displayName || '').trim() || 'Main Administrator';
    const password = String(req.body?.password || '');

    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({error: 'Please enter a valid email address.'});
      return;
    }

    // Strict backend-only authorization check: only the authorized Main Admin email can initialize
    const {authorizedEmail} = getAuthorizedMainAdminConfig(db);
    if (email !== authorizedEmail) {
      res.status(403).json({
        error:
          'This email address is not authorized as the initial Main Administrator for National Medical Hall.',
      });
      return;
    }

    if (!USERNAME_PATTERN.test(username)) {
      res.status(400).json({
        error:
          'Username must be 3–32 characters using lowercase letters, numbers, dots, underscores, or hyphens.',
      });
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      res.status(400).json({error: passwordError});
      return;
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const ownerPermsJson = JSON.stringify(sanitizePermissions(null, 'main_admin'));

    try {
      const createMainAdminTx = db.transaction(() => {
        const countInsideTx = db
          .prepare(`SELECT COUNT(*) AS total FROM admin_users WHERE role = 'main_admin'`)
          .get() as {total: number};
        if (countInsideTx.total > 0) {
          throw new Error('SETUP_ALREADY_COMPLETED');
        }

        db.prepare(
          `INSERT INTO admin_users
            (id, username, email, display_name, role, permissions_json, password_hash, is_active, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'main_admin', ?, ?, 1, NULL, ?, ?)`
        ).run(userId, username, email, displayName, ownerPermsJson, passwordHash, nowIso, nowIso);
      });

      createMainAdminTx();
    } catch (err) {
      if (err instanceof Error && err.message === 'SETUP_ALREADY_COMPLETED') {
        res.status(403).json({
          error:
            'Initial Main Admin setup is already complete. Public registration is permanently disabled.',
        });
        return;
      }
      res.status(500).json({error: 'Unable to complete initial setup.'});
      return;
    }

    // Never issue a session without 6-digit OTP sign-in
    res.status(201).json({
      setupCompleted: true,
      message:
        'Main Admin account created. Sign in using your authorized email, password, and 6-digit email verification code.',
    });
  });

  // Explicitly block any public signup/registration attempts
  app.post('/api/auth/register', (_req, res) => {
    res.status(403).json({
      error: 'Public signup and registration are permanently disabled.',
    });
  });
  app.post('/api/auth/signup', (_req, res) => {
    res.status(403).json({
      error: 'Public signup and registration are permanently disabled.',
    });
  });

  // Step 1 of Login: verify authorized email + password, then dispatch real 6-digit OTP via email
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const mainAdminCount = db
      .prepare(`SELECT COUNT(*) AS total FROM admin_users WHERE role = 'main_admin'`)
      .get() as {total: number};
    if (mainAdminCount.total === 0) {
      res.status(409).json({
        error: 'No Main Admin account exists yet. Complete one-time initial setup first.',
        setupRequired: true,
      });
      return;
    }

    const email = String(req.body?.email ?? req.body?.identifier ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');

    if (!EMAIL_PATTERN.test(email) || !password) {
      res.status(400).json({error: 'Authorized email address and password are required.'});
      return;
    }

    const clientIp = getClientIp(req);
    const lockoutStatus = checkLoginLockout(db, clientIp, email);
    if (lockoutStatus.locked) {
      res.setHeader('Retry-After', String(lockoutStatus.retryAfterSeconds));
      res.status(429).json({
        error: `Too many failed login attempts. Try again in ${Math.ceil(
          lockoutStatus.retryAfterSeconds / 60
        )} minute(s).`,
        retryAfterSeconds: lockoutStatus.retryAfterSeconds,
      });
      return;
    }

    // Strict lookup of pre-existing active user by email (NEVER auto-creates accounts)
    const user = db
      .prepare(
        `SELECT id, username, email, display_name, role, permissions_json, password_hash, is_active
         FROM admin_users
         WHERE email = ?`
      )
      .get(email) as AdminUserRow | undefined;

    const {authorizedEmail} = getAuthorizedMainAdminConfig(db);
    const isAllowedRoleAccount =
      Boolean(user) &&
      user!.is_active === 1 &&
      (user!.role === 'staff' || (user!.role === 'main_admin' && user!.email === authorizedEmail));

    const validPassword = await verifyPassword(
      password,
      isAllowedRoleAccount ? user!.password_hash : null
    );

    if (!validPassword || !isAllowedRoleAccount || !user) {
      const failure = recordFailedLogin(db, clientIp, email);
      if (failure.locked) {
        res.setHeader('Retry-After', String(failure.retryAfterSeconds));
        res.status(429).json({
          error: `Too many failed login attempts. Account temporarily locked for ${Math.ceil(
            failure.retryAfterSeconds / 60
          )} minute(s).`,
          retryAfterSeconds: failure.retryAfterSeconds,
        });
        return;
      }

      res.status(401).json({
        error: 'Invalid or unauthorized email address or password.',
        remainingAttempts: failure.remainingAttempts,
      });
      return;
    }

    if (!isMailAvailable()) {
      res.status(503).json({
        error:
          'Resend email delivery is not configured on the server, so the 6-digit verification OTP could not be sent. Configure RESEND_API_KEY and RESEND_FROM_EMAIL.',
      });
      return;
    }

    const now = Date.now();
    const challengeId = crypto.randomUUID();
    const otp = generateSixDigitOtp();
    const otpHash = hashOtp(challengeId, otp);

    // Invalidate older unconsumed challenges for this user
    db.prepare('DELETE FROM login_otp_challenges WHERE user_id = ? AND consumed_at IS NULL').run(
      user.id
    );

    db.prepare(
      `INSERT INTO login_otp_challenges
        (id, user_id, email, otp_hash, attempts, max_attempts, expires_at, consumed_at, resend_available_at, ip_address, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, NULL, ?, ?, ?)`
    ).run(
      challengeId,
      user.id,
      user.email,
      otpHash,
      OTP_MAX_ATTEMPTS,
      now + OTP_TTL_MS,
      now + OTP_RESEND_COOLDOWN_MS,
      clientIp,
      now
    );

    try {
      await sendMail(buildLoginOtpEmail(user.email, otp, Math.round(OTP_TTL_MS / 60000)));
    } catch (err) {
      db.prepare('DELETE FROM login_otp_challenges WHERE id = ?').run(challengeId);
      if (err instanceof ResendDeliveryError) {
        res.status(err.httpStatus).json({error: err.safeMessage});
        return;
      }
      res.status(502).json({
        error:
          'Credentials verified, but sending the 6-digit verification OTP email failed. Verify RESEND_API_KEY and RESEND_FROM_EMAIL.',
      });
      return;
    }

    res.json({
      otpRequired: true,
      challengeId,
      maskedEmail: maskEmail(user.email),
      expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
    });
  });

  // Step 2 of Login: verify 6-digit email OTP before creating authenticated session
  app.post('/api/auth/login/verify-otp', (req: Request, res: Response) => {
    const challengeId = String(req.body?.challengeId || '').trim();
    const otp = String(req.body?.otp || '').trim();

    if (!challengeId || !OTP_PATTERN.test(otp)) {
      res.status(400).json({error: 'Enter the 6-digit verification code sent to your email.'});
      return;
    }

    const now = Date.now();
    const challenge = db
      .prepare('SELECT * FROM login_otp_challenges WHERE id = ? AND consumed_at IS NULL')
      .get(challengeId) as LoginOtpChallengeRow | undefined;

    if (!challenge) {
      res.status(401).json({error: 'Verification challenge not found or already used. Sign in again.'});
      return;
    }

    if (challenge.expires_at <= now) {
      db.prepare('DELETE FROM login_otp_challenges WHERE id = ?').run(challenge.id);
      res.status(401).json({error: 'Your 6-digit OTP has expired. Please sign in again.'});
      return;
    }

    if (challenge.attempts >= challenge.max_attempts) {
      db.prepare('DELETE FROM login_otp_challenges WHERE id = ?').run(challenge.id);
      res.status(429).json({error: 'Too many invalid OTP attempts. Please sign in again.'});
      return;
    }

    const candidateHash = hashOtp(challenge.id, otp);
    if (!timingSafeEqualStrings(candidateHash, challenge.otp_hash)) {
      const nextAttempts = challenge.attempts + 1;
      db.prepare('UPDATE login_otp_challenges SET attempts = ? WHERE id = ?').run(
        nextAttempts,
        challenge.id
      );

      if (nextAttempts >= challenge.max_attempts) {
        db.prepare('DELETE FROM login_otp_challenges WHERE id = ?').run(challenge.id);
        res.status(429).json({
          error: 'Too many invalid OTP attempts. Please sign in again to request a new code.',
        });
        return;
      }

      res.status(401).json({
        error: 'Invalid 6-digit verification code.',
        remainingAttempts: challenge.max_attempts - nextAttempts,
      });
      return;
    }

    const user = db
      .prepare(
        `SELECT id, username, email, display_name, role, permissions_json, is_active
         FROM admin_users
         WHERE id = ?`
      )
      .get(challenge.user_id) as Omit<AdminUserRow, 'password_hash'> | undefined;

    const {authorizedEmail, isTemporaryTestEmail} = getAuthorizedMainAdminConfig(db);
    if (
      !user ||
      user.is_active !== 1 ||
      (user.role === 'main_admin' && user.email !== authorizedEmail)
    ) {
      db.prepare('DELETE FROM login_otp_challenges WHERE id = ?').run(challenge.id);
      res.status(403).json({error: 'Account is inactive or no longer authorized.'});
      return;
    }

    const consumeTx = db.transaction(() => {
      const updated = db
        .prepare(
          'UPDATE login_otp_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL'
        )
        .run(now, challenge.id);
      if (updated.changes === 0) {
        throw new Error('OTP_ALREADY_CONSUMED');
      }
    });

    try {
      consumeTx();
    } catch {
      res.status(401).json({error: 'This verification code has already been used.'});
      return;
    }

    clearLoginAttempts(db, getClientIp(req), user.email);

    const ttlMs = getSessionTtlMs();
    const {rawToken} = createSession(db, user.id, req, ttlMs);
    res.cookie(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions(req, ttlMs));

    res.json({
      isTemporaryTestEmail: user.role === 'main_admin' ? isTemporaryTestEmail : false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        permissions: parsePermissionsJson(user.permissions_json, user.role),
      },
    });
  });

  // Resend 6-digit login OTP for an active challenge
  app.post('/api/auth/login/resend-otp', async (req: Request, res: Response) => {
    const challengeId = String(req.body?.challengeId || '').trim();
    if (!challengeId) {
      res.status(400).json({error: 'Challenge ID is required.'});
      return;
    }

    const now = Date.now();
    const challenge = db
      .prepare('SELECT * FROM login_otp_challenges WHERE id = ? AND consumed_at IS NULL')
      .get(challengeId) as LoginOtpChallengeRow | undefined;

    if (!challenge || challenge.expires_at <= now) {
      res.status(401).json({error: 'Verification challenge expired. Please sign in again.'});
      return;
    }

    if (now < challenge.resend_available_at) {
      const waitSeconds = Math.max(1, Math.ceil((challenge.resend_available_at - now) / 1000));
      res.setHeader('Retry-After', String(waitSeconds));
      res.status(429).json({
        error: `Please wait ${waitSeconds}s before requesting another verification code.`,
        retryAfterSeconds: waitSeconds,
      });
      return;
    }

    if (!isMailAvailable()) {
      res.status(503).json({
        error:
          'Resend email delivery is not configured on the server. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
      });
      return;
    }

    const newOtp = generateSixDigitOtp();
    const newHash = hashOtp(challenge.id, newOtp);

    db.prepare(
      `UPDATE login_otp_challenges
       SET otp_hash = ?, attempts = 0, expires_at = ?, resend_available_at = ?
       WHERE id = ?`
    ).run(newHash, now + OTP_TTL_MS, now + OTP_RESEND_COOLDOWN_MS, challenge.id);

    try {
      await sendMail(buildLoginOtpEmail(challenge.email, newOtp, Math.round(OTP_TTL_MS / 60000)));
    } catch (err) {
      db.prepare(
        `UPDATE login_otp_challenges
         SET otp_hash = ?, attempts = ?, expires_at = ?, resend_available_at = ?
         WHERE id = ?`
      ).run(
        challenge.otp_hash,
        challenge.attempts,
        challenge.expires_at,
        challenge.resend_available_at,
        challenge.id
      );
      if (err instanceof ResendDeliveryError) {
        res.status(err.httpStatus).json({error: err.safeMessage});
        return;
      }
      res.status(502).json({
        error: 'Failed to resend OTP email via Resend. Verify RESEND_API_KEY and RESEND_FROM_EMAIL.',
      });
      return;
    }

    res.json({
      ok: true,
      expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
    });
  });

  // Logout (server-side session deletion + cookie clear)
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    deleteSessionByRawToken(db, rawToken);
    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(req));
    res.json({ok: true});
  });

  // Verify current session
  app.get('/api/auth/session', (req: Request, res: Response) => {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const session = getValidSession(db, rawToken);
    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(req));
      res.status(401).json({authenticated: false});
      return;
    }

    const {isTemporaryTestEmail} = getAuthorizedMainAdminConfig(db);
    res.json({
      authenticated: true,
      expiresAt: session.expires_at,
      isTemporaryTestEmail: session.role === 'main_admin' ? isTemporaryTestEmail : false,
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email,
        displayName: session.display_name,
        role: session.role,
        permissions: parsePermissionsJson(session.permissions_json, session.role),
      },
    });
  });

  // Staff Invitation Verification & Acceptance (ONLY valid Main Admin invite tokens allowed; no public signup)
  app.get('/api/auth/invite-info', (req: Request, res: Response) => {
    const rawToken = String(req.query.token || '').trim();
    if (!rawToken) {
      res.status(400).json({error: 'Invitation token is required.'});
      return;
    }

    const tokenHash = hashToken(rawToken);
    const invite = db
      .prepare('SELECT * FROM staff_invitations WHERE token_hash = ?')
      .get(tokenHash) as StaffInvitationRow | undefined;

    if (!invite || invite.revoked_at || invite.accepted_at || invite.expires_at <= Date.now()) {
      res.status(404).json({error: 'This staff invitation link is invalid or has expired.'});
      return;
    }

    res.json({
      valid: true,
      maskedEmail: maskEmail(invite.email),
      displayName: invite.display_name,
      permissions: parsePermissionsJson(invite.permissions_json, 'staff'),
    });
  });

  app.post('/api/auth/accept-invite', async (req: Request, res: Response) => {
    const rawToken = String(req.body?.token || '').trim();
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const username = String(req.body?.username || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');

    if (!rawToken || !EMAIL_PATTERN.test(email) || !USERNAME_PATTERN.test(username)) {
      res.status(400).json({error: 'Valid invitation token, invited email, and username are required.'});
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      res.status(400).json({error: passwordError});
      return;
    }

    const tokenHash = hashToken(rawToken);
    const invite = db
      .prepare('SELECT * FROM staff_invitations WHERE token_hash = ?')
      .get(tokenHash) as StaffInvitationRow | undefined;

    const now = Date.now();
    if (!invite || invite.revoked_at || invite.accepted_at || invite.expires_at <= now) {
      res.status(403).json({error: 'Staff invitation link is invalid, revoked, or expired.'});
      return;
    }

    if (invite.email.toLowerCase() !== email) {
      res.status(403).json({error: 'Email does not match the Main Admin staff invitation.'});
      return;
    }

    const duplicate = db
      .prepare('SELECT id FROM admin_users WHERE email = ? OR username = ?')
      .get(email, username);
    if (duplicate) {
      res.status(409).json({error: 'That email or username is already registered.'});
      return;
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const acceptTx = db.transaction(() => {
      const updated = db
        .prepare(
          'UPDATE staff_invitations SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL'
        )
        .run(now, invite.id);
      if (updated.changes === 0) {
        throw new Error('INVITE_UNAVAILABLE');
      }

      db.prepare(
        `INSERT INTO admin_users
          (id, username, email, display_name, role, permissions_json, password_hash, is_active, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'staff', ?, ?, 1, ?, ?, ?)`
      ).run(
        userId,
        username,
        email,
        invite.display_name,
        invite.permissions_json,
        passwordHash,
        invite.invited_by_user_id,
        nowIso,
        nowIso
      );
    });

    try {
      acceptTx();
    } catch {
      res.status(403).json({error: 'Unable to accept staff invitation.'});
      return;
    }

    res.status(201).json({
      ok: true,
      message:
        'Staff account activated. Sign in with your email, password, and 6-digit email OTP.',
    });
  });

  // Password Recovery Status & OTP Reset (strictly existing active users only; never auto-creates accounts)
  app.get('/api/auth/recovery-status', (_req, res) => {
    const configured = isMailAvailable();
    res.json({
      configured,
      method: configured ? 'resend' : 'none',
      message: configured
        ? 'Verified Resend email recovery is active for existing authorized accounts.'
        : 'Password recovery email is disabled until RESEND_API_KEY and RESEND_FROM_EMAIL are configured on the server. No fixed or public recovery password exists.',
    });
  });

  app.post('/api/auth/recovery/request', async (req: Request, res: Response) => {
    if (!isMailAvailable()) {
      res.status(503).json({
        configured: false,
        error:
          'Password recovery is disabled until RESEND_API_KEY and RESEND_FROM_EMAIL are configured on the server.',
      });
      return;
    }

    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({error: 'Enter your registered email address.'});
      return;
    }

    const user = db
      .prepare('SELECT id, email, is_active FROM admin_users WHERE email = ?')
      .get(email) as {id: string; email: string; is_active: number} | undefined;

    if (user && user.is_active === 1) {
      const now = Date.now();
      const resetId = crypto.randomUUID();
      const otp = generateSixDigitOtp();
      const otpHash = hashOtp(user.email, otp);

      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL').run(
        user.id
      );
      db.prepare(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`
      ).run(resetId, user.id, otpHash, now + OTP_TTL_MS, now);

      try {
        await sendMail(buildPasswordResetOtpEmail(user.email, otp, Math.round(OTP_TTL_MS / 60000)));
      } catch (err) {
        db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(resetId);
        if (err instanceof ResendDeliveryError) {
          res.status(err.httpStatus).json({error: err.safeMessage});
          return;
        }
        res.status(502).json({error: 'Unable to send password recovery email via Resend.'});
        return;
      }
    }

    res.json({
      ok: true,
      message:
        'If an active authorized account matches that email, a 6-digit password reset code has been sent.',
    });
  });

  app.post('/api/auth/recovery/confirm', async (req: Request, res: Response) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const otp = String(req.body?.otp || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!EMAIL_PATTERN.test(email) || !OTP_PATTERN.test(otp)) {
      res.status(400).json({error: 'Registered email and 6-digit reset OTP are required.'});
      return;
    }

    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) {
      res.status(400).json({error: pwErr});
      return;
    }

    const user = db
      .prepare('SELECT id, email, is_active FROM admin_users WHERE email = ?')
      .get(email) as {id: string; email: string; is_active: number} | undefined;

    if (!user || user.is_active !== 1) {
      res.status(401).json({error: 'Invalid or expired password reset code.'});
      return;
    }

    const now = Date.now();
    const tokenRow = db
      .prepare(
        `SELECT * FROM password_reset_tokens
         WHERE user_id = ? AND used_at IS NULL AND expires_at > ?
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(user.id, now) as
      | {id: string; token_hash: string; expires_at: number}
      | undefined;

    if (!tokenRow || !timingSafeEqualStrings(hashOtp(user.email, otp), tokenRow.token_hash)) {
      res.status(401).json({error: 'Invalid or expired password reset code.'});
      return;
    }

    const nextHash = await hashPassword(newPassword);
    try {
      db.transaction(() => {
        const consumed = db
          .prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL')
          .run(now, tokenRow.id);
        if (consumed.changes === 0) {
          throw new Error('RESET_TOKEN_ALREADY_USED');
        }
        db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
          nextHash,
          new Date().toISOString(),
          user.id
        );
        deleteAllUserSessions(db, user.id);
      })();
    } catch {
      res.status(401).json({error: 'Invalid or expired password reset code.'});
      return;
    }

    res.json({ok: true, message: 'Password reset successfully. Sign in with your new password.'});
  });

  // Middleware protecting ALL /api/admin/* endpoints
  const requireAdminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const session = getValidSession(db, rawToken);
    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(req));
      res.status(401).json({error: 'Authentication required.'});
      return;
    }

    // Verify Main Admin email authorization remains aligned
    if (session.role === 'main_admin') {
      const {authorizedEmail} = getAuthorizedMainAdminConfig(db);
      if (session.email !== authorizedEmail) {
        deleteSessionByRawToken(db, rawToken);
        res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(req));
        res.status(401).json({error: 'Authorization updated. Please sign in again.'});
        return;
      }
    }

    req.adminSession = session;
    req.permissions = parsePermissionsJson(session.permissions_json, session.role);
    next();
  };

  const requireMainAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.adminSession || req.adminSession.role !== 'main_admin') {
      res.status(403).json({error: 'Main Admin privileges required.'});
      return;
    }
    next();
  };

  const requirePermission =
    (perm: keyof StaffPermissions) =>
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (req.adminSession?.role === 'main_admin') {
        next();
        return;
      }
      if (!req.permissions || !req.permissions[perm]) {
        res.status(403).json({error: 'You do not have permission for this action.'});
        return;
      }
      next();
    };

  app.use('/api/admin', requireAdminAuth);

  // Protected Prescription Photo Records API (no OCR)
  app.get(
    '/api/admin/records',
    requirePermission('canViewRecords'),
    (_req: AuthenticatedRequest, res: Response) => {
      const rows = db
        .prepare('SELECT * FROM prescription_records ORDER BY visit_date DESC, created_at DESC')
        .all() as PrescriptionRow[];
      res.json({records: rows.map(mapPrescriptionRow)});
    }
  );

  app.post(
    '/api/admin/records',
    requirePermission('canAddRecords'),
    (req: AuthenticatedRequest, res: Response) => {
      const session = req.adminSession!;
      const patientName = String(req.body?.patientName || '').trim();
      const phone = String(req.body?.phone || '').trim();
      const doctorName = String(req.body?.doctorName || '').trim() || 'Not Specified';
      const visitDate = String(req.body?.visitDate || '').trim();
      const notes = String(req.body?.notes || '').trim();
      const photoUrl = String(req.body?.photoUrl || '').trim();
      const photoFilename = String(req.body?.photoFilename || '').trim() || 'prescription.jpg';

      if (!patientName || !phone || !visitDate || !photoUrl) {
        res.status(400).json({
          error: 'Patient name, phone, visit date, and prescription photo are required.',
        });
        return;
      }

      if (
        !photoUrl.startsWith('data:image/') &&
        !photoUrl.startsWith('/src/assets/') &&
        !photoUrl.startsWith('/assets/')
      ) {
        res.status(400).json({error: 'Invalid image format.'});
        return;
      }

      const id = `rec-${crypto.randomUUID()}`;
      const archiveMonth = visitDate.slice(0, 7);
      const monthDigits = archiveMonth.replace('-', '').slice(2);
      const countRow = db
        .prepare('SELECT COUNT(*) AS total FROM prescription_records')
        .get() as {total: number};
      const seq = String(1101 + countRow.total).padStart(4, '0');
      const recordNumber = `NMH-${monthDigits}-${seq}`;
      const createdAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

      db.prepare(
        `INSERT INTO prescription_records
          (id, record_number, patient_name, phone, doctor_name, visit_date, archive_month, photo_url, photo_filename, notes, logged_by, created_at, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        recordNumber,
        patientName,
        phone,
        doctorName,
        visitDate,
        archiveMonth,
        photoUrl,
        photoFilename,
        notes,
        session.display_name,
        createdAt,
        session.user_id
      );

      const created = db
        .prepare('SELECT * FROM prescription_records WHERE id = ?')
        .get(id) as PrescriptionRow;
      res.status(201).json({record: mapPrescriptionRow(created)});
    }
  );

  app.delete(
    '/api/admin/records/:id',
    requirePermission('canDeleteRecords'),
    (req: AuthenticatedRequest, res: Response) => {
      const result = db
        .prepare('DELETE FROM prescription_records WHERE id = ?')
        .run(req.params.id);
      if (result.changes === 0) {
        res.status(404).json({error: 'Record not found.'});
        return;
      }
      res.json({ok: true});
    }
  );

  // Protected Pharmacy Settings API
  app.get('/api/admin/settings', (_req: AuthenticatedRequest, res: Response) => {
    const row = db
      .prepare('SELECT payload_json FROM pharmacy_settings WHERE id = ?')
      .get('default') as {payload_json: string} | undefined;
    res.json({settings: row ? JSON.parse(row.payload_json) : null});
  });

  app.put(
    '/api/admin/settings',
    requirePermission('canManageSettings'),
    (req: AuthenticatedRequest, res: Response) => {
      const incoming = req.body?.settings;
      if (!incoming || typeof incoming !== 'object') {
        res.status(400).json({error: 'Invalid settings payload.'});
        return;
      }

      const sanitized = {
        ...incoming,
        publicSignupEnabled: false,
        ocrEnabled: false,
      };
      db.prepare('UPDATE pharmacy_settings SET payload_json = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(sanitized),
        new Date().toISOString(),
        'default'
      );
      res.json({settings: sanitized});
    }
  );

  // Protected Password Rotation for authenticated Main Admin
  app.post(
    '/api/admin/change-password',
    requireMainAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      const session = req.adminSession!;
      const currentPassword = String(req.body?.currentPassword || '');
      const newPassword = String(req.body?.newPassword || '');

      if (!currentPassword || !newPassword) {
        res.status(400).json({error: 'Current password and new password are required.'});
        return;
      }

      const user = db
        .prepare('SELECT id, password_hash FROM admin_users WHERE id = ?')
        .get(session.user_id) as {id: string; password_hash: string} | undefined;

      if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
        res.status(401).json({error: 'Current password is incorrect.'});
        return;
      }

      const pwErr = validatePasswordStrength(newPassword);
      if (pwErr) {
        res.status(400).json({error: pwErr});
        return;
      }

      const nextHash = await hashPassword(newPassword);
      db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
        nextHash,
        new Date().toISOString(),
        session.user_id
      );

      deleteAllUserSessions(db, session.user_id);
      const ttlMs = getSessionTtlMs();
      const {rawToken} = createSession(db, session.user_id, req, ttlMs);
      res.cookie(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions(req, ttlMs));

      res.json({ok: true});
    }
  );

  // Owner-Controlled Email Replacement (Main Admin ONLY, verified with password + 6-digit OTP to new email)
  app.get('/api/admin/owner-email/status', requireMainAdmin, (req: AuthenticatedRequest, res: Response) => {
    const {authorizedEmail, isTemporaryTestEmail} = getAuthorizedMainAdminConfig(db);
    res.json({
      authorizedEmail,
      isTemporaryTestEmail,
      currentUserEmail: req.adminSession!.email,
    });
  });

  app.post(
    '/api/admin/owner-email/request-change',
    requireMainAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      const session = req.adminSession!;
      const currentPassword = String(req.body?.currentPassword || '');
      const newEmail = String(req.body?.newEmail || '')
        .trim()
        .toLowerCase();

      if (!currentPassword || !EMAIL_PATTERN.test(newEmail)) {
        res.status(400).json({error: 'Current password and valid replacement email are required.'});
        return;
      }

      if (newEmail === session.email) {
        res.status(400).json({error: 'Replacement email must be different from the current Main Admin email.'});
        return;
      }

      const user = db
        .prepare('SELECT id, password_hash FROM admin_users WHERE id = ?')
        .get(session.user_id) as {id: string; password_hash: string} | undefined;
      if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
        res.status(401).json({error: 'Current password is incorrect.'});
        return;
      }

      const conflict = db
        .prepare('SELECT id FROM admin_users WHERE email = ? AND id != ?')
        .get(newEmail, session.user_id);
      if (conflict) {
        res.status(409).json({error: 'That email address is already assigned to a staff account.'});
        return;
      }

      if (!isMailAvailable()) {
        res.status(503).json({
          error:
            'Resend email delivery is required to send a verification OTP to the replacement Main Admin email.',
        });
        return;
      }

      const now = Date.now();
      const challengeId = crypto.randomUUID();
      const otp = generateSixDigitOtp();
      const otpHash = hashOtp(challengeId, otp);

      db.prepare('DELETE FROM owner_email_changes WHERE user_id = ? AND confirmed_at IS NULL').run(
        session.user_id
      );
      db.prepare(
        `INSERT INTO owner_email_changes
          (id, user_id, old_email, new_email, otp_hash, attempts, max_attempts, expires_at, confirmed_at, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL, ?)`
      ).run(
        challengeId,
        session.user_id,
        session.email,
        newEmail,
        otpHash,
        OTP_MAX_ATTEMPTS,
        now + OTP_TTL_MS,
        now
      );

      try {
        await sendMail(
          buildOwnerTransferOtpEmail(newEmail, session.email, otp, Math.round(OTP_TTL_MS / 60000))
        );
      } catch (err) {
        db.prepare('DELETE FROM owner_email_changes WHERE id = ?').run(challengeId);
        if (err instanceof ResendDeliveryError) {
          res.status(err.httpStatus).json({error: err.safeMessage});
          return;
        }
        res.status(502).json({
          error: 'Failed to send verification OTP to the replacement email address.',
        });
        return;
      }

      res.json({
        challengeId,
        maskedNewEmail: maskEmail(newEmail),
        expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
      });
    }
  );

  app.post(
    '/api/admin/owner-email/confirm-change',
    requireMainAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const session = req.adminSession!;
      const challengeId = String(req.body?.challengeId || '').trim();
      const otp = String(req.body?.otp || '').trim();

      if (!challengeId || !OTP_PATTERN.test(otp)) {
        res.status(400).json({error: 'Challenge ID and 6-digit confirmation OTP are required.'});
        return;
      }

      const now = Date.now();
      const changeRow = db
        .prepare(
          'SELECT * FROM owner_email_changes WHERE id = ? AND user_id = ? AND confirmed_at IS NULL'
        )
        .get(challengeId, session.user_id) as OwnerEmailChangeRow | undefined;

      if (!changeRow || changeRow.expires_at <= now) {
        res.status(401).json({error: 'Owner email confirmation challenge not found or expired.'});
        return;
      }

      if (changeRow.attempts >= changeRow.max_attempts) {
        db.prepare('DELETE FROM owner_email_changes WHERE id = ?').run(changeRow.id);
        res.status(429).json({error: 'Too many invalid OTP attempts. Start email replacement again.'});
        return;
      }

      if (!timingSafeEqualStrings(hashOtp(changeRow.id, otp), changeRow.otp_hash)) {
        const nextAttempts = changeRow.attempts + 1;
        db.prepare('UPDATE owner_email_changes SET attempts = ? WHERE id = ?').run(
          nextAttempts,
          changeRow.id
        );
        res.status(401).json({
          error: 'Invalid 6-digit confirmation OTP.',
          remainingAttempts: changeRow.max_attempts - nextAttempts,
        });
        return;
      }

      const isTempEmail = changeRow.new_email === 'scaninfoqr@gmail.com' ? 1 : 0;
      const nowIso = new Date().toISOString();

      db.transaction(() => {
        db.prepare(
          'UPDATE owner_email_changes SET confirmed_at = ? WHERE id = ?'
        ).run(now, changeRow.id);
        db.prepare(
          `UPDATE system_auth_config
           SET authorized_main_admin_email = ?, is_temporary_test_email = ?, updated_at = ?
           WHERE id = 'default'`
        ).run(changeRow.new_email, isTempEmail, nowIso);
        db.prepare('UPDATE admin_users SET email = ?, updated_at = ? WHERE id = ?').run(
          changeRow.new_email,
          nowIso,
          session.user_id
        );
        deleteAllUserSessions(db, session.user_id);
      })();

      const ttlMs = getSessionTtlMs();
      const {rawToken} = createSession(db, session.user_id, req, ttlMs);
      res.cookie(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions(req, ttlMs));

      res.json({
        ok: true,
        newEmail: changeRow.new_email,
        isTemporaryTestEmail: isTempEmail === 1,
      });
    }
  );

  // Main Admin-Only Staff Invitation & Permission Management
  app.get('/api/admin/staff', requireMainAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const staffRows = db
      .prepare(
        `SELECT id, username, email, display_name, role, permissions_json, is_active, created_at
         FROM admin_users
         ORDER BY CASE WHEN role = 'main_admin' THEN 0 ELSE 1 END, created_at DESC`
      )
      .all() as Omit<AdminUserRow, 'password_hash' | 'created_by' | 'updated_at'>[];

    const now = Date.now();
    const inviteRows = db
      .prepare(
        `SELECT id, email, display_name, permissions_json, expires_at, created_at
         FROM staff_invitations
         WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?
         ORDER BY created_at DESC`
      )
      .all(now) as Omit<StaffInvitationRow, 'token_hash' | 'invited_by_user_id' | 'accepted_at' | 'revoked_at'>[];

    res.json({
      users: staffRows.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        isActive: u.is_active === 1,
        permissions: parsePermissionsJson(u.permissions_json, u.role),
        createdAt: u.created_at,
      })),
      pendingInvitations: inviteRows.map((inv) => ({
        id: inv.id,
        email: inv.email,
        displayName: inv.display_name,
        permissions: parsePermissionsJson(inv.permissions_json, 'staff'),
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    });
  });

  app.post(
    '/api/admin/staff/invite',
    requireMainAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      const session = req.adminSession!;
      const email = String(req.body?.email || '')
        .trim()
        .toLowerCase();
      const displayName = String(req.body?.displayName || '').trim();
      const permissions = sanitizePermissions(req.body?.permissions, 'staff');

      if (!EMAIL_PATTERN.test(email) || !displayName) {
        res.status(400).json({error: 'Staff email address and full name are required.'});
        return;
      }

      const existingUser = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email);
      if (existingUser) {
        res.status(409).json({error: 'An account with that email already exists.'});
        return;
      }

      const rawToken = generateOpaqueToken(24);
      const tokenHash = hashToken(rawToken);
      const inviteId = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = now + 48 * 60 * 60 * 1000;
      const nowIso = new Date().toISOString();

      // Revoke older pending invites for the same email
      db.prepare(
        'UPDATE staff_invitations SET revoked_at = ? WHERE email = ? AND accepted_at IS NULL AND revoked_at IS NULL'
      ).run(now, email);

      db.prepare(
        `INSERT INTO staff_invitations
          (id, email, display_name, permissions_json, token_hash, expires_at, invited_by_user_id, accepted_at, revoked_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`
      ).run(
        inviteId,
        email,
        displayName,
        JSON.stringify(permissions),
        tokenHash,
        expiresAt,
        session.user_id,
        nowIso
      );

      const invitePath = `/admin/invite?token=${rawToken}`;
      const inviteUrl = `${getBaseAppUrl(req)}${invitePath}`;
      let emailSent = false;

      if (isMailAvailable()) {
        try {
          await sendMail(buildStaffInviteEmail(email, displayName, inviteUrl));
          emailSent = true;
        } catch {
          emailSent = false;
        }
      }

      res.status(201).json({
        invitation: {
          id: inviteId,
          email,
          displayName,
          permissions,
          expiresAt,
          createdAt: nowIso,
        },
        invitePath,
        emailSent,
      });
    }
  );

  app.patch(
    '/api/admin/staff/:id',
    requireMainAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const targetId = req.params.id;
      const target = db
        .prepare('SELECT id, role FROM admin_users WHERE id = ?')
        .get(targetId) as {id: string; role: 'main_admin' | 'staff'} | undefined;

      if (!target) {
        res.status(404).json({error: 'Staff account not found.'});
        return;
      }
      if (target.role === 'main_admin') {
        res.status(403).json({error: 'Main Admin permissions cannot be downgraded.'});
        return;
      }

      const nextPerms = sanitizePermissions(req.body?.permissions, 'staff');
      const isActive = req.body?.isActive !== false ? 1 : 0;

      db.prepare(
        'UPDATE admin_users SET permissions_json = ?, is_active = ?, updated_at = ? WHERE id = ?'
      ).run(JSON.stringify(nextPerms), isActive, new Date().toISOString(), targetId);

      if (isActive === 0) {
        deleteAllUserSessions(db, targetId);
      }

      res.json({ok: true, permissions: nextPerms, isActive: isActive === 1});
    }
  );

  app.delete(
    '/api/admin/staff/invitations/:id',
    requireMainAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const result = db
        .prepare(
          'UPDATE staff_invitations SET revoked_at = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL'
        )
        .run(Date.now(), req.params.id);
      if (result.changes === 0) {
        res.status(404).json({error: 'Pending invitation not found.'});
        return;
      }
      res.json({ok: true});
    }
  );

  // Protect every private /admin* browser route on the server
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const cleanPath = req.path.replace(/\/+$/, '') || '/';
    const isAdminRoute = cleanPath === '/admin' || cleanPath.startsWith('/admin/');
    const isPublicAuthGate =
      cleanPath === '/admin/login' ||
      cleanPath === '/admin/setup' ||
      cleanPath === '/admin/invite';

    if (!isAdminRoute || isPublicAuthGate) {
      next();
      return;
    }

    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const session = getValidSession(db, rawToken);
    if (session) {
      next();
      return;
    }

    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(req));
    if (req.accepts(['html', 'json']) === 'json') {
      res.status(401).json({error: 'Authentication required.'});
      return;
    }

    const mainAdminCount = db
      .prepare(`SELECT COUNT(*) AS total FROM admin_users WHERE role = 'main_admin'`)
      .get() as {total: number};
    res.redirect(302, mainAdminCount.total === 0 ? '/admin/setup' : '/admin/login');
  });

  // Ensure unmatched /api/* endpoints return JSON 404 rather than HTML
  app.use('/api', (_req, res) => {
    res.status(404).json({error: 'API endpoint not found.'});
  });

  return app;
}
