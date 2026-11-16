import React from 'react';
import {CheckCircle2, Lock, ShieldCheck} from 'lucide-react';
import {NMH_IMAGES} from '../../data/nmhData';
import {PharmacySettings, PublicRoute} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface AboutPageProps {
  settings: PharmacySettings;
  onNavigate: (page: PublicRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({settings, onNavigate}) => {
  return (
    <div className="bg-[#F8FAFC]">
      {/* Page Intro */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-medium text-[#1D4ED8]">About National Medical Hall</div>
            <h1
              className="font-display text-3xl sm:text-4xl font-bold text-[#0A192F] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Built on clinical accuracy, patient dignity, and verified medicine stewardship.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              National Medical Hall (NMH) serves patients, families, and nearby outpatient clinics
              with dependable access to authentic prescription medicines, sterile consumables, and
              calm, unhurried pharmacist guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Two-Column Facility & Cold Chain Story */}
      <section className="py-14 lg:py-18 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 space-y-6 flex flex-col justify-center">
              <h2 className="font-display text-2xl font-bold text-[#0A192F] tracking-tight">
                01. Clinical Storage &amp; Dispensary Discipline
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Medication efficacy depends on how it is handled long before it reaches your home.
                Our dispensary maintains segregated climate zones, calibrated cold-chain units for
                sensitive biologics and insulin, and organized drawer indexing to prevent look-alike
                dispensing errors.
              </p>
              <ul className="space-y-3 pt-2">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                  <span>
                    Continuous temperature checks on refrigerated biologicals and eye drops.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                  <span>
                    Expiry-date audit cycles across all shelves prior to dispensing.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                  <span>
                    Clear dosage labeling and patient counseling at every handover.
                  </span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-white">
                <SafeImage
                  src={NMH_IMAGES.coldChainStorage}
                  alt="Pharmaceutical cold-chain refrigerator and organized medicine drawers at National Medical Hall"
                  className="w-full h-full object-cover"
                  fallbackTitle="NMH Cold-Chain Dispensary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-14 lg:py-18 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-3">
              <ShieldCheck className="w-6 h-6 text-[#1D4ED8]" />
              <h3 className="font-display text-lg font-semibold text-[#0A192F]">
                Licensed Accountability
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Operating under registration <span className="font-mono-tabular">{settings.licenseNumber}</span>,
                our counter is supervised by qualified pharmacists throughout operating hours.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-3">
              <Lock className="w-6 h-6 text-[#059669]" />
              <h3 className="font-display text-lg font-semibold text-[#0A192F]">
                Prescription Confidentiality
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Patient prescriptions are never shared publicly or processed by automated third-party
                text readers. Records remain strictly within private staff administration.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-3">
              <CheckCircle2 className="w-6 h-6 text-[#0A192F]" />
              <h3 className="font-display text-lg font-semibold text-[#0A192F]">
                Transparent Guidance
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We explain prescribed schedules clearly and coordinate with prescribing physicians if
                any clarification is ever needed before dispensing.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Have a question about medicine availability or storage instructions?
            </p>
            <button
              type="button"
              onClick={() => {
                onNavigate('contact');
                window.scrollTo({top: 0, behavior: 'smooth'});
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0A192F] hover:bg-[#1D4ED8] rounded-lg transition-colors min-h-[44px] cursor-pointer"
            >
              Contact Our Pharmacists
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
