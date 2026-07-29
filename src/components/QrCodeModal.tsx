import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Copy, Printer, Check, ExternalLink, X, Sparkles, Building2 } from 'lucide-react';
import { Property } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  selectedPropertyId: string;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export default function QrCodeModal({
  isOpen,
  onClose,
  properties,
  selectedPropertyId,
  showToast
}: QrCodeModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const registrationUrl = `${currentOrigin}/?register=true`;
  
  // High quality QR Code image generator URL via Google Chart API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}&color=06582a`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    showToast(t('linkCopied'), 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const activePropName = selectedPropertyId === 'all' 
    ? 'All GMR PG Branches' 
    : (properties.find(p => p.id === selectedPropertyId)?.name || 'GMR Luxury Co-Living');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-neutral-100 text-neutral-900 text-center relative max-h-[90vh] overflow-y-auto"
          id="qr-code-modal-card"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* PRINTABLE POSTER CONTENT */}
          <div className="space-y-5" id="printable-qr-poster">
            
            {/* Poster Header */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 mx-auto flex items-center justify-center shadow-md border border-emerald-600/30">
                <img src="/logo-transparent.png" alt="GMR PG Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-black text-neutral-900 uppercase tracking-wide">
                GMR Luxury Co-Living
              </h2>
              <p className="text-xs text-emerald-700 font-bold tracking-wider font-script">
                Feels like home
              </p>
              <div className="inline-block bg-neutral-100 text-neutral-700 font-semibold text-[11px] px-3 py-1 rounded-full border border-neutral-200 mt-1">
                🏢 {activePropName}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50/50 p-6 rounded-3xl border-2 border-emerald-500/20 shadow-inner inline-block relative group">
              <img
                src={qrImageUrl}
                alt="Tenant Self Registration QR Code"
                className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain rounded-xl shadow-md bg-white p-2"
              />
              <div className="mt-3 text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Scan Mobile QR for Self Admission</span>
              </div>
            </div>

            {/* Bilingual Instructions */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-left space-y-1.5 text-xs">
              <p className="font-bold text-neutral-800 flex items-center gap-1.5">
                <span>📱 English:</span>
                <span className="font-normal text-neutral-600">Scan QR Code with mobile camera to fill admission form.</span>
              </p>
              <p className="font-bold text-neutral-800 flex items-center gap-1.5">
                <span>📱 తెలుగు:</span>
                <span className="font-normal text-neutral-600">అడ్మిషన్ ఫారమ్‌ను పూరించడానికి మొబైల్ కెమెరాతో QR కోడ్‌ని స్కాన్ చేయండి.</span>
              </p>
            </div>

            {/* Action Control Buttons (Hidden when printing poster) */}
            <div className="space-y-2 pt-2 print:hidden">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-200"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-600" />}
                  <span>{copied ? 'Copied!' : t('copyLink')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open(registrationUrl, '_blank')}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-200"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Open Form</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>{t('printPoster')}</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
