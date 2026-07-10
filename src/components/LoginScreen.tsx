/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Play, Award, User, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';
import { audioEngine } from './AudioEngine';

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
  backgroundUrl: string;
}

export default function LoginScreen({ onLogin, backgroundUrl }: LoginScreenProps) {
  const [brandName, setBrandName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!brandName.trim()) {
      setError('Nama Brand wajib diisi.');
      return;
    }
    if (!memberId.trim()) {
      setError('ID Member wajib diisi.');
      return;
    }

    // Play a friendly intro sound
    audioEngine.playCheerSound();

    // Trigger login
    onLogin({
      brandName: brandName.trim(),
      memberId: memberId.trim().toUpperCase(),
    });
  };

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
      id="login_screen_container"
    >
      {/* Absolute overlay to add slight festive red hue and ambient blur outside the card */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Main Glassmorphic Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md glass-panel-dark rounded-3xl p-8 text-center shadow-2xl overflow-hidden glow-merah border-t border-red-500/30"
        id="login_glass_box"
      >
        {/* Sparkle background elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-yellow-400 to-white" />

        {/* 🇮🇩 Elegant Indonesia Logo & Shield */}
        <div className="mb-6 flex justify-center" id="logo_emblem_wrapper">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-red-600 to-amber-300 p-1 shadow-lg"
          >
            <div className="flex h-full w-full flex-col overflow-hidden rounded-full border-4 border-amber-400 bg-white shadow-inner">
              {/* Top: Red */}
              <div className="h-1/2 bg-red-600 w-full flex items-end justify-center pb-0.5">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">RI</span>
              </div>
              {/* Bottom: White */}
              <div className="h-1/2 bg-white w-full flex items-start justify-center pt-0.5">
                <span className="text-[10px] font-bold text-red-600 tracking-widest">79</span>
              </div>
            </div>
            {/* Golden Star Banner badge */}
            <div className="absolute -bottom-1 right-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-black uppercase shadow border border-amber-300 flex items-center gap-0.5">
              <Award className="h-2.5 w-2.5" /> HUT RI
            </div>
          </motion.div>
        </div>

        {/* Title details */}
        <div className="mb-8" id="login_titles">
          <h1 className="font-display text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 drop-shadow">
            LOMBA BALAP KARUNG
          </h1>
          <p className="mt-2 font-sans text-xs font-semibold tracking-[0.2em] text-red-400 uppercase">
            EVENT SPESIAL HUT RI 17 AGUSTUS
          </p>
          <div className="mx-auto mt-3 h-0.5 w-24 bg-gradient-to-r from-red-600 via-amber-400 to-white" />
        </div>

        {/* Error notification */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-red-950/80 border border-red-500/50 p-3 text-left text-xs text-red-200"
            id="login_error"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left" id="login_form">
          {/* Brand Name Input */}
          <div className="relative" id="brand_input_group">
            <label className="block mb-1.5 text-[11px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Nama Brand
            </label>
            <div className="relative">
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3.5 text-sm font-medium text-white shadow-inner outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-1 focus:ring-amber-400/30"
                id="brandName"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Member ID Input */}
          <div className="relative" id="member_input_group">
            <label className="block mb-1.5 text-[11px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> ID Member
            </label>
            <div className="relative">
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3.5 text-sm font-mono text-white shadow-inner outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-1 focus:ring-amber-400/30"
                id="memberId"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-display text-sm font-bold tracking-widest uppercase shadow-lg glow-emas flex items-center justify-center gap-2 cursor-pointer border-t border-white/20"
            id="start_playing_btn"
          >
            <Play className="h-4 w-4 fill-current" />
            MULAI BERMAIN
          </motion.button>
        </form>

        {/* Decorative footer */}
        <div className="mt-8 text-[10px] text-gray-400 font-medium tracking-wider" id="login_footer">
          DIRGAHAYU REPUBLIK INDONESIA • BHINNEKA TUNGGAL IKA
        </div>
      </motion.div>
    </div>
  );
}
