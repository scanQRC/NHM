/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState} from 'react';
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
import {INITIAL_PHARMACY_SETTINGS, INITIAL_PREVIEW_RECORDS} from './data/nmhData';
import {
  AdminSection,
  AppView,
  PharmacySettings,
  PrescriptionRecord,
  PublicRoute,
} from './types/nmh';

export default function App() {
  const [view, setView] = useState<AppView>({area: 'public', page: 'home'});
  const [isAdminSessionActive, setIsAdminSessionActive] = useState(false);
  const [staffId, setStaffId] = useState('nmh-pharmacist-01');

  const [records, setRecords] = useState<PrescriptionRecord[]>(INITIAL_PREVIEW_RECORDS);
  const [settings, setSettings] = useState<PharmacySettings>(INITIAL_PHARMACY_SETTINGS);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewerRecord, setViewerRecord] = useState<PrescriptionRecord | null>(null);
  const [printTargetRecordId, setPrintTargetRecordId] = useState<string | null>(null);
  const [printTargetMonthKey, setPrintTargetMonthKey] = useState<string | null>(null);

  const navigatePublic = (page: PublicRoute) => {
    setView({area: 'public', page});
  };

  const openAdminLogin = () => {
    if (isAdminSessionActive) {
      setView({area: 'admin', section: 'dashboard'});
    } else {
      setView({area: 'admin-login'});
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleLoginSuccess = (authenticatedStaffId: string) => {
    setStaffId(authenticatedStaffId);
    setIsAdminSessionActive(true);
    setView({area: 'admin', section: 'dashboard'});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSignOut = () => {
    setIsAdminSessionActive(false);
    setView({area: 'admin-login'});
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSelectAdminSection = (section: AdminSection) => {
    if (!isAdminSessionActive) {
      setView({area: 'admin-login'});
      return;
    }
    if (section !== 'print') {
      setPrintTargetRecordId(null);
      setPrintTargetMonthKey(null);
    }
    setView({area: 'admin', section});
  };

  const handleOpenPrintForRecord = (recordId: string) => {
    setPrintTargetMonthKey(null);
    setPrintTargetRecordId(recordId);
    setView({area: 'admin', section: 'print'});
  };

  const handleOpenPrintForMonth = (monthKey: string) => {
    setPrintTargetRecordId(null);
    setPrintTargetMonthKey(monthKey);
    setView({area: 'admin', section: 'print'});
  };

  const handleAddRecord = (newRecord: PrescriptionRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Gate: Private Admin System is completely separate and requires authentication state
  if (view.area === 'admin-login') {
    return (
      <AdminLoginPage
        onLoginSuccess={handleLoginSuccess}
        onReturnPublic={() => navigatePublic('home')}
      />
    );
  }

  if (view.area === 'admin') {
    if (!isAdminSessionActive) {
      return (
        <AdminLoginPage
          onLoginSuccess={handleLoginSuccess}
          onReturnPublic={() => navigatePublic('home')}
        />
      );
    }

    return (
      <>
        <AdminLayout
          activeSection={view.section}
          staffId={staffId}
          onSelectSection={handleSelectAdminSection}
          onQuickAddPrescription={() => setIsAddModalOpen(true)}
          onSignOut={handleSignOut}
          onReturnPublic={() => navigatePublic('home')}
        >
          {view.section === 'dashboard' && (
            <AdminDashboard
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

          {view.section === 'backup' && <BackupCenter records={records} settings={settings} />}

          {view.section === 'settings' && (
            <AdminSettings settings={settings} onSaveSettings={setSettings} />
          )}
        </AdminLayout>

        <AddPrescriptionModal
          isOpen={isAddModalOpen}
          staffId={staffId}
          nextSequenceNumber={1105 + records.length}
          onClose={() => setIsAddModalOpen(false)}
          onAddRecord={handleAddRecord}
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
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
