import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
// @ts-ignore
import bgImg from '../assets/images/panjat_pinang_bg_1783722628309.jpg';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LOAD_STEPS = [
  'Menyiapkan Batang Pinang...',
  'Melumuri Oli dan Minyak Pelicin...',
  'Menggantung Hadiah di Puncak...',
  'Mempersiapkan Peserta Lomba...',
  'Menertibkan Penonton Sorak...',
  'BERSIAPLAH! MERDEKA!! 🇮🇩'
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const duration = 2400; // total 2.4 seconds loading
    const intervalTime = 40;
    const increment = (100 / duration) * intervalTime;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Distribute steps over progress
    const stepRatio = 100 / LOAD_STEPS.length;
    const currentStep = Math.min(
      Math.floor(progress / stepRatio),
      LOAD_STEPS.length - 1
    );
    setStepIndex(currentStep);

    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-cover bg-center select-none"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* 20% Dark Overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Flag banners cascading from top */}
      <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-red-600 via-white to-red-600 shadow-md" />

      {/* Floating Sparkles ambient */}
      <div className="absolute inset-0 bg-radial-[circle_at_center_rgba(239,68,68,0.2)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* Glowing Badge circle */}
        <div className="relative mb-8">
          {/* Circular outer progress pulse */}
          <div className="absolute -inset-4 rounded-full border-4 border-amber-400/50 animate-ping opacity-75" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center shadow-2xl border-4 border-white glow-red-white">
            <span className="text-4xl filter drop-shadow">🇮🇩</span>
          </div>
        </div>

        {/* LOADING TEXT & LOGO */}
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-display mb-1 text-center drop-shadow">
          DIRGAHAYU REPUBLIK INDONESIA
        </h2>
        <p className="text-sm font-bold text-amber-400 font-display tracking-widest mb-8 text-center drop-shadow">
          PERAYAAN HUT RI 17 AGUSTUS
        </p>

        {/* Loading card */}
        <div className="w-full bg-black/45 border border-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col">
          {/* Progress bar info */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-red-200 tracking-wider uppercase font-display flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              {LOAD_STEPS[stepIndex]}
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-red-500 rounded-full transition-all duration-75 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Animated highlight stripes */}
              <div className="absolute inset-0 bg-linear-[45deg_rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent] bg-[length:16px_16px] animate-[pulse_1.5s_infinite]" />
            </div>
          </div>
        </div>

        {/* Proverb sub-line */}
        <p className="mt-8 text-xs font-bold text-white/60 tracking-wider uppercase font-display animate-pulse">
          "PANTANG NYERAH SEBELUM PUNCAK!"
        </p>
      </div>
    </div>
  );
}
