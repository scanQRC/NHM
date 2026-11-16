import React from 'react';
import {ArrowRight} from 'lucide-react';
import {NMH_IMAGES, NMH_SERVICES} from '../../constants/storeInfo';
import {PublicRoute} from '../../types/nmh';
import {SafeImage} from '../common/SafeImage';

interface ServicesPageProps {
  onNavigate: (page: PublicRoute) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({onNavigate}) => {
  return (
    <div className="bg-[#F4F7FB]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-medium text-[#1769D2]">Services</div>
            <h1
              className="font-display text-3xl sm:text-4xl font-bold text-[#102B50] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Comprehensive pharmacy dispensing and clinical support.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Every service at National Medical Hall is delivered in person by trained pharmacy staff
              with strict attention to cold-chain safety, dosage clarity, and verified sourcing.
            </p>
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Grid */}
      <section className="py-14 lg:py-18">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {NMH_SERVICES.map((service, index) => {
              const isWide = index === 0 || index === 4;
              return (
                <article
                  key={service.number}
                  className={`bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between ${
                    isWide ? 'lg:col-span-2' : 'lg:col-span-1'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-tabular font-semibold text-[#12A66A]">
                        {service.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{service.category}</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#102B50]">
                      {service.title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {service.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-sm text-slate-500 leading-relaxed">{service.details}</p>
                  </div>
                </article>
              );
            })}

            {/* Visual Spotlight Block inside Bento */}
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-12 bg-[#102B50] text-white rounded-xl overflow-hidden border border-slate-800">
              <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-4">
                <div className="text-xs font-medium text-[#12A66A]">Counter Prescription Workflow</div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  Bring your physical prescription directly to our Hospital Road counter.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                  Our pharmacists review original clinician prescriptions at the counter, verify
                  batch dates, and provide clear administration instructions before billing.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('location');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#102B50] bg-white hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] cursor-pointer"
                  >
                    <span>See Store Location &amp; Directions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 flex items-center bg-[#102B50] p-4 sm:p-6">
                <div className="w-full rounded-lg overflow-hidden border border-slate-700">
                  <SafeImage
                    src={NMH_IMAGES.coldChainStorage}
                    alt="National Medical Hall interior medicine shelves and counter in Udhampur"
                    className="w-full h-auto object-contain block"
                    fallbackTitle="National Medical Hall Interior"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
