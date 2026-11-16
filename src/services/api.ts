import {
  AuthenticatedAdminUser,
  LoginOtpChallengeResponse,
  PendingStaffInvite,
  PharmacySettings,
  PrescriptionRecord,
  RecoveryStatusResponse,
  SetupStatusResponse,
  StaffAccountSummary,
  StaffPermissions,
} from '../types/nmh';

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  setupRequired?: boolean;

  constructor(
    message: string,
    status: number,
    extras?: {
      retryAfterSeconds?: number;
      remainingAttempts?: number;
      setupRequired?: boolean;
    }
  ) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = extras?.retryAfterSeconds;
    this.remainingAttempts = extras?.remainingAttempts;
    this.setupRequired = extras?.setupRequired;
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      {
        retryAfterSeconds: data?.retryAfterSeconds,
        remainingAttempts: data?.remainingAttempts,
        setupRequired: data?.setupRequired,
      }
    );
  }
  return data as T;
}

export async function getSetupStatus(): Promise<SetupStatusResponse> {
  return apiFetch<SetupStatusResponse>('/api/auth/setup-status', {method: 'GET'});
}

export async function completeInitialSetup(payload: {
  username: string;
  email: string;
  displayName: string;
  password: string;
  setupToken?: string;
}): Promise<{setupCompleted: boolean; message: string}> {
  return apiFetch<{setupCompleted: boolean; message: string}>('/api/auth/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<LoginOtpChallengeResponse> {
  return apiFetch<LoginOtpChallengeResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  });
}

export async function verifyLoginOtp(
  challengeId: string,
  otp: string
): Promise<{user: AuthenticatedAdminUser; isTemporaryTestEmail: boolean}> {
  return apiFetch<{user: AuthenticatedAdminUser; isTemporaryTestEmail: boolean}>(
    '/api/auth/login/verify-otp',
    {
      method: 'POST',
      body: JSON.stringify({challengeId, otp}),
    }
  );
}

export async function resendLoginOtp(
  challengeId: string
): Promise<{ok: boolean; expiresInSeconds: number}> {
  return apiFetch<{ok: boolean; expiresInSeconds: number}>('/api/auth/login/resend-otp', {
    method: 'POST',
    body: JSON.stringify({challengeId}),
  });
}

export async function logoutAdmin(): Promise<void> {
  await apiFetch<{ok: boolean}>('/api/auth/logout', {method: 'POST'});
}

export async function getAuthSession(): Promise<{
  authenticated: boolean;
  expiresAt?: number;
  isTemporaryTestEmail?: boolean;
  user?: AuthenticatedAdminUser;
}> {
  try {
    return await apiFetch<{
      authenticated: boolean;
      expiresAt: number;
      isTemporaryTestEmail: boolean;
      user: AuthenticatedAdminUser;
    }>('/api/auth/session', {method: 'GET'});
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return {authenticated: false};
    }
    throw err;
  }
}

export async function getInviteInfo(token: string): Promise<{
  valid: boolean;
  maskedEmail: string;
  displayName: string;
  permissions: StaffPermissions;
}> {
  return apiFetch(`/api/auth/invite-info?token=${encodeURIComponent(token)}`, {method: 'GET'});
}

export async function acceptStaffInvite(payload: {
  token: string;
  email: string;
  username: string;
  password: string;
}): Promise<{ok: boolean; message: string}> {
  return apiFetch('/api/auth/accept-invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRecoveryStatus(): Promise<RecoveryStatusResponse> {
  return apiFetch<RecoveryStatusResponse>('/api/auth/recovery-status', {method: 'GET'});
}

export async function requestPasswordRecovery(email: string): Promise<{ok: boolean; message: string}> {
  return apiFetch('/api/auth/recovery/request', {
    method: 'POST',
    body: JSON.stringify({email}),
  });
}

export async function confirmPasswordRecovery(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ok: boolean; message: string}> {
  return apiFetch('/api/auth/recovery/confirm', {
    method: 'POST',
    body: JSON.stringify({email, otp, newPassword}),
  });
}

export async function fetchAdminRecords(): Promise<PrescriptionRecord[]> {
  const res = await apiFetch<{records: PrescriptionRecord[]}>('/api/admin/records', {
    method: 'GET',
  });
  return res.records;
}

export async function createAdminRecord(payload: {
  patientName: string;
  phone: string;
  doctorName: string;
  visitDate: string;
  notes: string;
  photoUrl: string;
  photoFilename: string;
}): Promise<PrescriptionRecord> {
  const res = await apiFetch<{record: PrescriptionRecord}>('/api/admin/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.record;
}

export async function deleteAdminRecord(id: string): Promise<void> {
  await apiFetch<{ok: boolean}>(`/api/admin/records/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminSettings(): Promise<PharmacySettings | null> {
  const res = await apiFetch<{settings: PharmacySettings | null}>('/api/admin/settings', {
    method: 'GET',
  });
  return res.settings;
}

export async function updateAdminSettings(
  settings: PharmacySettings
): Promise<PharmacySettings> {
  const res = await apiFetch<{settings: PharmacySettings}>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({settings}),
  });
  return res.settings;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiFetch<{ok: boolean}>('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({currentPassword, newPassword}),
  });
}

export async function getOwnerEmailStatus(): Promise<{
  authorizedEmail: string;
  isTemporaryTestEmail: boolean;
  currentUserEmail: string;
}> {
  return apiFetch('/api/admin/owner-email/status', {method: 'GET'});
}

export async function requestOwnerEmailChange(
  currentPassword: string,
  newEmail: string
): Promise<{challengeId: string; maskedNewEmail: string; expiresInSeconds: number}> {
  return apiFetch('/api/admin/owner-email/request-change', {
    method: 'POST',
    body: JSON.stringify({currentPassword, newEmail}),
  });
}

export async function confirmOwnerEmailChange(
  challengeId: string,
  otp: string
): Promise<{ok: boolean; newEmail: string; isTemporaryTestEmail: boolean}> {
  return apiFetch('/api/admin/owner-email/confirm-change', {
    method: 'POST',
    body: JSON.stringify({challengeId, otp}),
  });
}

export async function fetchStaffManagement(): Promise<{
  users: StaffAccountSummary[];
  pendingInvitations: PendingStaffInvite[];
}> {
  return apiFetch('/api/admin/staff', {method: 'GET'});
}

export async function inviteStaffMember(payload: {
  email: string;
  displayName: string;
  permissions: StaffPermissions;
}): Promise<{invitation: PendingStaffInvite; invitePath: string; emailSent: boolean}> {
  return apiFetch('/api/admin/staff/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStaffMember(
  id: string,
  payload: {permissions: StaffPermissions; isActive: boolean}
): Promise<{ok: boolean; permissions: StaffPermissions; isActive: boolean}> {
  return apiFetch(`/api/admin/staff/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function revokeStaffInvitation(id: string): Promise<void> {
  await apiFetch(`/api/admin/staff/invitations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
