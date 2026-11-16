import React, {useState} from 'react';
import {Printer, RotateCw, X, ZoomIn, ZoomOut} from 'lucide-react';
import {formatArchiveMonthLabel} from '../../utils/dateFormat';
import {PrescriptionRecord} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface PhotoViewerModalProps {
  record: PrescriptionRecord | null;
  onClose: () => void;
  onPrintRecord: (recordId: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  record,
  onClose,
  onPrintRecord,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!record) return null;

  const handleClose = () => {
    setZoom(1);
    setRotation(0);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 no-print"
    >
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-xl">
        {/* Top Controls */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono-tabular font-semibold text-[#1769D2]">
                {record.recordNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatArchiveMonthLabel(record.archiveMonth)}</span>
            </div>
            <h2
              id="viewer-title"
              className="font-display text-base sm:text-lg font-bold text-[#102B50] truncate"
            >
              {record.patientName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-[#102B50] hover:bg-slate-100 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-tabular text-slate-600 w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-[#102B50] hover:bg-slate-100 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Rotate 90 degrees"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-[#102B50] hover:bg-slate-100 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onPrintRecord(record.id);
                handleClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] rounded-lg cursor-pointer min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              type="button"
              aria-label="Close viewer"
              onClick={handleClose}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <div className="lg:col-span-8 bg-slate-900 overflow-auto flex items-center justify-center p-6 min-h-[300px]">
            <div
              className="transition-transform duration-150"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <SafeImage
                src={record.photoUrl}
                alt={`Full prescription photograph for ${record.patientName}`}
                className="max-h-[70vh] w-auto rounded shadow-md object-contain"
                fallbackTitle={record.recordNumber}
              />
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 overflow-y-auto space-y-4 text-sm">
            <h3 className="font-display text-sm font-bold text-[#102B50]">
              Archived Record Details
            </h3>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500">Record Number</dt>
                <dd className="font-mono-tabular font-semibold text-[#102B50] mt-0.5">
                  {record.recordNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Patient Name</dt>
                <dd className="font-medium text-[#102B50] mt-0.5">{record.patientName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-mono-tabular text-[#102B50] mt-0.5">{record.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Prescribing Doctor</dt>
                <dd className="text-[#102B50] mt-0.5">{record.doctorName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Visit Date</dt>
                <dd className="font-mono-tabular text-[#102B50] mt-0.5">{record.visitDate}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Logged By</dt>
                <dd className="text-[#102B50] mt-0.5">{record.loggedBy}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Photo Filename</dt>
                <dd className="font-mono-tabular text-slate-600 mt-0.5 break-all">
                  {record.photoFilename}
                </dd>
              </div>
              {record.notes && (
                <div>
                  <dt className="text-slate-500">Counter Notes</dt>
                  <dd className="text-slate-700 mt-0.5 leading-relaxed">{record.notes}</dd>
                </div>
              )}
            </dl>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Stored strictly as an image record. No automated OCR or medicine reading is performed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
