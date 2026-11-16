import React, {useEffect, useState} from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MailCheck,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import {
  ApiError,
  acceptStaffInvite,
  completeInitialSetup,
  confirmPasswordRecovery,
  getInviteInfo,
  getRecoveryStatus,
  getSetupStatus,
  loginAdmin,
  requestPasswordRecovery,
  resendLoginOtp,
  verifyLoginOtp,
} from '../../services/api';
import {
  AuthenticatedAdminUser,
  LoginOtpChallengeResponse,
  RecoveryStatusResponse,
  SetupStatusResponse,
} from '../../types/nmh';
import {NMHLogo} from '../common/NMHLogo';

interface AdminLoginPageProps {
  initialNotice?: string;
  inviteToken?: string;
  onAuthSuccess: (user: AuthenticatedAdminUser) => void;
  onReturnPublic: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  initialNotice = '',
  inviteToken = '',
  onAuthSuccess,
  onReturnPublic,
}) => {
  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [notice, setNotice] = useState(initialNotice);

  // Invite activation state (only when ?token= present from Main Admin invite)
  const [inviteInfo, setInviteInfo] = useState<{
    valid: boolean;
    maskedEmail: string;
    displayName: string;
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirm, setInviteConfirm] = useState('');
  const [inviteActive, setInviteActive] = useState(Boolean(inviteToken));

  // Login Step 1 (email + password) & Step 2 (6-digit OTP)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<LoginOtpChallengeResponse | null>(null);
  const [otpCode, setOtpCode] = useState('');

  // Recovery panel state
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState('');

  // One-time Main Admin setup state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupDisplayName, setSetupDisplayName] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNotice(initialNotice);
  }, [initialNotice]);

  useEffect(() => {
    let active = true;
    const tasks: Promise<unknown>[] = [getSetupStatus(), getRecoveryStatus()];
    if (inviteToken) {
      tasks.push(getInviteInfo(inviteToken));
    }

    Promise.all(tasks)
      .then(([setupRes, recoveryRes, inviteRes]) => {
        if (!active) return;
        setSetupStatus(setupRes as SetupStatusResponse);
        setRecoveryStatus(recoveryRes as RecoveryStatusResponse);
        if (inviteRes) {
          setInviteInfo(inviteRes as {valid: boolean; maskedEmail: string; displayName: string});
          setInviteActive(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        if (inviteToken && err instanceof ApiError) {
          setError(err.message);
          setInviteActive(false);
        } else {
          setError('Unable to reach authentication server. Please verify the backend is running.');
        }
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, [inviteToken]);

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your authorized email address and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const challenge = await loginAdmin(email.trim(), password);
      setOtpChallenge(challenge);
      setOtpCode('');
      setPassword('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.setupRequired) {
          setSetupStatus((prev) =>
            prev ? {...prev, setupRequired: true} : null
          );
        }
        const suffix =
          typeof err.remainingAttempts === 'number' && err.remainingAttempts > 0
            ? ` (${err.remainingAttempts} attempt${
                err.remainingAttempts === 1 ? '' : 's'
              } remaining before temporary lockout)`
            : '';
        setError(`${err.message}${suffix}`);
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpChallenge) return;
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const {user, isTemporaryTestEmail} = await verifyLoginOtp(
        otpChallenge.challengeId,
        otpCode.trim()
      );
      onAuthSuccess({...user, isTemporaryTestEmail});
    } catch (err) {
      if (err instanceof ApiError) {
        const suffix =
          typeof err.remainingAttempts === 'number' && err.remainingAttempts > 0
            ? ` (${err.remainingAttempts} attempt${err.remainingAttempts === 1 ? '' : 's'} remaining)`
            : '';
        setError(`${err.message}${suffix}`);
      } else {
        setError('OTP verification failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpChallenge) return;
    setSubmitting(true);
    setError('');
    try {
      await resendLoginOtp(otpChallenge.challengeId);
      setNotice(`A fresh 6-digit OTP has been sent to ${otpChallenge.maskedEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupUsername.trim() || !setupEmail.trim() || !setupPassword) {
      setError('Authorized email, username, and password are required.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (setupStatus?.setupTokenRequired && !setupToken.trim()) {
      setError('Server setup token (ADMIN_SETUP_TOKEN) is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await completeInitialSetup({
        username: setupUsername.trim(),
        email: setupEmail.trim(),
        displayName: setupDisplayName.trim() || 'Main Administrator',
        password: setupPassword,
        setupToken: setupToken.trim() || undefined,
      });
      setSetupStatus((prev) => (prev ? {...prev, setupRequired: false} : prev));
      setEmail(setupEmail.trim());
      setNotice(result.message);
      setSetupPassword('');
      setSetupConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete initial setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteUsername.trim() || !invitePassword) {
      setError('Invited email, username, and strong password are required.');
      return;
    }
    if (invitePassword !== inviteConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await acceptStaffInvite({
        token: inviteToken,
        email: inviteEmail.trim(),
        username: inviteUsername.trim(),
        password: invitePassword,
      });
      setInviteActive(false);
      setEmail(inviteEmail.trim());
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate staff invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setError('Enter your registered email address.');
      return;
    }
    setSubmitting(true);
    setError('');
    setRecoveryFeedback('');
    try {
      const res = await requestPasswordRecovery(recoveryEmail.trim());
      setRecoveryRequested(true);
      setRecoveryFeedback(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request password recovery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await confirmPasswordRecovery(
        recoveryEmail.trim(),
        recoveryOtp.trim(),
        recoveryNewPassword
      );
      setShowRecoveryPanel(false);
      setRecoveryRequested(false);
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const activePasswordForRules = inviteActive ? invitePassword : setupPassword;
  const passwordChecks = [
    {label: 'At least 10 characters', ok: activePasswordForRules.length >= 10},
    {
      label: 'Uppercase & lowercase letters',
      ok: /[A-Z]/.test(activePasswordForRules) && /[a-z]/.test(activePasswordForRules),
    },
    {label: 'At least one number', ok: /[0-9]/.test(activePasswordForRules)},
    {label: 'At least one symbol (!@#$%)', ok: /[^A-Za-z0-9]/.test(activePasswordForRules)},
  ];

  const isSetupMode = Boolean(setupStatus?.setupRequired) && !inviteActive;

  const headingTitle = inviteActive
    ? 'Activate Invited Staff Account'
    : isSetupMode
      ? 'Main Admin One-Time Setup'
      : otpChallenge
        ? 'Enter 6-Digit Email OTP'
        : 'Authorized Admin Sign In';

  const headingSubtitle = inviteActive
    ? `Complete setup for ${inviteInfo?.displayName || 'invited staff'} (${inviteInfo?.maskedEmail || ''}). Public signup is disabled.`
    : isSetupMode
      ? 'Enter the owner-authorized Main Admin email and create a strong password. All unauthorized emails are rejected.'
      : otpChallenge
        ? `Enter the real 6-digit verification code dispatched to ${otpChallenge.maskedEmail}.`
        : 'Sign in with your authorized email and password. A 6-digit verification OTP will be emailed after password check.';

  return (
    <div className="min-h-screen bg-[#102B50] flex flex-col justify-between px-4 py-8 sm:px-6">
      <div className="max-w-[1000px] w-full mx-auto">
        <button
          type="button"
          onClick={onReturnPublic}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white transition-colors min-h-[40px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to National Medical Hall Public Site</span>
        </button>
      </div>

      <main className="max-w-[470px] w-full mx-auto my-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <NMHLogo variant="default" size="lg" />
          <div className="flex items-center gap-2 text-xs font-medium text-[#1769D2] pt-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Owner-Controlled Dispensary Portal</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-slate-500">No Public Signup</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#102B50] tracking-tight">
            {headingTitle}
          </h1>
          <p className="text-sm text-slate-600">{headingSubtitle}</p>
        </div>

        {notice && (
          <div className="mt-5 p-3.5 rounded-lg bg-[#F4F7FB] border border-slate-200 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-[#1769D2] shrink-0 mt-0.5" />
            <p className="text-xs text-[#102B50] leading-relaxed">{notice}</p>
          </div>
        )}

        {loadingStatus ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Checking server authentication status...
          </div>
        ) : inviteActive && inviteInfo ? (
          <form onSubmit={handleAcceptInviteSubmit} noValidate className="mt-6 space-y-4">
            <div className="p-3 rounded-lg bg-[#F4F7FB] border border-slate-200 flex items-center gap-2.5 text-xs text-[#102B50]">
              <UserPlus className="w-4 h-4 text-[#12A66A] shrink-0" />
              <span>
                Invited staff account: <strong>{inviteInfo.displayName}</strong> (
                {inviteInfo.maskedEmail})
              </span>
            </div>

            <div>
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Confirm Invited Email <span className="text-red-600">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                autoComplete="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter exact invited email"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="invite-username"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Choose Username <span className="text-red-600">*</span>
              </label>
              <input
                id="invite-username"
                type="text"
                autoComplete="username"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="lowercase, 3+ chars"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="invite-password"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Set Password <span className="text-red-600">*</span>
              </label>
              <input
                id="invite-password"
                type={showPassword ? 'text' : 'password'}
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="invite-confirm"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Confirm Password <span className="text-red-600">*</span>
              </label>
              <input
                id="invite-confirm"
                type={showPassword ? 'text' : 'password'}
                value={inviteConfirm}
                onChange={(e) => setInviteConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#F4F7FB] border border-slate-200 space-y-1.5">
              {passwordChecks.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      rule.ok ? 'text-[#12A66A]' : 'text-slate-300'
                    }`}
                  />
                  <span className={rule.ok ? 'text-[#102B50] font-medium' : 'text-slate-500'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] disabled:opacity-60 rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              {submitting ? 'Activating Staff Account...' : 'Activate Staff Account'}
            </button>
          </form>
        ) : isSetupMode ? (
          <form onSubmit={handleSetupSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="setup-email"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Authorized Main Admin Email <span className="text-red-600">*</span>
              </label>
              <input
                id="setup-email"
                type="email"
                autoComplete="email"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                placeholder="Enter authorized owner email"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="setup-display-name"
                  className="block text-sm font-medium text-[#102B50] mb-1.5"
                >
                  Owner Full Name
                </label>
                <input
                  id="setup-display-name"
                  type="text"
                  value={setupDisplayName}
                  onChange={(e) => setSetupDisplayName(e.target.value)}
                  placeholder="Main Administrator"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="setup-username"
                  className="block text-sm font-medium text-[#102B50] mb-1.5"
                >
                  Admin Username <span className="text-red-600">*</span>
                </label>
                <input
                  id="setup-username"
                  type="text"
                  autoComplete="username"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  placeholder="lowercase, 3+ chars"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
                />
              </div>
            </div>

            {setupStatus?.setupTokenRequired && (
              <div>
                <label
                  htmlFor="setup-token"
                  className="block text-sm font-medium text-[#102B50] mb-1.5"
                >
                  Server Setup Token <span className="text-red-600">*</span>
                </label>
                <input
                  id="setup-token"
                  type="password"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="Enter ADMIN_SETUP_TOKEN"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="setup-password"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Minimum 10 strong characters"
                  className="w-full pl-3.5 pr-11 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-[#102B50] rounded-md cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="setup-confirm-password"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Confirm Password <span className="text-red-600">*</span>
              </label>
              <input
                id="setup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={setupConfirmPassword}
                onChange={(e) => setSetupConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[44px]"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#F4F7FB] border border-slate-200 space-y-1.5">
              {passwordChecks.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      rule.ok ? 'text-[#12A66A]' : 'text-slate-300'
                    }`}
                  />
                  <span className={rule.ok ? 'text-[#102B50] font-medium' : 'text-slate-500'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] disabled:opacity-60 rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              {submitting ? 'Creating Main Admin...' : 'Complete One-Time Setup'}
            </button>
          </form>
        ) : otpChallenge ? (
          <form onSubmit={handleOtpVerifySubmit} noValidate className="mt-6 space-y-4">
            <div className="p-3.5 rounded-lg bg-[#ECFDF5] border border-emerald-200 flex items-start gap-2.5 text-xs text-[#102B50]">
              <MailCheck className="w-4 h-4 text-[#12A66A] shrink-0 mt-0.5" />
              <span>
                A real 6-digit verification code was sent to{' '}
                <strong className="font-mono-tabular">{otpChallenge.maskedEmail}</strong>. It expires
                in {Math.round(otpChallenge.expiresInSeconds / 60)} minutes.
              </span>
            </div>

            <div>
              <label htmlFor="otp-code" className="block text-sm font-medium text-[#102B50] mb-1.5">
                6-Digit Email OTP
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-xl font-mono-tabular tracking-[0.4em] rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] min-h-[48px]"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] disabled:opacity-60 rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              {submitting ? 'Verifying OTP...' : 'Verify OTP & Enter Admin Workspace'}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                disabled={submitting}
                onClick={handleResendOtp}
                className="font-medium text-[#1769D2] hover:underline cursor-pointer"
              >
                Resend 6-digit OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpChallenge(null);
                  setOtpCode('');
                  setError('');
                }}
                className="text-slate-500 hover:text-[#102B50] cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginStep1} noValidate className="mt-6 space-y-4">
            {!setupStatus?.mailConfigured && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                Resend email delivery is not configured yet on the server. Set{' '}
                <code className="font-mono-tabular">RESEND_API_KEY</code> and{' '}
                <code className="font-mono-tabular">RESEND_FROM_EMAIL</code> to send 6-digit
                login OTPs.
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-[#102B50] mb-1.5"
              >
                Authorized Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter authorized email"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-[#102B50]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryPanel((prev) => !prev);
                    setError('');
                  }}
                  className="text-xs font-medium text-[#1769D2] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-11 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-[#102B50] rounded-md cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showRecoveryPanel && (
              <div className="p-4 rounded-lg bg-[#F4F7FB] border border-slate-200 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-[#102B50]">
                  <KeyRound className="w-3.5 h-3.5 text-[#1769D2]" />
                  <span>Authorized Password Recovery</span>
                </div>
                {!recoveryStatus?.configured ? (
                  <p className="leading-relaxed">{recoveryStatus?.message}</p>
                ) : !recoveryRequested ? (
                  <div className="space-y-2.5">
                    <p>
                      Enter your pre-authorized account email to receive a 6-digit password reset
                      code.
                    </p>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Registered authorized email"
                      className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleRequestRecovery}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#102B50] hover:bg-[#1769D2] rounded cursor-pointer"
                    >
                      Send Reset OTP
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recoveryFeedback && (
                      <p className="text-[#059669] font-medium">{recoveryFeedback}</p>
                    )}
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryOtp}
                      onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit reset OTP"
                      className="w-full px-3 py-2 text-xs font-mono-tabular rounded border border-slate-300 bg-white"
                    />
                    <input
                      type="password"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      placeholder="New strong password (10+ chars)"
                      className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmRecovery}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded cursor-pointer"
                    >
                      Confirm Password Reset
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-60 rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              {submitting ? 'Verifying & Sending OTP...' : 'Verify Credentials & Send 6-Digit OTP'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Owner-Controlled Access Policy</p>
          <p>
            Public signup is permanently disabled. No account is ever created automatically through
            OTP verification. Staff access is strictly by Main Admin invitation.
          </p>
        </div>
      </main>

      <div className="max-w-[1000px] w-full mx-auto text-center text-xs text-slate-300">
        National Medical Hall (NMH) · Hospital Road, Udhampur – 182101
      </div>
    </div>
  );
};
