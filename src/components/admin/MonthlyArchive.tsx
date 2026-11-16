import React, {useMemo, useState} from 'react';
import {Eye, FolderOpen, Printer} from 'lucide-react';
import {formatArchiveMonthLabel} from '../../utils/dateFormat';
import {PrescriptionRecord} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface MonthlyArchiveProps {
  records: PrescriptionRecord[];
  onViewPhoto: (record: PrescriptionRecord) => void;
  onPrintMonthRegister: (monthKey: string) => void;
}

export const MonthlyArchive: React.FC<MonthlyArchiveProps> = ({
  records,
  onViewPhoto,
  onPrintMonthRegister,
}) => {
  const folders = useMemo(() => {
    const map = new Map<string, PrescriptionRecord[]>();
    records.forEach((rec) => {
      const list = map.get(rec.archiveMonth) ?? [];
      list.push(rec);
      map.set(rec.archiveMonth, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  const [selectedMonth, setSelectedMonth] = useState<string>(folders[0]?.[0] ?? '2026-11');

  const activeFolderRecords = useMemo(() => {
    const found = folders.find(([m]) => m === selectedMonth);
    return found ? found[1] : folders[0]?.[1] ?? [];
  }, [folders, selectedMonth]);

  const effectiveMonth =
    folders.find(([m]) => m === selectedMonth)?.[0] ?? folders[0]?.[0] ?? '';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-[#102B50]">Monthly Archive</h1>
          <p className="text-xs text-slate-500 mt-1">
            Prescription photo records grouped into chronological YYYY-MM folders for audit and
            monthly register printing.
          </p>
        </div>

        {effectiveMonth && (
          <button
            type="button"
            onClick={() => onPrintMonthRegister(effectiveMonth)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#102B50] hover:bg-[#1769D2] rounded-lg transition-colors min-h-[42px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {formatArchiveMonthLabel(effectiveMonth)} Register</span>
          </button>
        )}
      </div>

      {folders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-[#102B50]">No monthly folders created yet.</p>
          <p className="text-xs text-slate-500">
            Upload your first prescription photograph to automatically create its YYYY-MM archive
            folder.
          </p>
        </div>
      ) : (
        <>
          {/* Folder Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map(([monthKey, list]) => {
              const isSelected = monthKey === effectiveMonth;
              return (
                <button
                  key={monthKey}
                  type="button"
                  onClick={() => setSelectedMonth(monthKey)}
                  className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#102B50] text-white border-[#102B50]'
                      : 'bg-white text-[#102B50] border-slate-200 hover:border-[#1769D2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FolderOpen
                      className={`w-5 h-5 ${isSelected ? 'text-[#10B981]' : 'text-[#1769D2]'}`}
                    />
                    <span
                      className={`font-mono-tabular text-xs font-semibold ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {monthKey}
                    </span>
                  </div>
                  <div className="mt-3 font-display text-base font-bold">
                    {formatArchiveMonthLabel(monthKey)}
                  </div>
                  <div
                    className={`mt-1 text-xs tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {list.length} {list.length === 1 ? 'photo record' : 'photo records'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Month Folder Contents */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#102B50]">
                {effectiveMonth ? formatArchiveMonthLabel(effectiveMonth) : 'Folder'} Contents
              </h2>
              <span className="font-mono-tabular text-xs text-slate-500">
                {activeFolderRecords.length} records
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeFolderRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => onViewPhoto(rec)}
                      className="w-16 h-12 rounded-md border border-slate-200 overflow-hidden shrink-0 cursor-pointer"
                    >
                      <SafeImage
                        src={rec.photoUrl}
                        alt={rec.recordNumber}
                        className="w-full h-full object-cover"
                        fallbackTitle={rec.recordNumber}
                      />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono-tabular font-semibold text-[#1769D2]">
                          {rec.recordNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{rec.visitDate}</span>
                      </div>
                      <div className="font-medium text-sm text-[#102B50] truncate">
                        {rec.patientName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {rec.doctorName} · {rec.phone}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewPhoto(rec)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#102B50] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-center shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Photo</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
