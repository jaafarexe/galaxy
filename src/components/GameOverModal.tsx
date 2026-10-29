import React, { useState } from 'react';
import { GameStats } from '../types/game';
import { RotateCcw, Home, Trophy, Skull, Target, Zap, Clock, ShieldAlert, Check, Copy } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onMenu,
}) => {
  const [copied, setCopied] = useState(false);
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  // Calculate accuracy
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = () => {
    const text = `🚀 I scored ${stats.score.toLocaleString()} points in Galaxy Defender! Sector: ${stats.wave}, Max Combo: x${stats.maxCombo}! Can you beat my high score?`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-lg w-full bg-slate-900/95 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.3)] text-center flex flex-col items-center">
        
        {/* Skull icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black font-orbitron tracking-wider text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] mb-1">
          MISSION TERMINATED
        </h2>
        <p className="text-slate-400 font-rajdhani text-sm mb-5">
          Hull breach catastrophic. Sector defenses compromised.
        </p>

        {/* New High Score banner */}
        {isNewHighScore && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/60 text-amber-300 font-orbitron text-xs sm:text-sm font-bold tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" />
            NEW ALL-TIME RECORD!
          </div>
        )}

        {/* Final Score display */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase">FINAL SCORE</div>
          <div className="text-4xl sm:text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SECTOR REACHED</div>
            <div className="text-lg font-bold font-orbitron text-cyan-300">{stats.wave}</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">ENEMIES DESTROYED</div>
            <div className="text-lg font-bold font-orbitron text-rose-300">{stats.enemiesDefeated}</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">ACCURACY</div>
            <div className="text-lg font-bold font-orbitron text-emerald-300">{accuracy}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">MAX COMBO</div>
            <div className="text-lg font-bold font-orbitron text-fuchsia-300">{stats.maxCombo}x</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">TIME SURVIVED</div>
            <div className="text-lg font-bold font-orbitron text-amber-300">{formatTime(stats.timeSurvivedSeconds)}</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">BOSSES DOWN</div>
            <div className="text-lg font-bold font-orbitron text-indigo-300">{stats.bossesDefeated}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-orbitron font-bold text-sm text-slate-950 uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>DEPLOY AGAIN</span>
          </button>

          <button
            onClick={handleShare}
            className="py-3.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-300 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Copy score report"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED!' : 'SHARE'}</span>
          </button>

          <button
            onClick={onMenu}
            className="py-3.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-300 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Main Menu"
          >
            <Home className="w-4 h-4" />
            <span>MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
