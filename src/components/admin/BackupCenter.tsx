import React, {useState} from 'react';
import {CheckCircle2, Download, HardDrive, ShieldCheck} from 'lucide-react';
import {PharmacySettings, PrescriptionRecord} from '../../types/nmh';

interface BackupCenterProps {
  records: PrescriptionRecord[];
  settings: PharmacySettings;
}

export const BackupCenter: React.FC<BackupCenterProps> = ({records, settings}) => {
  const [exportMessage, setExportMessage] = useState('');

  const handleDownloadJsonExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: 'SERVER_DATABASE_EXPORT',
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
    link.download = `nmh-archive-index-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMessage(
      `Downloaded server archive metadata index (${records.length} records) as JSON.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-2">
        <h1 className="font-display text-xl font-bold text-[#102B50]">Backup &amp; Export</h1>
        <p className="text-sm text-slate-600">
          Export your server-stored prescription archive index and review database backup guidance.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#12A66A] shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-slate-600">
          <div className="font-semibold text-[#102B50]">SQLite Database Storage Active</div>
          <p>
            Prescription records and admin sessions are stored in the server SQLite database. For
            Render production, mount a persistent disk and point{' '}
            <code className="font-mono-tabular text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              NMH_DB_PATH
            </code>{' '}
            to that persistent path so records survive deploys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#059669]">
              <Download className="w-4 h-4" />
              <span>Live Server Export</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[#102B50]">
              Export Archive Index (JSON)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generates a JSON index of all prescription record numbers, patient names, doctors,
              visit dates, and photo filenames currently stored on the server.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-mono-tabular">
              Records included: {records.length}
            </div>
            <button
              type="button"
              onClick={handleDownloadJsonExport}
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
              <span>Planned Full Photo Bundle</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[#102B50]">
              Encrypted Photo Archive ZIP &amp; Restore
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Full monthly ZIP packaging with embedded image binaries for offline Windows backup
              drives can be added as a scheduled server job. Until enabled, back up the SQLite
              database file directly from your persistent disk.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>JSON Metadata Index Export</span>
              <span className="font-mono-tabular text-[#059669] font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Offline ZIP Photo Bundle</span>
              <span className="font-mono-tabular text-slate-700">Planned Phase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
