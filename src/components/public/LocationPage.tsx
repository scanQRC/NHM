import React from 'react';
import {Clock, MapPin, Navigation} from 'lucide-react';
import {NMH_OPERATING_HOURS} from '../../data/nmhData';
import {PharmacySettings} from '../../types/nmh';

interface LocationPageProps {
  settings: PharmacySettings;
}

export const LocationPage: React.FC<LocationPageProps> = ({settings}) => {
  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-medium text-[#1D4ED8]">Location &amp; Hours</div>
            <h1
              className="font-display text-3xl sm:text-4xl font-bold text-[#0A192F] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Visit National Medical Hall opposite District Hospital Main Gate.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Ground-floor wheelchair-accessible counter with dedicated two-wheeler and four-wheeler
              patient pickup bay along Station Road, Civil Lines.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-18">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Architectural Street Schematic (Self-contained, zero paid Map APIs) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0A192F]">
                  <Navigation className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Dispensary District Map Schematic</span>
                </div>
                <span className="text-xs text-slate-500">Civil Lines Landmark Guide</span>
              </div>

              <div className="p-6 flex-1 flex items-center justify-center bg-slate-50">
                <svg
                  viewBox="0 0 640 360"
                  role="img"
                  aria-label="Schematic map showing National Medical Hall on Station Road opposite District Hospital Main Gate"
                  className="w-full h-auto max-h-[340px] rounded-lg border border-slate-200 bg-white"
                >
                  {/* City grid blocks */}
                  <rect x="0" y="0" width="640" height="360" fill="#F8FAFC" />
                  <rect x="40" y="36" width="210" height="108" rx="8" fill="#E2E8F0" />
                  <text x="145" y="84" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="600">
                    District Hospital
                  </text>
                  <text x="145" y="104" textAnchor="middle" fill="#475569" fontSize="11">
                    Main Outpatient Gate
                  </text>

                  <rect x="330" y="36" width="270" height="108" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
                  <text x="465" y="84" textAnchor="middle" fill="#1E3A8A" fontSize="13" fontWeight="600">
                    Central Diagnostic Wing
                  </text>
                  <text x="465" y="104" textAnchor="middle" fill="#475569" fontSize="11">
                    2 min walk East
                  </text>

                  {/* Station Road horizontal arterial */}
                  <rect x="0" y="168" width="640" height="44" fill="#CBD5E1" />
                  <line x1="0" y1="190" x2="640" y2="190" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="10 8" />
                  <text x="320" y="194" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="600">
                    Station Road (Main Access)
                  </text>

                  {/* Vertical Cross Street */}
                  <rect x="268" y="0" width="38" height="360" fill="#CBD5E1" />
                  <text
                    x="287"
                    y="286"
                    textAnchor="middle"
                    fill="#334155"
                    fontSize="11"
                    transform="rotate(-90 287 286)"
                  >
                    Hospital Link Rd
                  </text>

                  {/* NMH Building Pin */}
                  <rect x="48" y="234" width="198" height="92" rx="10" fill="#0A192F" />
                  <circle cx="76" cy="264" r="10" fill="#059669" />
                  <path d="M76 258 v12 M70 264 h12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                  <text x="96" y="268" fill="#FFFFFF" fontSize="13" fontWeight="700">
                    National Medical Hall
                  </text>
                  <text x="68" y="294" fill="#CBD5E1" fontSize="11">
                    18 Station Road · Ground Floor
                  </text>
                  <text x="68" y="311" fill="#10B981" fontSize="11" fontWeight="600">
                    Patient Pickup Bay in Front
                  </text>

                  {/* Railway Station Direction Block */}
                  <rect x="330" y="234" width="270" height="92" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
                  <text x="465" y="274" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="600">
                    Civil Lines Crossing
                  </text>
                  <text x="465" y="294" textAnchor="middle" fill="#475569" fontSize="11">
                    400m toward City Railway Station
                  </text>
                </svg>
              </div>
            </div>

            {/* Address & Landmarks Card */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#059669] shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h2 className="font-display text-xl font-bold text-[#0A192F]">
                      Dispensary Address
                    </h2>
                    <p className="text-sm text-slate-700 font-medium">{settings.pharmacyName}</p>
                    <p className="text-sm text-slate-600">{settings.addressLine1}</p>
                    <p className="text-sm text-slate-600">{settings.addressLine2}</p>
                    <p className="text-sm text-slate-600">{settings.cityStateZip}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                  <div className="font-semibold text-[#0A192F]">Arrival &amp; Accessibility</div>
                  <p>
                    Located directly across the pedestrian crossing from District Hospital Main Gate.
                    Step-free ramp entry available for senior citizens and wheelchairs.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#1D4ED8]" />
                  <h2 className="font-display text-xl font-bold text-[#0A192F]">
                    Operating Schedule
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {NMH_OPERATING_HOURS.map((item) => (
                    <div
                      key={item.day}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#0A192F]">{item.day}</div>
                        <div className="text-xs text-slate-500">{item.note}</div>
                      </div>
                      <div className="text-sm font-mono-tabular font-medium text-[#0A192F] shrink-0">
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
