import React, { useState } from 'react';
import { Award, ShieldAlert, Play, Volume2, VolumeX } from 'lucide-react';
import { Player } from '../types';
import { soundManager } from '../utils/SoundManager';
// @ts-ignore
import bgImg from '../assets/images/panjat_pinang_bg_1783722628309.jpg';

interface LoginScreenProps {
  onLoginSuccess: (player: Player) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function LoginScreen({ onLoginSuccess, isMuted, onToggleMute }: LoginScreenProps) {
  const [brandName, setBrandName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();

    if (!brandName.trim() || !memberId.trim()) {
      setError('Harap isi Nama Brand dan ID Member Anda!');
      return;
    }

    // Attempt to load from localStorage to preserve previous attempts of this member
    const storageKey = `panjat_pinang_member_${memberId.trim().toUpperCase()}`;
    const savedAttempts = localStorage.getItem(storageKey);
    let attemptsLeft = 3;
    if (savedAttempts !== null) {
      attemptsLeft = parseInt(savedAttempts, 10);
    } else {
      localStorage.setItem(storageKey, '3');
    }

    onLoginSuccess({
      brandName: brandName.trim(),
      memberId: memberId.trim().toUpperCase(),
      attemptsLeft,
    });
  };

  return (
    <div
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-cover bg-center select-none"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* 20% Dark overlay as requested */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Sunbeam ambient glow */}
      <div className="absolute inset-0 bg-radial-[circle_at_center_rgba(239,68,68,0.15)] pointer-events-none" />

      {/* Sound Controller Button top right */}
      <button
        onClick={() => {
          onToggleMute();
          soundManager.playClick();
        }}
        className="absolute top-4 right-4 z-20 p-3 bg-red-600/90 hover:bg-red-700 text-white rounded-full transition-all border border-amber-400/40 shadow-lg cursor-pointer"
        aria-label="Toggle Sound"
        id="sound-toggle"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Beautiful Red-White Ribbon Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none z-10 hidden sm:block">
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1.5 w-48 -rotate-45 -translate-x-12 translate-y-6 border-b border-white shadow-md font-display tracking-widest uppercase">
          17 Agustus
        </div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10 hidden sm:block">
        <div className="bg-white text-red-600 text-xs font-bold text-center py-1.5 w-48 rotate-45 translate-x-12 translate-y-6 border-b border-red-200 shadow-md font-display tracking-widest uppercase">
          INDONESIA
        </div>
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-0">
        <div className="glass-panel text-white p-8 rounded-3xl glow-red-white flex flex-col items-center text-center relative overflow-hidden">
          {/* Internal glowing decoration */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-600/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/30 rounded-full blur-2xl pointer-events-none" />

          {/* 🇮🇩 Logo Indonesia - Beautiful Custom SVG */}
          <div className="mb-6 filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.4)] animate-float" id="logo-emblem">
            <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Golden Shield Guard */}
              <path d="M50 5 L85 20 C85 55, 70 82, 50 95 C30 82, 15 55, 15 20 L50 5 Z" fill="url(#goldGradient)" stroke="#F59E0B" strokeWidth="2" />
              {/* Inner Shield (Red/White flag split) */}
              <path d="M50 10 L80 23 C80 52, 67 76, 50 88 L50 10 Z" fill="#FFFFFF" />
              <path d="M50 10 L20 23 C20 52, 33 76, 50 88 L50 10 Z" fill="#DC2626" />
              {/* Divider strip */}
              <line x1="20" y1="49" x2="80" y2="49" stroke="#E5E7EB" strokeWidth="1.5" />
              {/* Gold Star in the center */}
              <polygon points="50,34 53,42 62,42 55,47 57,56 50,51 43,56 45,47 38,42 47,42" fill="#FBBF24" stroke="#D97706" strokeWidth="0.5" />
              {/* Golden Garland decorations */}
              <circle cx="50" cy="50" r="41" stroke="#FBBF24" strokeDasharray="3,7" strokeWidth="2.5" fill="none" />
              
              <defs>
                <linearGradient id="goldGradient" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FBBF24" />
                  <stop offset="0.5" stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Logo Title */}
          <p className="text-xs font-bold tracking-widest text-amber-300 uppercase font-display mb-1 flex items-center gap-1.5 drop-shadow">
            <Award className="w-4 h-4 text-amber-400" /> EVENT SPESIAL HUT RI 17 AGUSTUS
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display mb-2 drop-shadow-md">
            LOMBA PANJAT PINANG
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-full mb-6 shadow" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full text-left space-y-5" id="login-form">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-200 mb-1.5 font-sans">
                Nama Brand
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 focus:border-red-500 rounded-xl text-white font-medium outline-none transition-all placeholder:text-white/20 font-sans tracking-wide shadow-inner focus:ring-2 focus:ring-red-600/30"
                  required
                  id="brand-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-200 mb-1.5 font-sans">
                ID Member
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => {
                    setMemberId(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 focus:border-red-500 rounded-xl text-white font-medium outline-none transition-all placeholder:text-white/20 font-sans tracking-wide shadow-inner focus:ring-2 focus:ring-red-600/30"
                  required
                  id="member-input"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/75 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-200 font-medium animate-shake-climb">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Play Button */}
            <button
              type="submit"
              className="w-full mt-2 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 glow-red-hover active:scale-95 border-b-4 border-red-800 shadow-xl flex items-center justify-center gap-2 text-base font-display cursor-pointer"
              id="start-play-btn"
            >
              <Play className="w-5 h-5 fill-white" />
              MULAI BERMAIN
            </button>
          </form>

          {/* Footer Ribbon Text */}
          <div className="mt-8 text-[10px] text-white/50 tracking-wider font-mono font-medium uppercase border-t border-white/10 pt-4 w-full">
            Merdeka! Sekali Merdeka Tetap Merdeka!
          </div>
        </div>
      </div>
    </div>
  );
}
