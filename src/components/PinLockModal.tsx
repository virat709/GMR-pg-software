import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldAlert, UserCheck, Shield } from 'lucide-react';
import { UserRole } from '../types';

interface PinLockModalProps {
  isUnlocked: boolean;
  userRole: UserRole | null;
  onUnlock: (role: UserRole) => void;
  onLock: () => void;
  showChangePinModal: boolean;
  onCloseChangePinModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export const DEFAULT_SUPER_PIN = '1234';
export const DEFAULT_MANAGER_PIN = '5555';

export default function PinLockModal({
  isUnlocked,
  userRole,
  onUnlock,
  onLock,
  showChangePinModal,
  onCloseChangePinModal,
  showToast
}: PinLockModalProps) {
  // Super Admin PIN & Manager PIN stored in LocalStorage
  const [storedSuperPin, setStoredSuperPin] = useState<string>(() => {
    return localStorage.getItem('gmr_super_pin') || DEFAULT_SUPER_PIN;
  });
  const [storedManagerPin, setStoredManagerPin] = useState<string>(() => {
    return localStorage.getItem('gmr_manager_pin') || DEFAULT_MANAGER_PIN;
  });

  // Entry PIN input state
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);

  // Change PIN Form State
  const [targetPinType, setTargetPinType] = useState<'super' | 'manager'>('super');
  const [currentSuperPinInput, setCurrentSuperPinInput] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [changePinError, setChangePinError] = useState<string | null>(null);

  // Auto-verify when 4 digits are entered
  useEffect(() => {
    if (enteredPin.length === 4) {
      if (enteredPin === storedSuperPin) {
        setPinError(null);
        setEnteredPin('');
        onUnlock('super_admin');
        showToast('Authorized as Super Admin! Full Access Granted.', 'success');
      } else if (enteredPin === storedManagerPin) {
        setPinError(null);
        setEnteredPin('');
        onUnlock('manager');
        showToast('Authorized as Manager! Limited Operational Access Granted.', 'info');
      } else {
        setPinError('Invalid PIN! Use 1234 for Super Access or 5555 for Manager Access.');
        setEnteredPin('');
      }
    }
  }, [enteredPin, storedSuperPin, storedManagerPin, onUnlock, showToast]);

  const handleKeyClick = (num: string) => {
    if (enteredPin.length < 4) {
      setPinError(null);
      setEnteredPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(null);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification requires Super PIN to change any security credentials
    if (currentSuperPinInput !== storedSuperPin) {
      setChangePinError('Super Admin PIN is incorrect. Only Super Admins can update system PINs.');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setChangePinError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setChangePinError('New PINs do not match.');
      return;
    }

    if (targetPinType === 'super') {
      localStorage.setItem('gmr_super_pin', newPin);
      setStoredSuperPin(newPin);
      showToast('Super Admin PIN updated successfully!', 'success');
    } else {
      localStorage.setItem('gmr_manager_pin', newPin);
      setStoredManagerPin(newPin);
      showToast('Manager Access PIN updated successfully!', 'success');
    }

    setCurrentSuperPinInput('');
    setNewPin('');
    setConfirmNewPin('');
    setChangePinError(null);
    onCloseChangePinModal();
  };

  return (
    <>
      {/* 1. FULL-SCREEN SECURITY LOCK OVERLAY */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center p-4"
            id="pin-lock-fullscreen-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 w-full max-w-md text-center shadow-2xl text-white relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-neutral-600/50 mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Lock className="w-8 h-8 text-yellow-400" />
              </div>

              <h2 className="text-xl font-black tracking-tight text-white">GMR PG Access Control</h2>
              <p className="text-xs text-neutral-400 mt-1 mb-5">Enter your 4-digit PIN to authenticate access level</p>

              {/* PIN Indicator Dots */}
              <div className="flex justify-center items-center gap-4 mb-5">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = enteredPin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-lg transition-all duration-200 ${
                        isFilled
                          ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 shadow-sm shadow-emerald-400/20'
                          : 'border-neutral-700 bg-neutral-800/60 text-neutral-500'
                      }`}
                    >
                      {isFilled ? (showPin ? enteredPin[index] : '•') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Error Alert */}
              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-950/80 border border-red-800 text-red-200 text-xs px-3.5 py-2.5 rounded-xl mb-5 flex items-center justify-center gap-2 font-medium leading-tight"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{pinError}</span>
                </motion.div>
              )}

              {/* On-Screen Keypad */}
              <div className="grid grid-cols-3 gap-3 mb-5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyClick(num)}
                    className="h-12 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 active:bg-neutral-600 rounded-2xl text-lg font-bold text-white transition-all cursor-pointer flex items-center justify-center shadow-sm select-none"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="h-12 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-2xl text-xs font-semibold text-neutral-400 transition-all cursor-pointer flex items-center justify-center select-none"
                  title={showPin ? "Hide Digits" : "Show Digits"}
                >
                  {showPin ? <EyeOff className="w-4 h-4 text-neutral-300" /> : <Eye className="w-4 h-4 text-neutral-400" />}
                </button>
                <button
                  onClick={() => handleKeyClick('0')}
                  className="h-12 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 active:bg-neutral-600 rounded-2xl text-lg font-bold text-white transition-all cursor-pointer flex items-center justify-center shadow-sm select-none"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="h-12 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 text-neutral-300 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center select-none"
                  title="Delete digit"
                >
                  ⌫
                </button>
              </div>

              {/* Two Access Types Info Box */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-neutral-800/90 border border-amber-500/30 rounded-2xl p-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Super Access</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">Full Control (Add/Remove Properties, Edit Deposit & Logs)</p>
                  <div className="mt-2 text-[10px] font-mono text-neutral-300 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-700/60 inline-block">
                    PIN: <strong className="text-yellow-300">{storedSuperPin}</strong>
                  </div>
                </div>

                <div className="bg-neutral-800/90 border border-blue-500/30 rounded-2xl p-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Limited Access</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">Manager Mode (Collect Rent, Send WhatsApp Receipts)</p>
                  <div className="mt-2 text-[10px] font-mono text-neutral-300 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-700/60 inline-block">
                    PIN: <strong className="text-blue-300">{storedManagerPin}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHANGE PIN MODAL */}
      <AnimatePresence>
        {showChangePinModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl text-neutral-900 border border-neutral-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 text-yellow-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-base">Security PIN Management</h3>
                    <p className="text-xs text-neutral-500 font-medium">Configure Super Admin & Manager PINs</p>
                  </div>
                </div>
                <button
                  onClick={onCloseChangePinModal}
                  className="p-1.5 hover:bg-neutral-100 text-neutral-400 rounded-xl cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangePinSubmit} className="space-y-4">
                {changePinError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{changePinError}</span>
                  </div>
                )}

                {/* Target PIN Type Selection */}
                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1.5">
                    Select Access Level PIN To Update
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetPinType('super')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetPinType === 'super'
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Super Access PIN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPinType('manager')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetPinType === 'manager'
                          ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Limited Access PIN</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                    Super Admin Master PIN (Verification)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Enter Super Admin PIN (Default: 1234)"
                    value={currentSuperPinInput}
                    onChange={(e) => setCurrentSuperPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono tracking-widest bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Requires Super Admin authority to reconfigure security credentials.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                    New 4-Digit {targetPinType === 'super' ? 'Super Access' : 'Manager Access'} PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Enter new 4-digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono tracking-widest bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Re-enter new 4-digit PIN"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono tracking-widest bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCloseChangePinModal}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-extrabold hover:bg-neutral-800 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save New PIN</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

