import React, { useEffect } from 'react';
import { Award, RefreshCw, XCircle, ShieldCheck, Coins } from 'lucide-react';
import { Player, GameResult } from '../types';
import { soundManager } from '../utils/SoundManager';

interface PopupProps {
  result: GameResult;
  player: Player;
  wonPrize?: string;
  onRestart: () => void;
  onClose: () => void;
}

export default function Popup({ result, player, wonPrize, onRestart, onClose }: PopupProps) {
  const isWin = result === 'WIN';
  const hasAttempts = player.attemptsLeft > 0;

  useEffect(() => {
    if (isWin) {
      soundManager.playWinFanfare();
    } else {
      soundManager.playFailSound();
    }
  }, [isWin]);

  const handleAction = () => {
    soundManager.playClick();
    onRestart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      {/* Glow shadow depending on Win/Lose */}
      <div
        className={`relative w-full max-w-md p-8 rounded-3xl text-center glass-panel-dark text-white border-2 ${
          isWin ? 'border-amber-400 glow-gold' : 'border-red-500/50 glow-red-white'
        } transition-all duration-500`}
      >
        {/* Decorative elements */}
        {isWin && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-4 border-white flex items-center justify-center shadow-2xl animate-bounce">
            <span className="text-4xl filter drop-shadow">🏆</span>
          </div>
        )}
        {!isWin && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-4 border-white flex items-center justify-center shadow-2xl">
            <span className="text-4xl filter drop-shadow">😢</span>
          </div>
        )}

        <div className="mt-8 mb-6">
          <h2
            className={`text-3xl font-extrabold tracking-tight uppercase font-display mb-1 ${
              isWin ? 'text-amber-400 animate-pulse' : 'text-red-500'
            }`}
          >
            {isWin ? '🎉 SELAMAT!' : '😢 WAKTU HABIS'}
          </h2>
          <p className="text-xs font-bold text-white/60 tracking-widest uppercase font-mono">
            {isWin ? 'Berhasil Memanjat Pinang!' : 'Jangan Menyerah, Coba Lagi!'}
          </p>
        </div>

        {/* Stats card */}
        <div className="bg-black/55 rounded-2xl border border-white/10 p-5 text-left space-y-3 mb-6 font-sans">
          {/* Brand Name */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-red-200 tracking-wider uppercase">Nama Brand</span>
            <span className="text-sm font-bold text-white tracking-wide">{player.brandName}</span>
          </div>

          {/* Member ID */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-red-200 tracking-wider uppercase">ID Member</span>
            <span className="text-sm font-bold text-white tracking-wide">{player.memberId}</span>
          </div>

          {/* Status */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-red-200 tracking-wider uppercase">Status</span>
            <span
              className={`text-xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md ${
                isWin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isWin ? 'BERHASIL MENCAPAI PUNCAK' : 'BELUM BERHASIL'}
            </span>
          </div>

          {/* Hadiah */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-red-200 tracking-wider uppercase">Hadiah</span>
            <span
              className={`text-base font-black tracking-wide flex items-center gap-1 ${
                isWin ? 'text-amber-400 animate-pulse' : 'text-white/60'
              }`}
            >
              <Coins className="w-4.5 h-4.5 shrink-0" />
              {isWin ? (wonPrize || 'Rp 1.000.000') : 'Rp 0'}
            </span>
          </div>

          {/* Sisa Kesempatan */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-bold text-red-200 tracking-wider uppercase">Sisa Kesempatan</span>
            <span
              className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-full ${
                player.attemptsLeft > 0 ? 'bg-white/10 text-white' : 'bg-red-950/70 text-red-400 border border-red-500/30'
              }`}
            >
              {player.attemptsLeft} / 3
            </span>
          </div>
        </div>

        {/* Warning if no attempts left */}
        {!hasAttempts && (
          <div className="p-3 bg-red-950/70 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300 font-bold mb-6 text-left animate-pulse">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>Kesempatan bermain Anda telah habis.</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-3">
          {hasAttempts ? (
            <button
              onClick={handleAction}
              className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl border-b-4 flex items-center justify-center gap-2 font-display ${
                isWin
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 border-amber-800 glow-gold cursor-pointer active:scale-95'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 border-red-800 glow-red-hover cursor-pointer active:scale-95'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${!isWin ? 'animate-spin' : ''}`} />
              {isWin ? 'MAIN LAGI' : 'COBA LAGI'}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 bg-neutral-800 text-neutral-400 border border-white/5 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 font-display cursor-not-allowed"
            >
              KESEMPATAN BERMAIN HABIS
            </button>
          )}

          {/* Change Account button to let users try with another ID if they want */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-2.5 text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest font-display transition-colors hover:underline cursor-pointer"
          >
            Keluar / Ganti ID Member
          </button>
        </div>
      </div>
    </div>
  );
}
