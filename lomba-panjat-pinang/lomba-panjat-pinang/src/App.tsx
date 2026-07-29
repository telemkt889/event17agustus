import React, { useState, useEffect } from 'react';
import { Player } from './types';
import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import GameScreen from './components/GameScreen';
import { soundManager } from './utils/SoundManager';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [view, setView] = useState<'LOGIN' | 'LOADING' | 'GAME'>('LOGIN');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync mute state with sound manager
  useEffect(() => {
    // soundManager is instantiated globally, sync with our state
    const currentMute = soundManager.isMuted();
    if (currentMute !== isMuted) {
      soundManager.toggleMute();
    }
  }, [isMuted]);

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleLoginSuccess = (loggedInPlayer: Player) => {
    setPlayer(loggedInPlayer);
    setView('LOADING');
  };

  const handleLoadingComplete = () => {
    setView('GAME');
  };

  const handleLogout = () => {
    setPlayer(null);
    setView('LOGIN');
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayer(updatedPlayer);
  };

  return (
    <div className="w-full h-screen bg-slate-950 font-sans antialiased text-white selection:bg-red-600 selection:text-white">
      {view === 'LOGIN' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {view === 'LOADING' && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {view === 'GAME' && player && (
        <GameScreen
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onLogout={handleLogout}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}
    </div>
  );
}
