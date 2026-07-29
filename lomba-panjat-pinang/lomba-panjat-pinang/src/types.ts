export interface Player {
  brandName: string;
  memberId: string;
  attemptsLeft: number;
}

export type GameState = 'LOGIN' | 'LOADING' | 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED';

export type GameResult = 'WIN' | 'LOSE' | null;

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  type: 'confetti' | 'firework' | 'dust';
}
