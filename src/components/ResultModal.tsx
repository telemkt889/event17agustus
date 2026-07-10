/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, RefreshCw, XCircle, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultModalProps {
  isOpen: boolean;
  isSuccess: boolean;
  brandName: string;
  memberId: string;
  attemptsLeft: number;
  onRestart: () => void;
  onLogout: () => void;
}

export default function ResultModal({
  isOpen,
  isSuccess,
  brandName,
  memberId,
  attemptsLeft,
  onRestart,
  onLogout,
}: ResultModalProps) {

  useEffect(() => {
    if (isOpen && isSuccess) {
      // Fire beautiful celebratory confetti
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#e11d48', '#ffffff', '#fbbf24', '#f59e0b']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#e11d48', '#ffffff', '#fbbf24', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen, isSuccess]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        id="result_modal_overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md glass-panel-dark rounded-3xl p-8 text-center shadow-2xl overflow-hidden glow-emas border-2 border-amber-400/40"
          id="result_modal_content"
        >
          {/* Header decorative strip */}
          <div className={`absolute top-0 left-0 right-0 h-2 ${isSuccess ? 'bg-gradient-to-r from-amber-400 via-red-500 to-amber-400' : 'bg-red-600'}`} />

          {/* Icon Badge */}
          <div className="flex justify-center mb-6">
            {isSuccess ? (
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 1.5, duration: 0.8 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-1.5 shadow-lg glow-emas"
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-black/40 border-2 border-amber-300">
                  <Trophy className="h-10 w-10 text-amber-300" />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-800 p-1.5 shadow-lg border-2 border-red-500"
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-black/40 border-2 border-red-400">
                  <Clock className="h-10 w-10 text-red-400" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Outcome Heading */}
          <div className="mb-6">
            <h2 className={`font-display text-3xl font-extrabold tracking-wide uppercase ${isSuccess ? 'text-amber-400 drop-shadow' : 'text-red-500'}`}>
              {isSuccess ? '🎉 SELAMAT!' : '😢 WAKTU HABIS'}
            </h2>
            <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">
              Hasil Pertandingan Lomba
            </p>
          </div>

          {/* Results Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <span className="text-xs text-gray-400 font-medium tracking-wide">Nama Brand</span>
              <span className="text-sm font-bold text-white tracking-wide">{brandName}</span>
            </div>

            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <span className="text-xs text-gray-400 font-medium tracking-wide">ID Member</span>
              <span className="text-sm font-mono font-bold text-amber-300">{memberId}</span>
            </div>

            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <span className="text-xs text-gray-400 font-medium tracking-wide">Status</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {isSuccess ? 'BERHASIL MENYELESAIKAN LOMBA' : 'BELUM BERHASIL'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <span className="text-xs text-gray-400 font-medium tracking-wide">Hadiah</span>
              <span className={`text-xl font-extrabold font-display tracking-tight ${isSuccess ? 'text-amber-400 glow-emas' : 'text-gray-400'}`}>
                {isSuccess ? 'Rp5.000' : 'Rp0'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium tracking-wide">Sisa Kesempatan</span>
              <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">
                {attemptsLeft} / 3
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {attemptsLeft > 0 ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRestart}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-display text-sm font-bold tracking-widest uppercase shadow-lg glow-emas flex items-center justify-center gap-2 cursor-pointer border-t border-white/20"
                id="restart_btn"
              >
                <RefreshCw className="h-4 w-4" />
                MAIN LAGI
              </motion.button>
            ) : (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-400 mb-2">
                Kesempatan bermain Anda telah habis.
              </div>
            )}

            <button
              onClick={onLogout}
              className="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 font-display text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              id="logout_btn"
            >
              <XCircle className="h-4 w-4" />
              KEMBALI KE LOGIN
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
