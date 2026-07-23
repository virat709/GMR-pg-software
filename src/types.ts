export type IDType = 'Aadhaar' | 'PAN' | 'Passport' | 'Driving License' | 'Other';

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  roomNumber: string;
  rentAmount: number;
  securityDeposit: number; // Represents Advance
  presentPaid: number;      // Paid amount at entry
  idType: IDType;
  idNumber: string;
  checkInDate: string;      // Date of Joining
  checkOutDate: string | null;
  status: 'Active' | 'CheckedOut';
  
  // Custom GMR PG Admission details
  fatherName: string;
  age: number;
  dob: string;
  educationalQualification: string;
  employment: string;
  officeAddress: string;
  permanentAddress: string;
  familyContactNumber: string;
  aadharNo: string;
  panNo: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Net Banking';

export interface PaymentLog {
  id: string;
  tenantId: string;
  amount: number;
  billingMonth: string; // "YYYY-MM" format, e.g., "2026-07"
  paymentDate: string;  // "YYYY-MM-DD"
  paymentMode: PaymentMode;
  referenceId: string;  // Transaction ID or Cash Receipt ID
  notes?: string;
}

export type AnnouncementCategory = 'Urgent' | 'Maintenance' | 'General' | 'Security';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  sentDate: string; // ISO string or "YYYY-MM-DD HH:mm"
  roomsTargeted: 'All' | string;
}

export interface BillingAlert {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  rentAmount: number;
  billingMonth: string; // "YYYY-MM"
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string; // "YYYY-MM-DD"
}
