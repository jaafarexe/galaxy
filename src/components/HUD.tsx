import React from 'react';
import { GameStats, Player, GameSettings } from '../types/game';
import { Heart, Bomb, Shield, Zap, Flame, Radio, Crosshair, Pause, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';
import { PLAYER_CONFIG } from '../game/constants';

interface HUDProps {
  stats: GameStats;
  player: Player;
  settings: GameSettings;
  onPause: () => void;
  onTriggerBomb: () => void;
  onToggleSound: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  player,
  settings,
  onPause,
  onTriggerBomb,
  onToggleSound,
}) => {
  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString();

  // Weapon remaining time percentage
  const weaponPercent = Math.min(100, (player.weaponTimeRemaining / PLAYER_CONFIG.weaponDuration) * 100);
  const shieldPercent = Math.min(100, (player.shieldTimeRemaining / PLAYER_CONFIG.shieldDuration) * 100);
  const rapidFirePercent = Math.min(100, (player.rapidFireRemaining / PLAYER_CONFIG.shieldDuration) * 100);
  const speedBoostPercent = Math.min(100, (player.speedBoostRemaining / PLAYER_CONFIG.shieldDuration) * 100);

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none p-3 sm:p-5 flex flex-col gap-2 z-10 select-none">
      {/* Top Main Status Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-cyan-950/40">
        
        {/* Left: Lives & Bomb Counter */}
        <div className="flex items-center gap-3">
          {/* Hearts / Lives */}
          <div className="flex items-center gap-1">
            {Array.from({ length: player.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                  i < player.lives
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-100'
                    : 'text-slate-700 fill-transparent scale-90 opacity-40'
                }`}
              />
            ))}
          </div>

          <div className="h-5 w-px bg-cyan-900/60 hidden sm:block" />

          {/* Smart Bomb Button */}
          <button
            onClick={onTriggerBomb}
            disabled={player.bombs <= 0}
            className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 border ${
              player.bombs > 0
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:bg-rose-500/30'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Detonate EMP Bomb (Press B)"
          >
            <Bomb className="w-4 h-4 text-rose-400" />
            <span className="font-orbitron">{player.bombs}</span>
            <span className="hidden sm:inline text-[10px] text-rose-400/80 font-mono">[B]</span>
          </button>
        </div>

        {/* Center: Score & Combo */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400/80 uppercase">SCORE</span>
            <span className="text-xl sm:text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">
              {formatNumber(stats.score)}
            </span>
          </div>

          {/* High score badge */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-400/90 font-rajdhani">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>BEST: {formatNumber(Math.max(stats.score, stats.highScore))}</span>
          </div>
        </div>

        {/* Right: Wave Sector & Utility Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wave Badge */}
          <div className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-400/40 rounded-xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold font-orbitron text-cyan-300">
              SEC {stats.wave}
            </span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleSound}
            className="pointer-events-auto p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            title="Toggle Sound"
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            title="Pause Game (ESC / P)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sub Bar: Active Power-ups & Combo Streak */}
      <div className="flex items-center justify-between px-2">
        {/* Left: Active Power-up Timers */}
        <div className="flex items-center gap-2">
          {player.hasShield && (
            <div className="flex items-center gap-1.5 bg-blue-950/80 border border-blue-500/50 rounded-lg px-2.5 py-1 text-xs text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <Shield className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="font-mono font-bold text-[11px]">SHIELD</span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-200"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>
          )}

          {player.weapon !== 'SINGLE' && (
            <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/50 rounded-lg px-2.5 py-1 text-xs text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {player.weapon === 'TRIPLE' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
              {player.weapon === 'LASER' && <Radio className="w-3.5 h-3.5 text-emerald-400" />}
              {player.weapon === 'MISSILE' && <Crosshair className="w-3.5 h-3.5 text-pink-400" />}
              <span className="font-mono font-bold text-[11px]">{player.weapon}</span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${weaponPercent}%` }}
                />
              </div>
            </div>
          )}

          {player.rapidFireRemaining > 0 && (
            <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-bold text-[10px]">HYPER</span>
            </div>
          )}
        </div>

        {/* Right: Combo Streak */}
        {stats.combo > 1 && (
          <div className="flex items-center gap-1.5 bg-fuchsia-950/90 border border-fuchsia-500/60 rounded-xl px-3 py-1 shadow-[0_0_15px_rgba(217,70,239,0.4)] animate-bounce">
            <span className="text-[11px] font-mono text-fuchsia-300 uppercase">COMBO</span>
            <span className="font-orbitron font-black text-sm text-fuchsia-200">
              x{Math.min(5, 1 + Math.floor(stats.combo / 4))}
            </span>
            <span className="text-xs text-fuchsia-400">({stats.combo})</span>
          </div>
        )}
      </div>
    </div>
  );
};
