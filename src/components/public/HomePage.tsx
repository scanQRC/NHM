import React from 'react';
import {ArrowRight, Clock, MapPin, Phone, ShieldCheck} from 'lucide-react';
import {NMH_IMAGES, NMH_SERVICES} from '../../data/nmhData';
import {PharmacySettings, PublicRoute} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface HomePageProps {
  settings: PharmacySettings;
  onNavigate: (page: PublicRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({settings, onNavigate}) => {
  const goTo = (page: PublicRoute) => {
    onNavigate(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <div>
      {/* 1. Hero Split Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-[#059669]">
                <span>Licensed Community Pharmacy</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-600">Civil Lines Dispensary</span>
              </div>

              <h1
                className="font-display text-[#0A192F] font-bold tracking-tight leading-[1.12] max-w-xl"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.35rem)',
                  textWrap: 'balance',
                }}
              >
                Reliable clinical dispensing and trusted pharmaceutical care.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[60ch]">
                National Medical Hall delivers verified outpatient prescriptions, temperature-controlled
                cold-chain medicines, and direct consultation with registered pharmacists every day of
                the week.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => goTo('services')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors duration-150 min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Pharmacy Services</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo('location')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0A192F] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors duration-150 min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#059669]" />
                  <span>Directions &amp; Hours</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] lg:min-h-[420px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src={NMH_IMAGES.heroInterior}
                  alt="National Medical Hall interior dispensing counter and pharmacy hall"
                  className="w-full h-full object-cover"
                  fallbackTitle="National Medical Hall Interior"
                />
              </div>
            </div>
          </div>

          {/* Full-width 4-column operational strip below hero split */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500">Clinical Oversight</div>
              <div className="mt-1 font-display text-lg font-semibold text-[#0A192F]">
                Registered Pharmacists
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Two-step verification on every prescription handed over at the counter.
              </p>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Cold-Chain Standard</div>
              <div className="mt-1 font-display text-lg font-semibold text-[#0A192F] tabular-nums">
                2°C – 8°C Monitored
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Dedicated medical refrigeration for insulin, vaccines, and biologics.
              </p>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Weekly Availability</div>
              <div className="mt-1 font-display text-lg font-semibold text-[#0A192F] tabular-nums">
                08:00 AM – 10:30 PM
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Open Monday through Saturday with extended Sunday counter hours.
              </p>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Direct Inquiries</div>
              <div className="mt-1 font-display text-lg font-semibold text-[#0A192F] tabular-nums">
                {settings.phone}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Call our dispensary desk to confirm stock availability before visiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pharmacy Capabilities */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-200">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-medium text-[#1D4ED8]">Pharmacy Capabilities</div>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight"
                style={{textWrap: 'balance'}}
              >
                Disciplined dispensing built around patient safety.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => goTo('services')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:text-[#0A192F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View all five service lines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10 pt-10">
            {NMH_SERVICES.slice(0, 4).map((service) => (
              <div
                key={service.number}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-tabular font-semibold text-[#059669]">
                      {service.number}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{service.category}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {service.summary}
                  </p>
                </div>
                <p className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-500 leading-relaxed">
                  {service.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Pharmacist Standards & Claim-to-Proof */}
      <section className="bg-white py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src={NMH_IMAGES.pharmacistConsultation}
                  alt="Senior pharmacist reviewing medication packaging at National Medical Hall"
                  className="w-full h-full object-cover"
                  fallbackTitle="Licensed Pharmacist Review"
                />
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-[#059669]">
                <ShieldCheck className="w-4 h-4" />
                <span>Quality &amp; Authenticity Protocol</span>
              </div>

              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight"
                style={{textWrap: 'balance'}}
              >
                Direct manufacturer sourcing with transparent counter verification.
              </h2>

              <p className="text-base text-slate-600 leading-relaxed">
                At National Medical Hall, medicines are procured strictly through authorized
                stockists and inspected upon arrival for seal integrity, batch coding, and storage
                compliance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
                <div className="pt-4">
                  <div className="font-display text-2xl font-bold text-[#0A192F] tabular-nums">
                    100%
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-700">
                    Authorized Stockist Procurement
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Zero unverified grey-market inventory across prescription or surgical lines.
                  </p>
                </div>
                <div className="pt-4">
                  <div className="font-display text-2xl font-bold text-[#0A192F] tabular-nums">
                    Private Records
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-700">
                    Confidential Counter Archiving
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    In-house prescription records are accessible strictly to authorized staff.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => goTo('about')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:text-[#0A192F] transition-colors cursor-pointer"
                >
                  <span>Read about our pharmacy standards</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Visit & Contact Callout */}
      <section className="bg-[#0A192F] text-white py-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white"
                style={{textWrap: 'balance'}}
              >
                Need to confirm a prescription or visit our Civil Lines counter?
              </h2>
              <p className="text-slate-300 text-base max-w-2xl">
                Speak directly with our dispensary team during counter hours or check directions
                opposite the District Hospital Main Gate.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
              <button
                type="button"
                onClick={() => goTo('contact')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0A192F] bg-white hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#1D4ED8]" />
                <span>Contact Dispensary</span>
              </button>
              <button
                type="button"
                onClick={() => goTo('location')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Location &amp; Timings</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
