import React, { useRef, useState } from 'react';
import { Bomb, Flame, Zap } from 'lucide-react';
import { Player } from '../types/game';

interface TouchControlsProps {
  player: Player;
  autoFire: boolean;
  onMove: (vector: { x: number; y: number } | null) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onTriggerBomb: () => void;
  onToggleAutoFire: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  autoFire,
  onMove,
  onFireStart,
  onFireEnd,
  onTriggerBomb,
  onToggleAutoFire,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isStickActive, setIsStickActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsStickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isStickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        setIsStickActive(false);
        touchIdRef.current = null;
        setStickPos({ x: 0, y: 0 });
        onMove(null);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });

    const normalizedX = (stickX / maxRadius);
    const normalizedY = (stickY / maxRadius);
    onMove({ x: normalizedX, y: normalizedY });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 sm:p-6 flex items-end justify-between z-15 select-none touch-none">
      
      {/* Left: Virtual Joystick Pad */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-colors flex items-center justify-center ${
            isStickActive
              ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/40 border-slate-700/60'
          }`}
        >
          {/* Center deadzone ring */}
          <div className="w-10 h-10 rounded-full border border-cyan-500/20 pointer-events-none" />

          {/* Draggable Knob */}
          <div
            className={`absolute w-12 h-12 rounded-full border-2 transition-transform shadow-lg ${
              isStickActive
                ? 'bg-cyan-400 border-white shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-110'
                : 'bg-cyan-500/60 border-cyan-300'
            }`}
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pointer-events-none">
          FLIGHT STICK
        </span>
      </div>

      {/* Right: Weapons Control Cluster */}
      <div className="pointer-events-auto flex items-end gap-3 sm:gap-4">
        
        {/* EMP Smart Bomb Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onTriggerBomb}
            disabled={player.bombs <= 0}
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 ${
              player.bombs > 0
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:bg-rose-900/80'
                : 'bg-slate-900/50 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
            }`}
          >
            <Bomb className="w-6 h-6 text-rose-400" />
            <span className="text-[10px] font-orbitron font-bold mt-0.5">{player.bombs}</span>
          </button>
          <span className="text-[9px] font-mono text-rose-400 uppercase tracking-wider">
            EMP BOMB
          </span>
        </div>

        {/* Auto Fire Toggle & Main Trigger */}
        <div className="flex flex-col items-center gap-2">
          {/* Auto-fire quick toggle */}
          <button
            onClick={onToggleAutoFire}
            className={`px-3 py-1 rounded-full text-[10px] font-orbitron font-bold border transition-all ${
              autoFire
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-slate-700 text-slate-400'
            }`}
          >
            AUTO-FIRE: {autoFire ? 'ON' : 'OFF'}
          </button>

          {/* Primary Fire Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onFireStart();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onFireEnd();
            }}
            onMouseDown={onFireStart}
            onMouseUp={onFireEnd}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
              autoFire
                ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                : 'bg-cyan-500/25 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:bg-cyan-500/35'
            }`}
          >
            <Zap className={`w-8 h-8 ${autoFire ? 'text-amber-300' : 'text-cyan-300'}`} />
            <span className={`text-[11px] font-orbitron font-black uppercase mt-0.5 tracking-wider ${autoFire ? 'text-amber-300' : 'text-cyan-300'}`}>
              FIRE
            </span>
          </button>
        </div>

      </div>

    </div>
  );
};
