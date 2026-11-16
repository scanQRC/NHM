import React, {useState} from 'react';
import {Menu, X} from 'lucide-react';
import {PublicRoute} from '../../types/nmh';

interface PublicHeaderProps {
  currentPage: PublicRoute;
  onNavigate: (page: PublicRoute) => void;
  onOpenAdminLogin: () => void;
}

const NAV_ITEMS: {id: PublicRoute; label: string}[] = [
  {id: 'home', label: 'Home'},
  {id: 'about', label: 'About'},
  {id: 'services', label: 'Services'},
  {id: 'contact', label: 'Contact'},
  {id: 'location', label: 'Location'},
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenAdminLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: PublicRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0A192F] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
        >
          National Medical Hall
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded ${
                  isActive
                    ? 'text-[#0A192F] font-semibold'
                    : 'text-slate-600 hover:text-[#1D4ED8]'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#059669] transition-opacity duration-150 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0A192F] hover:bg-[#1D4ED8] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 cursor-pointer"
          >
            Admin Login
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-[#0A192F] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium min-h-[44px] transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-[#0A192F] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdminLogin();
              }}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-[#0A192F] hover:bg-[#1D4ED8] rounded-lg min-h-[44px] transition-colors cursor-pointer"
            >
              Admin Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
