import {PharmacySettings, PrescriptionRecord, ServiceItem} from '../types/nmh';

export const NMH_IMAGES = {
  heroInterior: '/src/assets/images/hero_pharmacy_interior_1794831789177.jpg',
  pharmacistConsultation: '/src/assets/images/about_pharmacist_consultation_1794831790366.jpg',
  coldChainStorage: '/src/assets/images/service_cold_chain_storage_1794831791569.jpg',
  sampleRxOne: '/src/assets/images/sample_rx_record_one_1794831791514.jpg',
  sampleRxTwo: '/src/assets/images/sample_rx_record_two_1794831791099.jpg',
};

export const INITIAL_PHARMACY_SETTINGS: PharmacySettings = {
  pharmacyName: 'National Medical Hall',
  shortCode: 'NMH',
  licenseNumber: 'DL-NMH-2026-0418',
  phone: '+91 (011) 2468-3910',
  emergencyPhone: '+91 98100-44290',
  email: 'care@nationalmedicalhall.example',
  addressLine1: '18 Station Road, Civil Lines',
  addressLine2: 'Opposite District Hospital Main Gate',
  cityStateZip: 'New Delhi 110054',
  printHeaderNote: 'Confidential Pharmacy Dispensing Record — Keep securely for reference.',
  publicSignupEnabled: false,
  ocrEnabled: false,
  targetBrowsers: 'Windows 10/11 (Edge, Chrome, Firefox) · Android Chrome · Windows 7 Legacy Mode',
};

export const NMH_SERVICES: ServiceItem[] = [
  {
    number: '01',
    title: 'Prescription Dispensing & Verification',
    summary:
      'Accurate fulfillment of outpatient, specialist, and hospital discharge prescriptions by registered pharmacists.',
    details:
      'Every prescription presented at our counter undergoes two-stage pharmacist verification for dosage clarity, expiry checks, and batch traceability before handover.',
    category: 'Core Dispensary',
    featured: true,
  },
  {
    number: '02',
    title: 'Temperature-Controlled Cold Chain Care',
    summary:
      'Continuous 2°C–8°C medical refrigeration for insulin, biologics, vaccines, and ophthalmic formulations.',
    details:
      'Calibrated medical-grade chillers with continuous logging and insulated transport packs keep temperature-sensitive therapies stable from shelf to home.',
    category: 'Cold-Chain Storage',
    featured: true,
  },
  {
    number: '03',
    title: 'Pharmacist Counseling & Regimen Guidance',
    summary:
      'Private counter consultations covering timing, food interactions, inhaler technique, and storage care.',
    details:
      'Patients managing chronic cardiac, endocrine, or respiratory regimens receive clear printed schedules and direct guidance from senior dispensary staff.',
    category: 'Patient Support',
  },
  {
    number: '04',
    title: 'Chronic Care & Monthly Refill Coordination',
    summary:
      'Organized follow-up scheduling and physical prescription record keeping for recurring monthly therapies.',
    details:
      'Our staff maintains structured monthly records so regular patients experience zero supply interruption when renewing long-term prescriptions.',
    category: 'Continuity of Care',
  },
  {
    number: '05',
    title: 'Surgical Consumables & Home Care Supplies',
    summary:
      'Sterile dressings, nebulizers, blood pressure monitors, glucometers, and orthopedic supports.',
    details:
      'Sourced directly from authorized clinical manufacturers with sealed packaging verification and live device demonstration at pickup.',
    category: 'Medical Equipment',
  },
];

export const NMH_OPERATING_HOURS = [
  {day: 'Monday – Saturday', hours: '08:00 AM – 10:30 PM', note: 'Full Pharmacist Counter'},
  {day: 'Sunday', hours: '09:30 AM – 09:00 PM', note: 'Regular & Urgent Dispensing'},
  {day: 'Public Holidays', hours: '10:00 AM – 06:00 PM', note: 'Essential Prescription Desk'},
];

export const INITIAL_PREVIEW_RECORDS: PrescriptionRecord[] = [
  {
    id: 'rec-202611-001',
    recordNumber: 'NMH-2026-1104',
    patientName: 'Rajeshwari Kulkarni',
    phone: '98204-51920',
    doctorName: 'Dr. A. K. Sengupta',
    visitDate: '2026-11-15',
    archiveMonth: '2026-11',
    photoUrl: NMH_IMAGES.sampleRxOne,
    photoFilename: 'rx_1104_kulkarni.jpg',
    notes: 'Monthly renewal prescription filed at Counter 1. Stored as photo record.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-11-15 10:42',
  },
  {
    id: 'rec-202611-002',
    recordNumber: 'NMH-2026-1103',
    patientName: 'Harpreet Singh Gill',
    phone: '98114-77231',
    doctorName: 'Dr. Meenakshi Iyer',
    visitDate: '2026-11-12',
    archiveMonth: '2026-11',
    photoUrl: NMH_IMAGES.sampleRxTwo,
    photoFilename: 'rx_1103_gill.jpg',
    notes: 'Outpatient clinic slip verified and photographed for monthly archive.',
    loggedBy: 'Dispensary Desk B',
    createdAt: '2026-11-12 16:18',
  },
  {
    id: 'rec-202611-003',
    recordNumber: 'NMH-2026-1102',
    patientName: 'Farida Begum Ansari',
    phone: '99102-38411',
    doctorName: 'Dr. V. Narayanan',
    visitDate: '2026-11-08',
    archiveMonth: '2026-11',
    photoUrl: NMH_IMAGES.sampleRxOne,
    photoFilename: 'rx_1102_ansari.jpg',
    notes: 'Cold-chain pickup documented with patient contact.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-11-08 11:05',
  },
  {
    id: 'rec-202610-001',
    recordNumber: 'NMH-2026-1028',
    patientName: 'Subhash Chandra Verma',
    phone: '98710-65024',
    doctorName: 'Dr. Ritu Deshmukh',
    visitDate: '2026-10-28',
    archiveMonth: '2026-10',
    photoUrl: NMH_IMAGES.sampleRxTwo,
    photoFilename: 'rx_1028_verma.jpg',
    notes: 'Hospital discharge prescription archived for October register.',
    loggedBy: 'Chief Pharmacist (Admin)',
    createdAt: '2026-10-28 18:30',
  },
  {
    id: 'rec-202610-002',
    recordNumber: 'NMH-2026-1019',
    patientName: 'Anita Sharma',
    phone: '98185-90432',
    doctorName: 'Dr. A. K. Sengupta',
    visitDate: '2026-10-19',
    archiveMonth: '2026-10',
    photoUrl: NMH_IMAGES.sampleRxOne,
    photoFilename: 'rx_1019_sharma.jpg',
    notes: 'Follow-up consultation slip photographed at dispensing desk.',
    loggedBy: 'Dispensary Desk A',
    createdAt: '2026-10-19 14:22',
  },
  {
    id: 'rec-202609-001',
    recordNumber: 'NMH-2026-0924',
    patientName: 'Mohd. Tariq Siddiqui',
    phone: '97170-21984',
    doctorName: 'Dr. S. P. Malhotra',
    visitDate: '2026-09-24',
    archiveMonth: '2026-09',
    photoUrl: NMH_IMAGES.sampleRxTwo,
    photoFilename: 'rx_0924_siddiqui.jpg',
    notes: 'September outpatient record archived cleanly without modification.',
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
