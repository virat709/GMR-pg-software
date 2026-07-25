import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Mail,
  Lock,
  LogIn,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import { UserRole, SecondAdmin } from '../types';
import { saveSecondAdminInDb, deleteSecondAdminInDb } from '../lib/firestoreService';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';

interface PinLockModalProps {
  isUnlocked: boolean;
  userRole: UserRole | null;
  onUnlock: (role: UserRole) => void;
  onLock: () => void;
  showChangePinModal: boolean;
  onCloseChangePinModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  secondAdmins: SecondAdmin[];
}

export const SUPER_ADMIN_EMAIL = 'gmrluxurycolivingpg@gmail.com';
export const SUPER_ADMIN_PASSWORD = 'GMRcoliving@1234';

export default function PinLockModal({
  isUnlocked,
  userRole,
  onUnlock,
  onLock,
  showChangePinModal,
  onCloseChangePinModal,
  showToast,
  secondAdmins
}: PinLockModalProps) {
  // Local combined state for instant UI updates
  const [localAdmins, setLocalAdmins] = useState<SecondAdmin[]>([]);

  // Sync props and localStorage on mount / prop update
  useEffect(() => {
    const savedLocal: SecondAdmin[] = JSON.parse(localStorage.getItem('gmr_second_admins') || '[]');
    const mergedMap = new Map<string, SecondAdmin>();

    // Add Firestore admins
    secondAdmins.forEach(a => mergedMap.set(a.email.toLowerCase(), a));
    // Add local admins
    savedLocal.forEach(a => mergedMap.set(a.email.toLowerCase(), a));

    setLocalAdmins(Array.from(mergedMap.values()));
  }, [secondAdmins]);

  // Login Form State
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Add Second Admin Form State (Super Admin Modal)
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [adminMgmtError, setAdminMgmtError] = useState<string | null>(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState<boolean>(false);

  // Firebase Auth Authenticator Helper
  const authenticateFirebaseUser = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
      } catch (createErr) {
        try {
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn('Firebase Auth fallback notice:', anonErr);
        }
      }
    }
  };

  // Strict Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    // 1. Check Super Admin Credentials (Strict Email & Password match)
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() && cleanPassword === SUPER_ADMIN_PASSWORD) {
      await authenticateFirebaseUser(cleanEmail, cleanPassword);
      setAuthLoading(false);
      setEmailInput('');
      setPasswordInput('');
      onUnlock('super_admin');
      showToast('Authenticated as Super Admin! Full Portal Access Granted.', 'success');
      return;
    }

    // 2. Check Second Admin Credentials (from combined local & Firestore list)
    const matchedSecondAdmin = localAdmins.find(
      (sa) => sa.email.trim().toLowerCase() === cleanEmail && sa.password === cleanPassword
    );

    if (matchedSecondAdmin) {
      await authenticateFirebaseUser(cleanEmail, cleanPassword);
      setAuthLoading(false);
      setEmailInput('');
      setPasswordInput('');
      onUnlock('manager');
      showToast(`Welcome ${matchedSecondAdmin.name}! Authenticated as Second Admin.`, 'info');
      return;
    }

    // 3. Fallback: Access Denied
    setAuthLoading(false);
    setAuthError('Access Denied: Invalid Email or Password. Only authorized GMR Admins can access this portal.');
  };

  // Add New Second Admin (Super Admin Only)
  const handleAddSecondAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMgmtError(null);

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminMgmtError('Please fill in all fields (Name, Email, Password).');
      return;
    }

    if (newAdminEmail.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setAdminMgmtError('This email is reserved for Super Admin.');
      return;
    }

    setIsSubmittingAdmin(true);

    const newAdmin: SecondAdmin = {
      id: 'admin_' + Math.random().toString(36).substring(2, 9),
      name: newAdminName.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      password: newAdminPassword.trim(),
      addedAt: new Date().toISOString().split('T')[0]
    };

    // 1. Instant local state update
    const updatedList = [...localAdmins.filter(a => a.email !== newAdmin.email), newAdmin];
    setLocalAdmins(updatedList);

    // 2. Instant localStorage persistence
    try {
      localStorage.setItem('gmr_second_admins', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('localStorage save notice:', e);
    }

    // 3. Cloud Firestore persistence (Fail-safe try/catch)
    try {
      await saveSecondAdminInDb(newAdmin);
    } catch (err: any) {
      console.warn('Firestore save Second Admin notice:', err?.message || err);
    }

    setIsSubmittingAdmin(false);
    showToast(`Second Admin "${newAdmin.name}" added successfully!`, 'success');
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPassword('');
  };

  // Delete Second Admin
  const handleDeleteSecondAdmin = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to revoke access for Second Admin "${name}"?`)) {
      const updatedList = localAdmins.filter(a => a.id !== id);
      setLocalAdmins(updatedList);

      try {
        localStorage.setItem('gmr_second_admins', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('localStorage delete notice:', e);
      }

      try {
        await deleteSecondAdminInDb(id);
      } catch (err: any) {
        console.warn('Firestore delete Second Admin notice:', err?.message || err);
      }

      showToast(`Revoked access for Second Admin "${name}".`, 'info');
    }
  };

  return (
    <>
      {/* 1. FULL-SCREEN GMR SECURE AUTHENTICATION OVERLAY */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
            id="gmr-auth-fullscreen-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 w-full max-w-md text-center shadow-2xl text-white relative overflow-hidden my-auto"
            >
              {/* Decorative Background Glow */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* ORIGINAL GMR LOGO IMAGE */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-md pointer-events-none" />
                <img
                  src="/logo-transparent.png"
                  alt="GMR Luxury Co-Living Logo"
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(6,88,42,0.3)]"
                />
              </div>

              {/* BRAND HEADING */}
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 tracking-wide uppercase">
                GMR Luxury Co-Living
              </h2>
              <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase mb-6 mt-0.5">
                Portal Authentication
              </p>

              {/* AUTH ERROR ALERT */}
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-950/90 border border-red-800 text-red-200 text-xs px-3.5 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-left"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="leading-tight">{authError}</span>
                </motion.div>
              )}

              {/* SECURE EMAIL & PASSWORD LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="gmrluxurycolivingpg@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-yellow-400 transition-colors font-mono"
                    />
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to GMR Portal</span>
                    </>
                  )}
                </button>
              </form>

              {/* SECURITY INFO FOOTER */}
              <div className="mt-6 pt-4 border-t border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin & Second Admin Protected</span>
                </span>
                <span className="text-neutral-500">v2.0</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SECOND ADMIN MANAGEMENT MODAL (FOR SUPER ADMIN ONLY) */}
      <AnimatePresence>
        {showChangePinModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-neutral-900 border border-neutral-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 text-yellow-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-base">Second Admin Access Control</h3>
                    <p className="text-xs text-neutral-500 font-medium">Add or Revoke Second Admin Credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseChangePinModal}
                  className="p-1.5 hover:bg-neutral-100 text-neutral-400 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ADD NEW SECOND ADMIN FORM */}
              <form onSubmit={handleAddSecondAdmin} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 mb-5 space-y-3">
                <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Create New Second Admin</span>
                </h4>

                {adminMgmtError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{adminMgmtError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Manager"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                      Gmail Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@gmail.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                    Assign Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Assign Second Admin Password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingAdmin ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Grant Second Admin Access</span>
                    </>
                  )}
                </button>
              </form>

              {/* LIST OF REGISTERED SECOND ADMINS */}
              <div>
                <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Active Second Admins ({localAdmins.length})</span>
                </h4>

                {localAdmins.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic text-center py-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                    No Second Admins added yet. Only Super Admin has access.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {localAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>{admin.name}</span>
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">
                              Second Admin
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                            {admin.email}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSecondAdmin(admin.id, admin.name)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
