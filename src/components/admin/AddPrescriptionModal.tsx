import React, {useState} from 'react';
import {Camera, Upload, X} from 'lucide-react';
import {NMH_IMAGES} from '../../data/nmhData';
import {PrescriptionRecord} from '../../types/nmh';

interface AddPrescriptionModalProps {
  isOpen: boolean;
  staffId: string;
  nextSequenceNumber: number;
  onClose: () => void;
  onAddRecord: (record: PrescriptionRecord) => void;
}

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  isOpen,
  staffId,
  nextSequenceNumber,
  onClose,
  onAddRecord,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [visitDate, setVisitDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoFilename, setPhotoFilename] = useState<string>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
    setPhotoFilename(file.name);
    setError('');
  };

  const handleUseSamplePhoto = () => {
    setPhotoPreviewUrl(NMH_IMAGES.sampleRxOne);
    setPhotoFilename('sample_counter_prescription.jpg');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Contact phone number is required.');
      return;
    }
    if (!photoPreviewUrl) {
      setError('Please select a prescription photograph or use the sample preview image.');
      return;
    }

    const archiveMonth = visitDate.slice(0, 7) || today.slice(0, 7);
    const monthDigits = archiveMonth.replace('-', '').slice(2);
    const seq = String(nextSequenceNumber).padStart(4, '0');
    const newRecord: PrescriptionRecord = {
      id: `rec-${Date.now()}`,
      recordNumber: `NMH-${monthDigits}-${seq}`,
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctorName: doctorName.trim() || 'Not Specified',
      visitDate,
      archiveMonth,
      photoUrl: photoPreviewUrl,
      photoFilename: photoFilename || `rx_${seq}.jpg`,
      notes: notes.trim(),
      loggedBy: staffId,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    onAddRecord(newRecord);
    setPatientName('');
    setPhone('');
    setDoctorName('');
    setVisitDate(today);
    setNotes('');
    setPhotoPreviewUrl('');
    setPhotoFilename('');
    setError('');
    onClose();
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
              UI preview only · Stored as visual image record without OCR or medicine reading.
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
          {/* Photo Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#102B50]">
              Prescription Photograph <span className="text-red-600">*</span>
            </label>

            {photoPreviewUrl ? (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
                <img
                  src={photoPreviewUrl}
                  alt="Selected prescription preview"
                  className="max-h-56 mx-auto rounded object-contain"
                />
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono-tabular truncate">{photoFilename}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreviewUrl('');
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
                <div className="flex justify-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer min-h-[42px]">
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
                  <button
                    type="button"
                    onClick={handleUseSamplePhoto}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#102B50] bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[42px]"
                  >
                    <Camera className="w-4 h-4 text-[#059669]" />
                    <span>Use Sample Photo</span>
                  </button>
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
                placeholder="e.g. Meera Deshpande"
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
                placeholder="e.g. 98110-22401"
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
                placeholder="e.g. Dr. R. Subramanian"
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
              placeholder="Optional filing remark (e.g. Monthly refill counter copy)..."
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
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              Save to Session Archive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
