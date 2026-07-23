import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { Property, Tenant, PaymentLog } from '../types';
import { initialProperties, initialTenants, initialPayments } from '../mockData';

const PROPERTIES_COLLECTION = 'properties';
const TENANTS_COLLECTION = 'tenants';
const PAYMENTS_COLLECTION = 'payments';

// Clean database to keep ONLY the main original property (GMR Main Branch)
export async function purgeAllDummyData() {
  try {
    // 1. Ensure prop_1 exists
    await setDoc(doc(db, PROPERTIES_COLLECTION, initialProperties[0].id), initialProperties[0], { merge: true });

    // 2. Remove extra dummy properties if present
    const propSnap = await getDocs(collection(db, PROPERTIES_COLLECTION));
    for (const d of propSnap.docs) {
      if (d.id !== 'prop_1') {
        await deleteDoc(doc(db, PROPERTIES_COLLECTION, d.id));
      }
    }

    // 3. Remove dummy tenants (t1..t6) if present
    const dummyTenantIds = ['t1', 't2', 't3', 't4', 't5', 't6'];
    for (const tid of dummyTenantIds) {
      try {
        await deleteDoc(doc(db, TENANTS_COLLECTION, tid));
      } catch (e) {
        // ignore if already deleted
      }
    }

    // 4. Remove dummy payments (pay_1..pay_4) if present
    const dummyPaymentIds = ['pay_1', 'pay_2', 'pay_3', 'pay_4'];
    for (const pid of dummyPaymentIds) {
      try {
        await deleteDoc(doc(db, PAYMENTS_COLLECTION, pid));
      } catch (e) {
        // ignore if already deleted
      }
    }
  } catch (err) {
    console.warn('Firestore purge notice:', err);
  }
}

// Seed initial mock data into Firestore if empty
export async function seedInitialData() {
  try {
    const propSnap = await getDocs(collection(db, PROPERTIES_COLLECTION));
    if (propSnap.empty) {
      for (const prop of initialProperties) {
        await setDoc(doc(db, PROPERTIES_COLLECTION, prop.id), prop);
      }
    }
  } catch (err) {
    console.warn('Firestore seed notice:', err);
  }
}

// Subscribe to Properties collection
export function subscribeProperties(callback: (properties: Property[]) => void) {
  try {
    const colRef = collection(db, PROPERTIES_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        seedInitialData();
        callback(initialProperties);
      } else {
        const properties: Property[] = snapshot.docs.map((doc) => doc.data() as Property);
        callback(properties);
      }
    }, (error) => {
      console.warn('Properties snapshot notice:', error?.message || error);
      callback(initialProperties);
    });
  } catch (err) {
    console.warn('Properties subscription error:', err);
    callback(initialProperties);
    return () => {};
  }
}

// Subscribe to Tenants collection
export function subscribeTenants(callback: (tenants: Tenant[]) => void) {
  try {
    const colRef = collection(db, TENANTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        callback(initialTenants);
      } else {
        const tenants: Tenant[] = snapshot.docs.map((doc) => doc.data() as Tenant);
        callback(tenants);
      }
    }, (error) => {
      console.warn('Tenants snapshot notice:', error?.message || error);
      callback(initialTenants);
    });
  } catch (err) {
    console.warn('Tenants subscription error:', err);
    callback(initialTenants);
    return () => {};
  }
}

// Subscribe to Payments collection
export function subscribePayments(callback: (payments: PaymentLog[]) => void) {
  try {
    const colRef = collection(db, PAYMENTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        callback(initialPayments);
      } else {
        const payments: PaymentLog[] = snapshot.docs.map((doc) => doc.data() as PaymentLog);
        callback(payments);
      }
    }, (error) => {
      console.warn('Payments snapshot notice:', error?.message || error);
      callback(initialPayments);
    });
  } catch (err) {
    console.warn('Payments subscription error:', err);
    callback(initialPayments);
    return () => {};
  }
}

// Property CRUD
export async function savePropertyInDb(property: Property) {
  await setDoc(doc(db, PROPERTIES_COLLECTION, property.id), property, { merge: true });
}

// Tenant CRUD
export async function saveTenantInDb(tenant: Tenant) {
  await setDoc(doc(db, TENANTS_COLLECTION, tenant.id), tenant, { merge: true });
}

export async function updateTenantInDb(tenantId: string, updates: Partial<Tenant>) {
  await updateDoc(doc(db, TENANTS_COLLECTION, tenantId), updates);
}

export async function deleteTenantInDb(tenantId: string) {
  await deleteDoc(doc(db, TENANTS_COLLECTION, tenantId));
}

// Payment CRUD
export async function savePaymentInDb(payment: PaymentLog) {
  await setDoc(doc(db, PAYMENTS_COLLECTION, payment.id), payment, { merge: true });
}
