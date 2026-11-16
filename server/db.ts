import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface StaffPermissions {
  canViewRecords: boolean;
  canAddRecords: boolean;
  canDeleteRecords: boolean;
  canPrintRecords: boolean;
  canExportBackup: boolean;
  canManageSettings: boolean;
}

export const FULL_OWNER_PERMISSIONS: StaffPermissions = {
  canViewRecords: true,
  canAddRecords: true,
  canDeleteRecords: true,
  canPrintRecords: true,
  canExportBackup: true,
  canManageSettings: true,
};

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: 'main_admin' | 'staff';
  permissions_json: string;
  password_hash: string;
  is_active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionJoinRow {
  session_id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
  last_seen_at: number;
  username: string;
  email: string;
  display_name: string;
  role: 'main_admin' | 'staff';
  permissions_json: string;
  is_active: number;
}

export interface PrescriptionRow {
  id: string;
  record_number: string;
  patient_name: string;
  phone: string;
  doctor_name: string;
  visit_date: string;
  archive_month: string;
  photo_url: string;
  photo_filename: string;
  notes: string;
  logged_by: string;
  created_at: string;
  created_by_user_id: string;
}

export interface LoginOtpChallengeRow {
  id: string;
  user_id: string;
  email: string;
  otp_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: number;
  consumed_at: number | null;
  resend_available_at: number;
  ip_address: string;
  created_at: number;
}

export interface StaffInvitationRow {
  id: string;
  email: string;
  display_name: string;
  permissions_json: string;
  token_hash: string;
  expires_at: number;
  invited_by_user_id: string;
  accepted_at: number | null;
  revoked_at: number | null;
  created_at: string;
}

export interface OwnerEmailChangeRow {
  id: string;
  user_id: string;
  old_email: string;
  new_email: string;
  otp_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: number;
  confirmed_at: number | null;
  created_at: number;
}

export interface SystemAuthConfigRow {
  id: string;
  authorized_main_admin_email: string;
  is_temporary_test_email: number;
  updated_at: string;
}

// Temporary initial test admin email stored strictly on the backend.
// Can be overridden via NMH_AUTHORIZED_MAIN_ADMIN_EMAIL or replaced post-setup via Settings -> Owner Email Transfer.
const DEFAULT_TEMP_AUTHORIZED_ADMIN_EMAIL = 'scaninfoqr@gmail.com';

const DEFAULT_SETTINGS = {
  pharmacyName: 'National Medical Hall',
  shortCode: 'NMH',
  licenseNumber: 'JK-UDH-NMH-0418',
  phone: '9419294905',
  emergencyPhone: '9419294905',
  email: 'care@nationalmedicalhall.example',
  addressLine1: 'Near Nehru Memorial Higher Secondary School',
  addressLine2: 'Hospital Road',
  cityStateZip: 'Udhampur – 182101, Jammu & Kashmir, India',
  googleMapsSearchUrl:
    'https://www.google.com/maps/search/?api=1&query=National+Medical+Hall+Near+Nehru+Memorial+Higher+Secondary+School+Hospital+Road+Udhampur+182101',
  printHeaderNote:
    'National Medical Hall (NMH), Udhampur · Confidential Counter Prescription Record.',
  publicSignupEnabled: false,
  ocrEnabled: false,
  targetBrowsers: 'Windows 10/11 (Edge, Chrome, Firefox) · Android Chrome · Windows 7 Legacy Mode',
};

export function initDatabase(dbPathOverride?: string): Database.Database {
  const dbPath =
    dbPathOverride ||
    process.env.NMH_DB_PATH ||
    path.resolve(process.cwd(), 'data', 'nmh.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS system_auth_config (
      id TEXT PRIMARY KEY,
      authorized_main_admin_email TEXT NOT NULL,
      is_temporary_test_email INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('main_admin', 'staff')),
      permissions_json TEXT NOT NULL DEFAULT '{}',
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      first_failed_at INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS login_otp_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      resend_available_at INTEGER NOT NULL,
      ip_address TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_invitations (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      permissions_json TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      invited_by_user_id TEXT NOT NULL,
      accepted_at INTEGER,
      revoked_at INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (invited_by_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS owner_email_changes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      old_email TEXT NOT NULL,
      new_email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at INTEGER NOT NULL,
      confirmed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pharmacy_settings (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prescription_records (
      id TEXT PRIMARY KEY,
      record_number TEXT NOT NULL UNIQUE,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      archive_month TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      photo_filename TEXT NOT NULL,
      notes TEXT NOT NULL,
      logged_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by_user_id TEXT NOT NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES admin_users(id) ON DELETE RESTRICT
    );
  `);

  // Safe migration for pre-existing databases lacking permissions_json on admin_users
  const userCols = db.prepare('PRAGMA table_info(admin_users)').all() as {name: string}[];
  if (!userCols.some((c) => c.name === 'permissions_json')) {
    db.exec(`ALTER TABLE admin_users ADD COLUMN permissions_json TEXT NOT NULL DEFAULT '{}'`);
  }

  // Seed or sync backend-only authorized Main Admin email prior to initial Main Admin setup
  const envAuthorizedEmail = process.env.NMH_AUTHORIZED_MAIN_ADMIN_EMAIL?.trim().toLowerCase();
  const initialAuthorizedEmail = envAuthorizedEmail || DEFAULT_TEMP_AUTHORIZED_ADMIN_EMAIL;
  const isTempFlag = initialAuthorizedEmail === DEFAULT_TEMP_AUTHORIZED_ADMIN_EMAIL ? 1 : 0;

  const existingConfig = db
    .prepare('SELECT id FROM system_auth_config WHERE id = ?')
    .get('default');
  if (!existingConfig) {
    db.prepare(
      `INSERT INTO system_auth_config (id, authorized_main_admin_email, is_temporary_test_email, updated_at)
       VALUES (?, ?, ?, ?)`
    ).run('default', initialAuthorizedEmail, isTempFlag, new Date().toISOString());
  } else if (envAuthorizedEmail) {
    const mainAdminExists = db
      .prepare(`SELECT COUNT(*) AS total FROM admin_users WHERE role = 'main_admin'`)
      .get() as {total: number};
    if (mainAdminExists.total === 0) {
      db.prepare(
        `UPDATE system_auth_config
         SET authorized_main_admin_email = ?, is_temporary_test_email = ?, updated_at = ?
         WHERE id = 'default'`
      ).run(envAuthorizedEmail, isTempFlag, new Date().toISOString());
    }
  }

  const existingSettings = db
    .prepare('SELECT id FROM pharmacy_settings WHERE id = ?')
    .get('default');
  if (!existingSettings) {
    db.prepare(
      'INSERT INTO pharmacy_settings (id, payload_json, updated_at) VALUES (?, ?, ?)'
    ).run('default', JSON.stringify(DEFAULT_SETTINGS), new Date().toISOString());
  }

  return db;
}
