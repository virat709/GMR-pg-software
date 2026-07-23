import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  IndianRupee, 
  Plus, 
  Printer, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Calendar, 
  CreditCard,
  User,
  Hash,
  AlertCircle,
  TrendingUp,
  ReceiptText,
  AlertTriangle,
  Send,
  Building,
  MessageCircle
} from 'lucide-react';
import { Tenant, PaymentLog, PaymentMode, BillingAlert } from '../types';
import { triggerWhatsAppMessage, getReceiptTemplate, getRentReminderTemplate } from '../utils/whatsapp';

interface BillingManagerProps {
  tenants: Tenant[];
  payments: PaymentLog[];
  billingAlerts: BillingAlert[];
  onAddPayment: (payment: Omit<PaymentLog, 'id'>) => void;
  onSendAlert: (alert: BillingAlert) => void;
}

export default function BillingManager({
  tenants,
  payments,
  billingAlerts,
  onAddPayment,
  onSendAlert
}: BillingManagerProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  
  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedAlertForPayment, setSelectedAlertForPayment] = useState<BillingAlert | null>(null);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<PaymentLog | null>(null);

  // Form states for Recording Payment
  const [paymentTenantId, setPaymentTenantId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(8500);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Auto-fill form when recording payment from list
  const handleOpenRecordPayment = (alert: BillingAlert | null) => {
    if (alert) {
      setSelectedAlertForPayment(alert);
      setPaymentTenantId(alert.tenantId);
      setPaymentAmount(alert.rentAmount);
    } else {
      setSelectedAlertForPayment(null);
      const activeTenants = tenants.filter(t => t.status === 'Active');
      if (activeTenants.length > 0) {
        setPaymentTenantId(activeTenants[0].id);
        setPaymentAmount(activeTenants[0].rentAmount);
      } else {
        setPaymentTenantId('');
        setPaymentAmount(8000);
      }
    }
    setPaymentMode('UPI');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    
    // Generate a quick random transaction ID for UPI/Net Banking convenience
    const randomRef = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
    setPaymentReference(randomRef);
    setPaymentNotes('');
    setIsRecordModalOpen(true);
  };

  // On Tenant dropdown change
  const handleTenantChange = (tenantId: string) => {
    setPaymentTenantId(tenantId);
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setPaymentAmount(tenant.rentAmount);
    }
  };

  // Handle Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTenantId || !paymentAmount || !paymentReference) {
      alert('Please complete all transaction fields.');
      return;
    }

    onAddPayment({
      tenantId: paymentTenantId,
      amount: Number(paymentAmount),
      billingMonth: '2026-07', // For current month simulation
      paymentDate,
      paymentMode,
      referenceId: paymentReference,
      notes: paymentNotes || undefined
    });

    setIsRecordModalOpen(false);
  };

  // View Printable Receipt (triggers receipt template view)
  const handleOpenReceipt = (log: PaymentLog) => {
    setActiveReceiptPayment(log);
    setIsReceiptModalOpen(true);
  };

  // Native Printer Trigger
  const handlePrint = () => {
    window.print();
  };

  // Get tenant information from ID
  const getTenant = (tenantId: string) => {
    return tenants.find(t => t.id === tenantId);
  };

  // Combined records for searchable billing status
  const currentMonth = '2026-07';
  const displayBillingRecords = tenants
    .filter(t => t.status === 'Active')
    .map(tenant => {
      // Find payment for this tenant for July 2026
      const paymentLog = payments.find(p => p.tenantId === tenant.id && p.billingMonth === currentMonth);
      const alertRecord = billingAlerts.find(b => b.tenantId === tenant.id);
      
      return {
        tenantId: tenant.id,
        name: tenant.name,
        roomNumber: tenant.roomNumber,
        rentAmount: tenant.rentAmount,
        status: paymentLog ? 'Paid' : (alertRecord?.status || 'Pending'),
        dueDate: alertRecord?.dueDate || '2026-07-05',
        paymentLog: paymentLog || null
      };
    });

  // Filter records
  const filteredRecords = displayBillingRecords.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="billing-manager-view">
      
      {/* Search and Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search billing by tenant or room number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-500 bg-neutral-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status filters */}
          <div className="inline-flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600">
            <button 
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'All' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('Paid')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'Paid' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
            >
              Paid
            </button>
            <button 
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'Pending' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setStatusFilter('Overdue')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${statusFilter === 'Overdue' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'}`}
            >
              Overdue
            </button>
          </div>

          <button
            onClick={() => handleOpenRecordPayment(null)}
            className="bg-neutral-900 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            id="log-payment-header-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Billing Status Grid */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 text-sm">Automated Billing Logs (July 2026)</h3>
            <p className="text-xs text-neutral-400">Monthly billing statuses, push alerting channels, and paper receipt printer keys.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Overdue</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Tenant & Room</th>
                <th className="py-3.5 px-6">Billing Month</th>
                <th className="py-3.5 px-6">Expected Rent</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action Gateways</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400 font-medium">
                    No billing logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.tenantId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="font-bold text-neutral-900 block">{rec.name}</span>
                        <span className="text-[10px] font-mono font-semibold bg-neutral-100 border border-neutral-200 text-neutral-600 px-2 py-0.5 rounded-md">
                          Room {rec.roomNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-neutral-500 font-medium font-mono">
                      {currentMonth}
                    </td>
                    <td className="py-4 px-6 font-bold text-neutral-800">
                      ₹{rec.rentAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-mono text-neutral-400">
                      {rec.dueDate}
                    </td>
                    <td className="py-4 px-6 font-medium text-neutral-600">
                      {rec.paymentLog ? (
                        <span className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-2 py-1 rounded font-semibold text-[10px]">
                          {rec.paymentLog.paymentMode}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Unpaid</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        rec.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.status === 'Overdue'
                            ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.status !== 'Paid' ? (
                          <>
                            <button
                              onClick={() => onSendAlert({
                                tenantId: rec.tenantId,
                                tenantName: rec.name,
                                roomNumber: rec.roomNumber,
                                rentAmount: rec.rentAmount,
                                billingMonth: currentMonth,
                                status: rec.status as any,
                                dueDate: rec.dueDate
                              })}
                              className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer text-xs"
                              title="Send Monthly Billing Alert"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Alert</span>
                            </button>
                            <button
                              onClick={() => {
                                const tenantObj = getTenant(rec.tenantId);
                                if (tenantObj) {
                                  const text = getRentReminderTemplate({
                                    tenantName: rec.name,
                                    roomNumber: rec.roomNumber,
                                    rentAmount: rec.rentAmount,
                                    billingMonth: currentMonth,
                                    dueDate: rec.dueDate,
                                    status: rec.status
                                  });
                                  triggerWhatsAppMessage(tenantObj.phone, text);
                                }
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer text-xs"
                              title="Send Rent Reminder on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              onClick={() => handleOpenRecordPayment({
                                tenantId: rec.tenantId,
                                tenantName: rec.name,
                                roomNumber: rec.roomNumber,
                                rentAmount: rec.rentAmount,
                                billingMonth: currentMonth,
                                status: rec.status as any,
                                dueDate: rec.dueDate
                              })}
                              className="bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer text-xs"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>Collect</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenReceipt(rec.paymentLog!)}
                              className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                              title="View Receipt Slip"
                            >
                              <ReceiptText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt</span>
                            </button>
                            <button
                              onClick={() => {
                                handleOpenReceipt(rec.paymentLog!);
                                setTimeout(() => {
                                  window.print();
                                }, 150);
                              }}
                              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
                              title="Print Friendly Receipt Copy"
                            >
                              <Printer className="w-3.5 h-3.5 text-neutral-600" />
                              <span>Print</span>
                            </button>
                            <button
                              onClick={() => {
                                const tenantObj = getTenant(rec.paymentLog!.tenantId);
                                if (tenantObj) {
                                  const text = getReceiptTemplate({
                                    tenantName: tenantObj.name,
                                    roomNumber: tenantObj.roomNumber,
                                    amount: rec.paymentLog!.amount,
                                    billingMonth: rec.paymentLog!.billingMonth,
                                    paymentDate: rec.paymentLog!.paymentDate,
                                    paymentMode: rec.paymentLog!.paymentMode,
                                    referenceId: rec.paymentLog!.referenceId
                                  });
                                  triggerWhatsAppMessage(tenantObj.phone, text);
                                }
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer text-xs"
                              title="Send Receipt on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 text-base">Record Rent Payment</h3>
              <button 
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 hover:bg-neutral-200 rounded-lg text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              {/* Tenant Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Select Resident *</label>
                <select
                  disabled={selectedAlertForPayment !== null}
                  value={paymentTenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                >
                  {tenants
                    .filter(t => t.status === 'Active')
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Room {t.roomNumber})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Amount field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rent Amount Collected *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-neutral-400 text-sm">₹</span>
                  <input 
                    type="number" 
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-bold bg-neutral-50/50"
                  />
                </div>
              </div>

              {/* Payment Mode & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Card">Credit/Debit Card</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Payment Date *</label>
                  <input 
                    type="date" 
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 font-mono"
                  />
                </div>
              </div>

              {/* Reference ID */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Transaction Ref / Reference ID *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. UPI82710398271"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm font-mono tracking-wider bg-neutral-50/50"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Payment Notes</label>
                <input 
                  type="text" 
                  placeholder="e.g. July Rent Paid fully"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50"
                />
              </div>

              {/* Actions panel */}
              <div className="border-t border-neutral-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Log Payment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Receipts Generator & Print Modal */}
      {isReceiptModalOpen && activeReceiptPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          >
            {/* Modal Header (Hidden on printing) */}
            <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between print:hidden">
              <span className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                <ReceiptText className="w-5 h-5 text-emerald-600" />
                Receipt Generated Successfully
              </span>
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 hover:bg-neutral-200 rounded-lg text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area - Centered Receipt Card */}
            <div className="p-6 bg-neutral-50 flex-1 overflow-y-auto max-h-[500px]">
              
              {/* Receipt Wrapper (With print identifier ID 'print-area') */}
              <div 
                id="print-area" 
                className="bg-white border-2 border-neutral-200 p-6 rounded-2xl space-y-6 shadow-sm font-sans mx-auto text-neutral-800"
                style={{ maxWidth: '400px' }}
              >
                {/* Header */}
                <div className="text-center pb-4 border-b-2 border-dashed border-neutral-200 space-y-1">
                  <div className="flex items-center justify-center gap-2 text-neutral-900 font-extrabold text-base tracking-wide">
                    <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#0b75c8]" fill="currentColor">
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
                    <span>GMR LUXURY PG</span>
                  </div>
                  <p className="text-[9px] text-[#0b75c8] font-bold uppercase tracking-widest">Feels Like Home</p>
                  <p className="text-[10px] text-neutral-500 font-medium">#7 Akash Nagar Main Road, A Narayanapura, Mahadevapura, Bengaluru - 560093</p>
                  <p className="text-[9px] text-neutral-400 font-mono">Ph: +91 99515 13796 | +91 70360 19865</p>
                  <p className="text-[9px] text-neutral-400 font-mono">Email: nagendranagiii955@gmail.com</p>
                </div>

                {/* Sub-Header details */}
                <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-neutral-600 font-medium pb-4 border-b border-neutral-100">
                  <div>
                    <span className="text-neutral-400 block uppercase tracking-wider text-[8px]">Receipt No</span>
                    <span className="font-mono font-bold text-neutral-900">{activeReceiptPayment.id.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-400 block uppercase tracking-wider text-[8px]">Date of payment</span>
                    <span className="font-mono font-bold text-neutral-900">{activeReceiptPayment.paymentDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block uppercase tracking-wider text-[8px]">Paying Guest</span>
                    <span className="font-bold text-neutral-900">{getTenant(activeReceiptPayment.tenantId)?.name || 'Resident'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-400 block uppercase tracking-wider text-[8px]">Room / Facility</span>
                    <span className="font-mono font-bold text-neutral-900">Room {getTenant(activeReceiptPayment.tenantId)?.roomNumber || 'N/A'}</span>
                  </div>
                </div>

                {/* Ledger Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider pb-1 border-b border-neutral-200">
                    <span>Description / Item</span>
                    <span>Amount</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>Room Rent ({activeReceiptPayment.billingMonth})</span>
                      <span className="font-bold">₹{activeReceiptPayment.amount.toLocaleString('en-IN')}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>• standard maintenance, high speed Wi-Fi</span>
                      <span>Included</span>
                    </div>
                  </div>
                </div>

                {/* Total box */}
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Received</span>
                  <span className="text-lg font-extrabold text-neutral-950">₹{activeReceiptPayment.amount.toLocaleString('en-IN')}.00</span>
                </div>

                {/* Payment gateway references */}
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-1 text-[10px] text-neutral-500">
                  <p className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="font-bold text-neutral-800">{activeReceiptPayment.paymentMode}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono font-semibold text-neutral-800">{activeReceiptPayment.referenceId}</span>
                  </p>
                  {activeReceiptPayment.notes && (
                    <p className="flex justify-between border-t border-neutral-200/50 pt-1 mt-1 text-[9px] italic">
                      <span>Notes:</span>
                      <span>{activeReceiptPayment.notes}</span>
                    </p>
                  )}
                </div>

                {/* Footer and signatures */}
                <div className="pt-4 text-center space-y-3">
                  <div className="flex justify-between items-end pt-4">
                    <div className="text-left">
                      <span className="border-t border-neutral-300 pt-1 text-[8px] text-neutral-400 uppercase block tracking-wider">Resident signature</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-neutral-800">For GMR Co-Living Spaces</p>
                      <div className="h-6"></div>
                      <span className="border-t border-neutral-300 pt-1 text-[8px] text-neutral-400 uppercase block tracking-wider">Authorized Seal</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-100 pt-3">
                    <p className="text-[10px] font-bold text-emerald-600">★ Thank you for staying with us! ★</p>
                    <p className="text-[8px] text-neutral-400 mt-0.5">This is a computer generated digital receipt copy.</p>
                  </div>
                </div>

              </div>
              
            </div>

            {/* Modal actions (Hidden on printing) */}
            <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between print:hidden">
              <span className="text-xs text-neutral-500">Ready for standard A4/A5 receipt printing</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const tenantObj = getTenant(activeReceiptPayment.tenantId);
                    if (tenantObj) {
                      const text = getReceiptTemplate({
                        tenantName: tenantObj.name,
                        roomNumber: tenantObj.roomNumber,
                        amount: activeReceiptPayment.amount,
                        billingMonth: activeReceiptPayment.billingMonth,
                        paymentDate: activeReceiptPayment.paymentDate,
                        paymentMode: activeReceiptPayment.paymentMode,
                        referenceId: activeReceiptPayment.referenceId
                      });
                      triggerWhatsAppMessage(tenantObj.phone, text);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                  <span>Send via WhatsApp</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
