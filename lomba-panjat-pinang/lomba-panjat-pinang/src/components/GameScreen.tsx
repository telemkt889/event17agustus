import React, { useState, useEffect, useRef } from 'react';
import { Timer, Award, User, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Player, GameState, GameResult, Gift, Particle } from '../types';
import { soundManager } from '../utils/SoundManager';
// @ts-ignore
import bgImg from '../assets/images/panjat_pinang_bg_1783722628309.jpg';
import Popup from './Popup';

interface GameScreenProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const GIFTS: Gift[] = [
  { id: '1', name: 'Rp 100.000', emoji: '💵 100.000', color: '#DC2626' },
  { id: '2', name: 'Rp 5.000', emoji: '💵 5.000', color: '#D97706' },
  { id: '3', name: 'Rp 500.000', emoji: '💵 500.000', color: '#2563EB' },
  { id: '4', name: 'Rp 10.000', emoji: '💵 10.000', color: '#7C3AED' },
  { id: '5', name: 'Rp 1.000.000', emoji: '💵 1.000.000', color: '#16A34A' },
];

export default function GameScreen({ player, onUpdatePlayer, onLogout, isMuted, onToggleMute }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>('READY');
  const [countdown, setCountdown] = useState<number>(3);
  const [timer, setTimer] = useState<number>(30);
  const [climbProgress, setClimbProgress] = useState<number>(0);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [wonPrize, setWonPrize] = useState<string>('Rp 1.000.000');
  const [cameraShake, setCameraShake] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Keep values in ref for the high-performance animation loop
  const progressRef = useRef<number>(0);
  const stateRef = useRef<GameState>('READY');
  const particlesRef = useRef<Particle[]>([]);
  const lastClimbTimeRef = useRef<number>(0);
  const climbCycleRef = useRef<number>(0);
  const swayTimeRef = useRef<number>(0);
  const swayOffsetRef = useRef<number>(0);

  // Sync refs with state
  useEffect(() => {
    progressRef.current = climbProgress;
  }, [climbProgress]);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Handle countdown before game starts
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      soundManager.playTick();
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState('PLAYING');
            soundManager.playWhistle();
            return 3;
          }
          soundManager.playTick();
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Game timer logic (30 seconds)
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0.1) {
            clearInterval(interval);
            // Time out - Lose condition
            handleGameEnd(false);
            return 0;
          }
          // Tick sound in the last 3 seconds
          if (prev <= 3.5) {
            soundManager.playTick();
          }
          return Math.max(0, prev - 0.1);
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Slipperiness effect: if player is not climbing, they slide down
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const slideTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastClimb = now - lastClimbTimeRef.current;

      if (timeSinceLastClimb > 220 && progressRef.current > 0) {
        // Base slide rate that increases slightly as you get higher to make it harder
        // Slightly reduced to match the slower climb speed
        const slideRate = 0.15 + (progressRef.current / 100) * 0.35;
        setClimbProgress((prev) => {
          const next = Math.max(0, prev - slideRate);
          if (next > 0 && Math.floor(next * 10) % 25 === 0) {
            soundManager.playSlide();
          }
          return next;
        });

        // Spawn slide dust particles
        if (Math.random() < 0.25) {
          spawnSlideDust();
        }
      }
    }, 40);

    return () => clearInterval(slideTimer);
  }, [gameState]);

  // Keyboard Event for Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClimb();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, player.attemptsLeft]);

  // Main Climb Trigger
  const handleClimb = () => {
    if (gameState === 'READY') {
      // Check attempts first
      if (player.attemptsLeft <= 0) {
        alert('Kesempatan bermain Anda telah habis.');
        return;
      }
      setGameState('COUNTDOWN');
      setTimer(10);
      setClimbProgress(0);
      progressRef.current = 0;
      setGameResult(null);
      return;
    }

    if (gameState !== 'PLAYING') return;

    soundManager.playClimb();
    lastClimbTimeRef.current = Date.now();
    climbCycleRef.current += 0.8; // Rotate arms/legs anim

    // Shake camera briefly
    setCameraShake(true);
    setTimeout(() => setCameraShake(false), 80);

    // Dynamic climb step: slower climb rate as requested
    const climbStep = 1.95 - (progressRef.current / 100) * 0.45;

    setClimbProgress((prev) => {
      const next = Math.min(100, prev + climbStep);
      
      // Spawn climb smoke dust at current player position
      spawnClimbParticles();

      if (next >= 100) {
        // Win condition
        handleGameEnd(true);
        return 100;
      }
      return next;
    });
  };

  const spawnClimbParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const yPos = canvas.height - 120 - (progressRef.current / 100) * (canvas.height - 300);
    
    // Spawn dust puffs
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x: canvas.width / 2 + swayOffsetRef.current + (Math.random() * 20 - 10),
        y: yPos + 30 + (Math.random() * 10),
        vx: (Math.random() * 2 - 1) * 1.5,
        vy: -Math.random() * 1.5,
        color: 'rgba(255, 255, 255, 0.45)',
        size: Math.random() * 8 + 4,
        alpha: 0.7,
        type: 'dust'
      });
    }
  };

  const spawnSlideDust = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const yPos = canvas.height - 120 - (progressRef.current / 100) * (canvas.height - 300);

    particlesRef.current.push({
      id: Math.random(),
      x: canvas.width / 2 + swayOffsetRef.current,
      y: yPos + (Math.random() * 40 - 20),
      vx: (Math.random() * 1.5 - 0.75),
      vy: -0.5,
      color: 'rgba(239, 68, 68, 0.3)',
      size: Math.random() * 6 + 3,
      alpha: 0.6,
      type: 'dust'
    });
  };

  // Launch celebratory fireworks and confetti
  const spawnWinCelebration = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Confetti
    const colors = ['#EF4444', '#FFFFFF', '#FBBF24', '#3B82F6', '#10B981'];
    for (let i = 0; i < 150; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x: Math.random() * canvas.width,
        y: Math.random() * -100,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        alpha: 1,
        type: 'confetti'
      });
    }

    // Fireworks
    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        if (stateRef.current !== 'FINISHED') return;
        const fx = Math.random() * (canvas.width - 200) + 100;
        const fy = Math.random() * (canvas.height / 2);
        const fColor = colors[Math.floor(Math.random() * colors.length)];

        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          particlesRef.current.push({
            id: Math.random(),
            x: fx,
            y: fy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: fColor,
            size: Math.random() * 4 + 2,
            alpha: 1,
            type: 'firework'
          });
        }
      }, f * 500);
    }
  };

  const handleGameEnd = (isVictory: boolean) => {
    setGameState('FINISHED');
    const result = isVictory ? 'WIN' : 'LOSE';
    setGameResult(result);

    // Decrement attempts left
    const nextAttempts = Math.max(0, player.attemptsLeft - 1);
    const updatedPlayer = { ...player, attemptsLeft: nextAttempts };
    onUpdatePlayer(updatedPlayer);

    // Persist attempts left
    localStorage.setItem(`panjat_pinang_member_${player.memberId}`, nextAttempts.toString());

    if (isVictory) {
      const possiblePrizes = ['Rp 100.000', 'Rp 5.000', 'Rp 500.000', 'Rp 10.000', 'Rp 1.000.000'];
      const prize = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];
      setWonPrize(prize);
      spawnWinCelebration();
    } else {
      setWonPrize('Rp 0');
    }

    // Open outcome popup after a short dramatic pause
    setTimeout(() => {
      setShowPopup(true);
    }, 1800);
  };

  const handleRestart = () => {
    if (player.attemptsLeft <= 0) return;
    setShowPopup(false);
    setCountdown(3);
    setTimer(30);
    setClimbProgress(0);
    progressRef.current = 0;
    setGameResult(null);
    setGameState('READY');
  };

  const handleRefill = () => {
    // Disabled according to instructions (cannot refill after 3 plays)
    soundManager.playClick();
  };

  // Rendering Game Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Frame drawing loop
    const draw = () => {
      if (!ctx || !canvas) return;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      // Apply subtle dynamic camera shake directly inside the canvas renderer!
      ctx.save();
      if (cameraShake) {
        const dx = (Math.random() - 0.5) * 6;
        const dy = (Math.random() - 0.5) * 6;
        ctx.translate(dx, dy);
      }

      // 1. UPDATE ANIMATIONS
      swayTimeRef.current += 0.02;
      // Pole sways slightly based on climb progress (sway increases higher up)
      const maxSway = 2 + (progressRef.current / 100) * 12;
      swayOffsetRef.current = Math.sin(swayTimeRef.current) * maxSway;

      // 1B. AMBIENT SUNBEAMS (Volumetric lighting glowing behind gapura)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rayCenterX = width / 2;
      const rayCenterY = 160;
      const numRays = 14;
      const rayAngleStep = Math.PI / (numRays - 1);
      
      const beamGrad = ctx.createRadialGradient(rayCenterX, rayCenterY, 30, rayCenterX, rayCenterY, width * 0.75);
      beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)'); // Golden light
      beamGrad.addColorStop(0.3, 'rgba(251, 191, 36, 0.12)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      for (let r = 0; r < numRays; r++) {
        const angle = Math.PI + r * rayAngleStep + Math.sin(swayTimeRef.current * 0.4 + r) * 0.04;
        const beamWidth = 0.12; // narrow search beams
        
        ctx.beginPath();
        ctx.moveTo(rayCenterX, rayCenterY);
        ctx.arc(rayCenterX, rayCenterY, width, angle - beamWidth, angle + beamWidth);
        ctx.closePath();
        ctx.fillStyle = beamGrad;
        ctx.fill();
      }
      ctx.restore();

      // 1C. AMBIENT RED & WHITE CONFETTI
      if (Math.random() < 0.1) {
        particlesRef.current.push({
          id: Math.random(),
          x: Math.random() * width,
          y: -20,
          vx: (Math.random() * 1.5 - 0.75) - 0.3, // wind blowing slightly left
          vy: Math.random() * 1.2 + 1.2,
          color: Math.random() < 0.5 ? '#EF4444' : '#FFFFFF',
          size: Math.random() * 4 + 3.5,
          alpha: 0.9,
          type: 'confetti'
        });
      }

      // 2. DRAW PINANG TREE (POLISHED BAMBOO POLE WITH REAL TEXTURE & SHINE)
      const poleX = width / 2;
      const groundY = height - 25;
      const poleTopY = 50;
      const poleHeight = groundY - poleTopY;

      // Draw shadow under the pole ground
      ctx.beginPath();
      ctx.ellipse(poleX, groundY + 10, 45, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      // Swaying path
      const getPoleXAtY = (y: number) => {
        // Linear interpolation of sway from ground (0 sway) to top (full sway)
        const factor = (groundY - y) / poleHeight;
        return poleX + swayOffsetRef.current * factor;
      };

      // Draw the pole using a quadratic curve / connected lines for swaying
      // Draw bamboo nodes and glossy oil/grease gradients
      const segments = 28;
      const segHeight = poleHeight / segments;

      for (let i = 0; i < segments; i++) {
        const yBottom = groundY - i * segHeight;
        const yTop = yBottom - segHeight;
        const xBottom = getPoleXAtY(yBottom);
        const xTop = getPoleXAtY(yTop);

        // Gradient for glossy bamboo pole covered in greasy oil (3D cylindrical wraps)
        const poleGrad = ctx.createLinearGradient(xBottom - 18, 0, xBottom + 18, 0);
        poleGrad.addColorStop(0, '#42241D'); // Deep shadowed wood edge
        poleGrad.addColorStop(0.2, '#78350F'); // Rich natural wood fiber color
        poleGrad.addColorStop(0.5, '#FDE047'); // Golden slippery shiny oil reflection highlight
        poleGrad.addColorStop(0.8, '#78350F');
        poleGrad.addColorStop(1, '#2D1609'); // Dark back-shadow edge

        ctx.beginPath();
        ctx.moveTo(xBottom - 14, yBottom);
        ctx.lineTo(xTop - 13, yTop);
        ctx.lineTo(xTop + 13, yTop);
        ctx.lineTo(xBottom + 14, yBottom);
        ctx.closePath();
        ctx.fillStyle = poleGrad;
        ctx.fill();

        // Draw realistic wood vertical grain lines
        ctx.strokeStyle = 'rgba(66, 36, 29, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xBottom - 5, yBottom);
        ctx.lineTo(xTop - 5, yTop);
        ctx.moveTo(xBottom + 6, yBottom);
        ctx.lineTo(xTop + 6, yTop);
        ctx.stroke();

        // Extra glossy mirror reflection overlay for slick wet grease feel
        const glossGrad = ctx.createLinearGradient(xBottom - 3, 0, xBottom + 4, 0);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.42)'); // slick specular highlights
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(xBottom - 3, yBottom);
        ctx.lineTo(xTop - 3, yTop);
        ctx.lineTo(xTop + 4, yTop);
        ctx.lineTo(xBottom + 4, yBottom);
        ctx.closePath();
        ctx.fillStyle = glossGrad;
        ctx.fill();

        // Node divider rings
        ctx.beginPath();
        ctx.ellipse(xTop, yTop, 15, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#271207';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#FBBF24'; // Golden ring highlight
        ctx.stroke();
      }

      // 3. DRAW ATTACHED HANGING PRIZE BASKET/WHEEL AT THE TOP
      const topX = getPoleXAtY(poleTopY);
      
      // Draw the circular bamboo prize holder frame
      ctx.beginPath();
      ctx.ellipse(topX, poleTopY, 110, 22, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#F59E0B'; // Gold frame
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF'; // White wrapping ropes
      ctx.stroke();

      // Hanging supporting ropes down to pole
      ctx.beginPath();
      ctx.moveTo(topX - 110, poleTopY);
      ctx.lineTo(topX, poleTopY - 15);
      ctx.lineTo(topX + 110, poleTopY);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Giant Red-White Flag on very top
      ctx.save();
      ctx.translate(topX, poleTopY - 45);
      const flagWave = Math.sin(swayTimeRef.current * 2.5) * 6;
      
      // Flagpole
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(0, -35);
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Gold top sphere
      ctx.beginPath();
      ctx.arc(0, -35, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#FBBF24';
      ctx.fill();

      // Waving Flag Fabric (Smooth Sinusoidal Wind Flutter)
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.quadraticCurveTo(20, -25 + flagWave, 45, -22);
      ctx.lineTo(45, -2);
      ctx.quadraticCurveTo(20, -5 + flagWave, 0, -5);
      ctx.closePath();
      ctx.fillStyle = '#DC2626'; // Red
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.quadraticCurveTo(20, -5 + flagWave, 45, -2);
      ctx.lineTo(45, 18);
      ctx.quadraticCurveTo(20, 15 + flagWave, 0, 15);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF'; // White
      ctx.fill();
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();

      // Draw hanging gifts at specific angle offsets
      GIFTS.forEach((gift, idx) => {
        const angle = (idx / GIFTS.length) * Math.PI * 2 + swayTimeRef.current * 0.2;
        const ropeStartX = topX + Math.cos(angle) * 110;
        const ropeStartY = poleTopY + Math.sin(angle) * 18;
        
        // Give each gift a physical dangling/sway offset based on wind and pole motion
        const giftSway = Math.sin(swayTimeRef.current * 1.8 + idx) * 12;
        const giftX = ropeStartX + giftSway;
        const giftY = ropeStartY + 46; // lowered so they don't overlap with the thick ring

        // Draw hanging rope with rich brown hemp color
        ctx.beginPath();
        ctx.moveTo(ropeStartX, ropeStartY);
        ctx.lineTo(giftX, giftY - 15);
        ctx.strokeStyle = '#78350F'; // Warm hemp brown rope
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw a light glowing aura/backdrop behind the gift for high-contrast visibility
        const glowGrad = ctx.createRadialGradient(giftX, giftY, 2, giftX, giftY, 26);
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(giftX, giftY, 26, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Save context and translate to gift position
        ctx.save();
        ctx.translate(giftX, giftY);
        
        // Tilt the prize based on its physical swaying motion
        const prizeAngle = Math.sin(swayTimeRef.current * 1.8 + idx) * 0.16;
        ctx.rotate(prizeAngle);

        // Draw money banknote / voucher tag card
        let cardW = 52;
        if (gift.name.includes('1.000.000')) cardW = 62;
        else if (gift.name.includes('100.000') || gift.name.includes('500.000')) cardW = 56;
        const cardH = 26;
        const hw = cardW / 2;
        const hh = cardH / 2;

        // Shadow under banknote
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(-hw + 1, -hh + 2, cardW, cardH);

        if (gift.name.includes('1.000.000')) {
          // 1.000.000 - Emerald & Gold Jackpot Banknote (1 Juta)
          const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
          grad.addColorStop(0, '#15803D');
          grad.addColorStop(0.5, '#22C55E');
          grad.addColorStop(1, '#14532D');
          ctx.fillStyle = grad;
          ctx.fillRect(-hw, -hh, cardW, cardH);

          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 2;
          ctx.strokeRect(-hw + 1, -hh + 1, cardW - 2, cardH - 2);

          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Rp', -hw + 3, -hh + 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('1.000.000', 2, 2);
        } else if (gift.name.includes('500.000')) {
          // 500.000 - Blue/Gold Luxury Note (500rb)
          const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
          grad.addColorStop(0, '#1D4ED8');
          grad.addColorStop(0.5, '#3B82F6');
          grad.addColorStop(1, '#1E3A8A');
          ctx.fillStyle = grad;
          ctx.fillRect(-hw, -hh, cardW, cardH);

          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-hw + 1, -hh + 1, cardW - 2, cardH - 2);

          ctx.fillStyle = '#FBBF24';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Rp', -hw + 3, -hh + 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('500.000', 1, 2);
        } else if (gift.name.includes('100.000')) {
          // 100.000 - Red Banknote (Merah 100rb)
          const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
          grad.addColorStop(0, '#DC2626');
          grad.addColorStop(0.5, '#EF4444');
          grad.addColorStop(1, '#991B1B');
          ctx.fillStyle = grad;
          ctx.fillRect(-hw, -hh, cardW, cardH);

          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-hw + 1, -hh + 1, cardW - 2, cardH - 2);

          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Rp', -hw + 3, -hh + 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('100.000', 1, 2);
        } else if (gift.name.includes('10.000')) {
          // 10.000 - Purple Banknote (10rb)
          const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
          grad.addColorStop(0, '#7C3AED');
          grad.addColorStop(0.5, '#8B5CF6');
          grad.addColorStop(1, '#4C1D95');
          ctx.fillStyle = grad;
          ctx.fillRect(-hw, -hh, cardW, cardH);

          ctx.strokeStyle = '#DDD6FE';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-hw + 1, -hh + 1, cardW - 2, cardH - 2);

          ctx.fillStyle = '#DDD6FE';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Rp', -hw + 3, -hh + 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('10.000', 1, 2);
        } else {
          // 5.000 - Brownish Yellow Banknote (5rb)
          const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
          grad.addColorStop(0, '#D97706');
          grad.addColorStop(0.5, '#F59E0B');
          grad.addColorStop(1, '#78350F');
          ctx.fillStyle = grad;
          ctx.fillRect(-hw, -hh, cardW, cardH);

          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-hw + 1, -hh + 1, cardW - 2, cardH - 2);

          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Rp', -hw + 3, -hh + 2);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('5.000', 1, 2);
        }

        ctx.restore();
      });

      // 4. DRAW CLIMBING CHARACTERS (SEMI-REALISTIC 3D INDONESIAN CLIMBERS)
      const drawClimberEntity = (cX: number, cY: number, cycleVal: number, scale = 1.0) => {
        ctx.save();
        ctx.translate(cX, cY);
        ctx.scale(scale, scale);

        const effortFactor = stateRef.current === 'PLAYING' ? 1.0 : 0.25;
        const armsOffset = Math.sin(cycleVal) * 8 * effortFactor;
        const legsOffset = Math.cos(cycleVal) * 8 * effortFactor;

        // Organic sweat drops spraying dynamically off the climber's head
        if (stateRef.current === 'PLAYING' && Math.random() < 0.14) {
          ctx.beginPath();
          ctx.arc(Math.random() * 26 - 13, -48 + Math.random() * 10, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
          ctx.fill();
        }

        // LEGS (3D athletic compression training pants + muscular definition)
        const leftLegGrad = ctx.createLinearGradient(-15, 0, 0, 10);
        leftLegGrad.addColorStop(0, '#111827'); // Sleek black pants shadow
        leftLegGrad.addColorStop(0.5, '#374151'); // athletic fabric light
        leftLegGrad.addColorStop(1, '#111827');

        const skinGrad = ctx.createLinearGradient(-10, 0, 10, 0);
        skinGrad.addColorStop(0, '#C68A4C'); // Rich Indonesian tan skin tone shadow
        skinGrad.addColorStop(0.5, '#E5A65D'); // Warm tan highlight
        skinGrad.addColorStop(1, '#8D5825'); // deep shadow

        // Left Leg
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.quadraticCurveTo(-22 + legsOffset, -2, -5, 12);
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = leftLegGrad;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, 12);
        ctx.lineTo(-2, 16);
        ctx.lineWidth = 5.2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = skinGrad;
        ctx.stroke();

        // Right Leg
        ctx.beginPath();
        ctx.moveTo(8, -10);
        ctx.quadraticCurveTo(22 - legsOffset, -2, 5, 12);
        ctx.lineWidth = 8;
        ctx.strokeStyle = leftLegGrad;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(5, 12);
        ctx.lineTo(2, 16);
        ctx.lineWidth = 5.2;
        ctx.strokeStyle = skinGrad;
        ctx.stroke();

        // TORSO (Patriotic Red-and-White athletic sports jersey with 3D shadows)
        const redShirtGrad = ctx.createLinearGradient(-12, -40, 12, -40);
        redShirtGrad.addColorStop(0, '#991B1B'); // Crimson shadow
        redShirtGrad.addColorStop(0.4, '#EF4444'); // Warm red
        redShirtGrad.addColorStop(0.8, '#F87171'); // Fabric light shine
        redShirtGrad.addColorStop(1, '#7F1D1D');

        const whiteShirtGrad = ctx.createLinearGradient(-12, -22, 12, -22);
        whiteShirtGrad.addColorStop(0, '#D1D5DB'); // Silver shadowed crease
        whiteShirtGrad.addColorStop(0.5, '#FFFFFF'); // Clean white
        whiteShirtGrad.addColorStop(1, '#9CA3AF');

        // Draw upper body chest (Merah / Red)
        ctx.beginPath();
        ctx.rect(-12, -38, 24, 16);
        ctx.fillStyle = redShirtGrad;
        ctx.fill();

        // Draw lower body belly (Putih / White)
        ctx.beginPath();
        ctx.rect(-12, -22, 24, 13);
        ctx.fillStyle = whiteShirtGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, -22);
        ctx.lineTo(12, -22);
        ctx.stroke();

        // ARMS (Clinging and wrapping around the pinang pole)
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.strokeStyle = skinGrad;

        // Left Arm wrapping
        ctx.beginPath();
        ctx.moveTo(-11, -34);
        ctx.quadraticCurveTo(-24 + armsOffset, -30, 0, -26);
        ctx.stroke();

        // Right Arm wrapping
        ctx.beginPath();
        ctx.moveTo(11, -34);
        ctx.quadraticCurveTo(24 - armsOffset, -30, 0, -26);
        ctx.stroke();

        // HEAD (Semi-realistic 3D sphere with shaded hair & determined face details)
        const headX = 0;
        const headY = -48;
        const headRadius = 11;

        const headGrad = ctx.createRadialGradient(headX - 3, headY - 3, 2, headX, headY, headRadius);
        headGrad.addColorStop(0, '#FCD34D'); // Shiny warm skin light
        headGrad.addColorStop(0.4, '#E5A65D'); // Warm tan skin
        headGrad.addColorStop(1, '#9E642A'); // deep base shadow

        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();

        // Dark crop hair
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(headX, headY - 3, 11, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX - 8, headY - 3, 3, 0, Math.PI * 2);
        ctx.arc(headX + 8, headY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Red-White Headband (Ikat kepala) wrapped perfectly in perspective
        const headbandRedGrad = ctx.createLinearGradient(-11, 0, 11, 0);
        headbandRedGrad.addColorStop(0, '#991B1B');
        headbandRedGrad.addColorStop(0.5, '#EF4444');
        headbandRedGrad.addColorStop(1, '#991B1B');

        ctx.beginPath();
        ctx.rect(headX - 11, headY - 7, 22, 3.5);
        ctx.fillStyle = headbandRedGrad;
        ctx.fill();

        const headbandWhiteGrad = ctx.createLinearGradient(-11, 0, 11, 0);
        headbandWhiteGrad.addColorStop(0, '#9CA3AF');
        headbandWhiteGrad.addColorStop(0.5, '#FFFFFF');
        headbandWhiteGrad.addColorStop(1, '#9CA3AF');

        ctx.beginPath();
        ctx.rect(headX - 11, headY - 3.5, 22, 3.5);
        ctx.fillStyle = headbandWhiteGrad;
        ctx.fill();

        // Headband cloth ribbon knot swaying physically
        ctx.save();
        ctx.translate(headX - 10, headY - 2);
        ctx.rotate(Math.sin(swayTimeRef.current * 4) * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -4);
        ctx.lineTo(-10, 6);
        ctx.closePath();
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -2);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Determined 3D eyes & focused expression
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(headX - 3.5, headY + 1, 1.5, 0, Math.PI * 2);
        ctx.arc(headX + 3.5, headY + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(headX - 4, headY + 0.5, 0.5, 0, Math.PI * 2);
        ctx.arc(headX + 3, headY + 0.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Determined angled brows
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY - 2.5);
        ctx.lineTo(headX - 2, headY - 1);
        ctx.moveTo(headX + 6, headY - 2.5);
        ctx.lineTo(headX + 2, headY - 1);
        ctx.stroke();

        // Gritted mouth line
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(headX - 3, headY + 5);
        ctx.lineTo(headX + 3, headY + 5);
        ctx.stroke();

        ctx.restore();
      };

      // Calculate dynamic progress for Teammates (they follow along to build a cooperative 5-person human pyramid!)
      const budiProgressFactor = Math.min(18, progressRef.current * 0.3 + Math.sin(swayTimeRef.current * 1.5) * 2);
      const jokoProgressFactor = Math.min(36, progressRef.current * 0.5 + Math.cos(swayTimeRef.current * 1.7) * 2.5);
      const agusProgressFactor = Math.min(54, progressRef.current * 0.68 + Math.sin(swayTimeRef.current * 1.9) * 2.5);
      const asepProgressFactor = Math.min(72, progressRef.current * 0.84 + Math.cos(swayTimeRef.current * 2.1) * 3);

      const budiY = groundY - (budiProgressFactor / 100) * poleHeight;
      const budiX = getPoleXAtY(budiY);

      const jokoY = groundY - (jokoProgressFactor / 100) * poleHeight;
      const jokoX = getPoleXAtY(jokoY);

      const agusY = groundY - (agusProgressFactor / 100) * poleHeight;
      const agusX = getPoleXAtY(agusY);

      const asepY = groundY - (asepProgressFactor / 100) * poleHeight;
      const asepX = getPoleXAtY(asepY);

      const climberProgressFactor = progressRef.current / 100;
      const climberY = groundY - climberProgressFactor * poleHeight;
      const climberX = getPoleXAtY(climberY);

      // Draw Teammate 1: Budi at the base
      drawClimberEntity(budiX, budiY, swayTimeRef.current * 3, 0.92);

      // Draw Teammate 2: Joko
      drawClimberEntity(jokoX, jokoY, swayTimeRef.current * 2.8, 0.94);

      // Draw Teammate 3: Agus in the middle
      drawClimberEntity(agusX, agusY, swayTimeRef.current * 2.5, 0.96);

      // Draw Teammate 4: Asep
      drawClimberEntity(asepX, asepY, swayTimeRef.current * 2.2, 0.98);

      // Draw Main Player at the top lead
      drawClimberEntity(climberX, climberY, climbCycleRef.current, 1.0);

      // 6. RENDER PARTICLES (CONFETTI, FIREWORKS, DUST)
      particlesRef.current.forEach((p, idx) => {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'confetti') {
          p.vy += 0.08; // Gravity
          p.vx += Math.sin(swayTimeRef.current + p.id) * 0.04; // Wind
          p.alpha -= 0.003;
        } else if (p.type === 'firework') {
          p.vy += 0.12; // Heavy gravity
          p.alpha -= 0.012;
          p.vx *= 0.98;
        } else if (p.type === 'dust') {
          p.alpha -= 0.035;
          p.size += 0.18;
        }

        // Render particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.type === 'confetti') {
          // Ribbon confetti
          ctx.rect(p.x, p.y, p.size, p.size * 1.5);
        } else {
          // Circular particle
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      ctx.restore(); // Restore camera shake matrix

      // Queue next frame
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [cameraShake]);

  return (
    <div
      className={`relative w-full h-screen overflow-hidden bg-cover bg-center select-none ${
        cameraShake ? 'animate-shake-climb' : ''
      }`}
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* 20% Dark overlay as specified */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Sunbeam spotlight ambient */}
      <div className="absolute inset-0 bg-radial-[circle_at_center_rgba(239,68,68,0.12)] pointer-events-none" />

      {/* TOP GAPURA DECORATION */}
      <div className="absolute top-0 inset-x-0 flex flex-col items-center pointer-events-none z-10 p-2 sm:p-4">
        {/* Waving Umbul-umbul Merah Putih Visual border */}
        <div className="flex gap-1 justify-center w-full max-w-lg overflow-hidden opacity-90 h-8 sm:h-12 mb-1">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-10 sm:h-14 rounded-b-full shadow-md animate-wave-flag ${
                i % 2 === 0 ? 'bg-red-600' : 'bg-white'
              }`}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>

      {/* PREMIUM HUD GLASS HEADER OVERLAY */}
      <div className="absolute top-6 sm:top-4 inset-x-3 sm:inset-x-4 z-20 max-w-lg mx-auto">
        <div className="backdrop-blur-md bg-black/40 border border-white/10 text-white py-1.5 px-5 rounded-full flex flex-row justify-between items-center gap-4 shadow-xl shadow-black/10">
          
          {/* User profile details */}
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <div className="text-left leading-none min-w-0">
              <p className="text-[8px] uppercase tracking-wider text-neutral-400 font-semibold">👤 PEMAIN</p>
              <h3 className="text-xs font-black tracking-tight truncate max-w-[70px] sm:max-w-[100px] text-white mt-0.5">
                {player.brandName}
              </h3>
            </div>
          </div>

          {/* Core HUD Timer Display */}
          <div className="flex items-center gap-2 min-w-0">
            <Timer className={`w-3.5 h-3.5 ${timer <= 3 ? 'text-red-500 animate-pulse' : 'text-amber-400'} shrink-0`} />
            <div className="text-left leading-none">
              <p className="text-[8px] uppercase tracking-wider text-neutral-400 font-semibold">⏱ WAKTU</p>
              <p className="text-xs font-black text-white mt-0.5 font-mono">
                {timer.toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Play attempts left */}
          <div className="flex items-center gap-2 min-w-0">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="text-left leading-none">
              <p className="text-[8px] uppercase tracking-wider text-neutral-400 font-semibold">🎟 TIKET</p>
              <p className="text-xs font-black text-white mt-0.5 font-mono">
                {player.attemptsLeft}/3
              </p>
            </div>
          </div>

          {/* Sound Control */}
          <button
            onClick={() => {
              onToggleMute();
              soundManager.playClick();
            }}
            className="p-1 hover:bg-white/10 text-white rounded-full transition-all shrink-0 active:scale-90 cursor-pointer"
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

        </div>
      </div>

      {/* GAMEPLAY CANVAS INTERACTIVE ARENA */}
      <div className="absolute inset-0 z-10">
        <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
      </div>

      {/* MOBILE CONTROLLER & PLAY BUTTON OVERLAY */}
      <div className="absolute bottom-14 inset-x-4 z-20 flex flex-col items-center pointer-events-none">
        
        {gameState === 'READY' && (
          <div className="pointer-events-auto w-full max-w-[220px] sm:max-w-[240px] animate-bounce">
            {player.attemptsLeft > 0 ? (
              <button
                onClick={handleClimb}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-extrabold uppercase tracking-widest text-xs sm:text-sm rounded-full border border-white/25 shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
              >
                MULAI PERMAINAN
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 bg-neutral-800 text-neutral-400 border border-white/5 font-extrabold uppercase tracking-widest text-xs sm:text-sm rounded-full shadow-2xl flex items-center justify-center cursor-not-allowed"
              >
                KESEMPATAN HABIS (MAX 3X)
              </button>
            )}
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="pointer-events-auto w-full max-w-[170px] sm:max-w-[190px]">
            {/* Mobile / Tablet capsule button with 3D gradient, glass shine, and hover states */}
            <button
              onClick={handleClimb}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:via-orange-400 hover:to-amber-400 text-white font-black text-base sm:text-lg tracking-widest rounded-full border border-white/20 shadow-xl shadow-red-950/20 active:scale-90 hover:scale-105 transition-all duration-150 cursor-pointer glow-red-white flex items-center justify-center font-display"
              id="mobile-climb-btn"
            >
              PANJAT!!
            </button>
          </div>
        )}

        {gameState === 'COUNTDOWN' && (
          <div className="backdrop-blur-md bg-black/40 px-6 py-2.5 rounded-full border border-white/10 glow-red-white animate-pulse">
            <p className="text-xs font-bold text-red-200 tracking-widest font-display uppercase">Persiapan Lomba</p>
          </div>
        )}

      </div>

      {/* DYNAMIC COUNTDOWN FULL SCREEN OVERLAY */}
      {gameState === 'COUNTDOWN' && (
        <div className="absolute inset-0 bg-black/65 z-40 flex flex-col items-center justify-center select-none animate-fade-in">
          <div className="text-center">
            <h4 className="text-xl font-bold tracking-widest text-amber-400 font-display mb-2 drop-shadow">
              LOMBA PANJAT PINANG AKAN DIMULAI
            </h4>
            <div className="relative">
              <span className="absolute -inset-10 bg-red-600/30 rounded-full blur-3xl animate-ping" />
              <h1 className="text-8xl sm:text-9xl font-black text-white font-display drop-shadow-2xl animate-bounce">
                {countdown}
              </h1>
            </div>
            <p className="mt-8 text-sm font-bold text-white/50 tracking-wider font-mono">
              SIAPKAN JARI DAN TOMBOL SPACE!
            </p>
          </div>
        </div>
      )}

      {/* OUTCOME MODAL POPUP */}
      {showPopup && gameResult && (
        <Popup
          result={gameResult}
          player={player}
          wonPrize={wonPrize}
          onRestart={handleRestart}
          onClose={onLogout}
        />
      )}

      {/* Side Logout Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          onLogout();
        }}
        className="absolute bottom-4 left-4 z-20 px-3.5 py-2 bg-black/40 hover:bg-black/60 border border-white/15 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer"
      >
        Keluar Lomba
      </button>
    </div>
  );
}
