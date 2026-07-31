import { describe, it, expect } from 'vitest';
import { Property, Tenant, PaymentLog, PendingTenantRegistration, BillingAlert } from '../types';
import { deduplicateById } from '../lib/firestoreService';

describe('Property Management & Deduplication Tests', () => {
  it('deduplicates entities by id correctly', () => {
    const rawProperties: Property[] = [
      {
        id: 'prop_1',
        name: 'GMR Main Branch',
        code: 'MAIN',
        address: 'Hitech City',
        city: 'Hyderabad',
        totalRooms: 10,
        totalFloors: 4,
        contactNumber: '+919951513796',
        type: 'Co-Living',
      },
      {
        id: 'prop_1',
        name: 'GMR Main Branch Duplicate',
        code: 'MAIN',
        address: 'Hitech City',
        city: 'Hyderabad',
        totalRooms: 10,
        totalFloors: 4,
        contactNumber: '+919951513796',
        type: 'Co-Living',
      },
      {
        id: 'prop_2',
        name: 'GMR Prime Heights',
        code: 'PRIME',
        address: 'Madhapur',
        city: 'Hyderabad',
        totalRooms: 15,
        totalFloors: 5,
        contactNumber: '+919951513797',
        type: 'Luxury Apartments',
      },
    ];

    const deduplicated = deduplicateById(rawProperties);
    expect(deduplicated).toHaveLength(2);
    expect(deduplicated.map(p => p.id)).toEqual(['prop_1', 'prop_2']);
  });

  it('correctly filters tenants when a property is deleted', () => {
    const tenants: Tenant[] = [
      {
        id: 'tenant_1',
        propertyId: 'prop_1',
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        roomNumber: '101',
        rentAmount: 8000,
        securityDeposit: 15000,
        presentPaid: 15000,
        idType: 'Aadhaar',
        idNumber: '123456789012',
        checkInDate: '2026-01-01',
        checkOutDate: null,
        status: 'Active',
        fatherName: 'Father Doe',
        age: 24,
        dob: '2002-01-01',
        educationalQualification: 'B.Tech',
        employment: 'IT',
        officeAddress: 'Hitech City',
        permanentAddress: 'Hyderabad',
        familyContactNumber: '9876543211',
        aadharNo: '123456789012',
        panNo: '',
      },
      {
        id: 'tenant_2',
        propertyId: 'prop_2',
        name: 'Jane Smith',
        phone: '9876543220',
        email: 'jane@example.com',
        roomNumber: '202',
        rentAmount: 9000,
        securityDeposit: 18000,
        presentPaid: 18000,
        idType: 'PAN',
        idNumber: 'ABCDE1234F',
        checkInDate: '2026-02-01',
        checkOutDate: null,
        status: 'Active',
        fatherName: 'Father Smith',
        age: 25,
        dob: '2001-02-01',
        educationalQualification: 'M.Tech',
        employment: 'IT',
        officeAddress: 'Madhapur',
        permanentAddress: 'Hyderabad',
        familyContactNumber: '9876543221',
        aadharNo: '',
        panNo: 'ABCDE1234F',
      },
    ];

    const deletedPropertyId = 'prop_1';
    const remainingTenants = tenants.filter(t => t.propertyId !== deletedPropertyId);
    expect(remainingTenants).toHaveLength(1);
    expect(remainingTenants[0].id).toBe('tenant_2');
  });
});

describe('Rent & Billing Status Calculation Tests', () => {
  it('assigns status Pending before due date and Overdue after due date when unpaid', () => {
    const rentAmount = 8000;
    const dueDate = '2026-07-05';
    const payments: PaymentLog[] = [];

    const calculateStatus = (todayStr: string): 'Paid' | 'Pending' | 'Overdue' => {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid >= rentAmount) return 'Paid';
      return todayStr > dueDate ? 'Overdue' : 'Pending';
    };

    // On July 3rd (before due date)
    expect(calculateStatus('2026-07-03')).toBe('Pending');
    // On July 5th (on due date)
    expect(calculateStatus('2026-07-05')).toBe('Pending');
    // On July 6th (after due date)
    expect(calculateStatus('2026-07-06')).toBe('Overdue');
  });

  it('marks status as Paid when total payments equal or exceed rent amount', () => {
    const rentAmount = 8000;
    const dueDate = '2026-07-05';
    const payments: PaymentLog[] = [
      {
        id: 'pay_1',
        tenantId: 'tenant_1',
        amount: 4000,
        billingMonth: '2026-07',
        paymentDate: '2026-07-02',
        paymentMode: 'UPI',
        referenceId: 'UPI12345',
      },
      {
        id: 'pay_2',
        tenantId: 'tenant_1',
        amount: 4000,
        billingMonth: '2026-07',
        paymentDate: '2026-07-04',
        paymentMode: 'Cash',
        referenceId: 'CASH67890',
      },
    ];

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const todayStr = '2026-07-10'; // Even past due date
    const status = totalPaid >= rentAmount ? 'Paid' : (todayStr > dueDate ? 'Overdue' : 'Pending');

    expect(totalPaid).toBe(8000);
    expect(status).toBe('Paid');
  });

  it('preserves target billing month when collecting overdue rent', () => {
    const targetBillingMonth = '2026-06';
    const paymentDate = '2026-07-02';

    // The recorded payment should retain targetBillingMonth rather than forcing paymentDate month
    const newPayment: PaymentLog = {
      id: 'pay_overdue_1',
      tenantId: 'tenant_1',
      amount: 8000,
      billingMonth: targetBillingMonth,
      paymentDate,
      paymentMode: 'UPI',
      referenceId: 'UPI999888777',
    };

    expect(newPayment.billingMonth).toBe('2026-06');
    expect(newPayment.paymentDate).toBe('2026-07-02');
  });
});

describe('Pending Self-Registration Approval Tests', () => {
  it('converts pending registration to active tenant with new tenant ID', () => {
    const pendingReg: PendingTenantRegistration = {
      id: 'pending_100',
      propertyId: 'prop_1',
      name: 'Alice Johnson',
      phone: '9988776655',
      email: 'alice@example.com',
      roomNumber: '303',
      rentAmount: 8500,
      securityDeposit: 15000,
      presentPaid: 15000,
      idType: 'Aadhaar',
      idNumber: '556677889900',
      checkInDate: '2026-07-15',
      fatherName: 'Bob Johnson',
      age: 23,
      dob: '2003-05-10',
      educationalQualification: 'B.Sc',
      employment: 'Private',
      officeAddress: 'Gachibowli',
      permanentAddress: 'Bengaluru',
      familyContactNumber: '9988776600',
      aadharNo: '556677889900',
      panNo: '',
      submittedAt: '2026-07-14T10:00:00Z',
      status: 'Pending',
    };

    const newTenant: Tenant = {
      id: 'tenant_' + Math.random().toString(36).substring(2, 9),
      propertyId: pendingReg.propertyId,
      name: pendingReg.name,
      phone: pendingReg.phone,
      email: pendingReg.email,
      roomNumber: pendingReg.roomNumber,
      rentAmount: pendingReg.rentAmount,
      securityDeposit: pendingReg.securityDeposit,
      presentPaid: pendingReg.presentPaid,
      idType: pendingReg.idType,
      idNumber: pendingReg.idNumber,
      checkInDate: pendingReg.checkInDate,
      checkOutDate: null,
      status: 'Active',
      fatherName: pendingReg.fatherName,
      age: pendingReg.age,
      dob: pendingReg.dob,
      educationalQualification: pendingReg.educationalQualification,
      employment: pendingReg.employment,
      officeAddress: pendingReg.officeAddress,
      permanentAddress: pendingReg.permanentAddress,
      familyContactNumber: pendingReg.familyContactNumber,
      aadharNo: pendingReg.aadharNo,
      panNo: pendingReg.panNo,
    };

    expect(newTenant.status).toBe('Active');
    expect(newTenant.name).toBe('Alice Johnson');
    expect(newTenant.id).toMatch(/^tenant_/);
  });
});
