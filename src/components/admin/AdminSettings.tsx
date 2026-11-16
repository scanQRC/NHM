import React, {useCallback, useEffect, useState} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  Mail,
  Monitor,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
} from 'lucide-react';
import {
  ApiError,
  changeAdminPassword,
  confirmOwnerEmailChange,
  fetchStaffManagement,
  getOwnerEmailStatus,
  inviteStaffMember,
  requestOwnerEmailChange,
  revokeStaffInvitation,
  updateAdminSettings,
  updateStaffMember,
} from '../../services/api';
import {
  AuthenticatedAdminUser,
  PendingStaffInvite,
  PharmacySettings,
  StaffAccountSummary,
  StaffPermissions,
} from '../../types/nmh';

interface AdminSettingsProps {
  user: AuthenticatedAdminUser;
  settings: PharmacySettings;
  onSaveSettings: (next: PharmacySettings) => void;
  onOwnerEmailUpdated: (newEmail: string, isTemporaryTestEmail: boolean) => void;
  onUnauthorized: () => void;
}

const DEFAULT_INVITE_PERMISSIONS: StaffPermissions = {
  canViewRecords: true,
  canAddRecords: true,
  canDeleteRecords: false,
  canPrintRecords: true,
  canExportBackup: false,
  canManageSettings: false,
};

const PERMISSION_LABELS: {key: keyof StaffPermissions; label: string}[] = [
  {key: 'canViewRecords', label: 'View Archive'},
  {key: 'canAddRecords', label: 'Upload Photos'},
  {key: 'canDeleteRecords', label: 'Delete Records'},
  {key: 'canPrintRecords', label: 'Print & PDF'},
  {key: 'canExportBackup', label: 'Export Index'},
  {key: 'canManageSettings', label: 'Edit Settings'},
];

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  user,
  settings,
  onSaveSettings,
  onOwnerEmailUpdated,
  onUnauthorized,
}) => {
  const isMainAdmin = user.role === 'main_admin';
  const canEditSettings = isMainAdmin || user.permissions.canManageSettings;

  const [draft, setDraft] = useState<PharmacySettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Password rotation state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Owner email replacement state (Main Admin only)
  const [isTempTestEmail, setIsTempTestEmail] = useState(Boolean(user.isTemporaryTestEmail));
  const [ownerCurrentPassword, setOwnerCurrentPassword] = useState('');
  const [replacementEmail, setReplacementEmail] = useState('');
  const [ownerTransferChallenge, setOwnerTransferChallenge] = useState<{
    challengeId: string;
    maskedNewEmail: string;
  } | null>(null);
  const [ownerTransferOtp, setOwnerTransferOtp] = useState('');
  const [ownerTransferSubmitting, setOwnerTransferSubmitting] = useState(false);
  const [ownerTransferMessage, setOwnerTransferMessage] = useState('');
  const [ownerTransferError, setOwnerTransferError] = useState('');

  // Staff invitations & permissions (Main Admin only)
  const [staffUsers, setStaffUsers] = useState<StaffAccountSummary[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingStaffInvite[]>([]);
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePerms, setInvitePerms] = useState<StaffPermissions>(DEFAULT_INVITE_PERMISSIONS);
  const [invitingStaff, setInvitingStaff] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [inviteEmailSent, setInviteEmailSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const loadOwnerControls = useCallback(async () => {
    if (!isMainAdmin) return;
    try {
      const [ownerRes, staffRes] = await Promise.all([
        getOwnerEmailStatus(),
        fetchStaffManagement(),
      ]);
      setIsTempTestEmail(ownerRes.isTemporaryTestEmail);
      setStaffUsers(staffRes.users);
      setPendingInvites(staffRes.pendingInvitations);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
      }
    }
  }, [isMainAdmin, onUnauthorized]);

  useEffect(() => {
    void loadOwnerControls();
  }, [loadOwnerControls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) return;
    setSavingSettings(true);
    setSettingsError('');
    setSavedNotice(false);
    try {
      const updated = await updateAdminSettings(draft);
      onSaveSettings(updated);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setSettingsError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Enter your current password and a new strong password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordMessage('Password updated securely. Previous sessions were invalidated.');
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 401 &&
        err.message === 'Authentication required.'
      ) {
        onUnauthorized();
        return;
      }
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRequestOwnerTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerTransferError('');
    setOwnerTransferMessage('');
    if (!ownerCurrentPassword || !replacementEmail.trim()) {
      setOwnerTransferError('Enter your current password and the replacement Main Admin email.');
      return;
    }

    setOwnerTransferSubmitting(true);
    try {
      const res = await requestOwnerEmailChange(ownerCurrentPassword, replacementEmail.trim());
      setOwnerTransferChallenge({
        challengeId: res.challengeId,
        maskedNewEmail: res.maskedNewEmail,
      });
      setOwnerTransferOtp('');
      setOwnerCurrentPassword('');
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 401 &&
        err.message === 'Authentication required.'
      ) {
        onUnauthorized();
        return;
      }
      setOwnerTransferError(err instanceof Error ? err.message : 'Unable to start email transfer.');
    } finally {
      setOwnerTransferSubmitting(false);
    }
  };

  const handleConfirmOwnerTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerTransferChallenge) return;
    setOwnerTransferError('');
    setOwnerTransferSubmitting(true);
    try {
      const res = await confirmOwnerEmailChange(
        ownerTransferChallenge.challengeId,
        ownerTransferOtp.trim()
      );
      setOwnerTransferChallenge(null);
      setOwnerTransferOtp('');
      setReplacementEmail('');
      setIsTempTestEmail(res.isTemporaryTestEmail);
      setOwnerTransferMessage(
        `Main Admin email updated securely to ${res.newEmail}. Future login OTPs will go to this address.`
      );
      onOwnerEmailUpdated(res.newEmail, res.isTemporaryTestEmail);
      await loadOwnerControls();
    } catch (err) {
      setOwnerTransferError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setOwnerTransferSubmitting(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setGeneratedInviteLink('');
    setCopiedLink(false);

    if (!inviteDisplayName.trim() || !inviteEmail.trim()) {
      setStaffError('Staff full name and email address are required.');
      return;
    }

    setInvitingStaff(true);
    try {
      const res = await inviteStaffMember({
        displayName: inviteDisplayName.trim(),
        email: inviteEmail.trim(),
        permissions: invitePerms,
      });
      setGeneratedInviteLink(`${window.location.origin}${res.invitePath}`);
      setInviteEmailSent(res.emailSent);
      setInviteDisplayName('');
      setInviteEmail('');
      setInvitePerms(DEFAULT_INVITE_PERMISSIONS);
      await loadOwnerControls();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setStaffError(err instanceof Error ? err.message : 'Unable to create staff invitation.');
    } finally {
      setInvitingStaff(false);
    }
  };

  const handleToggleStaffPermission = async (
    member: StaffAccountSummary,
    key: keyof StaffPermissions
  ) => {
    try {
      await updateStaffMember(member.id, {
        permissions: {...member.permissions, [key]: !member.permissions[key]},
        isActive: member.isActive,
      });
      await loadOwnerControls();
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Failed to update permissions.');
    }
  };

  const handleToggleStaffActive = async (member: StaffAccountSummary) => {
    try {
      await updateStaffMember(member.id, {
        permissions: member.permissions,
        isActive: !member.isActive,
      });
      await loadOwnerControls();
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Failed to update account status.');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeStaffInvitation(inviteId);
      await loadOwnerControls();
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Failed to revoke invitation.');
    }
  };

  const handleCopyInviteLink = async () => {
    if (!generatedInviteLink) return;
    await navigator.clipboard.writeText(generatedInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <h1 className="font-display text-xl font-bold text-[#102B50]">Settings &amp; Access Control</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure pharmacy letterhead details, manage owner email replacement, and invite
          authorized staff with granular permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Pharmacy Profile Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <h2 className="font-display text-lg font-bold text-[#102B50]">
              Pharmacy Profile &amp; Print Header
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="set-name"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Pharmacy Name
                </label>
                <input
                  id="set-name"
                  type="text"
                  disabled={!canEditSettings}
                  value={draft.pharmacyName}
                  onChange={(e) => setDraft({...draft, pharmacyName: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 disabled:bg-slate-50 min-h-[42px]"
                />
              </div>

              <div>
                <label
                  htmlFor="set-license"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Dispensary License Number
                </label>
                <input
                  id="set-license"
                  type="text"
                  disabled={!canEditSettings}
                  value={draft.licenseNumber}
                  onChange={(e) => setDraft({...draft, licenseNumber: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 disabled:bg-slate-50 font-mono-tabular min-h-[42px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="set-phone"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Counter Phone
                </label>
                <input
                  id="set-phone"
                  type="text"
                  disabled={!canEditSettings}
                  value={draft.phone}
                  onChange={(e) => setDraft({...draft, phone: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 disabled:bg-slate-50 min-h-[42px]"
                />
              </div>

              <div>
                <label
                  htmlFor="set-email"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Desk Email
                </label>
                <input
                  id="set-email"
                  type="email"
                  disabled={!canEditSettings}
                  value={draft.email}
                  onChange={(e) => setDraft({...draft, email: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 disabled:bg-slate-50 min-h-[42px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="set-addr1" className="block text-xs font-medium text-slate-600 mb-1.5">
                Address Line 1
              </label>
              <input
                id="set-addr1"
                type="text"
                disabled={!canEditSettings}
                value={draft.addressLine1}
                onChange={(e) => setDraft({...draft, addressLine1: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 disabled:bg-slate-50 min-h-[42px]"
              />
            </div>

            <div>
              <label
                htmlFor="set-print-note"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Print Footer Confidentiality Note
              </label>
              <input
                id="set-print-note"
                type="text"
                disabled={!canEditSettings}
                value={draft.printHeaderNote}
                onChange={(e) => setDraft({...draft, printHeaderNote: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 disabled:bg-slate-50 min-h-[42px]"
              />
            </div>

            {settingsError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {settingsError}
              </p>
            )}

            {canEditSettings ? (
              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] disabled:opacity-60 rounded-lg transition-colors min-h-[42px] cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
                {savedNotice && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved to server database</span>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Settings editing is restricted to the Main Admin or permitted staff.
              </p>
            )}
          </form>

          {/* Owner-Controlled Main Admin Email Replacement */}
          {isMainAdmin && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#1769D2]" />
                  <h2 className="font-display text-lg font-bold text-[#102B50]">
                    Owner-Controlled Main Admin Email Transfer
                  </h2>
                </div>
                {isTempTestEmail && (
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                    Temporary Test Email Active
                  </span>
                )}
              </div>

              {isTempTestEmail && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    The current Main Admin email (
                    <strong className="font-mono-tabular">{user.email}</strong>) is marked as a
                    temporary testing address. Replace it below with the actual owner&apos;s
                    personal email or official National Medical Hall business email once ready.
                  </span>
                </div>
              )}

              {!ownerTransferChallenge ? (
                <form onSubmit={handleRequestOwnerTransfer} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="owner-transfer-pw"
                        className="block text-xs font-medium text-slate-600 mb-1.5"
                      >
                        Verify Current Password
                      </label>
                      <input
                        id="owner-transfer-pw"
                        type="password"
                        value={ownerCurrentPassword}
                        onChange={(e) => setOwnerCurrentPassword(e.target.value)}
                        placeholder="Current Main Admin password"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="owner-transfer-email"
                        className="block text-xs font-medium text-slate-600 mb-1.5"
                      >
                        New Owner / Official NMH Email
                      </label>
                      <input
                        id="owner-transfer-email"
                        type="email"
                        value={replacementEmail}
                        onChange={(e) => setReplacementEmail(e.target.value)}
                        placeholder="owner@nationalmedicalhall.com"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
                      />
                    </div>
                  </div>

                  {ownerTransferError && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {ownerTransferError}
                    </p>
                  )}
                  {ownerTransferMessage && (
                    <p className="text-xs font-medium text-[#059669]">{ownerTransferMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={ownerTransferSubmitting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#102B50] hover:bg-[#1769D2] disabled:opacity-60 rounded-lg transition-colors min-h-[42px] cursor-pointer"
                  >
                    {ownerTransferSubmitting
                      ? 'Sending Verification OTP...'
                      : 'Send 6-Digit OTP to New Email'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmOwnerTransfer} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Enter the 6-digit confirmation OTP sent to{' '}
                    <strong className="font-mono-tabular text-[#102B50]">
                      {ownerTransferChallenge.maskedNewEmail}
                    </strong>{' '}
                    to complete the Main Admin email replacement.
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={ownerTransferOtp}
                    onChange={(e) => setOwnerTransferOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="w-full max-w-[220px] px-4 py-2.5 text-center font-mono-tabular tracking-[0.35em] text-base rounded-lg border border-slate-300"
                  />
                  {ownerTransferError && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {ownerTransferError}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={ownerTransferSubmitting}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg cursor-pointer"
                    >
                      Confirm Email Replacement
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerTransferChallenge(null)}
                      className="px-4 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Main Admin Staff Invitation & Permission Management */}
          {isMainAdmin && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#12A66A]" />
                <h2 className="font-display text-lg font-bold text-[#102B50]">
                  Staff Invitations &amp; Permissions (Main Admin Only)
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Only the Main Admin can invite authorized staff and assign granular archive
                permissions. Invited staff must still sign in using their email, password, and a
                6-digit email OTP.
              </p>

              <form onSubmit={handleInviteStaff} className="space-y-4 p-4 rounded-lg bg-[#F4F7FB] border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="invite-staff-name"
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      Staff Full Name
                    </label>
                    <input
                      id="invite-staff-name"
                      type="text"
                      value={inviteDisplayName}
                      onChange={(e) => setInviteDisplayName(e.target.value)}
                      placeholder="e.g. Rakesh Verma"
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="invite-staff-email"
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      Staff Email Address
                    </label>
                    <input
                      id="invite-staff-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="staff@example.com"
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 min-h-[40px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-600 mb-2">Assign Permissions</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PERMISSION_LABELS.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 text-xs text-[#102B50] bg-white px-2.5 py-2 rounded border border-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={invitePerms[perm.key]}
                          onChange={() =>
                            setInvitePerms((prev) => ({
                              ...prev,
                              [perm.key]: !prev[perm.key],
                            }))
                          }
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {staffError && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {staffError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={invitingStaff}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  {invitingStaff ? 'Creating Invitation...' : 'Create Staff Invitation'}
                </button>
              </form>

              {generatedInviteLink && (
                <div className="p-3.5 rounded-lg bg-[#ECFDF5] border border-emerald-200 space-y-2 text-xs">
                  <div className="font-semibold text-[#102B50]">
                    One-Time Staff Invite Created{' '}
                    {inviteEmailSent
                      ? '(Email sent via Resend)'
                      : '(Share this private link securely)'}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="inline-flex items-center gap-1 px-3 py-1.5 font-semibold text-[#102B50] bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Accounts & Permissions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-600">Authorized Accounts</h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  {staffUsers.map((member) => (
                    <div key={member.id} className="p-3.5 space-y-2.5 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-[#102B50]">
                            {member.displayName}{' '}
                            <span className="font-mono-tabular text-xs font-normal text-slate-500">
                              ({member.email})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.role === 'main_admin' ? 'Main Admin (Owner)' : 'Authorized Staff'} ·{' '}
                            {member.isActive ? 'Active' : 'Suspended'}
                          </div>
                        </div>
                        {member.role === 'staff' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStaffActive(member)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                              member.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {member.isActive ? 'Suspend Access' : 'Restore Access'}
                          </button>
                        )}
                      </div>

                      {member.role === 'staff' && (
                        <div className="flex flex-wrap gap-2">
                          {PERMISSION_LABELS.map((perm) => (
                            <label
                              key={perm.key}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={member.permissions[perm.key]}
                                onChange={() => handleToggleStaffPermission(member, perm.key)}
                              />
                              <span>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-600">Pending Staff Invitations</h3>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#102B50]">
                            {inv.displayName} ({inv.email})
                          </div>
                          <div className="text-slate-500">
                            Expires {new Date(inv.expiresAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Change Main Admin Password */}
          {isMainAdmin && (
            <form
              onSubmit={handlePasswordChange}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#1769D2]" />
                <h2 className="font-display text-lg font-bold text-[#102B50]">
                  Change Main Admin Password
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Requires your current password and invalidates any older active sessions.
              </p>

              <div>
                <label
                  htmlFor="pw-current"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Current Password
                </label>
                <input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pw-new"
                    className="block text-xs font-medium text-slate-600 mb-1.5"
                  >
                    New Strong Password
                  </label>
                  <input
                    id="pw-new"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="10+ chars, upper/lower/digit/symbol"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pw-confirm"
                    className="block text-xs font-medium text-slate-600 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="pw-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
                  />
                </div>
              </div>

              {passwordError && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {passwordError}
                </p>
              )}
              {passwordMessage && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#059669]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#102B50] hover:bg-[#1769D2] disabled:opacity-60 rounded-lg transition-colors min-h-[42px] cursor-pointer"
              >
                {changingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102B50]">
              <UserCog className="w-4 h-4 text-[#1769D2]" />
              <span>Authenticated Account</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-600">Display Name</span>
                <span className="font-semibold text-[#102B50]">{user.displayName}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-600">Username</span>
                <span className="font-mono-tabular font-semibold text-[#102B50]">
                  @{user.username}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-600">Email</span>
                <span className="font-mono-tabular text-[#102B50] truncate">{user.email}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-600">Account Role</span>
                <span className="font-semibold text-[#059669]">
                  {isMainAdmin ? 'Main Admin (Owner)' : 'Invited Staff'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-600">2-Step Email OTP</span>
                <span className="font-semibold text-[#059669]">Enforced on Every Login</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102B50]">
              <Lock className="w-4 h-4 text-[#1769D2]" />
              <span>Security &amp; Archival Policy</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Public Signup</span>
                <span className="font-semibold text-[#102B50]">Permanently Disabled</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">OTP Auto-Account Creation</span>
                <span className="font-semibold text-[#102B50]">Strictly Blocked</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Session Storage</span>
                <span className="font-semibold text-[#102B50]">HTTP-Only Server Cookie</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">OCR / Medicine Reading</span>
                <span className="font-semibold text-[#102B50]">Disabled by Requirement</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102B50]">
              <Monitor className="w-4 h-4 text-[#059669]" />
              <span>Target Browser Compatibility</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{settings.targetBrowsers}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
              <span>Standard HTML5 file inputs and native browser print used throughout.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
