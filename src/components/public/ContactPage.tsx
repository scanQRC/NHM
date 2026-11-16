import React, {useState} from 'react';
import {CheckCircle2, Mail, Phone, Clock} from 'lucide-react';
import {NMH_OPERATING_HOURS} from '../../data/nmhData';
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
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-medium text-[#1D4ED8]">Contact National Medical Hall</div>
            <h1
              className="font-display text-3xl sm:text-4xl font-bold text-[#0A192F] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Reach our dispensing counter directly.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Call us to check stock availability, inquire about cold-chain packs, or send a general
              pharmacy message below. Please bring physical prescriptions to the counter for
              dispensing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-18">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Direct Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
                <h2 className="font-display text-xl font-bold text-[#0A192F]">
                  Direct Desk Channels
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-[#0A192F]">Dispensary Telephone</div>
                      <div className="text-slate-600 tabular-nums mt-0.5">{settings.phone}</div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Urgent Line: {settings.emergencyPhone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                    <Mail className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-[#0A192F]">General Desk Email</div>
                      <div className="text-slate-600 mt-0.5">{settings.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                    <Clock className="w-5 h-5 text-[#0A192F] shrink-0 mt-0.5" />
                    <div className="w-full">
                      <div className="font-medium text-[#0A192F] mb-2">Counter Hours</div>
                      <div className="space-y-1.5">
                        {NMH_OPERATING_HOURS.map((row) => (
                          <div
                            key={row.day}
                            className="flex items-center justify-between text-xs text-slate-600 gap-2"
                          >
                            <span>{row.day}</span>
                            <span className="font-mono-tabular text-[#0A192F]">{row.hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                {submitted ? (
                  <div className="py-8 space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-[#0A192F]">
                      Inquiry Preview Recorded
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
                      Thank you, <span className="font-semibold text-[#0A192F]">{form.name}</span>.
                      Your message regarding <span className="font-medium">{form.topic}</span> has
                      been validated in this interface preview. For immediate assistance, please
                      call <span className="font-mono-tabular">{settings.phone}</span>.
                    </p>
                    <p className="text-xs text-slate-500">
                      Note: Server-side email dispatch will be connected when backend messaging is
                      configured.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0A192F] hover:bg-[#1D4ED8] rounded-lg transition-colors min-h-[44px] cursor-pointer"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="space-y-1">
                      <h2 className="font-display text-xl font-bold text-[#0A192F]">
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
                          className="block text-sm font-medium text-[#0A192F] mb-1.5"
                        >
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({...form, name: e.target.value})}
                          placeholder="e.g. Arvind Mehta"
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] min-h-[44px]"
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-sm font-medium text-[#0A192F] mb-1.5"
                        >
                          Phone Number <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({...form, phone: e.target.value})}
                          placeholder="e.g. 98100 12345"
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] min-h-[44px]"
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
                          className="block text-sm font-medium text-[#0A192F] mb-1.5"
                        >
                          Email Address (Optional)
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({...form, email: e.target.value})}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] min-h-[44px]"
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-topic"
                          className="block text-sm font-medium text-[#0A192F] mb-1.5"
                        >
                          Inquiry Topic
                        </label>
                        <select
                          id="contact-topic"
                          value={form.topic}
                          onChange={(e) => setForm({...form, topic: e.target.value})}
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] min-h-[44px]"
                        >
                          <option value="Medicine Availability">Medicine Availability</option>
                          <option value="Cold-Chain & Insulin">Cold-Chain &amp; Insulin</option>
                          <option value="Medical Devices & Supplies">Medical Devices &amp; Supplies</option>
                          <option value="Pharmacist Consultation">Pharmacist Consultation</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-[#0A192F] mb-1.5"
                      >
                        Message <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value})}
                        placeholder="Specify medicine inquiry, device question, or preferred callback time..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
                      />
                      {errors.message && (
                        <p className="mt-1 text-xs text-red-600">{errors.message}</p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500">
                        UI preview form · No paid messaging APIs used
                      </span>
                      <button
                        type="submit"
                        className="px-6 py-3 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
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
