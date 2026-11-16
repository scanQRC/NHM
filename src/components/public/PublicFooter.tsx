import React from 'react';
import {ExternalLink, MapPin, Phone} from 'lucide-react';
import {PharmacySettings, PublicRoute} from '../../types/nmh';
import {NMHLogo} from '../common/NMHLogo';

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
    <footer className="bg-[#102B50] text-slate-300 border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-700/70">
          <div className="md:col-span-5 space-y-4">
            <NMHLogo variant="on-dark" size="md" />
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Trusted community pharmacy and clinical dispensary dedicated to verified prescription
              fulfillment, cold-chain medication care, and attentive pharmacist guidance in
              Udhampur.
            </p>
            <p className="text-xs text-slate-400 font-mono-tabular">
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
                      className="text-slate-300 hover:text-white transition-colors capitalize"
                    >
                      {route}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Store Address &amp; Phone</h3>
            <div className="text-sm text-slate-300 space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#12A66A] shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-white">{settings.pharmacyName}</p>
                  <p>{settings.addressLine1}</p>
                  <p>
                    {settings.addressLine2}, {settings.cityStateZip}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg transition-colors tabular-nums"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {settings.phone}</span>
                </a>
                <a
                  href={settings.googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-lg transition-colors"
                >
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} National Medical Hall (NMH). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Hospital Road, Udhampur – 182101, J&amp;K, India</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-slate-200 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            >
              Staff Admin Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
