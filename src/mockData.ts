import { Tenant, PaymentLog, Property } from './types';

export const initialProperties: Property[] = [
  {
    id: 'prop_1',
    name: 'GMR Main Branch',
    code: 'MAIN',
    address: 'Plot 42, Hitech City Main Rd, Madhapur',
    city: 'Hyderabad',
    totalRooms: 10,
    totalFloors: 4,
    contactNumber: '+91 99515 13796',
    type: 'Co-Living',
  }
];

export const initialTenants: Tenant[] = [];

export const initialPayments: PaymentLog[] = [];
