/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { UserSession, GameHistory } from './types';
import LoginScreen from './components/LoginScreen';
import GameScreen from './components/GameScreen';

// Reference our beautiful festive background image path directly
const backgroundUrl = '/src/assets/images/hari_kemerdekaan_bg_1783703298894.jpg';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [history, setHistory] = useState<GameHistory>({});

  // Load member attempts history from local storage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('lomba_balap_karung_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to load play history from localStorage:', e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = (newHistory: GameHistory) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('lomba_balap_karung_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save play history to localStorage:', e);
    }
  };

  const handleLogin = (userSession: UserSession) => {
    const memberKey = userSession.memberId.trim().toUpperCase();
    
    let userAttempts = 3;
    const updatedHistory = { ...history };

    if (updatedHistory[memberKey] !== undefined) {
      // User has played or logged in before, retrieve their quota
      userAttempts = updatedHistory[memberKey].attemptsLeft;
      // Update their brand name just in case they typed a different one
      updatedHistory[memberKey].brandName = userSession.brandName;
    } else {
      // New member ID, initialize with 3 attempts
      updatedHistory[memberKey] = {
        attemptsLeft: 3,
        brandName: userSession.brandName,
      };
    }

    saveHistory(updatedHistory);
    setAttemptsLeft(userAttempts);
    setSession(userSession);
  };

  const handleSpendAttempt = () => {
    if (!session) return;
    const memberKey = session.memberId.trim().toUpperCase();
    
    // Decrement attempts by 1
    const nextAttempts = Math.max(0, attemptsLeft - 1);
    
    const updatedHistory = {
      ...history,
      [memberKey]: {
        brandName: session.brandName,
        attemptsLeft: nextAttempts,
      },
    };

    setAttemptsLeft(nextAttempts);
    saveHistory(updatedHistory);
  };

  const handleLogout = () => {
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans" id="app_root_node">
      {session ? (
        <GameScreen
          session={session}
          attemptsLeft={attemptsLeft}
          onSpendAttempt={handleSpendAttempt}
          onLogout={handleLogout}
          backgroundUrl={backgroundUrl}
        />
      ) : (
        <LoginScreen 
          onLogin={handleLogin} 
          backgroundUrl={backgroundUrl}
        />
      )}
    </div>
  );
}
