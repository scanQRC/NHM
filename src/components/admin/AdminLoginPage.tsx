import React, {useState} from 'react';
import {ArrowLeft, Eye, EyeOff, Lock, ShieldAlert} from 'lucide-react';
import {NMHLogo} from '../common/NMHLogo';

interface AdminLoginPageProps {
  onLoginSuccess: (staffId: string) => void;
  onReturnPublic: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onReturnPublic,
}) => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim()) {
      setError('Enter both Staff ID and Password to open the admin interface preview.');
      return;
    }
    setError('');
    onLoginSuccess(staffId.trim());
  };

  const handlePreviewFill = () => {
    setStaffId('nmh-pharmacist-01');
    setPassword('preview-session-key');
    setError('');
  };

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

      <main className="max-w-[440px] w-full mx-auto my-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <NMHLogo variant="default" size="lg" />
          <div className="flex items-center gap-2 text-xs font-medium text-[#1769D2] pt-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Private Dispensary Portal</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-slate-500">Staff Only</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#102B50] tracking-tight">
            Admin Sign In
          </h1>
          <p className="text-sm text-slate-600">
            Access the private prescription photo archive, monthly registers, and print tools.
          </p>
        </div>

        {/* Honest Interface Status Notice */}
        <div className="mt-5 p-3.5 rounded-lg bg-[#F4F7FB] border border-slate-200 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-[#1769D2] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-[#102B50]">Interface Preview Mode:</span> Backend
            authentication and encrypted server storage are not yet connected. Use any staff
            credentials or fill preview credentials below to inspect the private admin layout.
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-staff-id"
              className="block text-sm font-medium text-[#102B50] mb-1.5"
            >
              Staff ID
            </label>
            <input
              id="admin-staff-id"
              type="text"
              autoComplete="username"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. nmh-pharmacist-01"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-[#102B50] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter staff password"
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

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              Sign In to Admin Interface
            </button>
            <button
              type="button"
              onClick={handlePreviewFill}
              className="w-full px-4 py-2.5 text-xs font-medium text-[#102B50] bg-[#F4F7FB] hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors min-h-[40px] cursor-pointer"
            >
              Fill Interface Preview Credentials
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Access Policy: No Public Signup</p>
          <p>
            Public registration is disabled. Accounts are provisioned strictly by the pharmacy
            administrator once backend auth is enabled.
          </p>
        </div>
      </main>

      <div className="max-w-[1000px] w-full mx-auto text-center text-xs text-slate-300">
        National Medical Hall (NMH) · Hospital Road, Udhampur – 182101
      </div>
    </div>
  );
};
