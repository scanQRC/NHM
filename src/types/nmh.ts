export type PublicRoute = 'home' | 'about' | 'services' | 'contact' | 'location';

export type AdminSection =
  | 'dashboard'
  | 'archive'
  | 'search'
  | 'monthly'
  | 'print'
  | 'backup'
  | 'settings';

export type AppView =
  | {area: 'public'; page: PublicRoute}
  | {area: 'admin-login'}
  | {area: 'admin-setup'}
  | {area: 'admin-invite'; token: string}
  | {area: 'admin'; section: AdminSection};

export interface StaffPermissions {
  canViewRecords: boolean;
  canAddRecords: boolean;
  canDeleteRecords: boolean;
  canPrintRecords: boolean;
  canExportBackup: boolean;
  canManageSettings: boolean;
}

export interface AuthenticatedAdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'main_admin' | 'staff';
  permissions: StaffPermissions;
  isTemporaryTestEmail?: boolean;
}

export interface SetupStatusResponse {
  setupRequired: boolean;
  setupTokenRequired: boolean;
  mailConfigured: boolean;
  publicSignupEnabled: false;
  staffInviteSupported: boolean;
}

export interface LoginOtpChallengeResponse {
  otpRequired: true;
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
}

export interface RecoveryStatusResponse {
  configured: boolean;
  method: 'smtp' | 'none';
  message: string;
}

export interface StaffAccountSummary {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'main_admin' | 'staff';
  isActive: boolean;
  permissions: StaffPermissions;
  createdAt: string;
}

export interface PendingStaffInvite {
  id: string;
  email: string;
  displayName: string;
  permissions: StaffPermissions;
  expiresAt: number;
  createdAt: string;
}

export interface PrescriptionRecord {
  id: string;
  recordNumber: string;
  patientName: string;
  phone: string;
  doctorName: string;
  visitDate: string; // YYYY-MM-DD
  archiveMonth: string; // YYYY-MM
  photoUrl: string;
  photoFilename: string;
  notes: string;
  loggedBy: string;
  createdAt: string;
}

export interface PharmacySettings {
  pharmacyName: string;
  shortCode: string;
  licenseNumber: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  cityStateZip: string;
  googleMapsSearchUrl: string;
  printHeaderNote: string;
  publicSignupEnabled: false;
  ocrEnabled: false;
  targetBrowsers: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  summary: string;
  details: string;
  category: string;
  featured?: boolean;
}
