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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <div className="text-xs font-medium text-[#1769D2]">Services</div>
            <h1
              className="font-display text-2xl sm:text-4xl font-bold text-[#102B50] tracking-tight"
              style={{textWrap: 'balance'}}
            >
              Comprehensive pharmacy dispensing and clinical support.
            </h1>
            <p className="text-[15px] sm:text-lg text-slate-600 leading-relaxed">
              Every service at National Medical Hall is delivered in person by trained pharmacy staff
              with strict attention to cold-chain safety, dosage clarity, and verified sourcing.
            </p>
          </div>
        </div>
      </section>

      {/* Balanced Responsive Bento Grid */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-7">
            {NMH_SERVICES.map((service, index) => {
              const spanClasses =
                index < 2
                  ? 'md:col-span-1 lg:col-span-3'
                  : index === 4
                    ? 'md:col-span-2 lg:col-span-2'
                    : 'md:col-span-1 lg:col-span-2';
              return (
                <article
                  key={service.number}
                  className={`bg-white border border-slate-200 rounded-xl p-5 sm:p-7 flex flex-col justify-between h-full shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${spanClasses}`}
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-tabular font-semibold text-[#12A66A]">
                        {service.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{service.category}</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B50]">
                      {service.title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {service.summary}
                    </p>
                  </div>

                  <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100">
                    <p className="text-sm text-slate-500 leading-relaxed">{service.details}</p>
                  </div>
                </article>
              );
            })}

            {/* Visual Spotlight Block */}
            <div className="md:col-span-2 lg:col-span-6 grid grid-cols-1 lg:grid-cols-12 items-center bg-[#102B50] text-white rounded-xl overflow-hidden border border-slate-800 shadow-sm">
              <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-center space-y-3.5 sm:space-y-4">
                <div className="text-xs font-medium text-[#12A66A]">Counter Prescription Workflow</div>
                <h2 className="font-display text-xl sm:text-3xl font-bold tracking-tight">
                  Bring your physical prescription directly to our Hospital Road counter.
                </h2>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
                  Our pharmacists review original clinician prescriptions at the counter, verify
                  batch dates, and provide clear administration instructions before billing.
                </p>
                <div className="pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('location');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#102B50] bg-white hover:bg-slate-100 rounded-lg transition-colors min-h-[46px] sm:min-h-[44px] whitespace-nowrap cursor-pointer"
                  >
                    <span>See Store Location &amp; Directions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 flex items-center bg-[#102B50] px-5 pb-5 pt-0 sm:px-8 sm:pb-8 sm:pt-0 lg:p-6 lg:pr-8">
                <div className="w-full rounded-lg overflow-hidden border border-slate-700/80 shadow-xs">
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
