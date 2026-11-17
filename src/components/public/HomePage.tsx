import React from 'react';
import {ArrowRight, Clock, ExternalLink, MapPin, Phone, ShieldCheck} from 'lucide-react';
import {NMH_IMAGES, NMH_OPERATING_HOURS, NMH_SERVICES} from '../../constants/storeInfo';
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
      {/* 1. Hero Split Section with Authentic Storefront Photography */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#12A66A]">
                <span>Licensed Indian Medical Store</span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="text-slate-600">Hospital Road, Udhampur (J&amp;K)</span>
              </div>

              <h1
                className="font-display text-[#102B50] font-bold tracking-tight leading-[1.14] sm:leading-[1.12] max-w-xl"
                style={{
                  fontSize: 'clamp(1.85rem, 3.6vw, 3.1rem)',
                  textWrap: 'balance',
                }}
              >
                National Medical Hall — Trusted Chemist &amp; Medical Store in Udhampur.
              </h1>

              <p className="text-[15px] sm:text-lg text-slate-600 leading-relaxed max-w-[54ch]">
                Serving patients across Udhampur, Jammu &amp; Kashmir with genuine OPD and hospital
                prescription medicines, 2°C–8°C cold-chain care, and transparent MRP (₹) counter
                billing.
              </p>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 pt-1">
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-lg transition-colors duration-150 min-h-[46px] sm:min-h-[44px] whitespace-nowrap shrink-0 tabular-nums"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call +91 {settings.phone}</span>
                </a>
                <a
                  href={settings.googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#102B50] bg-[#F4F7FB] hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors duration-150 min-h-[46px] sm:min-h-[44px] whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-4 h-4 text-[#12A66A]" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 flex items-center">
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-[#102B50] shadow-sm">
                <SafeImage
                  src={NMH_IMAGES.heroInterior}
                  alt="National Medical Hall storefront in Udhampur showing illuminated NATIONAL MEDICAL HALL signage and entrance"
                  className="w-full h-auto object-contain block"
                  fallbackTitle="National Medical Hall Storefront"
                />
              </div>
            </div>
          </div>

          {/* Full-width 4-column operational strip below hero split */}
          <div className="mt-8 sm:mt-12 pt-7 sm:pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            <div className="space-y-1.5 pb-4 sm:pb-0 border-b sm:border-b-0 border-slate-100">
              <div className="text-xs font-medium text-slate-500">Chemist &amp; Druggist</div>
              <div className="font-display text-base sm:text-lg font-semibold text-[#102B50]">
                Registered Pharmacists
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Schedule H/H1 verification and batch checks on every counter prescription.
              </p>
            </div>
            <div className="space-y-1.5 pb-4 sm:pb-0 border-b sm:border-b-0 border-slate-100">
              <div className="text-xs font-medium text-slate-500">Cold-Chain Standard</div>
              <div className="font-display text-base sm:text-lg font-semibold text-[#102B50] tabular-nums">
                2°C – 8°C Monitored
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dedicated medical refrigeration for insulin, vaccines, and eye drops.
              </p>
            </div>
            <div className="space-y-1.5 pb-4 sm:pb-0 border-b sm:border-b-0 border-slate-100">
              <div className="text-xs font-medium text-slate-500">Transparent Pricing</div>
              <div className="font-display text-base sm:text-lg font-semibold text-[#102B50]">
                Clear MRP (₹) Billing
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Itemized counter bills in Indian Rupees (₹) with batch &amp; expiry details.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-500">Direct Store Phone</div>
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center py-1 sm:py-0 font-display text-base sm:text-lg font-semibold text-[#1769D2] hover:underline tabular-nums"
              >
                +91 {settings.phone}
              </a>
              <p className="text-sm text-slate-600 leading-relaxed">
                Call our Udhampur counter directly to check medicine stock before visiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pharmacy Capabilities */}
      <section className="bg-[#F4F7FB] py-10 sm:py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-10 border-b border-slate-200">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-medium text-[#1769D2]">Pharmacy Capabilities</div>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#102B50] tracking-tight"
                style={{textWrap: 'balance'}}
              >
                Disciplined dispensing built around patient safety.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => goTo('services')}
              className="inline-flex items-center gap-2 self-start md:self-auto py-2 sm:py-0 text-sm font-semibold text-[#1769D2] hover:text-[#102B50] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View all five service lines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-10">
            {NMH_SERVICES.slice(0, 4).map((service) => (
              <div
                key={service.number}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 flex flex-col justify-between h-full shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-tabular font-semibold text-[#12A66A]">
                      {service.number}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{service.category}</span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-[#102B50]">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {service.summary}
                  </p>
                </div>
                <p className="mt-4 sm:mt-5 pt-4 border-t border-slate-100 text-sm text-slate-500 leading-relaxed">
                  {service.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Pharmacist Standards & Claim-to-Proof */}
      <section className="bg-white py-10 sm:py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 flex items-center">
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-[#F4F7FB] shadow-sm">
                <SafeImage
                  src={NMH_IMAGES.pharmacistConsultation}
                  alt="Inside National Medical Hall counter and medicine shelves in Udhampur"
                  className="w-full h-auto object-contain block"
                  fallbackTitle="National Medical Hall Interior"
                />
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-[#12A66A]">
                <ShieldCheck className="w-4 h-4" />
                <span>Quality &amp; Authenticity Protocol</span>
              </div>

              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#102B50] tracking-tight"
                style={{textWrap: 'balance'}}
              >
                Direct manufacturer sourcing with transparent counter verification.
              </h2>

              <p className="text-base text-slate-600 leading-relaxed max-w-[58ch]">
                At National Medical Hall, medicines are procured strictly through authorized
                stockists and inspected upon arrival for seal integrity, batch coding, and storage
                compliance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                <div>
                  <div className="font-display text-2xl font-bold text-[#102B50] tabular-nums">
                    100%
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-700">
                    Authorized Stockist Procurement
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Zero unverified inventory across prescription or surgical lines.
                  </p>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-[#102B50] tabular-nums">
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

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => goTo('about')}
                  className="inline-flex items-center gap-2 py-2 sm:py-0 text-sm font-semibold text-[#1769D2] hover:text-[#102B50] transition-colors cursor-pointer"
                >
                  <span>Read about our pharmacy standards</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Clearly Visible Location & Contact Section */}
      <section className="bg-[#102B50] text-white py-10 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#12A66A]">
                <MapPin className="w-4 h-4" />
                <span>Store Location &amp; Direct Contact</span>
              </div>

              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white"
                style={{textWrap: 'balance'}}
              >
                Visit National Medical Hall on Hospital Road, Udhampur.
              </h2>

              <div className="space-y-2.5 text-slate-200 text-[15px] sm:text-base">
                <p className="font-semibold text-white">{settings.pharmacyName}</p>
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-[#12A66A] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {settings.addressLine1}, {settings.addressLine2}, {settings.cityStateZip}
                  </span>
                </p>
                <p className="flex items-center gap-2.5 tabular-nums">
                  <Phone className="w-5 h-5 text-[#12A66A] shrink-0" />
                  <span>Phone: {settings.phone}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 pt-2">
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg transition-colors min-h-[46px] sm:min-h-[44px] whitespace-nowrap shrink-0 tabular-nums"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {settings.phone}</span>
                </a>
                <a
                  href={settings.googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#102B50] bg-white hover:bg-slate-100 rounded-lg transition-colors min-h-[46px] sm:min-h-[44px] whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-4 h-4 text-[#1769D2]" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#163765] border border-slate-700/80 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Clock className="w-4 h-4 text-[#12A66A]" />
                <span>Dispensary Counter Hours</span>
              </div>
              <div className="divide-y divide-slate-700/70">
                {NMH_OPERATING_HOURS.map((item) => (
                  <div
                    key={item.day}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 sm:gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white">{item.day}</div>
                      <div className="text-xs text-slate-300">{item.note}</div>
                    </div>
                    <div className="font-mono-tabular text-xs sm:text-sm text-slate-100 shrink-0 text-right">
                      {item.hours}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
