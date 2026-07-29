import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Trash2, 
  X, 
  UserCheck, 
  UserX, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  Home, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PendingTenantRegistration, Tenant, Property } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PendingRegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRegistrations: PendingTenantRegistration[];
  properties: Property[];
  onApprove: (registration: PendingTenantRegistration) => void;
  onReject: (registrationId: string, name: string) => void;
}

export default function PendingRegistrationsModal({
  isOpen,
  onClose,
  pendingRegistrations,
  properties,
  onApprove,
  onReject
}: PendingRegistrationsModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-neutral-100 text-neutral-900 my-8 max-h-[90vh] overflow-y-auto"
          id="pending-registrations-modal"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                    {t('pendingApprovals')}
                  </h2>
                  <span className="bg-amber-100 text-amber-900 font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                    {pendingRegistrations.length}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Verify and confirm QR-scanned resident self-registration submissions
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

          {/* Registrations List */}
          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-neutral-700">{t('noPending')}</p>
              <p className="text-xs text-neutral-400">All submitted applications have been verified and processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegistrations.map((item) => {
                const propName = item.propertyName || properties.find(p => p.id === item.propertyId)?.name || 'GMR PG Branch';
                const formattedDate = new Date(item.submittedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4 shadow-xs hover:border-neutral-300 transition-all"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-neutral-200/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-neutral-900 text-base">{item.name}</h3>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                            Room {item.roomNumber}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                            <strong>{propName}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {formattedDate}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-neutral-500 block">Monthly Rent</span>
                        <span className="text-sm font-black text-neutral-900 font-mono">₹{item.rentAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Detailed Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">Contact Phone</span>
                        <p className="font-semibold text-neutral-900 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{item.phone}</span>
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">ID Proof ({item.idType})</span>
                        <p className="font-semibold text-neutral-900 font-mono flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-neutral-400" />
                          <span>{item.idNumber || item.aadharNo || item.panNo || 'N/A'}</span>
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">Advance Deposit Paid</span>
                        <p className="font-semibold text-emerald-700 font-mono">₹{item.securityDeposit.toLocaleString('en-IN')}</p>
                      </div>

                      {item.fatherName && (
                        <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 space-y-0.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('fatherName')}</span>
                          <p className="font-semibold text-neutral-900">{item.fatherName}</p>
                        </div>
                      )}

                      {item.familyContactNumber && (
                        <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 space-y-0.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">Family Phone</span>
                          <p className="font-semibold text-neutral-900 font-mono">{item.familyContactNumber}</p>
                        </div>
                      )}

                      {item.checkInDate && (
                        <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 space-y-0.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">Joining Date</span>
                          <p className="font-semibold text-neutral-900 font-mono">{item.checkInDate}</p>
                        </div>
                      )}
                    </div>

                    {item.permanentAddress && (
                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/80 text-xs space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">Permanent Address</span>
                        <p className="text-neutral-800 font-medium">{item.permanentAddress}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onReject(item.id, item.name)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <UserX className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{t('reject')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onApprove(item)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[40px]"
                      >
                        <UserCheck className="w-4 h-4 text-white shrink-0" />
                        <span>{t('approve')}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
