import React, {useMemo, useState} from 'react';
import {Eye, Printer, RotateCcw, Search} from 'lucide-react';
import {formatArchiveMonthLabel} from '../../data/nmhData';
import {PrescriptionRecord} from '../../types/nmh';

interface SearchRecordsProps {
  records: PrescriptionRecord[];
  onViewPhoto: (record: PrescriptionRecord) => void;
  onPrintRecord: (recordId: string) => void;
}

export const SearchRecords: React.FC<SearchRecordsProps> = ({
  records,
  onViewPhoto,
  onPrintRecord,
}) => {
  const [query, setQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const months = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.archiveMonth))).sort((a, b) => b.localeCompare(a)),
    [records]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((rec) => {
      if (monthFilter !== 'all' && rec.archiveMonth !== monthFilter) return false;
      if (fromDate && rec.visitDate < fromDate) return false;
      if (toDate && rec.visitDate > toDate) return false;
      if (!q) return true;
      return (
        rec.recordNumber.toLowerCase().includes(q) ||
        rec.patientName.toLowerCase().includes(q) ||
        rec.phone.toLowerCase().includes(q) ||
        rec.doctorName.toLowerCase().includes(q) ||
        rec.notes.toLowerCase().includes(q)
      );
    });
  }, [records, query, monthFilter, fromDate, toDate]);

  const handleReset = () => {
    setQuery('');
    setMonthFilter('all');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0A192F]">Search Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search archived prescription photo records by Record ID, Patient Name, Phone, Doctor, or
            visit date range.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <label htmlFor="search-query" className="block text-xs font-medium text-slate-600 mb-1">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Record ID, patient, phone, doctor..."
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] min-h-[42px]"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="search-month" className="block text-xs font-medium text-slate-600 mb-1">
              Archive Month
            </label>
            <select
              id="search-month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white min-h-[42px]"
            >
              <option value="all">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatArchiveMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="search-from" className="block text-xs font-medium text-slate-600 mb-1">
              From Date
            </label>
            <input
              id="search-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="search-to" className="block text-xs font-medium text-slate-600 mb-1">
              To Date
            </label>
            <input
              id="search-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong className="font-mono-tabular text-[#0A192F]">{results.length}</strong>{' '}
            of <strong className="font-mono-tabular text-[#0A192F]">{records.length}</strong>{' '}
            records
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D4ED8] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {results.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-display text-base font-semibold text-[#0A192F]">
              No matching records found
            </p>
            <p className="text-sm text-slate-500">
              Try clearing the date range or searching by partial phone number or doctor surname.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Visit Date</th>
                  <th className="py-3 px-4">Month Folder</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {results.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono-tabular text-xs font-semibold text-[#1D4ED8] whitespace-nowrap">
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
                    <td className="py-2.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatArchiveMonthLabel(rec.archiveMonth)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewPhoto(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0A192F] bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintRecord(rec.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 rounded-md cursor-pointer"
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
        )}
      </div>
    </div>
  );
};
