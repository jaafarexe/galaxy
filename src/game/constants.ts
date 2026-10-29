import { PowerUpType, WeaponType } from '../types/game';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 900;

export const PLAYER_CONFIG = {
  width: 48,
  height: 48,
  baseSpeed: 7,
  boostSpeed: 10,
  maxLives: 5,
  initialLives: 3,
  initialBombs: 2,
  maxBombs: 4,
  baseFireRate: 150, // ms between shots
  rapidFireRate: 85,
  invulnerableDuration: 2000, // ms
  shieldDuration: 12000, // ms
  weaponDuration: 14000, // ms
};

export const POWER_UP_CONFIG: Record<
  PowerUpType,
  { label: string; name: string; color: string; duration: number; icon: string }
> = {
  TRIPLE_SHOT: {
    label: '3X',
    name: 'Triple Plasma',
    color: '#06b6d4', // Cyan
    duration: 14000,
    icon: 'Zap',
  },
  RAPID_FIRE: {
    label: 'RF',
    name: 'Hyper Cannon',
    color: '#f59e0b', // Amber
    duration: 12000,
    icon: 'Flame',
  },
  LASER_BEAM: {
    label: 'LZ',
    name: 'Proton Beam',
    color: '#10b981', // Emerald
    duration: 10000,
    icon: 'Radio',
  },
  HOMING_MISSILE: {
    label: 'MS',
    name: 'Viper Missiles',
    color: '#ec4899', // Pink
    duration: 14000,
    icon: 'Crosshair',
  },
  SHIELD: {
    label: 'SH',
    name: 'Energy Barrier',
    color: '#3b82f6', // Blue
    duration: 12000,
    icon: 'Shield',
  },
  SMART_BOMB: {
    label: 'BM',
    name: 'EMP Supernova',
    color: '#ef4444', // Red
    duration: 0,
    icon: 'Bomb',
  },
  EXTRA_LIFE: {
    label: '+1',
    name: 'Hull Repair',
    color: '#22c55e', // Green
    duration: 0,
    icon: 'Heart',
  },
  SPEED_BOOST: {
    label: 'SP',
    name: 'Ion Afterburner',
    color: '#a855f7', // Purple
    duration: 10000,
    icon: 'Gauge',
  },
};

export const ENEMY_TYPES = {
  SCOUT: {
    hp: 25,
    score: 100,
    width: 32,
    height: 32,
    color: '#f43f5e',
    shootInterval: 2200,
  },
  FIGHTER: {
    hp: 45,
    score: 180,
    width: 38,
    height: 38,
    color: '#fb923c',
    shootInterval: 1800,
  },
  INTERCEPTOR: {
    hp: 35,
    score: 220,
    width: 34,
    height: 34,
    color: '#c084fc',
    shootInterval: 1400,
  },
  CRUISER: {
    hp: 140,
    score: 450,
    width: 54,
    height: 54,
    color: '#e11d48',
    shootInterval: 1200,
  },
  ASTEROID: {
    hp: 40,
    score: 80,
    width: 44,
    height: 44,
    color: '#94a3b8',
    shootInterval: 0,
  },
  BOSS: {
    hp: 900,
    score: 3000,
    width: 140,
    height: 100,
    color: '#dc2626',
    shootInterval: 600,
  },
};

export const COMBO_TIMEOUT_MS = 2800;
