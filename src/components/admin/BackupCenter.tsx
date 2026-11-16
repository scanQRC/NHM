import React, {useState} from 'react';
import {CheckCircle2, Download, HardDrive, ShieldAlert} from 'lucide-react';
import {PharmacySettings, PrescriptionRecord} from '../../types/nmh';

interface BackupCenterProps {
  records: PrescriptionRecord[];
  settings: PharmacySettings;
}

export const BackupCenter: React.FC<BackupCenterProps> = ({records, settings}) => {
  const [exportMessage, setExportMessage] = useState('');

  const handleDownloadJsonPreview = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: 'UI_PREVIEW_LOCAL_SESSION',
      pharmacy: settings.pharmacyName,
      recordCount: records.length,
      records: records.map(({photoUrl: _photoUrl, ...meta}) => ({
        ...meta,
        photoReference: meta.photoFilename,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nmh-preview-records-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMessage(
      `Downloaded preview metadata index (${records.length} records) as JSON.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-2">
        <h1 className="font-display text-xl font-bold text-[#102B50]">Backup &amp; Export</h1>
        <p className="text-sm text-slate-600">
          Interface layout for exporting prescription archive indexes and managing storage backups.
        </p>
      </div>

      {/* Honest Implementation Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#1769D2] shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-slate-600">
          <div className="font-semibold text-[#102B50]">
            Backend Photo Backup Not Yet Connected
          </div>
          <p>
            Automated encrypted server backups and full binary photo archive ZIP downloads require
            backend storage integration. You can test a local JSON metadata export below to verify
            the interface workflow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#059669]">
              <Download className="w-4 h-4" />
              <span>Available in Local UI Preview</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[#102B50]">
              Export Session Index (JSON)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generates a local JSON file containing the current session&apos;s prescription record
              numbers, patient names, doctors, dates, and photo filenames.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-mono-tabular">
              Records included: {records.length}
            </div>
            <button
              type="button"
              onClick={handleDownloadJsonPreview}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Index</span>
            </button>
            {exportMessage && (
              <div className="flex items-center gap-2 text-xs font-medium text-[#059669]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{exportMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <HardDrive className="w-4 h-4" />
              <span>Planned Backend Phase</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[#102B50]">
              Full Photo Archive Backup &amp; Restore
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Once server storage is connected, this panel will package monthly photo folders into
              verifiable offline archive bundles for Windows desktop backup drives.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Server Archive Snapshot</span>
              <span className="font-mono-tabular text-slate-700">Pending Backend Setup</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Restore Verification</span>
              <span className="font-mono-tabular text-slate-700">Pending Backend Setup</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
