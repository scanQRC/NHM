import React from 'react';
import {PharmacySettings, PublicRoute} from '../../types/nmh';

interface PublicFooterProps {
  settings: PharmacySettings;
  onNavigate: (page: PublicRoute) => void;
  onOpenAdminLogin: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  settings,
  onNavigate,
  onOpenAdminLogin,
}) => {
  const handleNav = (page: PublicRoute) => {
    onNavigate(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <footer className="bg-[#0A192F] text-slate-300 border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-800">
          <div className="md:col-span-5 space-y-3">
            <div className="font-display text-lg font-bold text-white tracking-tight">
              National Medical Hall
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Licensed community pharmacy and clinical dispensary dedicated to verified prescription
              fulfillment, cold-chain medication care, and attentive pharmacist guidance.
            </p>
            <p className="text-xs text-slate-400 pt-1 font-mono-tabular">
              Dispensary Reg. {settings.licenseNumber}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white">Navigation</h3>
            <ul className="space-y-2 text-sm">
              {(['home', 'about', 'services', 'contact', 'location'] as PublicRoute[]).map(
                (route) => (
                  <li key={route}>
                    <a
                      href={`#${route}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNav(route);
                      }}
                      className="text-slate-400 hover:text-white transition-colors capitalize"
                    >
                      {route}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Dispensary Desk</h3>
            <div className="text-sm text-slate-400 space-y-1.5">
              <p>{settings.addressLine1}</p>
              <p>{settings.addressLine2}</p>
              <p>{settings.cityStateZip}</p>
              <p className="pt-1 text-slate-200 tabular-nums">Phone: {settings.phone}</p>
              <p className="text-slate-400">Mon–Sat: 08:00 AM – 10:30 PM · Sun: 09:30 AM – 09:00 PM</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} National Medical Hall (NMH). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Public Dispensary Information</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-slate-300 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            >
              Staff Admin Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
