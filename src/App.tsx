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
  Megaphone, 
  Building, 
  Bell, 
  CheckCircle, 
  Menu, 
  X,
  CreditCard,
  PhoneCall,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { Tenant, PaymentLog, Announcement, BillingAlert } from './types';
import { initialTenants, initialPayments, initialAnnouncements } from './mockData';

// Component imports
import DashboardOverview from './components/DashboardOverview';
import TenantDirectory from './components/TenantDirectory';
import BillingManager from './components/BillingManager';
import AnnouncementCenter from './components/AnnouncementCenter';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'billing' | 'announcements'>('dashboard');
  
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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedTenants = localStorage.getItem('pg_tenants');
    const savedPayments = localStorage.getItem('pg_payments');
    const savedAnnouncements = localStorage.getItem('pg_announcements');

    if (savedTenants) {
      setTenants(JSON.parse(savedTenants));
    } else {
      setTenants(initialTenants);
      localStorage.setItem('pg_tenants', JSON.stringify(initialTenants));
    }

    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    } else {
      setPayments(initialPayments);
      localStorage.setItem('pg_payments', JSON.stringify(initialPayments));
    }

    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    } else {
      setAnnouncements(initialAnnouncements);
      localStorage.setItem('pg_announcements', JSON.stringify(initialAnnouncements));
    }
  }, []);

  // Save changes to LocalStorage helper
  const saveToStorage = (key: 'pg_tenants' | 'pg_payments' | 'pg_announcements', data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Toast Trigger Helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Tenant Handlers
  const handleAddTenant = (newTenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...newTenantData,
      id: 'tenant_' + Math.random().toString(36).substring(2, 9),
    };
    const updated = [newTenant, ...tenants];
    setTenants(updated);
    saveToStorage('pg_tenants', updated);
    showToast(`Resident ${newTenant.name} registered successfully!`, 'success');
  };

  const handleEditTenant = (updatedTenant: Tenant) => {
    const updated = tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t);
    setTenants(updated);
    saveToStorage('pg_tenants', updated);
    showToast(`Resident ${updatedTenant.name}'s profile updated!`, 'success');
  };

  const handleCheckOutTenant = (tenantId: string) => {
    const tenantName = tenants.find(t => t.id === tenantId)?.name || 'Resident';
    const checkOutDate = new Date().toISOString().split('T')[0];
    const updated = tenants.map(t => 
      t.id === tenantId 
        ? { ...t, status: 'CheckedOut' as const, checkOutDate } 
        : t
    );
    setTenants(updated);
    saveToStorage('pg_tenants', updated);
    showToast(`Resident ${tenantName} checked out of PG!`, 'info');
  };

  // 2. Payment Handlers
  const handleAddPayment = (newPaymentData: Omit<PaymentLog, 'id'>) => {
    const newPayment: PaymentLog = {
      ...newPaymentData,
      id: 'pay_' + Math.random().toString(36).substring(2, 9),
    };
    const updated = [newPayment, ...payments];
    setPayments(updated);
    saveToStorage('pg_payments', updated);
    
    // Get tenant name for toast
    const name = tenants.find(t => t.id === newPaymentData.tenantId)?.name || 'Resident';
    showToast(`Collected ₹${newPayment.amount} from ${name}!`, 'success');
  };

  // 3. Announcement Handlers
  const handleAddAnnouncement = (newAnnData: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = {
      ...newAnnData,
      id: 'ann_' + Math.random().toString(36).substring(2, 9),
    };
    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    saveToStorage('pg_announcements', updated);
  };

  // 4. Send Custom Billing Alert (WhatsApp/Push notification simulator)
  const handleSendBillingAlert = (alert: BillingAlert) => {
    showToast(`Sent monthly billing alert push notification to ${alert.tenantName}'s device successfully!`, 'success');
  };

  // Dynamically calculate Billing Alerts based on active tenants
  // Billing cycle month is July 2026 ('2026-07')
  const currentMonth = '2026-07';
  const billingAlerts: BillingAlert[] = tenants
    .filter(t => t.status === 'Active')
    .map(tenant => {
      // Check if tenant paid this month
      const hasPaid = payments.some(p => p.tenantId === tenant.id && p.billingMonth === currentMonth);
      
      // Assume standard rent due date is 5th of current month
      const dueDate = '2026-07-05';
      const status = hasPaid ? 'Paid' : 'Overdue'; // July 21 is past due date, so overdue
      
      return {
        tenantId: tenant.id,
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
    { id: 'dashboard' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'tenants' as const, label: 'Residents Directory', icon: Users },
    { id: 'billing' as const, label: 'Billing & Receipts', icon: IndianRupee },
    { id: 'announcements' as const, label: 'Urgent Notices', icon: Megaphone },
  ];

  const handleSelectTenantFromDashboard = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setActiveTab('tenants');
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row relative transition-colors duration-300 theme-${theme}`}>
      
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
            <div className={`px-5 py-3 rounded-xl border shadow-lg flex items-center gap-2 text-sm font-semibold whitespace-nowrap ${
              toastType === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {toastType === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Bell className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: Desktop Layout (Hidden on printing) */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-900 text-neutral-300 border-r border-neutral-800 shrink-0 select-none print:hidden" id="desktop-sidebar">
        {/* Branding header */}
        <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm p-1 shrink-0">
            <svg viewBox="0 0 100 100" className="w-8 h-8 text-[#0b75c8]" fill="currentColor">
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
            <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">Luxury Co-Living</p>
          </div>
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

        {/* Theme Switcher Toggle section */}
        <div className="px-5 py-3.5 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">Late-Night Mode</span>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'bg-blue-900/40 text-blue-200 border border-blue-800/60' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
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
          <p className="text-[9px] mt-0.5">Management Portal v1.4</p>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER (Hidden on printing) */}
      <header className="md:hidden bg-neutral-900 text-neutral-300 border-b border-neutral-800 px-4 py-3.5 flex items-center justify-between z-40 print:hidden select-none" id="mobile-header">
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

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl cursor-pointer transition-all duration-200"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5 text-blue-400" /> : <Sun className="w-4.5 h-4.5 text-yellow-400" />}
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

                <nav className="space-y-1.5">
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
              </div>

              <div className="text-[10px] text-neutral-500 font-semibold border-t border-neutral-800 pt-4">
                <p>© 2026 GMR Luxury Co-Living PG</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full" id="main-content-viewport">
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
                tenants={tenants}
                payments={payments}
                announcements={announcements}
                billingAlerts={billingAlerts}
                onNavigate={setActiveTab}
                onSelectTenant={handleSelectTenantFromDashboard}
                onTriggerAlert={handleSendBillingAlert}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantDirectory 
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
                tenants={tenants}
                payments={payments}
                billingAlerts={billingAlerts}
                onAddPayment={handleAddPayment}
                onSendAlert={handleSendBillingAlert}
              />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementCenter 
                tenants={tenants}
                announcements={announcements}
                onAddAnnouncement={handleAddAnnouncement}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
