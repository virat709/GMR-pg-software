import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  IndianRupee, 
  Home, 
  AlertTriangle, 
  Bell, 
  ArrowUpRight, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { Tenant, PaymentLog, Announcement, BillingAlert } from '../types';

interface DashboardOverviewProps {
  tenants: Tenant[];
  payments: PaymentLog[];
  announcements: Announcement[];
  billingAlerts: BillingAlert[];
  onNavigate: (tab: 'dashboard' | 'tenants' | 'billing' | 'announcements') => void;
  onSelectTenant: (tenantId: string) => void;
  onTriggerAlert: (alert: BillingAlert) => void;
}

export default function DashboardOverview({
  tenants,
  payments,
  announcements,
  billingAlerts,
  onNavigate,
  onSelectTenant,
  onTriggerAlert
}: DashboardOverviewProps) {
  // Constants for PG capacity
  const TOTAL_ROOMS = 10;
  
  // Calculate statistics
  const activeTenants = tenants.filter(t => t.status === 'Active');
  const checkedOutCount = tenants.filter(t => t.status === 'CheckedOut').length;
  const occupancyRate = Math.round((activeTenants.length / TOTAL_ROOMS) * 100);
  
  // Current month string
  const currentMonth = '2026-07';
  const currentMonthLabel = 'July 2026';
  
  // Rent collected this month
  const collectedThisMonth = payments
    .filter(p => p.billingMonth === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  // Pending rent calculation
  const pendingAlerts = billingAlerts.filter(b => b.status === 'Pending' || b.status === 'Overdue');
  const expectedTotalRent = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0);
  const pendingRentAmount = pendingAlerts.reduce((sum, b) => sum + b.rentAmount, 0);

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 4);

  // Match tenant name for recent payments
  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getRoomNumber = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.roomNumber : 'N/A';
  };

  return (
    <div className="space-y-6" id="dashboard-overview-view">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">GMR Luxury Co-Living PG Portal</h1>
          <p className="text-neutral-500 mt-1">Here is a summary of your Paying Guest facility for {currentMonthLabel}.</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white border border-neutral-200 px-4 py-2 rounded-xl shadow-xs text-sm font-medium text-neutral-700 flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live Monitoring Active
        </div>
      </div>

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Occupancy Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-occupancy"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-neutral-400">Total Occupancy</span>
              <p className="text-3xl font-bold text-neutral-900">{activeTenants.length} <span className="text-lg font-normal text-neutral-400">/ {TOTAL_ROOMS} Rooms</span></p>
            </div>
            <div className="p-3 bg-neutral-50 text-neutral-700 rounded-xl border border-neutral-100">
              <Home className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium border-t border-neutral-100 pt-3">
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{occupancyRate}% Full</span>
            <span className="text-neutral-400">{TOTAL_ROOMS - activeTenants.length} Rooms Available</span>
          </div>
        </motion.div>

        {/* Rent Collected Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-collected"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-neutral-400">Rent Collected (July)</span>
              <p className="text-3xl font-bold text-neutral-900">₹{collectedThisMonth.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium border-t border-neutral-100 pt-3">
            <span className="text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              ₹{Math.round((collectedThisMonth / (expectedTotalRent || 1)) * 100)}% Recd
            </span>
            <span className="text-neutral-400">Target: ₹{expectedTotalRent.toLocaleString('en-IN')}</span>
          </div>
        </motion.div>

        {/* Pending Rent Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-pending"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-neutral-400">Unpaid Balance</span>
              <p className="text-3xl font-bold text-amber-600">₹{pendingRentAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium border-t border-neutral-100 pt-3">
            <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              {pendingAlerts.length} Pending Bills
            </span>
            <button 
              onClick={() => onNavigate('billing')}
              className="text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5 font-medium cursor-pointer"
            >
              Collect <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Push Broadcast Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          id="stat-card-broadcasts"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-neutral-400">Active Broadcasters</span>
              <p className="text-3xl font-bold text-neutral-900">{announcements.length} <span className="text-lg font-normal text-neutral-400">Notices</span></p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium border-t border-neutral-100 pt-3">
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Push Active</span>
            <button 
              onClick={() => onNavigate('announcements')}
              className="text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5 font-medium cursor-pointer"
            >
              New Update <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Pending Alerts & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Billing alerts & notices (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Automated Billing Alerts */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold text-neutral-900">Monthly Billing Status</h2>
                <p className="text-xs text-neutral-500">Automated check of rent cycles for {currentMonthLabel}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Due in July
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {billingAlerts.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">All tenant rents are perfectly updated!</p>
                </div>
              ) : (
                billingAlerts.map((alert) => (
                  <div 
                    key={alert.tenantId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-50 border border-neutral-200/60 rounded-xl gap-3 transition-hover duration-200 hover:border-neutral-300"
                    id={`billing-alert-item-${alert.tenantId}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{alert.tenantName}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600">
                          Room {alert.roomNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span>Amount: <b>₹{alert.rentAmount}</b></span>
                        <span>•</span>
                        <span>Due: {alert.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        alert.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : alert.status === 'Overdue' 
                            ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {alert.status}
                      </span>
                      
                      {alert.status !== 'Paid' && (
                        <button
                          onClick={() => onTriggerAlert(alert)}
                          className="text-xs bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg font-medium transition-colors shadow-xs hover:border-neutral-300 cursor-pointer"
                        >
                          Alert Tenant
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          onNavigate('billing');
                        }}
                        className="text-xs bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-1.5 rounded-lg font-medium transition-colors shadow-xs cursor-pointer"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Urgent Notices Panel */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold text-neutral-900">Recent Broadcasts</h2>
                <p className="text-xs text-neutral-500">Urgent notifications on residents' devices</p>
              </div>
              <button 
                onClick={() => onNavigate('announcements')}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer"
              >
                Go to Sender <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 2).map((ann) => (
                <div 
                  key={ann.id}
                  className="p-4 bg-neutral-50/70 border border-neutral-200/50 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      ann.category === 'Urgent' 
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : ann.category === 'Maintenance'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {ann.category}
                    </span>
                    <span className="text-xs text-neutral-400">{ann.sentDate}</span>
                  </div>
                  <h3 className="font-semibold text-neutral-800 text-sm">{ann.title}</h3>
                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Column 2: Recent Payments (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold text-neutral-900">Recent Payments</h2>
                <p className="text-xs text-neutral-500">History log of completed transactions</p>
              </div>
              <button 
                onClick={() => onNavigate('billing')}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer"
              >
                Log Book <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              {recentPayments.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <p className="text-sm">No payment logs available yet.</p>
                </div>
              ) : (
                recentPayments.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectTenant(log.tenantId)}
                          className="font-semibold text-sm text-neutral-800 hover:text-neutral-900 text-left hover:underline cursor-pointer"
                        >
                          {getTenantName(log.tenantId)}
                        </button>
                        <span className="text-[10px] font-medium bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                          Room {getRoomNumber(log.tenantId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span>{log.paymentDate}</span>
                        <span>•</span>
                        <span className="bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100 text-neutral-500 font-medium text-[10px]">{log.paymentMode}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-sm">+ ₹{log.amount}</span>
                      <p className="text-[10px] text-neutral-400">For {log.billingMonth}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-neutral-950 text-sm">PG Facility Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-xl space-y-1 border border-neutral-100">
                <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">Occupants</span>
                <span className="text-xl font-bold text-neutral-800">{activeTenants.length} Active</span>
                <span className="text-xs text-neutral-400 block mt-1">{checkedOutCount} Checked Out</span>
              </div>
              <div className="p-4 bg-neutral-50 rounded-xl space-y-1 border border-neutral-100">
                <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">Rooms</span>
                <span className="text-xl font-bold text-neutral-800">{TOTAL_ROOMS - activeTenants.length} Free</span>
                <span className="text-xs text-emerald-600 block mt-1">Ready for Check-In</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
