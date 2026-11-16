import React, {useEffect, useMemo, useState} from 'react';
import {FileText, Printer} from 'lucide-react';
import {formatArchiveMonthLabel} from '../../data/nmhData';
import {PharmacySettings, PrescriptionRecord} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface PdfPrintCenterProps {
  records: PrescriptionRecord[];
  settings: PharmacySettings;
  initialRecordId?: string | null;
  initialMonthKey?: string | null;
}

export const PdfPrintCenter: React.FC<PdfPrintCenterProps> = ({
  records,
  settings,
  initialRecordId,
  initialMonthKey,
}) => {
  const [mode, setMode] = useState<'single' | 'monthly'>(
    initialMonthKey ? 'monthly' : 'single'
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecordId || records[0]?.id || ''
  );

  const months = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.archiveMonth))).sort((a, b) => b.localeCompare(a)),
    [records]
  );

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonthKey || months[0] || '2026-11'
  );

  useEffect(() => {
    if (initialRecordId) {
      setMode('single');
      setSelectedRecordId(initialRecordId);
    }
  }, [initialRecordId]);

  useEffect(() => {
    if (initialMonthKey) {
      setMode('monthly');
      setSelectedMonth(initialMonthKey);
    }
  }, [initialMonthKey]);

  const activeRecord =
    records.find((r) => r.id === selectedRecordId) || records[0] || null;

  const monthlyRecords = useMemo(
    () => records.filter((r) => r.archiveMonth === selectedMonth),
    [records, selectedMonth]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls (Hidden during browser print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-[#0A192F]">PDF &amp; Print</h1>
            <p className="text-xs text-slate-500 mt-1">
              Prepare an A4 prescription photo sheet or monthly register using your browser&apos;s
              built-in Print / Save as PDF dialog (compatible with Windows 10/11, Android, and
              Windows 7).
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors min-h-[42px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'single'
                  ? 'bg-white text-[#0A192F] shadow-sm'
                  : 'text-slate-600 hover:text-[#0A192F]'
              }`}
            >
              Single Photo Sheet
            </button>
            <button
              type="button"
              onClick={() => setMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'monthly'
                  ? 'bg-white text-[#0A192F] shadow-sm'
                  : 'text-slate-600 hover:text-[#0A192F]'
              }`}
            >
              Monthly Register
            </button>
          </div>

          {mode === 'single' ? (
            <select
              aria-label="Select prescription record to print"
              value={activeRecord?.id ?? ''}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white min-h-[40px] max-w-full"
            >
              {records.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.recordNumber} — {rec.patientName} ({rec.visitDate})
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="Select month register to print"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white min-h-[40px]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatArchiveMonthLabel(m)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Printable A4 Sheet Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-[820px] mx-auto print-only-full">
        {/* Letterhead */}
        <div className="pb-5 border-b-2 border-[#0A192F] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-bold text-[#0A192F]">
              {settings.pharmacyName}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {settings.addressLine1}, {settings.addressLine2}, {settings.cityStateZip}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono-tabular">
              Reg: {settings.licenseNumber} · Tel: {settings.phone}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
              <FileText className="w-3.5 h-3.5" />
              <span>
                {mode === 'single' ? 'Prescription Photo Record' : 'Monthly Archive Register'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono-tabular mt-1">
              Prepared: {new Date().toISOString().slice(0, 10)}
            </div>
          </div>
        </div>

        {mode === 'single' ? (
          activeRecord ? (
            <div className="pt-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Record Number</div>
                  <div className="font-mono-tabular font-semibold text-[#0A192F] mt-0.5">
                    {activeRecord.recordNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Patient Name</div>
                  <div className="font-semibold text-[#0A192F] mt-0.5">
                    {activeRecord.patientName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Phone</div>
                  <div className="font-mono-tabular text-[#0A192F] mt-0.5">
                    {activeRecord.phone}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Prescribing Doctor</div>
                  <div className="text-[#0A192F] mt-0.5">{activeRecord.doctorName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Visit Date</div>
                  <div className="font-mono-tabular text-[#0A192F] mt-0.5">
                    {activeRecord.visitDate}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Archive Month</div>
                  <div className="text-[#0A192F] mt-0.5">
                    {formatArchiveMonthLabel(activeRecord.archiveMonth)}
                  </div>
                </div>
              </div>

              {activeRecord.notes && (
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-[#0A192F]">Counter Notes:</span>{' '}
                  {activeRecord.notes}
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <SafeImage
                  src={activeRecord.photoUrl}
                  alt={`Printed prescription photo ${activeRecord.recordNumber}`}
                  className="w-full max-h-[620px] object-contain mx-auto"
                  fallbackTitle={activeRecord.recordNumber}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>{settings.printHeaderNote}</span>
                <span className="font-mono-tabular">File: {activeRecord.photoFilename}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              No records available to print.
            </div>
          )
        ) : (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#0A192F]">
                {formatArchiveMonthLabel(selectedMonth)} — Archived Prescription Register
              </h2>
              <span className="font-mono-tabular text-xs text-slate-600">
                Total Entries: {monthlyRecords.length}
              </span>
            </div>

            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2.5 px-3 border-r border-slate-200">Record ID</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Date</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Patient Name</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Phone</th>
                  <th className="py-2.5 px-3">Prescribing Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono-tabular font-medium">
                      {rec.recordNumber}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono-tabular">
                      {rec.visitDate}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium">
                      {rec.patientName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono-tabular">
                      {rec.phone}
                    </td>
                    <td className="py-2 px-3">{rec.doctorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-4 text-[11px] text-slate-500">{settings.printHeaderNote}</div>
          </div>
        )}
      </div>
    </div>
  );
};
