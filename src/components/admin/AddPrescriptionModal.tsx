import React, {useState} from 'react';
import {Upload, X} from 'lucide-react';
import {ApiError, createAdminRecord} from '../../services/api';
import {PrescriptionRecord} from '../../types/nmh';

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: PrescriptionRecord) => void;
  onUnauthorized: () => void;
}

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
  onUnauthorized,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [visitDate, setVisitDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoFilename, setPhotoFilename] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image size must be under 8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
        setPhotoFilename(file.name);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Contact phone number is required.');
      return;
    }
    if (!photoDataUrl) {
      setError('Please select or capture a prescription photograph.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const record = await createAdminRecord({
        patientName: patientName.trim(),
        phone: phone.trim(),
        doctorName: doctorName.trim() || 'Not Specified',
        visitDate,
        notes: notes.trim(),
        photoUrl: photoDataUrl,
        photoFilename: photoFilename || 'prescription.jpg',
      });
      onAddRecord(record);
      setPatientName('');
      setPhone('');
      setDoctorName('');
      setVisitDate(today);
      setNotes('');
      setPhotoDataUrl('');
      setPhotoFilename('');
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to save prescription record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-rx-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 no-print"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 id="add-rx-title" className="font-display text-lg font-bold text-[#102B50]">
              Add Prescription Photo Record
            </h2>
            <p className="text-xs text-slate-500">
              Stored securely in private dispensary database as a visual photo record (no OCR).
            </p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#102B50]">
              Prescription Photograph <span className="text-red-600">*</span>
            </label>

            {photoDataUrl ? (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
                <img
                  src={photoDataUrl}
                  alt="Selected prescription preview"
                  className="max-h-56 mx-auto rounded object-contain"
                />
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono-tabular truncate">{photoFilename}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl('');
                      setPhotoFilename('');
                    }}
                    className="text-red-600 font-medium hover:underline cursor-pointer"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3 bg-slate-50">
                <div className="flex justify-center">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-lg transition-colors cursor-pointer min-h-[42px]">
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo / Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  Supports desktop JPG/PNG selection (Windows 10/11) and mobile camera capture
                  (Android).
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="rx-patient"
                className="block text-xs font-medium text-[#102B50] mb-1.5"
              >
                Patient Name <span className="text-red-600">*</span>
              </label>
              <input
                id="rx-patient"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
              />
            </div>

            <div>
              <label
                htmlFor="rx-phone"
                className="block text-xs font-medium text-[#102B50] mb-1.5"
              >
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                id="rx-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9419294905"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="rx-doctor"
                className="block text-xs font-medium text-[#102B50] mb-1.5"
              >
                Prescribing Doctor
              </label>
              <input
                id="rx-doctor"
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. S. Sharma"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
              />
            </div>

            <div>
              <label
                htmlFor="rx-date"
                className="block text-xs font-medium text-[#102B50] mb-1.5"
              >
                Prescription Visit Date
              </label>
              <input
                id="rx-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 min-h-[42px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rx-notes" className="block text-xs font-medium text-[#102B50] mb-1.5">
              Counter Notes (Optional)
            </label>
            <textarea
              id="rx-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional filing remark..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] disabled:opacity-60 rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
