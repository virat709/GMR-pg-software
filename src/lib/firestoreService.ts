import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Property, Tenant, PaymentLog, SecondAdmin } from '../types';
import { initialProperties, initialTenants, initialPayments } from '../mockData';

const PROPERTIES_COLLECTION = 'properties';
const TENANTS_COLLECTION = 'tenants';
const PAYMENTS_COLLECTION = 'payments';
const SECOND_ADMINS_COLLECTION = 'second_admins';

// Subscribe to Properties collection with Fail-Safe Persistence
export function subscribeProperties(callback: (properties: Property[]) => void) {
  try {
    const colRef = collection(db, PROPERTIES_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        const local = JSON.parse(localStorage.getItem('gmr_properties') || '[]');
        callback(local.length > 0 ? local : initialProperties);
      } else {
        const properties: Property[] = snapshot.docs.map((doc) => doc.data() as Property);
        localStorage.setItem('gmr_properties', JSON.stringify(properties));
        callback(properties);
      }
    }, (error) => {
      console.warn('Properties snapshot notice:', error?.message || error);
      const local = JSON.parse(localStorage.getItem('gmr_properties') || '[]');
      callback(local.length > 0 ? local : initialProperties);
    });
  } catch (err) {
    console.warn('Properties subscription error:', err);
    const local = JSON.parse(localStorage.getItem('gmr_properties') || '[]');
    callback(local.length > 0 ? local : initialProperties);
    return () => {};
  }
}

// Subscribe to Tenants collection with Fail-Safe Persistence
export function subscribeTenants(callback: (tenants: Tenant[]) => void) {
  try {
    const colRef = collection(db, TENANTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        const local = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
        callback(local.length > 0 ? local : initialTenants);
      } else {
        const tenants: Tenant[] = snapshot.docs.map((doc) => doc.data() as Tenant);
        localStorage.setItem('gmr_tenants', JSON.stringify(tenants));
        callback(tenants);
      }
    }, (error) => {
      console.warn('Tenants snapshot notice:', error?.message || error);
      const local = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
      callback(local.length > 0 ? local : initialTenants);
    });
  } catch (err) {
    console.warn('Tenants subscription error:', err);
    const local = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
    callback(local.length > 0 ? local : initialTenants);
    return () => {};
  }
}

// Subscribe to Payments collection with Fail-Safe Persistence
export function subscribePayments(callback: (payments: PaymentLog[]) => void) {
  try {
    const colRef = collection(db, PAYMENTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        const local = JSON.parse(localStorage.getItem('gmr_payments') || '[]');
        callback(local.length > 0 ? local : initialPayments);
      } else {
        const payments: PaymentLog[] = snapshot.docs.map((doc) => doc.data() as PaymentLog);
        localStorage.setItem('gmr_payments', JSON.stringify(payments));
        callback(payments);
      }
    }, (error) => {
      console.warn('Payments snapshot notice:', error?.message || error);
      const local = JSON.parse(localStorage.getItem('gmr_payments') || '[]');
      callback(local.length > 0 ? local : initialPayments);
    });
  } catch (err) {
    console.warn('Payments subscription error:', err);
    const local = JSON.parse(localStorage.getItem('gmr_payments') || '[]');
    callback(local.length > 0 ? local : initialPayments);
    return () => {};
  }
}

// Subscribe to Second Admins collection
export function subscribeSecondAdmins(callback: (admins: SecondAdmin[]) => void) {
  try {
    const colRef = collection(db, SECOND_ADMINS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const admins: SecondAdmin[] = snapshot.docs.map((doc) => doc.data() as SecondAdmin);
      localStorage.setItem('gmr_second_admins', JSON.stringify(admins));
      callback(admins);
    }, (error) => {
      console.warn('SecondAdmins snapshot notice:', error?.message || error);
      const local = JSON.parse(localStorage.getItem('gmr_second_admins') || '[]');
      callback(local);
    });
  } catch (err) {
    console.warn('SecondAdmins subscription error:', err);
    const local = JSON.parse(localStorage.getItem('gmr_second_admins') || '[]');
    callback(local);
    return () => {};
  }
}

// Property CRUD
export async function savePropertyInDb(property: Property) {
  try {
    const local: Property[] = JSON.parse(localStorage.getItem('gmr_properties') || '[]');
    const updated = [...local.filter(p => p.id !== property.id), property];
    localStorage.setItem('gmr_properties', JSON.stringify(updated));
  } catch (e) {}

  try {
    await setDoc(doc(db, PROPERTIES_COLLECTION, property.id), property, { merge: true });
  } catch (err) {
    console.warn('Firestore Property save notice:', err);
  }
}

// Tenant CRUD
export async function saveTenantInDb(tenant: Tenant) {
  try {
    const local: Tenant[] = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
    const updated = [...local.filter(t => t.id !== tenant.id), tenant];
    localStorage.setItem('gmr_tenants', JSON.stringify(updated));
  } catch (e) {}

  try {
    await setDoc(doc(db, TENANTS_COLLECTION, tenant.id), tenant, { merge: true });
  } catch (err) {
    console.warn('Firestore Tenant save notice:', err);
  }
}

export async function updateTenantInDb(tenantId: string, updates: Partial<Tenant>) {
  try {
    const local: Tenant[] = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
    const updated = local.map(t => t.id === tenantId ? { ...t, ...updates } : t);
    localStorage.setItem('gmr_tenants', JSON.stringify(updated));
  } catch (e) {}

  try {
    await updateDoc(doc(db, TENANTS_COLLECTION, tenantId), updates);
  } catch (err) {
    console.warn('Firestore Tenant update notice:', err);
  }
}

export async function deleteTenantInDb(tenantId: string) {
  try {
    const local: Tenant[] = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
    const updated = local.filter(t => t.id !== tenantId);
    localStorage.setItem('gmr_tenants', JSON.stringify(updated));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, TENANTS_COLLECTION, tenantId));
  } catch (err) {
    console.warn('Firestore Tenant delete notice:', err);
  }
}

// Payment CRUD
export async function savePaymentInDb(payment: PaymentLog) {
  try {
    const local: PaymentLog[] = JSON.parse(localStorage.getItem('gmr_payments') || '[]');
    const updated = [...local.filter(p => p.id !== payment.id), payment];
    localStorage.setItem('gmr_payments', JSON.stringify(updated));
  } catch (e) {}

  try {
    await setDoc(doc(db, PAYMENTS_COLLECTION, payment.id), payment, { merge: true });
  } catch (err) {
    console.warn('Firestore Payment save notice:', err);
  }
}

// Second Admin CRUD
export async function saveSecondAdminInDb(admin: SecondAdmin) {
  try {
    const local: SecondAdmin[] = JSON.parse(localStorage.getItem('gmr_second_admins') || '[]');
    const updated = [...local.filter(a => a.id !== admin.id), admin];
    localStorage.setItem('gmr_second_admins', JSON.stringify(updated));
  } catch (e) {}

  try {
    await setDoc(doc(db, SECOND_ADMINS_COLLECTION, admin.id), admin, { merge: true });
  } catch (err) {
    console.warn('Firestore Second Admin save notice:', err);
  }
}

export async function deleteSecondAdminInDb(adminId: string) {
  try {
    const local: SecondAdmin[] = JSON.parse(localStorage.getItem('gmr_second_admins') || '[]');
    const updated = local.filter(a => a.id !== adminId);
    localStorage.setItem('gmr_second_admins', JSON.stringify(updated));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, SECOND_ADMINS_COLLECTION, adminId));
  } catch (err) {
    console.warn('Firestore Second Admin delete notice:', err);
  }
}
