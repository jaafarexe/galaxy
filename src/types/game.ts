export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type WeaponType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'LASER' | 'MISSILE';

export type PowerUpType = 
  | 'TRIPLE_SHOT'
  | 'RAPID_FIRE'
  | 'LASER_BEAM'
  | 'HOMING_MISSILE'
  | 'SHIELD'
  | 'SMART_BOMB'
  | 'EXTRA_LIFE'
  | 'SPEED_BOOST';

export type EnemyType = 
  | 'SCOUT'
  | 'FIGHTER'
  | 'CRUISER'
  | 'INTERCEPTOR'
  | 'ASTEROID'
  | 'BOSS';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  maxLives: number;
  shield: number; // 0 to 100
  hasShield: boolean;
  shieldTimeRemaining: number;
  weapon: WeaponType;
  weaponTimeRemaining: number;
  rapidFireRemaining: number;
  speedBoostRemaining: number;
  bombs: number;
  maxBombs: number;
  invulnerableTime: number;
  fireCooldown: number;
  tilt: number; // for roll animation
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  glowColor: string;
  isLaserBeam?: boolean;
  isMissile?: boolean;
  targetEnemyId?: number;
  trail?: { x: number; y: number; alpha: number }[];
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  color: string;
  accentColor: string;
  shootCooldown: number;
  shootInterval: number;
  phase: number;
  stateTimer: number;
  radius: number; // For collision & asteroids
  rotation: number;
  rotationSpeed: number;
  splitCount?: number; // For splitting asteroids
  isBoss?: boolean;
  bossPhase?: number;
  patternType?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  shape?: 'circle' | 'spark' | 'ring' | 'smoke';
  maxLife?: number;
}

export interface PowerUp {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  vx: number;
  width: number;
  height: number;
  color: string;
  label: string;
  duration: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  alpha: number;
  twinkleSpeed: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  shotsFired: number;
  shotsHit: number;
  timeSurvivedSeconds: number;
  combo: number;
  maxCombo: number;
  comboTimer: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  screenShakeEnabled: boolean;
  autoFire: boolean;
  volume: number;
}
