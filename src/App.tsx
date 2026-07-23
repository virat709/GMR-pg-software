/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  IndianRupee, 
  Building, 
  Bell, 
  CheckCircle, 
  Menu, 
  X,
  Sun,
  Moon,
  Building2,
  Lock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { Tenant, PaymentLog, BillingAlert, Property, UserRole } from './types';
import { initialTenants, initialPayments, initialProperties } from './mockData';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import {
  subscribeProperties,
  subscribeTenants,
  subscribePayments,
  savePropertyInDb,
  saveTenantInDb,
  updateTenantInDb,
  savePaymentInDb,
  purgeAllDummyData
} from './lib/firestoreService';

// Component imports
import DashboardOverview from './components/DashboardOverview';
import TenantDirectory from './components/TenantDirectory';
import BillingManager from './components/BillingManager';
import PinLockModal from './components/PinLockModal';

export default function App() {
  // Security PIN Lock State & Role Access
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('gmr_unlocked') === 'true';
  });
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return (sessionStorage.getItem('gmr_user_role') as UserRole) || null;
  });
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);

  const handleUnlock = (role: UserRole) => {
    setIsUnlocked(true);
    setUserRole(role);
    sessionStorage.setItem('gmr_unlocked', 'true');
    sessionStorage.setItem('gmr_user_role', role);
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setUserRole(null);
    sessionStorage.removeItem('gmr_unlocked');
    sessionStorage.removeItem('gmr_user_role');
    showToast('Portal locked! Enter security PIN to unlock.', 'info');
  };
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'billing'>('dashboard');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gmr_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('gmr_theme', theme);
  }, [theme]);
  
  // Mobile sidebar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data States
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Firebase Auth listener (silent fallback if anonymous sign-in is disabled in project console)
  const [_authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setAuthUser(currentUser);
      } else {
        try {
          const userCred = await signInAnonymously(auth);
          setAuthUser(userCred.user);
        } catch {
          // Anonymous auth not enabled in Firebase Console; proceeding with database access
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to Cloud Firestore database on mount
  useEffect(() => {
    // Purge dummy data so only main branch property remains
    purgeAllDummyData();

    const unsubProp = subscribeProperties((data) => setProperties(data));
    const unsubTenant = subscribeTenants((data) => setTenants(data));
    const unsubPay = subscribePayments((data) => setPayments(data));

    return () => {
      unsubProp();
      unsubTenant();
      unsubPay();
    };
  }, []);

  // Toast Trigger Helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Property Handlers
  const handleAddProperty = async (newPropData: Omit<Property, 'id'>) => {
    const newProperty: Property = {
      ...newPropData,
      id: 'prop_' + Math.random().toString(36).substring(2, 9),
    };
    await savePropertyInDb(newProperty);
    showToast(`Registered PG Branch "${newProperty.name}" in Database!`, 'success');
  };

  // Tenant Handlers
  const handleAddTenant = async (newTenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...newTenantData,
      id: 'tenant_' + Math.random().toString(36).substring(2, 9),
    };
    await saveTenantInDb(newTenant);
    showToast(`Resident ${newTenant.name} registered in Database!`, 'success');
  };

  const handleEditTenant = async (updatedTenant: Tenant) => {
    await saveTenantInDb(updatedTenant);
    showToast(`Resident ${updatedTenant.name}'s profile updated in Database!`, 'success');
  };

  const handleCheckOutTenant = async (tenantId: string) => {
    const tenantName = tenants.find(t => t.id === tenantId)?.name || 'Resident';
    const checkOutDate = new Date().toISOString().split('T')[0];
    await updateTenantInDb(tenantId, { status: 'CheckedOut', checkOutDate });
    showToast(`Resident ${tenantName} checked out! Database updated.`, 'info');
  };

  // Payment Handlers
  const handleAddPayment = async (newPaymentData: Omit<PaymentLog, 'id'>) => {
    const newPayment: PaymentLog = {
      ...newPaymentData,
      id: 'pay_' + Math.random().toString(36).substring(2, 9),
    };
    await savePaymentInDb(newPayment);
    
    // Get tenant name for toast
    const name = tenants.find(t => t.id === newPaymentData.tenantId)?.name || 'Resident';
    showToast(`Collected ₹${newPayment.amount} from ${name}! Saved to Cloud Database.`, 'success');
  };

  // Send Custom Billing Alert
  const handleSendBillingAlert = (alert: BillingAlert) => {
    showToast(`Sent monthly billing alert push notification to ${alert.tenantName}'s device successfully!`, 'success');
  };

  // Dynamically calculate Billing Alerts based on active tenants for July 2026 ('2026-07')
  const currentMonth = '2026-07';
  const billingAlerts: BillingAlert[] = tenants
    .filter(t => t.status === 'Active')
    .map(tenant => {
      const hasPaid = payments.some(p => p.tenantId === tenant.id && p.billingMonth === currentMonth);
      const dueDate = '2026-07-05';
      const status = hasPaid ? 'Paid' : 'Overdue';
      
      return {
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        tenantName: tenant.name,
        roomNumber: tenant.roomNumber,
        rentAmount: tenant.rentAmount,
        billingMonth: currentMonth,
        status,
        dueDate
      };
    });

  // Sidebar navigation options
  const navItems = [
    { id: 'dashboard' as const, label: 'Properties Overview', icon: LayoutDashboard },
    { id: 'tenants' as const, label: 'Residents Directory', icon: Users },
    { id: 'billing' as const, label: 'Billing & Receipts', icon: IndianRupee },
  ];

  const handleSelectTenantFromDashboard = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setActiveTab('tenants');
  };

  return (
    <div className={`h-screen w-full font-sans flex flex-col md:flex-row overflow-hidden relative transition-colors duration-300 theme-${theme}`}>
      
      {/* SECURITY PIN LOCK SYSTEM OVERLAY & PIN MODAL */}
      <PinLockModal 
        isUnlocked={isUnlocked}
        userRole={userRole}
        onUnlock={handleUnlock}
        onLock={handleLock}
        showChangePinModal={showChangePinModal}
        onCloseChangePinModal={() => setShowChangePinModal(false)}
        showToast={showToast}
      />

      {/* Toast Overlay Notice Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto print:hidden"
            id="toast-notification-overlay"
          >
            <div className="px-5 py-3 rounded-xl border shadow-lg flex items-center gap-2 text-sm font-semibold whitespace-nowrap bg-emerald-50 text-emerald-800 border-emerald-200">
              {toastType === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: Desktop Layout (Hidden on printing) */}
      <aside className="hidden md:flex flex-col w-64 h-full overflow-y-auto bg-neutral-900 text-neutral-300 border-r border-neutral-800 shrink-0 select-none print:hidden" id="desktop-sidebar">
        {/* Branding header */}
        <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm p-1 shrink-0">
            <svg viewBox="0 0 100 100" className="w-8 h-8 text-[#16a34a]" fill="currentColor">
              <path d="M50,15 C47,30 47,45 50,60 C53,45 53,30 50,15 Z" fill="currentColor" />
              <path d="M50,20 C42,32 40,46 45,58 C49,48 49,34 50,20 Z" fill="currentColor" />
              <path d="M50,20 C58,32 60,46 55,58 C51,48 51,34 50,20 Z" fill="currentColor" />
              <path d="M50,25 C34,35 32,50 40,62 C45,52 47,40 50,25 Z" fill="currentColor" />
              <path d="M50,25 C66,35 68,50 60,62 C55,52 53,40 50,25 Z" fill="currentColor" />
              <path d="M50,33 C26,42 25,58 35,66 C40,58 44,48 50,33 Z" fill="currentColor" />
              <path d="M50,33 C74,42 75,58 65,66 C60,58 56,48 50,33 Z" fill="currentColor" />
              <path d="M22,70 C40,55 60,80 78,65 C60,74 40,60 22,70 Z" fill="currentColor" />
              <path d="M18,78 C38,62 62,88 82,72 C62,81 38,67 18,78 Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-sm tracking-wide">GMR</h1>
              <span className="bg-[#e6df15] text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded-sm select-none">PG</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">Multi-Property System</p>
          </div>
        </div>

        {/* Active Role Access Badge */}
        <div className="px-4 py-2.5 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Access Mode</span>
          {userRole === 'super_admin' ? (
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1" title="Super Access: Full system control">
              <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Super Access</span>
            </span>
          ) : (
            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-300 font-extrabold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1" title="Manager Access: Limited operational mode">
              <UserCheck className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Limited Manager</span>
            </span>
          )}
        </div>

        {/* Property Switcher in Sidebar */}
        <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/40">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>Active Branch</span>
          </label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full bg-neutral-800 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500 cursor-pointer"
          >
            <option value="all">🏢 All Properties ({properties.length})</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                🏢 {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'tenants') setSelectedTenantId(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
                id={isActive ? `nav-tab-${item.id}-active` : `nav-tab-${item.id}`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security PIN Controls Section */}
        <div className="px-4 py-3 border-t border-neutral-800 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">
            <span>Security PIN</span>
            <span className="text-emerald-400 font-mono">Active</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setShowChangePinModal(true)}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/70 rounded-xl py-2 px-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Change 4-digit Master Security PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Set PIN</span>
            </button>
            <button
              onClick={handleLock}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 rounded-xl py-2 px-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Lock Manager Portal"
            >
              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Lock</span>
            </button>
          </div>
        </div>

        {/* Theme Switcher Toggle section */}
        <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">Late-Night Mode</span>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800/60' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>Light</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="p-5 border-t border-neutral-800 text-[10px] text-neutral-500 font-semibold">
          <p>© 2026 GMR Luxury Co-Living PG</p>
          <p className="text-[9px] mt-0.5">Multi-Property Suite v2.0</p>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER (Hidden on printing) */}
      <header className="md:hidden bg-neutral-900 text-neutral-300 border-b border-neutral-800 px-4 py-3.5 flex items-center justify-between z-40 print:hidden select-none" id="mobile-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5">
            <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#16a34a]" fill="currentColor">
              <path d="M50,15 C47,30 47,45 50,60 C53,45 53,30 50,15 Z" />
              <path d="M50,20 C42,32 40,46 45,58 C49,48 49,34 50,20 Z" />
              <path d="M50,20 C58,32 60,46 55,58 C51,48 51,34 50,20 Z" />
              <path d="M50,25 C34,35 32,50 40,62 C45,52 47,40 50,25 Z" />
              <path d="M50,25 C66,35 68,50 60,62 C55,52 53,40 50,25 Z" />
              <path d="M50,33 C26,42 25,58 35,66 C40,58 44,48 50,33 Z" />
              <path d="M50,33 C74,42 75,58 65,66 C60,58 56,48 50,33 Z" />
              <path d="M22,70 C40,55 60,80 78,65 C60,74 40,60 22,70 Z" />
              <path d="M18,78 C38,62 62,88 82,72 C62,81 38,67 18,78 Z" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-sm tracking-wide">GMR</span>
            <span className="bg-[#e6df15] text-neutral-950 font-black text-[9px] px-1 py-0.5 rounded-sm">PG</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleLock}
            className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl cursor-pointer transition-all duration-200"
            title="Lock Portal"
          >
            <Lock className="w-4.5 h-4.5 text-red-400" />
          </button>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl cursor-pointer transition-all duration-200"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5 text-emerald-400" /> : <Sun className="w-4.5 h-4.5 text-yellow-400" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop & Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-neutral-900 text-neutral-300 z-40 p-4 flex flex-col justify-between md:hidden shadow-2xl"
              id="mobile-drawer"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5">
                      <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#0b75c8]" fill="currentColor">
                        <path d="M50,15 C47,30 47,45 50,60 C53,45 53,30 50,15 Z" />
                        <path d="M50,20 C42,32 40,46 45,58 C49,48 49,34 50,20 Z" />
                        <path d="M50,20 C58,32 60,46 55,58 C51,48 51,34 50,20 Z" />
                        <path d="M50,25 C34,35 32,50 40,62 C45,52 47,40 50,25 Z" />
                        <path d="M50,25 C66,35 68,50 60,62 C55,52 53,40 50,25 Z" />
                        <path d="M50,33 C26,42 25,58 35,66 C40,58 44,48 50,33 Z" />
                        <path d="M50,33 C74,42 75,58 65,66 C60,58 56,48 50,33 Z" />
                        <path d="M22,70 C40,55 60,80 78,65 C60,74 40,60 22,70 Z" />
                        <path d="M18,78 C38,62 62,88 82,72 C62,81 38,67 18,78 Z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white text-sm tracking-wide">GMR</span>
                      <span className="bg-[#e6df15] text-neutral-950 font-black text-[9px] px-1 py-0.5 rounded-sm">PG</span>
                    </div>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer">
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Select Branch
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full bg-neutral-800 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-neutral-700 focus:outline-none"
                  >
                    <option value="all">🏢 All Properties ({properties.length})</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        🏢 {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <nav className="space-y-1.5 pt-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (item.id !== 'tenants') setSelectedTenantId(null);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-white text-neutral-900 shadow-sm' 
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                        }`}
                        id={isActive ? `mobile-nav-tab-${item.id}-active` : `mobile-nav-tab-${item.id}`}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-2 border-t border-neutral-800 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Security PIN</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setShowChangePinModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/70 rounded-xl py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Set PIN</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLock();
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-red-950/40 hover:bg-red-900 text-red-200 border border-red-800/50 rounded-xl py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span>Lock</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 font-semibold border-t border-neutral-800 pt-4">
                <p>© 2026 GMR Luxury Co-Living PG</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 w-full" id="main-content-viewport">
        <div className="max-w-7xl mx-auto w-full min-h-full pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
            {activeTab === 'dashboard' && (
              <DashboardOverview 
                userRole={userRole}
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                onSelectProperty={setSelectedPropertyId}
                onAddProperty={handleAddProperty}
                tenants={tenants}
                payments={payments}
                billingAlerts={billingAlerts}
                onNavigate={setActiveTab}
                onSelectTenant={handleSelectTenantFromDashboard}
                onTriggerAlert={handleSendBillingAlert}
                showToast={showToast}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantDirectory 
                userRole={userRole}
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                tenants={tenants}
                payments={payments}
                onAddTenant={handleAddTenant}
                onEditTenant={handleEditTenant}
                onCheckOutTenant={handleCheckOutTenant}
                selectedTenantId={selectedTenantId}
                onSelectTenant={setSelectedTenantId}
              />
            )}

            {activeTab === 'billing' && (
              <BillingManager 
                userRole={userRole}
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                tenants={tenants}
                payments={payments}
                billingAlerts={billingAlerts}
                onAddPayment={handleAddPayment}
                onSendAlert={handleSendBillingAlert}
                showToast={showToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
