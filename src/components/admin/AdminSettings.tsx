import React, {useState} from 'react';
import {CheckCircle2, Lock, Monitor, ShieldCheck} from 'lucide-react';
import {PharmacySettings} from '../../types/nmh';

interface AdminSettingsProps {
  settings: PharmacySettings;
  onSaveSettings: (next: PharmacySettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({settings, onSaveSettings}) => {
  const [draft, setDraft] = useState<PharmacySettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <h1 className="font-display text-xl font-bold text-[#102B50]">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure pharmacy letterhead details for print sheets and review system policies.
          Changes apply to the current browser preview session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
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
                value={draft.pharmacyName}
                onChange={(e) => setDraft({...draft, pharmacyName: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
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
                value={draft.licenseNumber}
                onChange={(e) => setDraft({...draft, licenseNumber: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 font-mono-tabular min-h-[42px]"
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
                value={draft.phone}
                onChange={(e) => setDraft({...draft, phone: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
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
                value={draft.email}
                onChange={(e) => setDraft({...draft, email: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
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
              value={draft.addressLine1}
              onChange={(e) => setDraft({...draft, addressLine1: e.target.value})}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
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
              value={draft.printHeaderNote}
              onChange={(e) => setDraft({...draft, printHeaderNote: e.target.value})}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
            />
          </div>

          <div className="pt-2 flex items-center gap-4">
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              Save Preview Settings
            </button>
            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Updated for current preview session</span>
              </span>
            )}
          </div>
        </form>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102B50]">
              <Lock className="w-4 h-4 text-[#1769D2]" />
              <span>Security &amp; Archival Policy</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Public Signup</span>
                <span className="font-semibold text-[#102B50]">Disabled (Admin Only)</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">OCR / Medicine Reading</span>
                <span className="font-semibold text-[#102B50]">Disabled by Requirement</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Record Storage Format</span>
                <span className="font-semibold text-[#102B50]">Photo + Counter Metadata</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Paid External APIs</span>
                <span className="font-semibold text-[#059669]">None Used</span>
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
