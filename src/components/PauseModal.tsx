import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Flame, Zap, Shield, Sparkles } from 'lucide-react';
import { GameSettings } from '../types/game';

interface PauseModalProps {
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  onResume,
  onRestart,
  onMenu,
  onUpdateSettings,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative max-w-md w-full bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_40px_rgba(6,182,212,0.25)] text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-orbitron tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] mb-1">
          TACTICAL PAUSE
        </h2>
        <p className="text-slate-400 font-rajdhani text-xs mb-5">
          Combat state suspended. Adjust your systems or resume.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-orbitron font-bold text-sm text-slate-950 uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-200 font-orbitron text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART SECTOR</span>
          </button>

          <button
            onClick={onMenu}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 font-orbitron text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO BASE</span>
          </button>
        </div>

        {/* Options Drawer */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
          <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase mb-1">
            SETTINGS & ACCESSIBILITY
          </div>

          {/* Sound FX */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-rajdhani font-semibold">Sound FX</span>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-bold transition-all ${
                settings.soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Music */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-rajdhani font-semibold">Synthwave Music</span>
            <button
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-bold transition-all ${
                settings.musicEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-rajdhani font-semibold">Screen Shake</span>
            <button
              onClick={() => onUpdateSettings({ screenShakeEnabled: !settings.screenShakeEnabled })}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-bold transition-all ${
                settings.screenShakeEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {settings.screenShakeEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Auto-fire */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-rajdhani font-semibold">Continuous Auto-Fire</span>
            <button
              onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-bold transition-all ${
                settings.autoFire
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {settings.autoFire ? 'ACTIVE' : 'MANUAL'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
