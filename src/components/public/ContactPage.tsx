import React, {useState} from 'react';
import {CheckCircle2, Clock, ExternalLink, MapPin, Phone} from 'lucide-react';
import {NMH_OPERATING_HOURS} from '../../constants/storeInfo';
import {PharmacySettings} from '../../types/nmh';

interface ContactPageProps {
  settings: PharmacySettings;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({settings}) => {
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    email: '',
    topic: 'Medicine Availability',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) {
      next.name = 'Please enter your full name.';
    }
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 8) {
      next.phone = 'Please enter a valid phone number (at least 8 digits).';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address or leave blank.';
    }
    if (form.message.trim().length < 10) {
      next.message = 'Please enter a short inquiry (at least 10 characters).';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      topic: 'Medicine Availability',
      message: '',
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="bg-[#F4F7FB]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <div className="text-xs font-medium text-[#1769D2]">Contact National Medical Hall</div>
            <h1
              className="font-display text-2xl sm:text-4xl font-bold text-[#102B50] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Reach our dispensing counter in Udhampur directly.
            </h1>
            <p className="text-[15px] sm:text-lg text-slate-600 leading-relaxed">
              Call us at <span className="font-semibold text-[#102B50] tabular-nums">{settings.phone}</span>{' '}
              to check medicine availability, inquire about cold-chain storage, or send an inquiry
              below. Please bring physical prescriptions to the counter for dispensing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-stretch">
            {/* Left Direct Contact Details */}
            <div className="lg:col-span-5 flex">
              <div className="w-full bg-white border border-slate-200 rounded-xl p-5 sm:p-7 flex flex-col justify-between space-y-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="space-y-5">
                  <h2 className="font-display text-xl font-bold text-[#102B50]">
                    {settings.pharmacyName}
                  </h2>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#1769D2] shrink-0 mt-0.5" />
                      <div className="space-y-2.5 min-w-0">
                        <div>
                          <div className="font-medium text-[#102B50]">Store Phone Number</div>
                          <div className="text-base font-semibold text-[#102B50] tabular-nums mt-0.5">
                            {settings.phone}
                          </div>
                        </div>
                        <a
                          href={`tel:${settings.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg transition-colors min-h-[44px] sm:min-h-[38px] tabular-nums"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call {settings.phone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                      <MapPin className="w-5 h-5 text-[#12A66A] shrink-0 mt-0.5" />
                      <div className="space-y-2.5 min-w-0">
                        <div>
                          <div className="font-medium text-[#102B50]">Store Address</div>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">
                            {settings.addressLine1}, {settings.addressLine2}, {settings.cityStateZip}
                          </p>
                        </div>
                        <a
                          href={settings.googleMapsSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold text-[#102B50] bg-[#F4F7FB] hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors min-h-[44px] sm:min-h-[38px]"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#1769D2]" />
                          <span>Get Directions</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-slate-100 text-sm">
                  <Clock className="w-5 h-5 text-[#102B50] shrink-0 mt-0.5" />
                  <div className="w-full min-w-0">
                    <div className="font-medium text-[#102B50] mb-2.5">Counter Hours</div>
                    <div className="space-y-2">
                      {NMH_OPERATING_HOURS.map((row) => (
                        <div
                          key={row.day}
                          className="flex items-center justify-between text-xs text-slate-600 gap-2"
                        >
                          <span className="min-w-0">{row.day}</span>
                          <span className="font-mono-tabular text-[#102B50] shrink-0">{row.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Inquiry Form */}
            <div className="lg:col-span-7 flex">
              <div className="w-full bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                {submitted ? (
                  <div className="py-8 space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ECFDF5] text-[#12A66A]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-[#102B50]">
                      Inquiry Preview Recorded
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
                      Thank you, <span className="font-semibold text-[#102B50]">{form.name}</span>.
                      Your message regarding <span className="font-medium">{form.topic}</span> has
                      been validated in this interface preview. For immediate assistance, please
                      call{' '}
                      <a
                        href={`tel:${settings.phone}`}
                        className="font-mono-tabular font-semibold text-[#1769D2] underline"
                      >
                        {settings.phone}
                      </a>
                      .
                    </p>
                    <p className="text-xs text-slate-500">
                      Note: Server-side email dispatch will be connected when backend messaging is
                      configured.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#102B50] hover:bg-[#1769D2] rounded-lg transition-colors min-h-[44px] cursor-pointer"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1">
                      <h2 className="font-display text-xl font-bold text-[#102B50]">
                        Patient &amp; Clinic Inquiry Form
                      </h2>
                      <p className="text-sm text-slate-500">
                        Do not upload prescription images here; bring physical prescriptions to the
                        dispensary counter.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-sm font-medium text-[#102B50] mb-1.5"
                        >
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({...form, name: e.target.value})}
                          placeholder="e.g. Rajesh Sharma"
                          className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-sm font-medium text-[#102B50] mb-1.5"
                        >
                          Phone Number <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({...form, phone: e.target.value})}
                          placeholder="e.g. 9419294905"
                          className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-sm font-medium text-[#102B50] mb-1.5"
                        >
                          Email Address (Optional)
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({...form, email: e.target.value})}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-topic"
                          className="block text-sm font-medium text-[#102B50] mb-1.5"
                        >
                          Inquiry Topic
                        </label>
                        <select
                          id="contact-topic"
                          value={form.topic}
                          onChange={(e) => setForm({...form, topic: e.target.value})}
                          className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] min-h-[44px]"
                        >
                          <option value="Medicine Availability">Medicine Availability</option>
                          <option value="Cold-Chain & Insulin">Cold-Chain &amp; Insulin</option>
                          <option value="Medical Devices & Supplies">
                            Medical Devices &amp; Supplies
                          </option>
                          <option value="Pharmacist Consultation">Pharmacist Consultation</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-[#102B50] mb-1.5"
                      >
                        Message <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value})}
                        placeholder="Specify medicine inquiry, device question, or preferred callback time..."
                        className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2]"
                      />
                      {errors.message && (
                        <p className="mt-1 text-xs text-red-600">{errors.message}</p>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <span className="text-xs text-slate-500">
                        UI preview form · No paid messaging APIs used
                      </span>
                      <button
                        type="submit"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-lg transition-colors min-h-[46px] sm:min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Submit Inquiry
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
