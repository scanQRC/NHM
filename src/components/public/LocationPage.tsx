import React from 'react';
import {Clock, ExternalLink, MapPin, Navigation, Phone} from 'lucide-react';
import {NMH_OPERATING_HOURS} from '../../constants/storeInfo';
import {PharmacySettings} from '../../types/nmh';

interface LocationPageProps {
  settings: PharmacySettings;
}

export const LocationPage: React.FC<LocationPageProps> = ({settings}) => {
  return (
    <div className="bg-[#F4F7FB]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <div className="text-xs font-medium text-[#1769D2]">Location &amp; Hours</div>
            <h1
              className="font-display text-2xl sm:text-4xl font-bold text-[#102B50] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Visit National Medical Hall on Hospital Road, Udhampur.
            </h1>
            <p className="text-[15px] sm:text-lg text-slate-600 leading-relaxed">
              Located near Nehru Memorial Higher Secondary School on Hospital Road, Udhampur –
              182101. Call our counter anytime during operating hours or open Google Maps for
              directions.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-stretch">
            {/* Primary Store Location & Directions Card */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-8 flex flex-col justify-between space-y-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#102B50] text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#12A66A]" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="text-xs font-medium text-[#1769D2]">Pharmacy Location</div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#102B50]">
                      {settings.pharmacyName}
                    </h2>
                    <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed">
                      {settings.addressLine1}
                      <br />
                      {settings.addressLine2}, {settings.cityStateZip}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 rounded-lg bg-[#F4F7FB] border border-slate-200 space-y-1">
                    <div className="text-xs font-medium text-slate-500">Landmark</div>
                    <div className="text-sm font-semibold text-[#102B50]">
                      Near Nehru Memorial Higher Secondary School
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F4F7FB] border border-slate-200 space-y-1">
                    <div className="text-xs font-medium text-slate-500">City, State &amp; PIN</div>
                    <div className="text-sm font-semibold text-[#102B50] tabular-nums">
                      Hospital Road, Udhampur – 182101, Jammu &amp; Kashmir, India
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F4F7FB] border border-slate-200 flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-[#1769D2] shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Selecting <strong className="text-[#102B50]">Get Directions</strong> opens a
                    Google Maps search for National Medical Hall on Hospital Road, Udhampur –
                    182101 so you can navigate directly from your current location.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 pt-4 border-t border-slate-200">
                <a
                  href={settings.googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-lg transition-colors min-h-[46px] sm:min-h-[44px] whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#12A66A] hover:bg-[#0F8F5B] rounded-lg transition-colors min-h-[46px] sm:min-h-[44px] whitespace-nowrap tabular-nums"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {settings.phone}</span>
                </a>
              </div>
            </div>

            {/* Operating Hours & Direct Phone Card */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4 sm:gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-3 sm:space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#12A66A]" />
                  <h2 className="font-display text-xl font-bold text-[#102B50]">
                    Telephone Desk
                  </h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Speak with our pharmacy counter directly to verify medicine availability before
                  your visit.
                </p>
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-0 font-display text-2xl font-bold text-[#1769D2] hover:underline tabular-nums"
                >
                  <span>{settings.phone}</span>
                </a>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-4 flex-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#1769D2]" />
                  <h2 className="font-display text-xl font-bold text-[#102B50]">
                    Operating Schedule
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {NMH_OPERATING_HOURS.map((item) => (
                    <div
                      key={item.day}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 sm:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#102B50]">{item.day}</div>
                        <div className="text-xs text-slate-500">{item.note}</div>
                      </div>
                      <div className="text-xs sm:text-sm font-mono-tabular font-medium text-[#102B50] shrink-0 text-right">
                        {item.hours}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
