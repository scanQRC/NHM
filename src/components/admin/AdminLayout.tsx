import React, {useState} from 'react';
import {
  Archive,
  DatabaseBackup,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  Search,
  Settings,
  X,
} from 'lucide-react';
import {AdminSection} from '../../types/nmh';
import {NMHLogo} from '../common/NMHLogo';

interface AdminLayoutProps {
  activeSection: AdminSection;
  staffId: string;
  onSelectSection: (section: AdminSection) => void;
  onQuickAddPrescription: () => void;
  onSignOut: () => void;
  onReturnPublic: () => void;
  children: React.ReactNode;
}

const ADMIN_NAV_ITEMS: {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}[] = [
  {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
  {id: 'archive', label: 'Prescription Archive', icon: Archive},
  {id: 'search', label: 'Search Records', icon: Search},
  {id: 'monthly', label: 'Monthly Archive', icon: FolderKanban},
  {id: 'print', label: 'PDF & Print', icon: Printer},
  {id: 'backup', label: 'Backup', icon: DatabaseBackup},
  {id: 'settings', label: 'Settings', icon: Settings},
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSection,
  staffId,
  onSelectSection,
  onQuickAddPrescription,
  onSignOut,
  onReturnPublic,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = ADMIN_NAV_ITEMS.find((item) => item.id === activeSection);

  const handleNavSelect = (section: AdminSection) => {
    onSelectSection(section);
    setSidebarOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#102B50] text-slate-200">
      <div className="px-4 h-16 flex items-center justify-between border-b border-slate-700/70 shrink-0">
        <NMHLogo variant="on-dark" size="sm" />
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-300 hover:bg-[#163765] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-3 border-b border-slate-700/70 text-xs text-slate-300">
        <div className="font-medium text-white truncate">{staffId}</div>
        <div className="mt-0.5 text-[#12A66A]">Private Admin · UI Preview</div>
      </div>

      <nav
        aria-label="Admin Workspace Navigation"
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[42px] whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#1769D2] text-white'
                  : 'text-slate-200 hover:bg-[#163765] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/70 space-y-1.5 shrink-0">
        <button
          type="button"
          onClick={onReturnPublic}
          className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-[#163765] rounded-lg transition-colors min-h-[40px] cursor-pointer"
        >
          View Public Website
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#163765] rounded-lg transition-colors min-h-[40px] cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex">
      {/* Desktop Fixed 260px Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-slate-800 no-print">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[260px] max-w-[82vw] h-full z-10">{SidebarContent}</div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-[#102B50] hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">NMH Admin</span>
              <span aria-hidden="true" className="text-slate-300 hidden sm:inline">
                /
              </span>
              <span className="font-display font-semibold text-[#102B50] truncate">
                {currentNav?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onQuickAddPrescription}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg transition-colors min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Prescription Photo</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
