import React, {useState} from 'react';
import {Eye, Grid, List, Plus, Printer, Trash2} from 'lucide-react';
import {formatArchiveMonthLabel} from '../../data/nmhData';
import {PrescriptionRecord} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface PrescriptionArchiveProps {
  records: PrescriptionRecord[];
  onOpenAddModal: () => void;
  onViewPhoto: (record: PrescriptionRecord) => void;
  onPrintRecord: (recordId: string) => void;
  onDeleteRecord: (recordId: string) => void;
}

export const PrescriptionArchive: React.FC<PrescriptionArchiveProps> = ({
  records,
  onOpenAddModal,
  onViewPhoto,
  onPrintRecord,
  onDeleteRecord,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const availableMonths = Array.from(new Set(records.map((r) => r.archiveMonth))).sort((a, b) =>
    b.localeCompare(a)
  );

  const filteredRecords =
    monthFilter === 'all' ? records : records.filter((r) => r.archiveMonth === monthFilter);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-bold text-[#102B50]">
            Prescription Photo Archive
          </h1>
          <p className="text-xs text-slate-500">
            Visual prescription records only — no OCR or automated medicine reading is performed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter archive by month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-[#102B50] min-h-[40px]"
          >
            <option value="all">All Months ({records.length})</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatArchiveMonthLabel(month)}
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#102B50] shadow-sm'
                  : 'text-slate-600 hover:text-[#102B50]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Photo Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#102B50] shadow-sm'
                  : 'text-slate-600 hover:text-[#102B50]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] rounded-lg transition-colors min-h-[40px] whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Photo Record</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <h2 className="font-display text-lg font-semibold text-[#102B50]">
            No prescription photos in this filter
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload a prescription photograph or switch the month filter to view existing preview
            records.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              Add Prescription Photo
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((rec) => (
            <article
              key={rec.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => onViewPhoto(rec)}
                  className="w-full aspect-[4/3] bg-slate-100 overflow-hidden block relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769D2]"
                >
                  <SafeImage
                    src={rec.photoUrl}
                    alt={`Prescription photo record ${rec.recordNumber} for ${rec.patientName}`}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    fallbackTitle={rec.recordNumber}
                  />
                </button>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-mono-tabular font-semibold text-[#1769D2]">
                      {rec.recordNumber}
                    </span>
                    <span className="font-mono-tabular">{rec.visitDate}</span>
                  </div>
                  <h2 className="font-display text-base font-bold text-[#102B50] truncate">
                    {rec.patientName}
                  </h2>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="truncate">Doctor: {rec.doctorName}</p>
                    <p className="font-mono-tabular">Phone: {rec.phone}</p>
                  </div>
                  {rec.notes && (
                    <p className="text-xs text-slate-500 pt-1 line-clamp-2">{rec.notes}</p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewPhoto(rec)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#102B50] bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Photo</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPrintRecord(rec.id)}
                    aria-label={`Print ${rec.recordNumber}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1769D2] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  {confirmDeleteId === rec.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteRecord(rec.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(rec.id)}
                      aria-label={`Remove ${rec.recordNumber}`}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Visit Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4">
                      <button
                        type="button"
                        onClick={() => onViewPhoto(rec)}
                        className="w-12 h-9 rounded border border-slate-200 overflow-hidden block cursor-pointer"
                      >
                        <SafeImage
                          src={rec.photoUrl}
                          alt={rec.recordNumber}
                          className="w-full h-full object-cover"
                          fallbackTitle={rec.recordNumber}
                        />
                      </button>
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-xs font-semibold text-[#1769D2] whitespace-nowrap">
                      {rec.recordNumber}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#0A192F] whitespace-nowrap">
                      {rec.patientName}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                      {rec.phone}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {rec.doctorName}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                      {rec.visitDate}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewPhoto(rec)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#0A192F] bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintRecord(rec.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 rounded-md cursor-pointer"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
