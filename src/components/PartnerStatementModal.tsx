import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  X,
  IndianRupee,
  AlertTriangle,
  Calendar,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserX,
  CreditCard
} from 'lucide-react';
import { Property, Tenant, PaymentLog, BillingAlert } from '../types';
import { generate30DayPartnerPDF } from '../utils/partnerPdfGenerator';

interface PartnerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  tenants: Tenant[];
  payments: PaymentLog[];
  billingAlerts: BillingAlert[];
  selectedPropertyId: string;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export default function PartnerStatementModal({
  isOpen,
  onClose,
  properties,
  tenants,
  payments,
  billingAlerts,
  selectedPropertyId,
  showToast
}: PartnerStatementModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Filter tenants by property if selected
  const targetTenants = selectedPropertyId === 'all'
    ? tenants
    : tenants.filter(t => t.propertyId === selectedPropertyId);
  
  const targetTenantIds = new Set(targetTenants.map(t => t.id));
  const activeTenants = targetTenants.filter(t => t.status === 'Active');

  // Payments in last 30 days
  const last30DaysPayments = payments.filter(p => {
    if (!targetTenantIds.has(p.tenantId)) return false;
    const pDate = new Date(p.paymentDate);
    return pDate >= thirtyDaysAgo && pDate <= now;
  }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Pending dues / alerts
  const targetAlerts = billingAlerts.filter(b => targetTenantIds.has(b.tenantId) && (b.status === 'Pending' || b.status === 'Overdue'));

  // Amounts
  const totalCollectedAmount = last30DaysPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDuesAmount = targetAlerts.reduce((sum, b) => sum + b.rentAmount, 0);

  const activePropertyName = selectedPropertyId === 'all'
    ? 'All Properties (Global Portfolio)'
    : (properties.find(p => p.id === selectedPropertyId)?.name || 'Property Branch');

  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);
      generate30DayPartnerPDF({
        properties,
        tenants,
        payments,
        billingAlerts,
        selectedPropertyId
      });
      showToast('30-Day Partner Financial Statement PDF downloaded!', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Failed to generate PDF. Please try again.', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareSummaryWhatsApp = () => {
    const text = `*GMR PG 30-Day Partner Financial Statement*\n` +
      ` Scope: ${activePropertyName}\n` +
      ` Period: Last 30 Days (${thirtyDaysAgo.toLocaleDateString('en-IN')} - ${now.toLocaleDateString('en-IN')})\n\n` +
      ` *FINANCIAL HIGHLIGHTS:*\n` +
      ` Total Collected (Paid): ₹${totalCollectedAmount.toLocaleString('en-IN')} (${last30DaysPayments.length} transactions)\n` +
      ` Total Pending Dues: ₹${totalDuesAmount.toLocaleString('en-IN')} (${targetAlerts.length} overdue residents)\n\n` +
      `Active Residents: ${activeTenants.length}\n` +
      `Generated from GMR PG Management Portal.`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-neutral-100 text-neutral-900 my-8 max-h-[90vh] overflow-y-auto"
          id="partner-statement-modal"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-neutral-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Partner 30-Day Statement</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Official PDF
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Scope: <strong className="text-neutral-800">{activePropertyName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 text-neutral-400 rounded-xl cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date Range Badge */}
          <div className="bg-neutral-900 text-white rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Statement Period: <strong>{thirtyDaysAgo.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong> to <strong>{now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </span>
            </div>
            <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paid Details & Dues Report</span>
            </div>
          </div>

          {/* Key Totals Cards: Paid vs Dues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Collected Card */}
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                    Total Amount Collected (Paid)
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-3xl font-black text-emerald-950">₹{totalCollectedAmount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-emerald-700 font-bold mt-3">
                {last30DaysPayments.length} Rent Payments Processed in Last 30 Days
              </p>
            </div>

            {/* Dues Card */}
            <div className="bg-red-50 border border-red-200/90 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-red-800 uppercase tracking-wider">
                    Total Pending Dues (Unpaid)
                  </span>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-3xl font-black text-red-950">₹{totalDuesAmount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-red-700 font-bold mt-3">
                {targetAlerts.length} Unpaid Resident Accounts Pending Clearance
              </p>
            </div>
          </div>

          {/* SECTION 1: PAID DETAILS TABLE (LAST 30 DAYS) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-neutral-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Paid Details (Last 30 Days Transactions)</span>
              </h3>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {last30DaysPayments.length} Paid Logs
              </span>
            </div>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-900 text-white font-bold border-b border-neutral-200 text-[11px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Resident Name</th>
                    <th className="p-3 text-center">Room</th>
                    <th className="p-3 text-center">Month</th>
                    <th className="p-3 text-center">Mode</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {last30DaysPayments.length > 0 ? (
                    last30DaysPayments.map(pay => {
                      const tenant = tenants.find(t => t.id === pay.tenantId);
                      return (
                        <tr key={pay.id} className="hover:bg-neutral-50">
                          <td className="p-3 font-mono text-neutral-600">{pay.paymentDate}</td>
                          <td className="p-3 font-bold text-neutral-900">{tenant ? tenant.name : 'Resident'}</td>
                          <td className="p-3 text-center font-bold text-neutral-700">{tenant ? `R-${tenant.roomNumber}` : '-'}</td>
                          <td className="p-3 text-center text-neutral-600">{pay.billingMonth}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {pay.paymentMode}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{pay.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-neutral-400">
                        No payments collected in the last 30 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: DUE PEOPLE LIST (ADDED IN THE LAST AS REQUESTED) */}
          <div className="mb-6 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-red-700 flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-600" />
                <span>Pending Dues & Unpaid Residents List (Due People)</span>
              </h3>
              <span className="text-xs text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                {targetAlerts.length} Unpaid
              </span>
            </div>

            <div className="border border-red-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-red-600 text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-3">Resident Name</th>
                    <th className="p-3 text-center">Room</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3 text-center">Due Date</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Pending Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 font-medium">
                  {targetAlerts.length > 0 ? (
                    targetAlerts.map((alert, idx) => {
                      const tenant = tenants.find(t => t.id === alert.tenantId);
                      const prop = properties.find(p => p.id === tenant?.propertyId);
                      return (
                        <tr key={`${alert.tenantId}-${idx}`} className="hover:bg-red-50/50">
                          <td className="p-3 font-bold text-neutral-900">{tenant ? tenant.name : alert.tenantName}</td>
                          <td className="p-3 text-center font-bold text-neutral-700">{tenant ? `R-${tenant.roomNumber}` : `R-${alert.roomNumber}`}</td>
                          <td className="p-3 text-neutral-600 text-[11px]">{prop ? prop.name : 'GMR Branch'}</td>
                          <td className="p-3 text-center font-mono text-neutral-600">{alert.dueDate}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase">
                              {alert.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-red-700">₹{alert.rentAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-emerald-700 font-bold bg-emerald-50">
                        🎉 Great news! All resident accounts are clear. Zero pending dues.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleShareSummaryWhatsApp}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Share Statement on WhatsApp</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-white" />
                <span>{isGenerating ? 'Generating PDF...' : 'Download Partner Statement PDF'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
