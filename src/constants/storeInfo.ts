import {PharmacySettings, ServiceItem} from '../types/nmh';

export const NMH_IMAGES = {
  heroInterior: '/assets/aistudio/image_5a4dd366.png',
  pharmacistConsultation: '/assets/aistudio/image_5d0a228c.png',
  coldChainStorage: '/assets/aistudio/image_5d0a228c.png',
} as const;

export const NMH_OPERATING_HOURS = [
  {
    day: 'Monday – Saturday',
    hours: '8:30 AM – 9:30 PM',
    note: 'Full Counter & Cold-Chain Service',
  },
  {
    day: 'Sunday',
    hours: '9:30 AM – 8:00 PM',
    note: 'Essential & OPD Prescription Counter',
  },
  {
    day: 'Emergency Support',
    hours: 'Call 9419294905',
    note: 'Direct Store Phone Desk',
  },
] as const;

export const NMH_SERVICES: ServiceItem[] = [
  {
    number: '01',
    title: 'OPD & Hospital Prescription Dispensing',
    category: 'Prescription Care',
    summary:
      'Accurate dispensing of specialist, general physician, and hospital discharge prescriptions with verified batch numbers and clear dosage instructions.',
    details:
      'Every prescription brought to our Hospital Road counter is checked by trained staff for strength, schedule, and expiry prior to billing.',
    featured: true,
  },
  {
    number: '02',
    title: '2°C–8°C Cold-Chain & Insulin Storage',
    category: 'Temperature Controlled',
    summary:
      'Dedicated medical refrigeration for insulin pens, vaccines, biologics, hormone preparations, and sensitive ophthalmic drops.',
    details:
      'Maintained continuously between 2°C and 8°C with insulated ice-pack handover pouches available for safe home transport across Udhampur.',
  },
  {
    number: '03',
    title: 'Surgical Consumables & Wound Dressing',
    category: 'Clinical Supplies',
    summary:
      'Sterile dressings, IV sets, catheters, orthopedic supports, glucometers, BP monitors, and home-nursing recovery essentials.',
    details:
      'Sourced from authorized Indian and international medical manufacturers with transparent MRP (₹) billing.',
  },
  {
    number: '04',
    title: 'Chronic Therapy & Monthly Refill Guidance',
    category: 'Ongoing Care',
    summary:
      'Reliable monthly stock continuity for cardiac, diabetic, thyroid, respiratory, and geriatric maintenance prescriptions.',
    details:
      'Patients and caregivers can call ahead at 9419294905 to confirm brand availability before visiting the store.',
  },
  {
    number: '05',
    title: 'Private Dispensary Photo Archival',
    category: 'Internal Compliance',
    summary:
      'Physical prescriptions submitted at the counter are securely archived by authorized staff in our private dispensary system without third-party OCR.',
    details:
      'Stored strictly as protected photo records for authorized pharmacy administration and audit traceability.',
    featured: true,
  },
];

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
  googleMapsSearchUrl:
    'https://www.google.com/maps/search/?api=1&query=National+Medical+Hall+Near+Nehru+Memorial+Higher+Secondary+School+Hospital+Road+Udhampur+182101',
  printHeaderNote:
    'National Medical Hall (NMH), Udhampur · Confidential Counter Prescription Record.',
  publicSignupEnabled: false,
  ocrEnabled: false,
  targetBrowsers: 'Windows 10/11 (Edge, Chrome, Firefox) · Android Chrome · Windows 7 Legacy Mode',
};
