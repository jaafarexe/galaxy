import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameSettings, GameStats, GameStatus, Player } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_CONFIG } from '../game/constants';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { TouchControls } from './TouchControls';
import { sound } from '../utils/audio';

export const GalaxyDefender: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React state synced with engine
  const [gameStatus, setGameStatus] = useState<GameStatus>('MENU');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    wave: 1,
    enemiesDefeated: 0,
    bossesDefeated: 0,
    shotsFired: 0,
    shotsHit: 0,
    timeSurvivedSeconds: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
  });

  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    targetX: CANVAS_WIDTH / 2,
    targetY: CANVAS_HEIGHT - 120,
    vx: 0,
    vy: 0,
    width: PLAYER_CONFIG.width,
    height: PLAYER_CONFIG.height,
    speed: PLAYER_CONFIG.baseSpeed,
    lives: PLAYER_CONFIG.initialLives,
    maxLives: PLAYER_CONFIG.maxLives,
    shield: 100,
    hasShield: false,
    shieldTimeRemaining: 0,
    weapon: 'SINGLE',
    weaponTimeRemaining: 0,
    rapidFireRemaining: 0,
    speedBoostRemaining: 0,
    bombs: PLAYER_CONFIG.initialBombs,
    maxBombs: PLAYER_CONFIG.maxBombs,
    invulnerableTime: 0,
    fireCooldown: 0,
    tilt: 0,
  });

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    screenShakeEnabled: true,
    autoFire: false,
    volume: 0.8,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Initialize Engine
  useEffect(() => {
    // Detect touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.onStateChange = (newStatus) => {
      setGameStatus(newStatus);
    };

    engine.onStatsChange = (newStats) => {
      setStats({ ...newStats });
    };

    engine.onPlayerChange = (newPlayer) => {
      setPlayer({ ...newPlayer });
    };

    // Load initial high score
    setStats((prev) => ({ ...prev, highScore: engine.stats.highScore }));

    // Initial render call
    engine.render();

    return () => {
      engine.unbindEvents();
    };
  }, []);

  // Sync settings with engine
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.settings = updated;
      }
      if (newSettings.soundEnabled !== undefined) {
        sound.setSoundMuted(!newSettings.soundEnabled);
      }
      if (newSettings.musicEnabled !== undefined) {
        sound.setMusicMuted(!newSettings.musicEnabled);
      }
      return updated;
    });
  }, []);

  // Action handlers
  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePauseGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleRestartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  }, []);

  const handleMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.status = 'MENU';
      sound.stopMusic();
      setGameStatus('MENU');
    }
  }, []);

  const handleTriggerBomb = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerBomb();
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
  }, [handleUpdateSettings, settings.soundEnabled]);

  // Touch & Mouse direct aiming tracking
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || gameStatus !== 'PLAYING') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    engineRef.current.mousePos = { x: canvasX, y: canvasY };
  };

  const handleCanvasMouseLeave = () => {
    if (engineRef.current) {
      engineRef.current.mousePos = null;
      engineRef.current.isMouseDown = false;
    }
  };

  const handleCanvasMouseDown = () => {
    if (engineRef.current && gameStatus === 'PLAYING') {
      engineRef.current.isMouseDown = true;
    }
  };

  const handleCanvasMouseUp = () => {
    if (engineRef.current) {
      engineRef.current.isMouseDown = false;
    }
  };

  // Direct canvas touch drag for fluid mobile flight
  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || gameStatus !== 'PLAYING') return;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const canvasX = (touch.clientX - rect.left) * scaleX;
      const canvasY = (touch.clientY - rect.top) * scaleY;

      engineRef.current.player.x = Math.max(
        PLAYER_CONFIG.width / 2,
        Math.min(CANVAS_WIDTH - PLAYER_CONFIG.width / 2, canvasX)
      );
      engineRef.current.player.y = Math.max(
        PLAYER_CONFIG.height / 2 + 50,
        Math.min(CANVAS_HEIGHT - PLAYER_CONFIG.height / 2 - 20, canvasY)
      );
    }
  };

  // Virtual joystick movement vector
  const handleTouchMoveVector = useCallback((vec: { x: number; y: number } | null) => {
    if (engineRef.current) {
      engineRef.current.touchMove = vec;
    }
  }, []);

  const handleTouchFireStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.isMouseDown = true;
    }
  }, []);

  const handleTouchFireEnd = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.isMouseDown = false;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-slate-950 flex items-center justify-center overflow-hidden select-none"
    >
      {/* Outer Glow frame border */}
      <div className="relative w-full h-full max-w-[800px] max-h-[950px] flex items-center justify-center shadow-2xl">
        
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          onTouchMove={handleCanvasTouchMove}
          className="w-full h-full object-contain cursor-crosshair touch-none bg-slate-950 border-x sm:border border-cyan-500/20 sm:rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)]"
        />

        {/* Scanlines CRT arcade overlay for authentic retro flavor */}
        <div className="absolute inset-0 scanlines pointer-events-none rounded-2xl opacity-60" />

        {/* HUD Overlay during gameplay */}
        {gameStatus === 'PLAYING' && (
          <HUD
            stats={stats}
            player={player}
            settings={settings}
            onPause={handlePauseGame}
            onTriggerBomb={handleTriggerBomb}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* Mobile On-Screen Controls */}
        {gameStatus === 'PLAYING' && (isTouchDevice || window.innerWidth <= 768) && (
          <TouchControls
            player={player}
            autoFire={settings.autoFire}
            onMove={handleTouchMoveVector}
            onFireStart={handleTouchFireStart}
            onFireEnd={handleTouchFireEnd}
            onTriggerBomb={handleTriggerBomb}
            onToggleAutoFire={() => handleUpdateSettings({ autoFire: !settings.autoFire })}
          />
        )}

        {/* Start Screen Overlay */}
        {gameStatus === 'MENU' && (
          <StartScreen
            highScore={stats.highScore}
            settings={settings}
            onStart={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {/* Pause Screen Overlay */}
        {gameStatus === 'PAUSED' && (
          <PauseModal
            settings={settings}
            onResume={handleResumeGame}
            onRestart={handleRestartGame}
            onMenu={handleMenu}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {/* Game Over Screen Overlay */}
        {gameStatus === 'GAMEOVER' && (
          <GameOverModal
            stats={stats}
            onRestart={handleRestartGame}
            onMenu={handleMenu}
          />
        )}

      </div>
    </div>
  );
};
