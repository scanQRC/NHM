export type PublicRoute = 'home' | 'about' | 'services' | 'contact' | 'location';

export type AdminSection =
  | 'dashboard'
  | 'archive'
  | 'search'
  | 'monthly'
  | 'print'
  | 'backup'
  | 'settings';

export type AppView =
  | {area: 'public'; page: PublicRoute}
  | {area: 'admin-login'}
  | {area: 'admin'; section: AdminSection};

export interface PrescriptionRecord {
  id: string;
  recordNumber: string;
  patientName: string;
  phone: string;
  doctorName: string;
  visitDate: string; // YYYY-MM-DD
  archiveMonth: string; // YYYY-MM
  photoUrl: string;
  photoFilename: string;
  notes: string;
  loggedBy: string;
  createdAt: string;
}

export interface PharmacySettings {
  pharmacyName: string;
  shortCode: string;
  licenseNumber: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  cityStateZip: string;
  googleMapsSearchUrl: string;
  printHeaderNote: string;
  publicSignupEnabled: false;
  ocrEnabled: false;
  targetBrowsers: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  summary: string;
  details: string;
  category: string;
  featured?: boolean;
}
