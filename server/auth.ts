import bcrypt from 'bcryptjs';
import type Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type {CookieOptions, Request} from 'express';
import {
  FULL_OWNER_PERMISSIONS,
  type SessionJoinRow,
  type StaffPermissions,
  type SystemAuthConfigRow,
} from './db.ts';
import {isMailConfigured} from './mailer.ts';

export const SESSION_COOKIE_NAME = 'nmh_admin_session';

const BCRYPT_ROUNDS = 12;
const DUMMY_BCRYPT_HASH = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), BCRYPT_ROUNDS);

export const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export function getSessionTtlMs(): number {
  const parsed = Number(process.env.SESSION_TTL_MS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 8 * 60 * 60 * 1000; // 8 hours default
}

export function getLoginRateLimitConfig() {
  const maxAttempts = Number(process.env.LOGIN_MAX_ATTEMPTS);
  const windowMs = Number(process.env.LOGIN_WINDOW_MS);
  const lockoutMs = Number(process.env.LOGIN_LOCKOUT_MS);
  return {
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : 5,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 15 * 60 * 1000,
    lockoutMs: Number.isFinite(lockoutMs) && lockoutMs > 0 ? lockoutMs : 15 * 60 * 1000,
  };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function hashOtp(challengeId: string, otp: string): string {
  return crypto.createHash('sha256').update(`${challengeId}:${otp.trim()}`).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local[0] || '*'}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

export function sanitizePermissions(
  raw: Partial<StaffPermissions> | null | undefined,
  role: 'main_admin' | 'staff'
): StaffPermissions {
  if (role === 'main_admin') {
    return {...FULL_OWNER_PERMISSIONS};
  }
  return {
    canViewRecords: raw?.canViewRecords !== false,
    canAddRecords: Boolean(raw?.canAddRecords),
    canDeleteRecords: Boolean(raw?.canDeleteRecords),
    canPrintRecords: raw?.canPrintRecords !== false,
    canExportBackup: Boolean(raw?.canExportBackup),
    canManageSettings: Boolean(raw?.canManageSettings),
  };
}

export function parsePermissionsJson(
  jsonText: string | null | undefined,
  role: 'main_admin' | 'staff'
): StaffPermissions {
  if (role === 'main_admin') {
    return {...FULL_OWNER_PERMISSIONS};
  }
  try {
    const parsed = JSON.parse(jsonText || '{}') as Partial<StaffPermissions>;
    return sanitizePermissions(parsed, role);
  } catch {
    return sanitizePermissions({}, role);
  }
}

export function getAuthorizedMainAdminConfig(db: Database.Database): {
  authorizedEmail: string;
  isTemporaryTestEmail: boolean;
} {
  const row = db
    .prepare(
      'SELECT authorized_main_admin_email, is_temporary_test_email FROM system_auth_config WHERE id = ?'
    )
    .get('default') as Pick<
    SystemAuthConfigRow,
    'authorized_main_admin_email' | 'is_temporary_test_email'
  >;

  return {
    authorizedEmail: row.authorized_main_admin_email.trim().toLowerCase(),
    isTemporaryTestEmail: row.is_temporary_test_email === 1,
  };
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  storedHash: string | null
): Promise<boolean> {
  const targetHash = storedHash || DUMMY_BCRYPT_HASH;
  const matched = await bcrypt.compare(plainPassword, targetHash);
  return Boolean(storedHash && matched);
}

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string' || password.length < 10) {
    return 'Password must be at least 10 characters long.';
  }
  if (password.length > 128) {
    return 'Password must not exceed 128 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character (e.g. !@#$%).';
  }
  return null;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function checkLoginLockout(
  db: Database.Database,
  ip: string,
  identifier: string,
  now = Date.now()
): {locked: boolean; retryAfterSeconds: number} {
  const keys = [`ip:${ip}`, `id:${identifier}`];
  let maxLockedUntil = 0;

  for (const key of keys) {
    const row = db
      .prepare('SELECT locked_until FROM login_attempts WHERE key = ?')
      .get(key) as {locked_until: number} | undefined;

    if (row && row.locked_until > now) {
      maxLockedUntil = Math.max(maxLockedUntil, row.locked_until);
    }
  }

  if (maxLockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((maxLockedUntil - now) / 1000)),
    };
  }
  return {locked: false, retryAfterSeconds: 0};
}

export function recordFailedLogin(
  db: Database.Database,
  ip: string,
  identifier: string,
  now = Date.now()
): {locked: boolean; retryAfterSeconds: number; remainingAttempts: number} {
  const {maxAttempts, windowMs, lockoutMs} = getLoginRateLimitConfig();
  const keys = [`ip:${ip}`, `id:${identifier}`];
  let highestFailedCount = 0;
  let maxLockedUntil = 0;

  const upsert = db.prepare(`
    INSERT INTO login_attempts (key, failed_count, first_failed_at, locked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      failed_count = excluded.failed_count,
      first_failed_at = excluded.first_failed_at,
      locked_until = excluded.locked_until
  `);

  for (const key of keys) {
    const existing = db
      .prepare('SELECT failed_count, first_failed_at, locked_until FROM login_attempts WHERE key = ?')
      .get(key) as
      | {failed_count: number; first_failed_at: number; locked_until: number}
      | undefined;

    let count = 1;
    let firstFailedAt = now;
    let lockedUntil = 0;

    if (existing) {
      if (now - existing.first_failed_at <= windowMs) {
        count = existing.failed_count + 1;
        firstFailedAt = existing.first_failed_at;
      }
      if (count >= maxAttempts) {
        lockedUntil = now + lockoutMs;
      }
    } else if (maxAttempts <= 1) {
      lockedUntil = now + lockoutMs;
    }

    upsert.run(key, count, firstFailedAt, lockedUntil);
    highestFailedCount = Math.max(highestFailedCount, count);
    if (lockedUntil > now) {
      maxLockedUntil = Math.max(maxLockedUntil, lockedUntil);
    }
  }

  if (maxLockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((maxLockedUntil - now) / 1000)),
      remainingAttempts: 0,
    };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, maxAttempts - highestFailedCount),
  };
}

export function clearLoginAttempts(
  db: Database.Database,
  ip: string,
  identifier: string
): void {
  const del = db.prepare('DELETE FROM login_attempts WHERE key = ?');
  del.run(`ip:${ip}`);
  del.run(`id:${identifier}`);
}

export function createSession(
  db: Database.Database,
  userId: string,
  req: Request,
  ttlMs = getSessionTtlMs()
): {rawToken: string; expiresAt: number} {
  const now = Date.now();
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const sessionId = crypto.randomUUID();
  const expiresAt = now + ttlMs;
  const ipAddress = getClientIp(req);
  const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 250);

  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(now);

  db.prepare(
    `INSERT INTO admin_sessions
      (id, token_hash, user_id, expires_at, created_at, last_seen_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionId, tokenHash, userId, expiresAt, now, now, ipAddress, userAgent);

  return {rawToken, expiresAt};
}

export function getValidSession(
  db: Database.Database,
  rawToken: string | undefined,
  now = Date.now()
): SessionJoinRow | null {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const row = db
    .prepare(
      `SELECT
         s.id AS session_id,
         s.user_id,
         s.expires_at,
         s.created_at,
         s.last_seen_at,
         u.username,
         u.email,
         u.display_name,
         u.role,
         u.permissions_json,
         u.is_active
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as SessionJoinRow | undefined;

  if (!row) {
    return null;
  }

  if (row.expires_at <= now || row.is_active !== 1) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(row.session_id);
    return null;
  }

  db.prepare('UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?').run(now, row.session_id);
  return row;
}

export function deleteSessionByRawToken(db: Database.Database, rawToken: string | undefined): void {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
}

export function deleteAllUserSessions(db: Database.Database, userId: string): void {
  db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(userId);
}

export function getSessionCookieOptions(req: Request, maxAgeMs?: number): CookieOptions {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.FORCE_SECURE_COOKIES === 'true';

  const envSameSite = process.env.COOKIE_SAMESITE?.toLowerCase();
  let sameSite: 'lax' | 'strict' | 'none' = isHttps ? 'none' : 'lax';
  if (envSameSite === 'strict' || envSameSite === 'lax' || envSameSite === 'none') {
    sameSite = envSameSite === 'none' && !isHttps ? 'lax' : envSameSite;
  }

  const opts: CookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite,
    path: '/',
  };

  if (typeof maxAgeMs === 'number') {
    opts.maxAge = maxAgeMs;
  }
  return opts;
}

export function isRecoveryConfigured(): boolean {
  return isMailConfigured();
}
