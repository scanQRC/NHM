/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useState} from 'react';
import {AddPrescriptionModal} from './components/admin/AddPrescriptionModal';
import {AdminDashboard} from './components/admin/AdminDashboard';
import {AdminLayout} from './components/admin/AdminLayout';
import {AdminLoginPage} from './components/admin/AdminLoginPage';
import {AdminSettings} from './components/admin/AdminSettings';
import {BackupCenter} from './components/admin/BackupCenter';
import {MonthlyArchive} from './components/admin/MonthlyArchive';
import {PdfPrintCenter} from './components/admin/PdfPrintCenter';
import {PhotoViewerModal} from './components/admin/PhotoViewerModal';
import {PrescriptionArchive} from './components/admin/PrescriptionArchive';
import {SearchRecords} from './components/admin/SearchRecords';
import {AboutPage} from './components/public/AboutPage';
import {ContactPage} from './components/public/ContactPage';
import {HomePage} from './components/public/HomePage';
import {LocationPage} from './components/public/LocationPage';
import {PublicFooter} from './components/public/PublicFooter';
import {PublicHeader} from './components/public/PublicHeader';
import {ServicesPage} from './components/public/ServicesPage';
import {INITIAL_PHARMACY_SETTINGS} from './data/nmhData';
import {
  ApiError,
  deleteAdminRecord,
  fetchAdminRecords,
  fetchAdminSettings,
  getAuthSession,
  logoutAdmin,
} from './services/api';
import {
  AdminSection,
  AppView,
  AuthenticatedAdminUser,
  PharmacySettings,
  PrescriptionRecord,
  PublicRoute,
} from './types/nmh';

const PUBLIC_PATHS: Record<PublicRoute, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  contact: '/contact',
  location: '/location',
};

const ADMIN_PATHS: Record<AdminSection, string> = {
  dashboard: '/admin/dashboard',
  archive: '/admin/archive',
  search: '/admin/search',
  monthly: '/admin/monthly',
  print: '/admin/print',
  backup: '/admin/backup',
  settings: '/admin/settings',
};

function parsePathname(pathname: string, search = ''): AppView {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '/home') return {area: 'public', page: 'home'};
  if (clean === '/about') return {area: 'public', page: 'about'};
  if (clean === '/services') return {area: 'public', page: 'services'};
  if (clean === '/contact') return {area: 'public', page: 'contact'};
  if (clean === '/location') return {area: 'public', page: 'location'};

  if (clean === '/admin/invite') {
    const params = new URLSearchParams(search);
    return {area: 'admin-invite', token: params.get('token') || ''};
  }
  if (clean === '/admin/setup') return {area: 'admin-setup'};
  if (clean === '/admin/login') return {area: 'admin-login'};
  if (clean === '/admin' || clean === '/admin/dashboard') {
    return {area: 'admin', section: 'dashboard'};
  }
  if (clean === '/admin/archive') return {area: 'admin', section: 'archive'};
  if (clean === '/admin/search') return {area: 'admin', section: 'search'};
  if (clean === '/admin/monthly') return {area: 'admin', section: 'monthly'};
  if (clean === '/admin/print') return {area: 'admin', section: 'print'};
  if (clean === '/admin/backup') return {area: 'admin', section: 'backup'};
  if (clean === '/admin/settings') return {area: 'admin', section: 'settings'};

  if (clean.startsWith('/admin')) {
    return {area: 'admin', section: 'dashboard'};
  }

  return {area: 'public', page: 'home'};
}

function viewToPath(view: AppView): string {
  if (view.area === 'public') return PUBLIC_PATHS[view.page];
  if (view.area === 'admin-login') return '/admin/login';
  if (view.area === 'admin-setup') return '/admin/setup';
  if (view.area === 'admin-invite') {
    return view.token ? `/admin/invite?token=${encodeURIComponent(view.token)}` : '/admin/login';
  }
  return ADMIN_PATHS[view.section];
}

export default function App() {
  const [view, setView] = useState<AppView>(() =>
    parsePathname(window.location.pathname, window.location.search)
  );
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedAdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(() => {
    const initial = parsePathname(window.location.pathname, window.location.search);
    return initial.area !== 'public';
  });
  const [authNotice, setAuthNotice] = useState('');

  const [records, setRecords] = useState<PrescriptionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [settings, setSettings] = useState<PharmacySettings>(INITIAL_PHARMACY_SETTINGS);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewerRecord, setViewerRecord] = useState<PrescriptionRecord | null>(null);
  const [printTargetRecordId, setPrintTargetRecordId] = useState<string | null>(null);
  const [printTargetMonthKey, setPrintTargetMonthKey] = useState<string | null>(null);

  const setViewAndUrl = useCallback((nextView: AppView, replace = false) => {
    const targetPath = viewToPath(nextView);
    const currentFull = `${window.location.pathname}${window.location.search}`;
    if (currentFull !== targetPath) {
      if (replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
    }
    setView(nextView);
  }, []);

  const clearPrivateState = useCallback(() => {
    setAuthenticatedUser(null);
    setRecords([]);
    setIsAddModalOpen(false);
    setViewerRecord(null);
    setPrintTargetRecordId(null);
    setPrintTargetMonthKey(null);
  }, []);

  const handleUnauthorized = useCallback(
    (notice = 'Your admin session expired or is not authenticated. Please sign in.') => {
      clearPrivateState();
      setAuthNotice(notice);
      setViewAndUrl({area: 'admin-login'}, true);
    },
    [clearPrivateState, setViewAndUrl]
  );

  const loadProtectedAdminData = useCallback(
    async (user: AuthenticatedAdminUser) => {
      setLoadingRecords(true);
      try {
        const canView = user.role === 'main_admin' || user.permissions.canViewRecords;
        const [serverRecords, serverSettings] = await Promise.all([
          canView ? fetchAdminRecords() : Promise.resolve([]),
          fetchAdminSettings(),
        ]);
        setRecords(serverRecords);
        if (serverSettings) {
          setSettings(serverSettings);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
        }
      } finally {
        setLoadingRecords(false);
      }
    },
    [handleUnauthorized]
  );

  const verifySessionForView = useCallback(
    async (targetView: AppView) => {
      if (targetView.area === 'public') {
        setAuthChecking(false);
        return;
      }

      // If visiting /admin/invite with a token while unauthenticated, show invite activation directly
      if (targetView.area === 'admin-invite') {
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      try {
        const sessionRes = await getAuthSession();
        if (sessionRes.authenticated && sessionRes.user) {
          const userWithFlag: AuthenticatedAdminUser = {
            ...sessionRes.user,
            isTemporaryTestEmail: sessionRes.isTemporaryTestEmail,
          };
          setAuthenticatedUser(userWithFlag);
          if (targetView.area === 'admin-login' || targetView.area === 'admin-setup') {
            setViewAndUrl({area: 'admin', section: 'dashboard'}, true);
          }
          await loadProtectedAdminData(userWithFlag);
        } else {
          clearPrivateState();
          if (targetView.area === 'admin') {
            setViewAndUrl({area: 'admin-login'}, true);
          }
        }
      } catch {
        clearPrivateState();
        if (targetView.area === 'admin') {
          setViewAndUrl({area: 'admin-login'}, true);
        }
      } finally {
        setAuthChecking(false);
      }
    },
    [clearPrivateState, loadProtectedAdminData, setViewAndUrl]
  );

  useEffect(() => {
    void verifySessionForView(parsePathname(window.location.pathname, window.location.search));
  }, [verifySessionForView]);

  useEffect(() => {
    const onPopState = () => {
      const next = parsePathname(window.location.pathname, window.location.search);
      setView(next);
      void verifySessionForView(next);
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const current = parsePathname(window.location.pathname, window.location.search);
        if (current.area !== 'public') {
          void verifySessionForView(current);
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [verifySessionForView]);

  const navigatePublic = (page: PublicRoute) => {
    setViewAndUrl({area: 'public', page});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const openAdminLogin = async () => {
    setAuthNotice('');
    setAuthChecking(true);
    setViewAndUrl({area: 'admin-login'});
    window.scrollTo({top: 0, behavior: 'smooth'});
    try {
      const sessionRes = await getAuthSession();
      if (sessionRes.authenticated && sessionRes.user) {
        const userWithFlag: AuthenticatedAdminUser = {
          ...sessionRes.user,
          isTemporaryTestEmail: sessionRes.isTemporaryTestEmail,
        };
        setAuthenticatedUser(userWithFlag);
        setViewAndUrl({area: 'admin', section: 'dashboard'}, true);
        await loadProtectedAdminData(userWithFlag);
      } else {
        clearPrivateState();
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const handleAuthSuccess = async (user: AuthenticatedAdminUser) => {
    setAuthNotice('');
    setAuthenticatedUser(user);
    setViewAndUrl({area: 'admin', section: 'dashboard'});
    window.scrollTo({top: 0, behavior: 'smooth'});
    await loadProtectedAdminData(user);
  };

  const handleSignOut = async () => {
    try {
      await logoutAdmin();
    } catch {
      // Clear local state regardless if cookie already expired
    }
    clearPrivateState();
    setAuthNotice('');
    // Replace current admin history entry with public homepage so Back button cannot re-open admin
    window.history.replaceState(null, '', '/');
    setView({area: 'public', page: 'home'});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSelectAdminSection = async (section: AdminSection) => {
    if (!authenticatedUser) {
      handleUnauthorized();
      return;
    }
    if (section !== 'print') {
      setPrintTargetRecordId(null);
      setPrintTargetMonthKey(null);
    }
    setViewAndUrl({area: 'admin', section});

    try {
      const sessionRes = await getAuthSession();
      if (!sessionRes.authenticated || !sessionRes.user) {
        handleUnauthorized();
      }
    } catch {
      handleUnauthorized();
    }
  };

  const handleOpenPrintForRecord = (recordId: string) => {
    setPrintTargetMonthKey(null);
    setPrintTargetRecordId(recordId);
    setViewAndUrl({area: 'admin', section: 'print'});
  };

  const handleOpenPrintForMonth = (monthKey: string) => {
    setPrintTargetRecordId(null);
    setPrintTargetMonthKey(monthKey);
    setViewAndUrl({area: 'admin', section: 'print'});
  };

  const handleAddRecord = (newRecord: PrescriptionRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteAdminRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized();
      }
    }
  };

  const handleOwnerEmailUpdated = (newEmail: string, isTemporaryTestEmail: boolean) => {
    setAuthenticatedUser((prev) =>
      prev ? {...prev, email: newEmail, isTemporaryTestEmail} : null
    );
  };

  // Block protected admin rendering while checking session
  if (view.area !== 'public' && authChecking) {
    return (
      <div className="min-h-screen bg-[#102B50] flex items-center justify-center px-4 text-slate-200 text-sm">
        Verifying admin session...
      </div>
    );
  }

  // Gate: Private Admin System is completely separate and requires server-verified authentication + 6-digit OTP
  if (view.area === 'admin-login' || view.area === 'admin-setup' || view.area === 'admin-invite') {
    return (
      <AdminLoginPage
        initialNotice={authNotice}
        inviteToken={view.area === 'admin-invite' ? view.token : ''}
        onAuthSuccess={handleAuthSuccess}
        onReturnPublic={() => navigatePublic('home')}
      />
    );
  }

  if (view.area === 'admin') {
    if (!authenticatedUser) {
      return (
        <AdminLoginPage
          initialNotice={authNotice || 'Please sign in to access the private admin workspace.'}
          onAuthSuccess={handleAuthSuccess}
          onReturnPublic={() => navigatePublic('home')}
        />
      );
    }

    return (
      <>
        <AdminLayout
          activeSection={view.section}
          user={authenticatedUser}
          onSelectSection={handleSelectAdminSection}
          onQuickAddPrescription={() => setIsAddModalOpen(true)}
          onSignOut={handleSignOut}
          onReturnPublic={() => navigatePublic('home')}
        >
          {loadingRecords ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
              Loading protected prescription archive...
            </div>
          ) : (
            <>
              {view.section === 'dashboard' && (
                <AdminDashboard
                  user={authenticatedUser}
                  records={records}
                  onNavigateSection={handleSelectAdminSection}
                  onSelectRecordForPrint={handleOpenPrintForRecord}
                  onSelectRecordForView={(rec) => setViewerRecord(rec)}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                />
              )}

              {view.section === 'archive' && (
                <PrescriptionArchive
                  records={records}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onViewPhoto={(rec) => setViewerRecord(rec)}
                  onPrintRecord={handleOpenPrintForRecord}
                  onDeleteRecord={handleDeleteRecord}
                />
              )}

              {view.section === 'search' && (
                <SearchRecords
                  records={records}
                  onViewPhoto={(rec) => setViewerRecord(rec)}
                  onPrintRecord={handleOpenPrintForRecord}
                />
              )}

              {view.section === 'monthly' && (
                <MonthlyArchive
                  records={records}
                  onViewPhoto={(rec) => setViewerRecord(rec)}
                  onPrintMonthRegister={handleOpenPrintForMonth}
                />
              )}

              {view.section === 'print' && (
                <PdfPrintCenter
                  records={records}
                  settings={settings}
                  initialRecordId={printTargetRecordId}
                  initialMonthKey={printTargetMonthKey}
                />
              )}

              {view.section === 'backup' && (
                <BackupCenter records={records} settings={settings} />
              )}

              {view.section === 'settings' && (
                <AdminSettings
                  user={authenticatedUser}
                  settings={settings}
                  onSaveSettings={setSettings}
                  onOwnerEmailUpdated={handleOwnerEmailUpdated}
                  onUnauthorized={() => handleUnauthorized()}
                />
              )}
            </>
          )}
        </AdminLayout>

        <AddPrescriptionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddRecord={handleAddRecord}
          onUnauthorized={() => handleUnauthorized()}
        />

        <PhotoViewerModal
          record={viewerRecord}
          onClose={() => setViewerRecord(null)}
          onPrintRecord={handleOpenPrintForRecord}
        />
      </>
    );
  }

  // Public Website Layout (completely separate from Admin System)
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-[#0F172A]">
      <PublicHeader
        currentPage={view.page}
        onNavigate={navigatePublic}
        onOpenAdminLogin={openAdminLogin}
      />

      <main className="flex-1">
        {view.page === 'home' && <HomePage settings={settings} onNavigate={navigatePublic} />}
        {view.page === 'about' && <AboutPage settings={settings} onNavigate={navigatePublic} />}
        {view.page === 'services' && <ServicesPage onNavigate={navigatePublic} />}
        {view.page === 'contact' && <ContactPage settings={settings} />}
        {view.page === 'location' && <LocationPage settings={settings} />}
      </main>

      <PublicFooter
        settings={settings}
        onNavigate={navigatePublic}
        onOpenAdminLogin={openAdminLogin}
      />
    </div>
  );
}
