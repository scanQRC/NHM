import {PharmacySettings, PrescriptionRecord, ServiceItem} from '../types/nmh';

export const NMH_IMAGES = {
  logo: '/assets/aistudio/image_12173a4f.png',
  heroInterior: '/assets/aistudio/image_5a4dd366.png',
  pharmacistConsultation: '/assets/aistudio/image_5d0a228c.png',
  coldChainStorage: '/assets/aistudio/image_5d0a228c.png',
  sampleRxOne: '/src/assets/images/sample_rx_indian_one_1794833918445.jpg',
  sampleRxTwo: '/src/assets/images/sample_rx_indian_two_1794833918532.jpg',
};

export const NMH_GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=National+Medical+Hall+Near+Nehru+Memorial+Higher+Secondary+School+Hospital+Road+Udhampur+182101';

export const INITIAL_PHARMACY_SETTINGS: PharmacySettings = {
  pharmacyName: 'National Medical Hall',
  shortCode: 'NMH',
  licenseNumber: 'JK-UDH-NMH-0418',
  phone: '9419294905',
  emergencyPhone: '9419294905',
  email: 'care@nationalmedicalhall.example',
  addressLine1: 'Near Nehru Memorial Higher Secondary School',
  addressLine2: 'Hospital Road',
  cityStateZip: 'Udhampur – 182101, Jammu & Kashmir, India',
  googleMapsSearchUrl: NMH_GOOGLE_MAPS_URL,
  printHeaderNote:
    'National Medical Hall (NMH), Udhampur · Confidential Counter Prescription Record.',
  publicSignupEnabled: false,
  ocrEnabled: false,
  targetBrowsers: 'Windows 10/11 (Edge, Chrome, Firefox) · Android Chrome · Windows 7 Legacy Mode',
};

export const NMH_SERVICES: ServiceItem[] = [
  {
    number: '01',
    title: 'OPD & Hospital Prescription Dispensing',
    summary:
      'Accurate fulfillment of outpatient clinic, specialist, and hospital discharge prescriptions by registered pharmacists.',
    details:
      'Every prescription presented at the National Medical Hall counter undergoes Schedule H/H1 compliance checks, expiry verification, and transparent INR (₹) MRP billing.',
    category: 'Core Medical Store',
    featured: true,
  },
  {
    number: '02',
    title: 'Temperature-Controlled Cold Chain Care',
    summary:
      'Continuous 2°C–8°C medical refrigeration for insulin pens, vaccines, biologics, and ophthalmic drops.',
    details:
      'Calibrated medical chillers and insulated carry packs protect temperature-sensitive medicines from our Hospital Road store safely to your home.',
    category: 'Cold-Chain Storage',
    featured: true,
  },
  {
    number: '03',
    title: 'Pharmacist Guidance & Dosage Clarity',
    summary:
      'Clear counter explanations on medicine timing, meal spacing, inhaler technique, and safe storage at home.',
    details:
      'Patients managing diabetes, hypertension, cardiac, or respiratory care receive clear dosage guidance in plain language with transparent ₹ MRP bills.',
    category: 'Patient Support',
  },
  {
    number: '04',
    title: 'Monthly Chronic Care Refill Support',
    summary:
      'Consistent availability and organized counter record keeping for recurring monthly prescriptions.',
    details:
      'Our team coordinates stock with authorized Indian pharmaceutical distributors so regular patients in Udhampur do not face therapy interruptions.',
    category: 'Continuity of Care',
  },
  {
    number: '05',
    title: 'Surgical Items & Home Healthcare Supplies',
    summary:
      'Sterile dressings, nebulizers, digital BP monitors, glucometers, thermometers, and orthopedic supports.',
    details:
      'Sourced from trusted Indian and global medical brands with sealed pack inspection, warranty guidance, and clear ₹ pricing.',
    category: 'Medical Equipment',
  },
];

export const NMH_OPERATING_HOURS = [
  {day: 'Monday – Saturday', hours: '08:00 AM – 10:30 PM', note: 'Full Pharmacist Counter'},
  {day: 'Sunday', hours: '09:30 AM – 09:00 PM', note: 'Regular & Urgent Dispensing'},
  {day: 'Gazetted Holidays', hours: '10:00 AM – 06:00 PM', note: 'Essential Medicine Desk'},
];

export const INITIAL_PREVIEW_RECORDS: PrescriptionRecord[] = [
  {
    id: 'rec-202611-001',
    recordNumber: 'NMH-2026-1104',
    patientName: 'Ramesh Kumar Dogra',
    phone: '+91 94192-51920',
    doctorName: 'Dr. S. K. Sharma',
    visitDate: '2026-11-15',
    archiveMonth: '2026-11',
    photoUrl: NMH_IMAGES.sampleRxOne,
    photoFilename: 'rx_1104_dogra.jpg',
    notes: 'Monthly OPD renewal filed at main counter. Stored as photo record.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-11-15 10:42',
  },
  {
    id: 'rec-202611-002',
    recordNumber: 'NMH-2026-1103',
    patientName: 'Gurpreet Singh Jamwal',
    phone: '+91 98580-77231',
    doctorName: 'Dr. Meenakshi Raina',
    visitDate: '2026-11-12',
    archiveMonth: '2026-11',
    photoUrl: NMH_IMAGES.sampleRxTwo,
    photoFilename: 'rx_1103_jamwal.jpg',
    notes: 'Outpatient consultation slip photographed for monthly register.',
    loggedBy: 'Dispensary Desk B',
    createdAt: '2026-11-12 16:18',
  },
  {
    id: 'rec-202611-003',
    recordNumber: 'NMH-2026-1102',
    patientName: 'Shahnaz Begum',
    phone: '+91 99061-38411',
    doctorName: 'Dr. V. K. Gupta',
    visitDate: '2026-11-08',
    archiveMonth: '2026-11',
    photoUrl: NMH_IMAGES.sampleRxOne,
    photoFilename: 'rx_1102_shahnaz.jpg',
    notes: 'Cold-chain pickup logged with patient mobile number.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-11-08 11:05',
  },
  {
    id: 'rec-202610-001',
    recordNumber: 'NMH-2026-1028',
    patientName: 'Subhash Chander Verma',
    phone: '+91 94191-65024',
    doctorName: 'Dr. Ritu Mahajan',
    visitDate: '2026-10-28',
    archiveMonth: '2026-10',
    photoUrl: NMH_IMAGES.sampleRxTwo,
    photoFilename: 'rx_1028_verma.jpg',
    notes: 'Hospital discharge prescription archived for October folder.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-10-28 18:30',
  },
  {
    id: 'rec-202610-002',
    recordNumber: 'NMH-2026-1019',
    patientName: 'Sunita Devi',
    phone: '+91 97975-90432',
    doctorName: 'Dr. S. K. Sharma',
    visitDate: '2026-10-19',
    archiveMonth: '2026-10',
    photoUrl: NMH_IMAGES.sampleRxOne,
    photoFilename: 'rx_1019_sunita.jpg',
    notes: 'Follow-up OPD slip photographed at counter.',
    loggedBy: 'Dispensary Desk A',
    createdAt: '2026-10-19 14:22',
  },
  {
    id: 'rec-202609-001',
    recordNumber: 'NMH-2026-0924',
    patientName: 'Mohd. Yousuf Wani',
    phone: '+91 94193-21984',
    doctorName: 'Dr. R. K. Katoch',
    visitDate: '2026-09-24',
    archiveMonth: '2026-09',
    photoUrl: NMH_IMAGES.sampleRxTwo,
    photoFilename: 'rx_0924_wani.jpg',
    notes: 'September outpatient record archived as photo.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-09-24 09:50',
  },
];

export function formatArchiveMonthLabel(archiveMonth: string): string {
  const [year, month] = archiveMonth.split('-');
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const idx = Number(month) - 1;
  if (!year || idx < 0 || idx > 11 || Number.isNaN(idx)) {
    return archiveMonth;
  }
  return `${monthNames[idx]} ${year}`;
}
