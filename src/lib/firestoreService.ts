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

// Helper to remove any 'undefined' values before passing object to Firestore
function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean;
}

// Subscribe to Properties collection with Fail-Safe Persistence
export function subscribeProperties(callback: (properties: Property[]) => void) {
  try {
    const colRef = collection(db, PROPERTIES_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const initialized = localStorage.getItem('gmr_properties_initialized');
      if (snapshot.empty && !initialized) {
        localStorage.setItem('gmr_properties_initialized', 'true');
        localStorage.setItem('gmr_properties', JSON.stringify(initialProperties));
        callback(initialProperties);
        initialProperties.forEach((p: Property) => savePropertyInDb(p));
      } else if (snapshot.empty) {
        localStorage.setItem('gmr_properties_initialized', 'true');
        localStorage.setItem('gmr_properties', '[]');
        callback([]);
      } else {
        localStorage.setItem('gmr_properties_initialized', 'true');
        const properties: Property[] = snapshot.docs.map((doc) => doc.data() as Property);
        localStorage.setItem('gmr_properties', JSON.stringify(properties));
        callback(properties);
      }
    }, (error) => {
      console.warn('Properties snapshot notice:', error?.message || error);
      const localStr = localStorage.getItem('gmr_properties');
      const local = localStr !== null ? JSON.parse(localStr) : initialProperties;
      callback(local);
    });
  } catch (err) {
    console.warn('Properties subscription error:', err);
    const localStr = localStorage.getItem('gmr_properties');
    const local = localStr !== null ? JSON.parse(localStr) : initialProperties;
    callback(local);
    return () => {};
  }
}

// Subscribe to Tenants collection with Fail-Safe Persistence
export function subscribeTenants(callback: (tenants: Tenant[]) => void) {
  try {
    const colRef = collection(db, TENANTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const initialized = localStorage.getItem('gmr_tenants_initialized');
      if (snapshot.empty && !initialized) {
        localStorage.setItem('gmr_tenants_initialized', 'true');
        localStorage.setItem('gmr_tenants', JSON.stringify(initialTenants));
        callback(initialTenants);
      } else if (snapshot.empty) {
        localStorage.setItem('gmr_tenants_initialized', 'true');
        localStorage.setItem('gmr_tenants', '[]');
        callback([]);
      } else {
        localStorage.setItem('gmr_tenants_initialized', 'true');
        const tenants: Tenant[] = snapshot.docs.map((doc) => doc.data() as Tenant);
        localStorage.setItem('gmr_tenants', JSON.stringify(tenants));
        callback(tenants);
      }
    }, (error) => {
      console.warn('Tenants snapshot notice:', error?.message || error);
      const localStr = localStorage.getItem('gmr_tenants');
      const local = localStr !== null ? JSON.parse(localStr) : initialTenants;
      callback(local);
    });
  } catch (err) {
    console.warn('Tenants subscription error:', err);
    const localStr = localStorage.getItem('gmr_tenants');
    const local = localStr !== null ? JSON.parse(localStr) : initialTenants;
    callback(local);
    return () => {};
  }
}

// Subscribe to Payments collection with Fail-Safe Persistence
export function subscribePayments(callback: (payments: PaymentLog[]) => void) {
  try {
    const colRef = collection(db, PAYMENTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const initialized = localStorage.getItem('gmr_payments_initialized');
      if (snapshot.empty && !initialized) {
        localStorage.setItem('gmr_payments_initialized', 'true');
        localStorage.setItem('gmr_payments', JSON.stringify(initialPayments));
        callback(initialPayments);
      } else if (snapshot.empty) {
        localStorage.setItem('gmr_payments_initialized', 'true');
        localStorage.setItem('gmr_payments', '[]');
        callback([]);
      } else {
        localStorage.setItem('gmr_payments_initialized', 'true');
        const payments: PaymentLog[] = snapshot.docs.map((doc) => doc.data() as PaymentLog);
        localStorage.setItem('gmr_payments', JSON.stringify(payments));
        callback(payments);
      }
    }, (error) => {
      console.warn('Payments snapshot notice:', error?.message || error);
      const localStr = localStorage.getItem('gmr_payments');
      const local = localStr !== null ? JSON.parse(localStr) : initialPayments;
      callback(local);
    });
  } catch (err) {
    console.warn('Payments subscription error:', err);
    const localStr = localStorage.getItem('gmr_payments');
    const local = localStr !== null ? JSON.parse(localStr) : initialPayments;
    callback(local);
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
    const sanitized = cleanForFirestore(property);
    await setDoc(doc(db, PROPERTIES_COLLECTION, property.id), sanitized, { merge: true });
    console.log('Saved Property to Cloud Firestore:', property.id);
  } catch (err) {
    console.error('Firestore Property save error:', err);
  }
}

export async function deletePropertyInDb(propertyId: string) {
  try {
    const local: Property[] = JSON.parse(localStorage.getItem('gmr_properties') || '[]');
    const updated = local.filter(p => p.id !== propertyId);
    localStorage.setItem('gmr_properties', JSON.stringify(updated));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, PROPERTIES_COLLECTION, propertyId));
    console.log('Deleted Property from Cloud Firestore:', propertyId);
  } catch (err) {
    console.error('Firestore Property delete error:', err);
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
    const sanitized = cleanForFirestore(tenant);
    await setDoc(doc(db, TENANTS_COLLECTION, tenant.id), sanitized, { merge: true });
    console.log('Saved Tenant to Cloud Firestore:', tenant.id);
  } catch (err) {
    console.error('Firestore Tenant save error:', err);
  }
}

export async function updateTenantInDb(tenantId: string, updates: Partial<Tenant>) {
  try {
    const local: Tenant[] = JSON.parse(localStorage.getItem('gmr_tenants') || '[]');
    const updated = local.map(t => t.id === tenantId ? { ...t, ...updates } : t);
    localStorage.setItem('gmr_tenants', JSON.stringify(updated));
  } catch (e) {}

  try {
    const sanitized = cleanForFirestore(updates);
    await updateDoc(doc(db, TENANTS_COLLECTION, tenantId), sanitized);
    console.log('Updated Tenant in Cloud Firestore:', tenantId);
  } catch (err) {
    console.error('Firestore Tenant update error:', err);
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
    console.log('Deleted Tenant from Cloud Firestore:', tenantId);
  } catch (err) {
    console.error('Firestore Tenant delete error:', err);
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
    const sanitized = cleanForFirestore(payment);
    await setDoc(doc(db, PAYMENTS_COLLECTION, payment.id), sanitized, { merge: true });
    console.log('Saved Payment to Cloud Firestore:', payment.id);
  } catch (err) {
    console.error('Firestore Payment save error:', err);
  }
}

export async function deletePaymentInDb(paymentId: string) {
  try {
    const local: PaymentLog[] = JSON.parse(localStorage.getItem('gmr_payments') || '[]');
    const updated = local.filter(p => p.id !== paymentId);
    localStorage.setItem('gmr_payments', JSON.stringify(updated));
  } catch (e) {}

  try {
    await deleteDoc(doc(db, PAYMENTS_COLLECTION, paymentId));
    console.log('Deleted Payment from Cloud Firestore:', paymentId);
  } catch (err) {
    console.error('Firestore Payment delete error:', err);
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
    const sanitized = cleanForFirestore(admin);
    await setDoc(doc(db, SECOND_ADMINS_COLLECTION, admin.id), sanitized, { merge: true });
    console.log('Saved Second Admin to Cloud Firestore:', admin.id);
  } catch (err) {
    console.error('Firestore Second Admin save error:', err);
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
    console.log('Deleted Second Admin from Cloud Firestore:', adminId);
  } catch (err) {
    console.error('Firestore Second Admin delete error:', err);
  }
}

// Test Connection Function
export async function testFirestoreConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const testDocRef = doc(db, 'system_status', 'ping');
    await setDoc(testDocRef, {
      lastPing: new Date().toISOString(),
      status: 'Connected to GMR Co-Living Software',
      projectId: 'gmr-accounts'
    });
    console.log('✅ Firestore Database Ping Successful! Project: gmr-accounts');
    return { success: true };
  } catch (err: any) {
    console.error('❌ Firestore Database Ping Failed:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
