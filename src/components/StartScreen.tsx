import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Shield, Zap, Crosshair, Bomb, Radio, Flame, Sparkles, Trophy, Keyboard, Smartphone, Info, Award } from 'lucide-react';
import { GameSettings } from '../types/game';
import { POWER_UP_CONFIG } from '../game/constants';

interface StartScreenProps {
  highScore: number;
  settings: GameSettings;
  onStart: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  settings,
  onStart,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'POWERUPS' | 'INTEL'>('CONTROLS');

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative max-w-2xl w-full my-auto flex flex-col items-center text-center">
        
        {/* Glow ambient circle */}
        <div className="absolute -top-12 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Subtitle */}
        <div className="relative mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Arcade Space Defense Protocol
          </div>
          <h1 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">
            GALAXY DEFENDER
          </h1>
          <p className="text-slate-400 font-rajdhani text-sm sm:text-base mt-1 max-w-md mx-auto">
            Repel the alien armada, blast hostile flagships, collect hyper upgrades, and defend the frontier.
          </p>
        </div>

        {/* High Score Badge */}
        {highScore > 0 && (
          <div className="mb-6 flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 border border-amber-500/40 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">ALL-TIME RECORD</div>
              <div className="text-lg font-black font-orbitron text-amber-300">
                {highScore.toLocaleString()} PTS
              </div>
            </div>
          </div>
        )}

        {/* Big Launch Button */}
        <button
          onClick={onStart}
          className="group relative px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 rounded-2xl font-orbitron font-black text-lg sm:text-xl text-slate-950 uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_45px_rgba(6,182,212,0.9)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3 cursor-pointer mb-6"
        >
          <Play className="w-6 h-6 fill-slate-950 text-slate-950 transition-transform group-hover:translate-x-1" />
          <span>ENGAGE SYSTEM</span>
        </button>

        {/* Tabs for Info */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-800 pb-3 gap-2 justify-center mb-4">
            <button
              onClick={() => setActiveTab('CONTROLS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-orbitron transition-all ${
                activeTab === 'CONTROLS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>CONTROLS</span>
            </button>
            <button
              onClick={() => setActiveTab('POWERUPS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-orbitron transition-all ${
                activeTab === 'POWERUPS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>POWER-UPS</span>
            </button>
            <button
              onClick={() => setActiveTab('INTEL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-orbitron transition-all ${
                activeTab === 'INTEL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>INTEL</span>
            </button>
          </div>

          {/* Controls Tab */}
          {activeTab === 'CONTROLS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm font-orbitron mb-2">
                  <Keyboard className="w-4 h-4" />
                  <span>Desktop Controls</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 font-rajdhani">
                  <li><span className="text-cyan-300 font-mono font-bold">WASD / Arrow Keys</span>: Maneuver ship</li>
                  <li><span className="text-cyan-300 font-mono font-bold">Mouse Move</span>: Steer toward cursor</li>
                  <li><span className="text-cyan-300 font-mono font-bold">Space / Left Click</span>: Fire blasters</li>
                  <li><span className="text-rose-300 font-mono font-bold">B / E Key</span>: Detonate EMP Smart Bomb</li>
                  <li><span className="text-cyan-300 font-mono font-bold">ESC / P</span>: Pause & tactical status</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm font-orbitron mb-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile & Touch Controls</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 font-rajdhani">
                  <li><span className="text-fuchsia-300 font-mono font-bold">Touch & Drag</span>: Seamless flight tracking</li>
                  <li><span className="text-fuchsia-300 font-mono font-bold">Virtual Joystick</span>: On-screen directional stick</li>
                  <li><span className="text-fuchsia-300 font-mono font-bold">FIRE Button</span>: Hold to shoot or auto-fire</li>
                  <li><span className="text-rose-300 font-mono font-bold">BOMB Button</span>: Screen-clearing pulse</li>
                </ul>
              </div>
            </div>
          )}

          {/* Powerups Tab */}
          {activeTab === 'POWERUPS' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              {Object.entries(POWER_UP_CONFIG).map(([key, item]) => (
                <div
                  key={key}
                  className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-orbitron font-bold text-xs shrink-0 shadow-md"
                    style={{ backgroundColor: `${item.color}25`, borderColor: item.color, color: item.color, borderWidth: 1 }}
                  >
                    {item.label}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.duration ? `${item.duration / 1000}s active` : 'Instant'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Intel Tab */}
          {activeTab === 'INTEL' && (
            <div className="text-xs text-slate-300 space-y-2 text-left font-rajdhani">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-300 font-orbitron">Combo Multiplier:</span> Destroy hostiles in rapid succession to ramp up your combo multiplier (up to 5x points per kill!).
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-rose-300 font-orbitron">Mothership Encounters:</span> Every 5 sectors, a planetary dreadnought appears with multi-stage bullet barrages.
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-300 font-orbitron">Magnetic Attraction:</span> Power-ups automatically gravitate toward your starfighter when within radar range.
              </div>
            </div>
          )}

          {/* Quick Settings Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                <span>SFX: {settings.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
              >
                <span>Music: {settings.musicEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
                className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
              >
                <Flame className={`w-3.5 h-3.5 ${settings.autoFire ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Auto-Fire: {settings.autoFire ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
