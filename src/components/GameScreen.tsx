/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Award, User, RefreshCw, Zap, ArrowRight, Play, Volume2 } from 'lucide-react';
import { UserSession } from '../types';
import { audioEngine } from './AudioEngine';
import ResultModal from './ResultModal';

interface GameScreenProps {
  session: UserSession;
  attemptsLeft: number;
  onSpendAttempt: () => void;
  onLogout: () => void;
  backgroundUrl: string;
}

interface DustParticle {
  id: number;
  x: number;
  y: number;
  scale: number;
}

export default function GameScreen({
  session,
  attemptsLeft,
  onSpendAttempt,
  onLogout,
  backgroundUrl,
}: GameScreenProps) {
  // Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // Ready 3-2-1 countdown
  const [timer, setTimer] = useState(10); // 10 seconds timer
  const [progress, setProgress] = useState(0); // 0 to 100% of track
  const [isJumping, setIsJumping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [cameraShake, setCameraShake] = useState(false);
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [hasStartedAttemptsReduction, setHasStartedAttemptsReduction] = useState(false);

  // Sound enablement helper
  const [isMuted, setIsMuted] = useState(false);

  const particleIdCounter = useRef(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle SPACE BAR on keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling page
        triggerJump();
      }
    };

    if (isPlaying && !isFinished && !isFailed) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isFinished, isFailed, isJumping, progress]);

  // Handle Countdown before game starts
  const startCountdown = () => {
    if (attemptsLeft <= 0) {
      alert('Kesempatan bermain Anda telah habis.');
      return;
    }
    setCountdown(3);
    setProgress(0);
    setTimer(10);
    setIsFinished(false);
    setIsFailed(false);
    setIsPlaying(false);
    setShowResult(false);
    setHasStartedAttemptsReduction(false);
  };

  // Countdown countdown ticking
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const id = setTimeout(() => {
        setCountdown(countdown - 1);
        audioEngine.playLandSound(); // rhythmic beep
      }, 1000);
      return () => clearTimeout(id);
    } else {
      // Start the game!
      setIsPlaying(true);
      setCountdown(null);
      // Consume an attempt as soon as the game play active session starts
      onSpendAttempt();
      setHasStartedAttemptsReduction(true);
      audioEngine.playCheerSound();
    }
  }, [countdown]);

  // Timer interval countdown
  useEffect(() => {
    if (isPlaying && !isFinished && !isFailed) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Time is out!
            clearInterval(timerIntervalRef.current!);
            handleFailure();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, isFinished, isFailed]);

  // Jump animation handler
  const triggerJump = () => {
    if (!isPlaying || isJumping || isFinished || isFailed) return;

    setIsJumping(true);
    audioEngine.playJumpSound();

    // Advance progress
    const nextProgress = Math.min(100, progress + 10);
    setProgress(nextProgress);

    // After animation duration, land the character
    setTimeout(() => {
      setIsJumping(false);
      audioEngine.playLandSound();
      triggerLandingEffects(nextProgress);

      // Check if finished
      if (nextProgress >= 100) {
        handleSuccess();
      }
    }, 320); // match framer motion transition
  };

  const triggerLandingEffects = (currentProgress: number) => {
    // 1. Camera Shake
    setCameraShake(true);
    setTimeout(() => setCameraShake(false), 150);

    // 2. Generate dust particles relative to current progress position (rough calculation)
    const container = document.getElementById('track_arena');
    if (container) {
      const rect = container.getBoundingClientRect();
      const leftOffset = (currentProgress / 100) * (rect.width - 100) + 50; // approximate center of character
      
      const newParticles: DustParticle[] = Array.from({ length: 4 }).map(() => ({
        id: particleIdCounter.current++,
        x: leftOffset + (Math.random() * 40 - 20),
        y: rect.height - 42 + (Math.random() * 10 - 5),
        scale: Math.random() * 0.8 + 0.4,
      }));

      setDustParticles((prev) => [...prev, ...newParticles]);

      // Remove after fade
      setTimeout(() => {
        setDustParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
      }, 600);
    }
  };

  const handleSuccess = () => {
    setIsFinished(true);
    setIsPlaying(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    audioEngine.playCheerSound();
    
    // Brief delay before showing results modal to enjoy the visual confetti and success state
    setTimeout(() => {
      setShowResult(true);
    }, 1200);
  };

  const handleFailure = () => {
    setIsFailed(true);
    setIsPlaying(false);
    setTimeout(() => {
      setShowResult(true);
    }, 1200);
  };

  const handleRestart = () => {
    setShowResult(false);
    startCountdown();
  };

  // Helper to get remaining attempts display
  const currentAttemptsDisplay = hasStartedAttemptsReduction ? attemptsLeft : attemptsLeft;

  return (
    <div 
      className={`relative min-h-screen flex flex-col justify-between overflow-hidden bg-cover bg-center text-white ${cameraShake ? 'animate-bounce' : ''}`}
      style={{ backgroundImage: `url(${backgroundUrl})` }}
      id="game_screen_container"
    >
      {/* Absolute overlay for ambient blur & lighting */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

      {/* TOP HEADER STATUS PANEL (Glassmorphism) */}
      <header className="relative z-10 w-full max-w-5xl mx-auto mt-4 px-4" id="game_header">
        <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-wrap gap-4 items-center justify-between border-t border-white/10 shadow-lg">
          
          {/* User Info & Brand */}
          <div className="flex items-center gap-3" id="header_user_details">
            <div className="h-10 w-10 rounded-xl bg-red-600/35 border border-red-500/50 flex items-center justify-center text-red-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Nama Brand</div>
              <div className="text-sm font-extrabold tracking-wide text-white">{session.brandName}</div>
            </div>
            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold text-amber-400 tracking-widest uppercase">ID Member</div>
              <div className="text-sm font-mono font-bold text-amber-300">{session.memberId}</div>
            </div>
          </div>

          {/* TIMER CUE */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2 rounded-xl" id="header_timer">
            <Clock className={`h-5 w-5 ${timer <= 3 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
            <span className="font-mono text-sm font-extrabold tracking-wider">
              ⏱ TIMER : <span className={`text-base font-black ${timer <= 3 ? 'text-red-500' : 'text-amber-400'}`}>{timer} DETIK</span>
            </span>
          </div>

          {/* ATTEMPTS LEFT COUNTER */}
          <div className="flex items-center gap-3" id="header_attempts">
            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Kesempatan Bermain</div>
              <div className="text-sm font-black text-white">
                <span className="text-amber-400 font-display">{attemptsLeft}</span> / 3
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold font-display">
              {attemptsLeft}
            </div>
          </div>
        </div>
      </header>

      {/* MID ARENA (Race track and character) */}
      <main className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center px-4 py-6" id="game_arena">
        
        {/* Dynamic Countdown start overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center" id="countdown_overlay">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="glass-panel-dark rounded-3xl p-10 text-center max-w-xs border border-amber-400/30 glow-emas"
            >
              <h3 className="text-sm font-extrabold tracking-widest text-red-500 uppercase mb-2">BALAP KARUNG</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Siap-siap di garis start!</p>
              
              <motion.div 
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600"
              >
                {countdown}
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Start Game prompt when idle (not yet started) */}
        {!isPlaying && countdown === null && !isFinished && !isFailed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center" id="ready_prompt_overlay">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel-dark rounded-3xl p-8 text-center max-w-md border border-white/10 shadow-2xl"
            >
              <h3 className="font-display text-2xl font-extrabold text-amber-400 tracking-wide uppercase mb-1">
                LOMBA BALAP KARUNG
              </h3>
              <p className="text-xs text-gray-300 uppercase tracking-widest mb-6">
                Event Spesial Hari Kemerdekaan Indonesia 17 Agustus
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-xs text-gray-300 space-y-2.5 mb-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold">1</span>
                  <span>Lompat secepat mungkin mencapai garis <strong>FINISH</strong> sebelum waktu 10 detik habis!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold">2</span>
                  <span>Gunakan tombol <strong>SPACEBAR (Spasi)</strong> pada keyboard atau tekan tombol <strong>LOMPAT!!</strong> di layar.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold">3</span>
                  <span>Pemenang mendapatkan hadiah sebesar <strong>Rp5.000</strong>!</span>
                </div>
              </div>

              {attemptsLeft > 0 ? (
                <button
                  onClick={startCountdown}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-display text-sm font-bold tracking-widest uppercase transition-all shadow-lg glow-emas flex items-center justify-center gap-2 cursor-pointer border-t border-white/20"
                  id="prepare_start_btn"
                >
                  <Play className="h-4 w-4 fill-current" />
                  MULAI SEKARANG
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-400">
                  ⚠️ Kesempatan bermain Anda telah habis (0/3).
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* RACING TRACK ARENA CONTAINER */}
        <div 
          className="relative w-full glass-panel rounded-3xl p-6 border border-white/10 overflow-hidden flex flex-col justify-end bg-black/30 shadow-inner min-h-[300px]"
          id="track_arena"
        >
          {/* Top Hanging Indonesian Triangular Bunting Flags (Decorations) */}
          <div className="absolute top-2 left-0 right-0 h-6 flex justify-around overflow-hidden pointer-events-none" id="decorative_flags">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] ${idx % 2 === 0 ? 'border-t-red-600' : 'border-t-white'} drop-shadow-md`}
              />
            ))}
          </div>

          {/* Dynamic Track background decoration lines */}
          <div className="absolute top-12 left-0 right-0 pointer-events-none text-center opacity-10 font-black text-[5rem] tracking-widest select-none uppercase font-display" id="track_bg_text">
            MERDEKA
          </div>

          {/* Audience Cheer status hint */}
          {isPlaying && (
            <div className="absolute top-12 left-6 right-6 flex justify-between pointer-events-none" id="arena_active_cues">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/20">
                <Volume2 className="h-3 w-3" /> Penonton bersorak!
              </span>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <Zap className="h-3 w-3" /> Tekan Spasi / Ketuk Lompat
              </span>
            </div>
          )}

          {/* Dust Particle Layers */}
          {dustParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0.8, scale: p.scale, y: 0 }}
              animate={{ opacity: 0, scale: p.scale * 2.5, y: -25 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute rounded-full bg-white/40 pointer-events-none blur-[2px]"
              style={{
                left: p.x,
                top: p.y,
                width: 12,
                height: 12,
              }}
            />
          ))}

          {/* Arena Lines: START & FINISH Markers */}
          <div className="absolute bottom-16 left-[50px] flex flex-col items-center pointer-events-none" id="start_line_marker">
            <div className="text-[9px] font-bold text-emerald-400 tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase">
              START
            </div>
            <div className="w-1.5 h-16 bg-gradient-to-b from-emerald-500 to-transparent mt-1" />
          </div>

          <div className="absolute bottom-16 right-[50px] flex flex-col items-center pointer-events-none" id="finish_line_marker">
            <div className="text-[9px] font-bold text-red-400 tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 uppercase animate-pulse">
              FINISH
            </div>
            <div className="w-1.5 h-16 bg-gradient-to-b from-red-500 via-white to-transparent mt-1" />
          </div>

          {/* THE CHARACTER CONTAINER */}
          <div className="relative w-full h-24 mb-1" id="character_track_strip">
            <motion.div
              animate={{
                left: `calc(${progress}% - ${progress * 0.8}px + 10px)`, // dynamic interpolation to stay between lines
                y: isJumping ? -65 : 0,
              }}
              transition={{
                left: { type: 'spring', stiffness: 100, damping: 15 },
                y: { duration: 0.3, ease: 'easeOut' }
              }}
              className="absolute bottom-0 h-24 w-24 flex flex-col items-center"
              style={{ left: '50px' }} // fallback start point
              id="sack_jumper_character"
            >
              {/* Jumper Headband (Ikat Kepala Merah Putih) & Face */}
              <div className="relative flex flex-col items-center">
                {/* Straw Hat or Hair */}
                <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 relative shadow flex items-center justify-center">
                  
                  {/* Eyes */}
                  <div className="absolute top-3 left-2.5 flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-0.5 left-0.5" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-black flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-0.5 left-0.5" />
                    </div>
                  </div>

                  {/* Mouth / Smile */}
                  <div className={`absolute bottom-2.5 w-3.5 h-2 rounded-b-full border-b-2 border-amber-900 ${isJumping ? 'bg-red-500' : ''}`} />

                  {/* Cheek Blush */}
                  <div className="absolute top-4.5 left-1 w-1.5 h-1 rounded-full bg-rose-400/40" />
                  <div className="absolute top-4.5 right-1 w-1.5 h-1 rounded-full bg-rose-400/40" />

                  {/* Merah Putih Headband (Ikat Kepala) */}
                  <div className="absolute top-1 left-0 right-0 h-2 bg-gradient-to-b from-red-600 to-white border-y border-red-700 flex justify-center items-center overflow-hidden">
                    <span className="text-[5px] text-white font-extrabold uppercase scale-75">17 AGUSTUS</span>
                  </div>
                  
                  {/* Headband tie knot on side */}
                  <div className="absolute top-1 -right-1 w-1.5 h-1.5 bg-red-600 rotate-45 rounded-sm" />
                </div>
              </div>

              {/* Gunny Sack (Karung Goni) body with custom decorations */}
              <div className="relative -mt-1 w-14 h-14 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-t-xl rounded-b-3xl border border-amber-950 flex flex-col justify-between items-center py-1.5 shadow-lg overflow-hidden">
                {/* Sack wrinkles & bindings */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-950/30" />
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-amber-950/20" />
                <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-amber-950/20" />

                {/* Rope tying the sack at the waist */}
                <div className="w-full h-1 bg-yellow-400/80 border-y border-yellow-600 relative z-10" />

                {/* Indonesian Flag Emblem in the center of sack */}
                <div className="w-7 h-4 border border-white/40 flex flex-col rounded overflow-hidden shadow-sm relative z-10 bg-white">
                  <div className="h-1/2 bg-red-600 w-full" />
                  <div className="h-1/2 bg-white w-full" />
                </div>

                {/* Text "RI" */}
                <span className="text-[8px] font-mono font-bold text-amber-200 tracking-widest relative z-10 scale-90">KAPASITAS</span>
              </div>

              {/* Shadow Beneath Character (dynamic scaling based on jump height) */}
              <div 
                className="absolute -bottom-1.5 w-12 h-2.5 bg-black/60 rounded-full blur-[1px] transition-transform duration-300"
                style={{
                  transform: `scale(${isJumping ? 0.4 : 1})`,
                  opacity: isJumping ? 0.3 : 0.8,
                }}
              />
            </motion.div>
          </div>

          {/* TRACK PATH FLOOR */}
          <div className="w-full h-6 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-b-xl border-t-4 border-amber-600 flex items-center justify-between px-10 relative" id="track_floor">
            {/* Visual white-red segments like curb rings */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-white to-red-600" />
            <span className="text-[8px] text-amber-200/50 font-bold tracking-widest uppercase">LINE-1</span>
            <span className="text-[8px] text-amber-200/50 font-bold tracking-widest uppercase">79 TH RI</span>
            <span className="text-[8px] text-amber-200/50 font-bold tracking-widest uppercase">BALAP KARUNG</span>
          </div>
        </div>

        {/* Visual Progress percentage helper */}
        <div className="mt-4 flex justify-between items-center px-2" id="track_progress_bar">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mulai (0%)</span>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden relative border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Finish (100%)</span>
        </div>
      </main>

      {/* BOTTOM CONTROL ACTIONS PANEL (Glassmorphism) */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto mb-6 px-4" id="game_footer_controls">
        <div className="glass-panel rounded-2xl p-4 md:p-6 text-center space-y-4 border-t border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            
            <div className="text-left" id="controls_hint">
              <h4 className="text-sm font-extrabold text-amber-400 tracking-wide uppercase flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400 fill-current animate-pulse" />
                Cara Lompat
              </h4>
              <p className="text-xs text-gray-300">
                Tekan tombol <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-xs">SPACEBAR</kbd> di keyboard atau klik tombol merah di kanan.
              </p>
            </div>

            {/* ACTION JUMP BUTTON OR START BUTTON */}
            <div className="flex items-center gap-3 w-full sm:w-auto" id="controls_btn_wrapper">
              {isPlaying ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={triggerJump}
                  className="w-full sm:w-56 py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-400 text-white font-display text-sm font-black tracking-widest uppercase shadow-xl glow-merah border-t border-white/20 cursor-pointer flex items-center justify-center gap-2"
                  id="jump_action_btn"
                >
                  LOMPAT!!
                </motion.button>
              ) : (
                attemptsLeft > 0 ? (
                  <button
                    onClick={startCountdown}
                    className="w-full sm:w-56 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-display text-sm font-black tracking-widest uppercase shadow-xl glow-emas cursor-pointer flex items-center justify-center gap-2"
                    id="game_trigger_btn"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isFinished || isFailed ? 'MAIN LAGI' : 'MULAI SEKARANG'}
                  </button>
                ) : (
                  <div className="py-3 px-6 rounded-2xl bg-red-950/60 border border-red-500/30 text-xs font-bold text-red-400 w-full text-center">
                    Kesempatan habis!
                  </div>
                )
              )}

              {/* Logout / Exit Button */}
              <button
                onClick={onLogout}
                className="py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 font-display text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                id="exit_game_btn"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* RESULTS MODAL popup */}
      <ResultModal
        isOpen={showResult}
        isSuccess={isFinished}
        brandName={session.brandName}
        memberId={session.memberId}
        attemptsLeft={attemptsLeft}
        onRestart={handleRestart}
        onLogout={onLogout}
      />
    </div>
  );
}
