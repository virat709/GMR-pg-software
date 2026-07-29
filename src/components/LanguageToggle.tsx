import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageToggleProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export default function LanguageToggle({ variant = 'full', className = '' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center justify-center p-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/80 shadow-sm ${className}`}
        title={language === 'en' ? 'Switch to Telugu (తెలుగు)' : 'Switch to English'}
      >
        <Languages className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="ml-1.5 font-semibold text-[11px]">
          {language === 'en' ? 'తెలుగు' : 'EN'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
        language === 'te'
          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/70 shadow-sm'
          : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 border border-neutral-700/60'
      } ${className}`}
      title="Switch App Language (English / తెలుగు)"
    >
      <div className="flex items-center gap-1.5">
        <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{language === 'en' ? 'English' : 'తెలుగు'}</span>
      </div>
      <span className="text-[10px] bg-neutral-900/60 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">
        {language === 'en' ? 'తెలుగు' : 'EN'}
      </span>
    </button>
  );
}
