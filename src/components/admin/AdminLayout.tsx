import React, {useState} from 'react';
import {
  Archive,
  ArrowLeft,
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
import {AdminSection, AuthenticatedAdminUser} from '../../types/nmh';
import {NMHLogo} from '../common/NMHLogo';

interface AdminLayoutProps {
  activeSection: AdminSection;
  user: AuthenticatedAdminUser;
  onSelectSection: (section: AdminSection) => void;
  onQuickAddPrescription: () => void;
  onSignOut: () => Promise<void> | void;
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
  user,
  onSelectSection,
  onQuickAddPrescription,
  onSignOut,
  onReturnPublic,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentNav = ADMIN_NAV_ITEMS.find((item) => item.id === activeSection);

  const handleNavSelect = (section: AdminSection) => {
    onSelectSection(section);
    setSidebarOpen(false);
  };

  const handleRequestLogout = () => {
    setSidebarOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await onSignOut();
    } finally {
      setLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  const roleLabel = user.role === 'main_admin' ? 'Main Admin' : 'Authorized Staff';
  const canAdd = user.role === 'main_admin' || user.permissions.canAddRecords;

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
        <div className="font-medium text-white truncate">{user.displayName}</div>
        <div className="mt-0.5 text-[#12A66A] truncate">
          {roleLabel} · @{user.username}
        </div>
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
          onClick={() => {
            setSidebarOpen(false);
            onReturnPublic();
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-[#163765] rounded-lg transition-colors min-h-[40px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>← Back to Website</span>
        </button>
        <button
          type="button"
          onClick={handleRequestLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-200 hover:text-white hover:bg-red-700/40 rounded-lg transition-colors min-h-[40px] cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
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
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 no-print">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
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

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onReturnPublic}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#102B50] bg-[#F4F7FB] hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>← Back to Website</span>
              </button>

              {canAdd && (
                <button
                  type="button"
                  onClick={onQuickAddPrescription}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg transition-colors min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">Add Prescription Photo</span>
                  <span className="md:hidden">Add Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRequestLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Action Bar: Always keeps Back to Website & Logout directly accessible on mobile screens */}
          <div className="sm:hidden px-4 py-2 bg-[#F4F7FB] border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onReturnPublic}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#102B50] bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors min-h-[38px] whitespace-nowrap cursor-pointer"
            >
              <span>← Back to Website</span>
            </button>
            <button
              type="button"
              onClick={handleRequestLogout}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors min-h-[38px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      {logoutConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 no-print"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h2 id="logout-confirm-title" className="font-display text-lg font-bold text-[#102B50]">
                  Confirm Logout
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">Are you sure you want to logout?</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[40px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors min-h-[40px] cursor-pointer"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
