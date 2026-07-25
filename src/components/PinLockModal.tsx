import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Mail,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { UserRole } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';

interface PinLockModalProps {
  isUnlocked: boolean;
  userRole: UserRole | null;
  onUnlock: (role: UserRole) => void;
  onLock: () => void;
  showChangePinModal: boolean;
  onCloseChangePinModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export default function PinLockModal({
  isUnlocked,
  userRole,
  onUnlock,
  onLock,
  showChangePinModal,
  onCloseChangePinModal,
  showToast
}: PinLockModalProps) {
  // Selected Access Role Level
  const [loginRole, setLoginRole] = useState<UserRole>('super_admin');

  // Email & Password Form State
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firebase Email & Password Authentication Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email address and password.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast(`Account registered! Authenticated as ${loginRole === 'super_admin' ? 'Super Admin' : 'Second Admin'}`, 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast(`Welcome! Logged in as ${loginRole === 'super_admin' ? 'Super Admin' : 'Second Admin'}`, 'success');
      }
      setAuthLoading(false);
      onUnlock(loginRole);
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err.message || 'Firebase Authentication failed. Please verify credentials.');
    }
  };

  // Firebase Google Sign-In Handler
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      showToast(`Signed in as ${user.displayName || user.email} (${loginRole === 'super_admin' ? 'Super Admin' : 'Second Admin'})`, 'success');
      setAuthLoading(false);
      onUnlock(loginRole);
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err.message || 'Google Sign-In cancelled or popup blocked.');
    }
  };

  return (
    <>
      {/* FULL-SCREEN GMR BRANDED AUTHENTICATION OVERLAY */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
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

              {/* BRAND HEADING & TAGLINE */}
              <h2 className="text-xl sm:text-2xl font-black text-[#06582a] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 tracking-wide uppercase">
                GMR Luxury Co-Living
              </h2>
              <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase mb-5 mt-0.5">
                Feels like home • Management System
              </p>

              {/* SELECT ACCESS ROLE LEVEL */}
              <div className="text-left mb-4">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide block mb-1.5">
                  Select Access Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginRole('super_admin')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      loginRole === 'super_admin'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Super Admin</span>
                    <span className="text-[9px] font-normal text-neutral-400">All Access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginRole('manager')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      loginRole === 'manager'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-md shadow-blue-500/10'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span>Second Admin</span>
                    <span className="text-[9px] font-normal text-neutral-400">Limited Access</span>
                  </button>
                </div>
              </div>

              {/* AUTH ERROR DISPLAY */}
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

              {/* EMAIL & PASSWORD AUTHENTICATION FORM */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5 text-left">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@gmrluxury.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  ) : isRegisterMode ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register & Open Portal</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In & Open Portal</span>
                    </>
                  )}
                </button>
              </form>

              {/* MODE SWITCHER LINK */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  {isRegisterMode ? "Already have an account? Sign In" : "Need a new account? Register"}
                </button>
              </div>

              {/* GOOGLE SIGN-IN DIVIDER */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-neutral-800 w-full" />
                <span className="bg-neutral-900 px-2.5 text-[10px] font-bold uppercase text-neutral-500 shrink-0">OR</span>
                <div className="border-t border-neutral-800 w-full" />
              </div>

              {/* GOOGLE SIGN-IN BUTTON */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
