import React, {useMemo} from 'react';
import {Archive, Eye, FolderKanban, Printer, Upload} from 'lucide-react';
import {formatArchiveMonthLabel} from '../../data/nmhData';
import {AdminSection, PrescriptionRecord} from '../../types/nmh';

interface AdminDashboardProps {
  records: PrescriptionRecord[];
  onNavigateSection: (section: AdminSection) => void;
  onSelectRecordForPrint: (recordId: string) => void;
  onSelectRecordForView: (record: PrescriptionRecord) => void;
  onOpenAddModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  records,
  onNavigateSection,
  onSelectRecordForPrint,
  onSelectRecordForView,
  onOpenAddModal,
}) => {
  const stats = useMemo(() => {
    const months = new Map<string, number>();
    records.forEach((rec) => {
      months.set(rec.archiveMonth, (months.get(rec.archiveMonth) ?? 0) + 1);
    });
    const sortedMonths = Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const latestMonth = sortedMonths[0]?.[0] ?? '2026-11';
    const latestCount = sortedMonths[0]?.[1] ?? 0;

    return {
      totalRecords: records.length,
      latestMonthLabel: formatArchiveMonthLabel(latestMonth),
      latestMonthCount: latestCount,
      monthFolderCount: sortedMonths.length,
      monthlyDistribution: sortedMonths.slice(0, 6).reverse(),
    };
  }, [records]);

  const maxBar = Math.max(1, ...stats.monthlyDistribution.map(([, count]) => count));

  return (
    <div className="space-y-8">
      {/* Honest UI Preview Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-[#1D4ED8]">
            Private Prescription Photo Archive · UI Interface Preview
          </div>
          <p className="text-sm text-slate-600">
            Showing local preview records in browser memory. Server storage, database persistence,
            and scheduled backups are not connected yet. Photos are stored strictly as image records
            without OCR.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Photo Record</span>
        </button>
      </div>

      {/* 4 KPI Summary Blocks (Single-level elevation, tabular numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Archived Photos</div>
          <div className="mt-2 font-display text-3xl font-bold text-[#0A192F] tabular-nums">
            {stats.totalRecords}
          </div>
          <div className="mt-1 text-xs text-slate-500">Preview records in current session</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">{stats.latestMonthLabel}</div>
          <div className="mt-2 font-display text-3xl font-bold text-[#059669] tabular-nums">
            {stats.latestMonthCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Latest active month count</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Monthly Archive Folders</div>
          <div className="mt-2 font-display text-3xl font-bold text-[#0A192F] tabular-nums">
            {stats.monthFolderCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Organized YYYY-MM registers</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">OCR / Text Extraction</div>
          <div className="mt-2 font-display text-3xl font-bold text-[#0A192F]">Disabled</div>
          <div className="mt-1 text-xs text-slate-500">Photo-only archival policy</div>
        </div>
      </div>

      {/* Monthly Distribution & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0A192F]">
                Monthly Photo Intake
              </h2>
              <p className="text-xs text-slate-500">
                Prescription photographs filed by calendar month
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('monthly')}
              className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Monthly Archive
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {stats.monthlyDistribution.map(([monthKey, count]) => {
              const widthPct = Math.max(12, Math.round((count / maxBar) * 100));
              return (
                <div key={monthKey} className="grid grid-cols-12 items-center gap-3 text-sm">
                  <div className="col-span-4 sm:col-span-3 text-xs font-medium text-slate-700 truncate">
                    {formatArchiveMonthLabel(monthKey)}
                  </div>
                  <div className="col-span-6 sm:col-span-7 h-6 bg-slate-100 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] rounded-md transition-all duration-200"
                      style={{width: `${widthPct}%`}}
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono-tabular text-xs font-semibold text-[#0A192F]">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#0A192F]">
              Quick Workspace Actions
            </h2>
            <p className="text-xs text-slate-500">
              Jump directly to common dispensary record tasks.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigateSection('archive')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-[#0A192F] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-[#1D4ED8]" />
                <span>Browse Full Photo Archive</span>
              </span>
              <span className="font-mono-tabular text-xs text-slate-500">{records.length}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSection('monthly')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-[#0A192F] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-[#059669]" />
                <span>Open Monthly Folders</span>
              </span>
              <span className="font-mono-tabular text-xs text-slate-500">
                {stats.monthFolderCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSection('print')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-[#0A192F] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 text-[#0A192F]" />
                <span>Prepare PDF &amp; Print Sheet</span>
              </span>
              <span className="text-xs text-slate-500">A4 Ready</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Prescription Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-[#0A192F]">
            Recent Prescription Photo Records
          </h2>
          <button
            type="button"
            onClick={() => onNavigateSection('search')}
            className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Search All Records
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Prescribing Doctor</th>
                <th className="py-3 px-4">Visit Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.slice(0, 6).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono-tabular text-xs font-medium text-[#1D4ED8] whitespace-nowrap">
                    {rec.recordNumber}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[#0A192F] whitespace-nowrap">
                    {rec.patientName}
                  </td>
                  <td className="py-2.5 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                    {rec.phone}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{rec.doctorName}</td>
                  <td className="py-2.5 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                    {rec.visitDate}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectRecordForView(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0A192F] bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectRecordForPrint(rec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
