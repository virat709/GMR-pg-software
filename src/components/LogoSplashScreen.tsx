import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LogoSplashScreenProps {
  isVisible: boolean;
  onFinish?: () => void;
}

export default function LogoSplashScreen({ isVisible, onFinish }: LogoSplashScreenProps) {
  // Leaf parts of the ACTUAL GMR logo flying in from outer screen corners
  const leafParts = [
    {
      id: 'top-left-leaf',
      initial: { x: '-60vw', y: '-60vh', rotate: -60, scale: 0.2, opacity: 0 },
      animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
      clipPath: 'polygon(0% 0%, 55% 0%, 50% 50%, 0% 55%)',
      delay: 0.05
    },
    {
      id: 'top-right-leaf',
      initial: { x: '60vw', y: '-60vh', rotate: 60, scale: 0.2, opacity: 0 },
      animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
      clipPath: 'polygon(45% 0%, 100% 0%, 100% 55%, 50% 50%)',
      delay: 0.15
    },
    {
      id: 'bottom-left-leaf',
      initial: { x: '-60vw', y: '60vh', rotate: -45, scale: 0.2, opacity: 0 },
      animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
      clipPath: 'polygon(0% 45%, 50% 50%, 55% 100%, 0% 100%)',
      delay: 0.25
    },
    {
      id: 'bottom-right-leaf',
      initial: { x: '60vw', y: '60vh', rotate: 45, scale: 0.2, opacity: 0 },
      animate: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
      clipPath: 'polygon(50% 50%, 100% 45%, 100% 100%, 45% 100%)',
      delay: 0.35
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="gmr-white-logo-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={onFinish}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#f4f8f5] to-[#ffffff] text-[#06582a] select-none overflow-hidden cursor-pointer backdrop-blur-3xl"
        >
          {/* Pristine White Circular Aura Backdrop */}
          <div className="absolute w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] bg-white rounded-full shadow-[0_20px_80px_rgba(6,88,42,0.08)] border border-emerald-100/80 pointer-events-none" />
          <div className="absolute w-[340px] h-[340px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

          {/* MAIN ANIMATION STAGE */}
          <div className="relative flex flex-col items-center justify-center text-center px-4">
            
            {/* LOGO ASSEMBLY CONTAINER */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              
              {/* Circular Emerald & Gold Ring Pulse on Assembly */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.25, 1.5], opacity: [0, 0.6, 0] }}
                transition={{ delay: 0.75, duration: 0.7, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-[#06582a]/40 shadow-[0_0_40px_rgba(6,88,42,0.2)] pointer-events-none"
              />

              {/* 4 CORNER LEAVES OF THE ACTUAL LOGO FLYING IN ON PRISTINE WHITE BACKDROP */}
              <div className="absolute inset-0 flex items-center justify-center">
                {leafParts.map((part) => (
                  <motion.div
                    key={part.id}
                    initial={part.initial}
                    animate={part.animate}
                    transition={{
                      duration: 0.65,
                      delay: part.delay,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    style={{ clipPath: part.clipPath }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src="/logo-transparent.png"
                      alt="GMR Logo Leaf Part"
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Full Complete Transparent Logo Lock-In */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <img
                  src="/logo-transparent.png"
                  alt="GMR Luxury Co-Living Official Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>

            {/* PG TITLE & TAGLINE EMERGENCE BELOW */}
            <div className="mt-6 space-y-1.5 overflow-hidden">
              {/* PG Name */}
              <motion.h1
                initial={{ y: 35, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl sm:text-3xl font-black text-[#06582a] tracking-wider uppercase"
              >
                GMR Luxury Co-Living
              </motion.h1>

              {/* Tagline Script */}
              <motion.p
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl sm:text-3xl font-script text-[#06582a] font-bold tracking-wide"
              >
                Feels like home
              </motion.p>
            </div>

            {/* Click anywhere hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              className="mt-8 text-[10px] text-[#1e633d] font-semibold tracking-widest uppercase"
            >
              Click anywhere to continue
            </motion.p>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
