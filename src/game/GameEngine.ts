import {
  Bullet,
  Enemy,
  FloatingText,
  GameSettings,
  GameStats,
  GameStatus,
  Particle,
  Player,
  PowerUp,
  PowerUpType,
  Star,
  WeaponType,
} from '../types/game';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COMBO_TIMEOUT_MS,
  ENEMY_TYPES,
  PLAYER_CONFIG,
  POWER_UP_CONFIG,
} from './constants';
import { sound } from '../utils/audio';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Game state
  public status: GameStatus = 'MENU';
  public stats: GameStats = {
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
  };

  public settings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    screenShakeEnabled: true,
    autoFire: false,
    volume: 0.8,
  };

  // Entities
  public player: Player;
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public particles: Particle[] = [];
  public powerUps: PowerUp[] = [];
  public floatingTexts: FloatingText[] = [];
  public stars: Star[] = [];

  // Wave manager
  private waveInProgress: boolean = false;
  private waveEnemiesToSpawn: { type: keyof typeof ENEMY_TYPES; delay: number }[] = [];
  private waveSpawnTimer: number = 0;
  public waveAnnouncement: { text: string; subtext: string; timer: number; maxTimer: number } | null = null;

  // Screen shake
  private screenShake: number = 0;
  private shockwave: { x: number; y: number; radius: number; maxRadius: number; alpha: number } | null = null;

  // Input states
  public keys: Record<string, boolean> = {};
  public mousePos: { x: number; y: number } | null = null;
  public isMouseDown: boolean = false;
  public touchMove: { x: number; y: number } | null = null;
  public touchActive: boolean = false;

  // Callbacks to UI
  public onStateChange?: (status: GameStatus) => void;
  public onStatsChange?: (stats: GameStats) => void;
  public onPlayerChange?: (player: Player) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    
    // Load high score
    const savedHighScore = localStorage.getItem('galaxy_defender_highscore');
    if (savedHighScore) {
      this.stats.highScore = parseInt(savedHighScore, 10) || 0;
    }

    this.player = this.createInitialPlayer();
    this.initStars();
    this.bindEvents();
  }

  private createInitialPlayer(): Player {
    return {
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
      invulnerableTime: 1500,
      fireCooldown: 0,
      tilt: 0,
    };
  }

  private initStars() {
    this.stars = [];
    const starCount = 140;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3,
        speed: Math.random() * 2.5 + 0.5,
        color: Math.random() < 0.6 ? '#ffffff' : Math.random() < 0.8 ? '#38bdf8' : '#ec4899',
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
      });
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code] = true;

    // Pause on Escape or 'p'
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (this.status === 'PLAYING') {
        this.pauseGame();
      } else if (this.status === 'PAUSED') {
        this.resumeGame();
      }
    }

    // Bomb key: 'b' or 'B' or 'e'
    if ((e.key === 'b' || e.key === 'B' || e.key === 'e' || e.key === 'E') && this.status === 'PLAYING') {
      this.triggerBomb();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code] = false;
  };

  // --- GAME FLOW CONTROLS ---

  public startGame() {
    this.status = 'PLAYING';
    this.player = this.createInitialPlayer();
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];
    this.floatingTexts = [];
    this.shockwave = null;
    this.screenShake = 0;

    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      wave: 1,
      enemiesDefeated: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      shotsHit: 0,
      timeSurvivedSeconds: 0,
      combo: 0,
      maxCombo: 0,
      comboTimer: 0,
    };

    sound.enableAudio();
    if (this.settings.musicEnabled) {
      sound.startMusic();
    }

    this.onStateChange?.(this.status);
    this.onStatsChange?.(this.stats);
    this.onPlayerChange?.(this.player);

    this.startWave(1);

    this.lastTime = performance.now();
    if (!this.animFrameId) {
      this.loop(this.lastTime);
    }
  }

  public pauseGame() {
    if (this.status === 'PLAYING') {
      this.status = 'PAUSED';
      this.onStateChange?.(this.status);
    }
  }

  public resumeGame() {
    if (this.status === 'PAUSED') {
      this.status = 'PLAYING';
      this.lastTime = performance.now();
      this.onStateChange?.(this.status);
    }
  }

  public restartGame() {
    this.startGame();
  }

  public triggerBomb() {
    if (this.status !== 'PLAYING') return;
    if (this.player.bombs <= 0) return;

    this.player.bombs--;
    this.onPlayerChange?.(this.player);

    sound.playBomb();

    // Trigger visual shockwave
    this.shockwave = {
      x: this.player.x,
      y: this.player.y,
      radius: 20,
      maxRadius: Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 1.2,
      alpha: 1,
    };

    this.addScreenShake(20);

    // Wipe all enemy bullets
    this.bullets = this.bullets.filter(b => b.isPlayer);

    // Heavily damage / wipe all enemies
    for (const enemy of this.enemies) {
      const damage = enemy.isBoss ? 350 : 999;
      enemy.hp -= damage;
      this.createExplosion(enemy.x, enemy.y, '#f59e0b', 16);
      if (enemy.hp <= 0) {
        this.stats.enemiesDefeated++;
        this.addScore(enemy.scoreValue, enemy.x, enemy.y);
      }
    }

    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.addFloatingText(this.player.x, this.player.y - 40, 'EMP DETONATED!', '#ef4444', 1.4);
  }

  // --- WAVE SPAWN SYSTEM ---

  private startWave(waveNum: number) {
    this.stats.wave = waveNum;
    this.waveInProgress = true;
    this.waveSpawnTimer = 0;
    this.waveEnemiesToSpawn = [];

    const isBossWave = waveNum % 5 === 0;

    if (isBossWave) {
      sound.playBossWarning();
      this.waveAnnouncement = {
        text: `WARNING: SECTOR ${waveNum} BOSS`,
        subtext: 'MOTHERSHIP DREADNOUGHT APPROACHING',
        timer: 3500,
        maxTimer: 3500,
      };

      // Spawn boss after announcement
      this.waveEnemiesToSpawn.push({ type: 'BOSS', delay: 1800 });
      // Add escorts
      for (let i = 0; i < 4; i++) {
        this.waveEnemiesToSpawn.push({ type: 'FIGHTER', delay: 3000 + i * 1200 });
      }
    } else {
      sound.playWaveStart();
      this.waveAnnouncement = {
        text: `SECTOR ${waveNum}`,
        subtext: waveNum % 3 === 0 ? 'ASTEROID SWARM INCOMING' : 'ENGAGE HOSTILES',
        timer: 2400,
        maxTimer: 2400,
      };

      // Calculate wave enemy composition
      const count = 10 + waveNum * 3;
      for (let i = 0; i < count; i++) {
        let type: keyof typeof ENEMY_TYPES = 'SCOUT';
        const rand = Math.random();

        if (waveNum % 3 === 0 && rand < 0.45) {
          type = 'ASTEROID';
        } else if (waveNum >= 4 && rand < 0.25) {
          type = 'CRUISER';
        } else if (waveNum >= 3 && rand < 0.5) {
          type = 'INTERCEPTOR';
        } else if (waveNum >= 2 && rand < 0.7) {
          type = 'FIGHTER';
        }

        this.waveEnemiesToSpawn.push({
          type,
          delay: 800 + i * Math.max(350, 1100 - waveNum * 60),
        });
      }
    }

    this.onStatsChange?.(this.stats);
  }

  private spawnEnemy(typeKey: keyof typeof ENEMY_TYPES) {
    const config = ENEMY_TYPES[typeKey];
    const isBoss = typeKey === 'BOSS';

    const id = Date.now() + Math.random();
    const hpScale = 1 + (this.stats.wave - 1) * 0.15;
    const hp = isBoss ? config.hp + (this.stats.wave - 5) * 200 : Math.round(config.hp * hpScale);

    let x = Math.random() * (CANVAS_WIDTH - config.width * 2) + config.width;
    let y = -config.height - 20;
    let vx = (Math.random() - 0.5) * 2.5;
    let vy = Math.random() * 1.5 + 1.2;

    if (typeKey === 'ASTEROID') {
      vx = (Math.random() - 0.5) * 3;
      vy = Math.random() * 2 + 1.5;
    } else if (typeKey === 'INTERCEPTOR') {
      vx = Math.random() > 0.5 ? 3.5 : -3.5;
      vy = 2.8;
    } else if (isBoss) {
      x = CANVAS_WIDTH / 2;
      y = -120;
      vx = 2;
      vy = 1;
    }

    const enemy: Enemy = {
      id,
      type: typeKey,
      x,
      y,
      vx,
      vy,
      width: config.width,
      height: config.height,
      hp,
      maxHp: hp,
      scoreValue: config.score,
      color: config.color,
      accentColor: isBoss ? '#f43f5e' : '#38bdf8',
      shootCooldown: Math.random() * 1000 + 500,
      shootInterval: config.shootInterval,
      phase: 0,
      stateTimer: 0,
      radius: Math.max(config.width, config.height) / 2,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      isBoss,
      bossPhase: 1,
      splitCount: typeKey === 'ASTEROID' ? 2 : 0,
    };

    this.enemies.push(enemy);
  }

  // --- MAIN LOOP ---

  private loop = (time: number) => {
    const dt = Math.min((time - this.lastTime), 50); // Clamp delta time
    this.lastTime = time;

    if (this.status === 'PLAYING') {
      this.update(dt);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // --- UPDATE LOGIC ---

  private update(dt: number) {
    const dtSeconds = dt / 1000;
    this.stats.timeSurvivedSeconds += dtSeconds;

    // Combo timer
    if (this.stats.combo > 0) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        this.stats.combo = 0;
        this.onStatsChange?.(this.stats);
      }
    }

    // Wave announcement timer
    if (this.waveAnnouncement) {
      this.waveAnnouncement.timer -= dt;
      if (this.waveAnnouncement.timer <= 0) {
        this.waveAnnouncement = null;
      }
    }

    // Wave enemy spawner
    if (this.waveInProgress) {
      this.waveSpawnTimer += dt;
      while (this.waveEnemiesToSpawn.length > 0 && this.waveSpawnTimer >= this.waveEnemiesToSpawn[0].delay) {
        const item = this.waveEnemiesToSpawn.shift()!;
        this.spawnEnemy(item.type);
      }

      // Check if wave is cleared
      if (this.waveEnemiesToSpawn.length === 0 && this.enemies.length === 0) {
        this.waveInProgress = false;
        // Wave clear bonus
        const waveBonus = this.stats.wave * 1000;
        this.addScore(waveBonus, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.addFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, `WAVE CLEAR! +${waveBonus}`, '#10b981', 1.5);
        sound.playWaveStart();

        // Delay next wave slightly
        setTimeout(() => {
          if (this.status === 'PLAYING') {
            this.startWave(this.stats.wave + 1);
          }
        }, 1500);
      }
    }

    // Update Player
    this.updatePlayer(dt);

    // Update Bullets
    this.updateBullets(dt);

    // Update Enemies
    this.updateEnemies(dt);

    // Update PowerUps
    this.updatePowerUps(dt);

    // Update Particles
    this.updateParticles(dt);

    // Update Floating Texts
    this.updateFloatingTexts(dt);

    // Update Stars
    this.updateStars(dt);

    // Update Shockwave
    if (this.shockwave) {
      this.shockwave.radius += 28;
      this.shockwave.alpha = Math.max(0, 1 - this.shockwave.radius / this.shockwave.maxRadius);
      if (this.shockwave.radius >= this.shockwave.maxRadius) {
        this.shockwave = null;
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 0.05);
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Movement speed calculations
    const currentSpeed = p.speedBoostRemaining > 0 ? PLAYER_CONFIG.boostSpeed : PLAYER_CONFIG.baseSpeed;

    let moveX = 0;
    let moveY = 0;

    // Keyboard inputs
    if (this.keys['arrowleft'] || this.keys['keya']) moveX -= 1;
    if (this.keys['arrowright'] || this.keys['keyd']) moveX += 1;
    if (this.keys['arrowup'] || this.keys['keyw']) moveY -= 1;
    if (this.keys['arrowdown'] || this.keys['keys']) moveY += 1;

    // Touch joystick or drag input
    if (this.touchMove) {
      moveX += this.touchMove.x;
      moveY += this.touchMove.y;
    }

    // Mouse control lerp if mouse is active
    if (this.mousePos) {
      const dx = this.mousePos.x - p.x;
      const dy = this.mousePos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        moveX += (dx / dist) * Math.min(1, dist / 40);
        moveY += (dy / dist) * Math.min(1, dist / 40);
      }
    }

    // Normalize diagonal movement
    const mag = Math.sqrt(moveX * moveX + moveY * moveY);
    if (mag > 0) {
      p.vx = (moveX / mag) * currentSpeed;
      p.vy = (moveY / mag) * currentSpeed;
    } else {
      p.vx *= 0.8;
      p.vy *= 0.8;
    }

    p.x += p.vx;
    p.y += p.vy;

    // Boundaries
    const halfW = p.width / 2;
    const halfH = p.height / 2;
    p.x = Math.max(halfW, Math.min(CANVAS_WIDTH - halfW, p.x));
    p.y = Math.max(halfH + 40, Math.min(CANVAS_HEIGHT - halfH - 20, p.y));

    // Ship tilt roll animation
    const targetTilt = (p.vx / currentSpeed) * 0.45;
    p.tilt += (targetTilt - p.tilt) * 0.25;

    // Invulnerability decay
    if (p.invulnerableTime > 0) {
      p.invulnerableTime = Math.max(0, p.invulnerableTime - dt);
    }

    // Shield decay
    if (p.shieldTimeRemaining > 0) {
      p.shieldTimeRemaining = Math.max(0, p.shieldTimeRemaining - dt);
      if (p.shieldTimeRemaining <= 0) {
        p.hasShield = false;
        this.onPlayerChange?.(this.player);
      }
    }

    // Weapon powerup decay
    if (p.weaponTimeRemaining > 0) {
      p.weaponTimeRemaining = Math.max(0, p.weaponTimeRemaining - dt);
      if (p.weaponTimeRemaining <= 0) {
        p.weapon = 'SINGLE';
        this.onPlayerChange?.(this.player);
      }
    }

    // Rapid fire decay
    if (p.rapidFireRemaining > 0) {
      p.rapidFireRemaining = Math.max(0, p.rapidFireRemaining - dt);
    }

    // Speed boost decay
    if (p.speedBoostRemaining > 0) {
      p.speedBoostRemaining = Math.max(0, p.speedBoostRemaining - dt);
    }

    // Engine thruster particles
    if (Math.random() < 0.7) {
      const offsetX = (Math.random() - 0.5) * 14;
      this.particles.push({
        x: p.x + offsetX,
        y: p.y + p.height / 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 4 + 4,
        size: Math.random() * 4 + 2,
        color: Math.random() < 0.6 ? '#38bdf8' : '#f97316',
        alpha: 0.9,
        decay: 0.05,
        life: 1,
        shape: 'spark',
      });
    }

    // Firing logic
    p.fireCooldown -= dt;
    const isFiring =
      this.keys[' '] ||
      this.keys['space'] ||
      this.isMouseDown ||
      this.settings.autoFire;

    if (isFiring && p.fireCooldown <= 0) {
      this.firePlayerWeapon();
      const fireRate = p.rapidFireRemaining > 0 ? PLAYER_CONFIG.rapidFireRate : PLAYER_CONFIG.baseFireRate;
      p.fireCooldown = fireRate;
    }
  }

  private firePlayerWeapon() {
    const p = this.player;
    this.stats.shotsFired++;

    if (p.weapon === 'SINGLE') {
      sound.playLaser('single');
      this.bullets.push({
        id: Math.random(),
        x: p.x,
        y: p.y - 20,
        vx: 0,
        vy: -15,
        width: 4,
        height: 18,
        damage: 25,
        isPlayer: true,
        color: '#38bdf8',
        glowColor: '#0284c7',
      });
    } else if (p.weapon === 'DOUBLE') {
      sound.playLaser('single');
      [-12, 12].forEach(ox => {
        this.bullets.push({
          id: Math.random(),
          x: p.x + ox,
          y: p.y - 18,
          vx: 0,
          vy: -16,
          width: 5,
          height: 18,
          damage: 22,
          isPlayer: true,
          color: '#38bdf8',
          glowColor: '#0ea5e9',
        });
      });
    } else if (p.weapon === 'TRIPLE') {
      sound.playLaser('triple');
      const angles = [-0.18, 0, 0.18];
      angles.forEach(rad => {
        this.bullets.push({
          id: Math.random(),
          x: p.x + Math.sin(rad) * 12,
          y: p.y - 18,
          vx: Math.sin(rad) * 15,
          vy: -Math.cos(rad) * 15,
          width: 5,
          height: 16,
          damage: 24,
          isPlayer: true,
          color: '#06b6d4',
          glowColor: '#0891b2',
        });
      });
    } else if (p.weapon === 'LASER') {
      sound.playLaser('single');
      this.bullets.push({
        id: Math.random(),
        x: p.x,
        y: p.y - 25,
        vx: 0,
        vy: -20,
        width: 10,
        height: 36,
        damage: 45,
        isPlayer: true,
        color: '#10b981',
        glowColor: '#059669',
        isLaserBeam: true,
      });
    } else if (p.weapon === 'MISSILE') {
      sound.playLaser('missile');
      [-16, 16].forEach(ox => {
        this.bullets.push({
          id: Math.random(),
          x: p.x + ox,
          y: p.y - 10,
          vx: ox > 0 ? 3 : -3,
          vy: -8,
          width: 7,
          height: 18,
          damage: 60,
          isPlayer: true,
          color: '#ec4899',
          glowColor: '#db2777',
          isMissile: true,
          trail: [],
        });
      });
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      // Homing missile logic
      if (b.isMissile && b.isPlayer) {
        let nearestEnemy: Enemy | null = null;
        let minDist = 450;
        for (const enemy of this.enemies) {
          const dx = enemy.x - b.x;
          const dy = enemy.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestEnemy = enemy;
          }
        }

        if (nearestEnemy) {
          const targetAngle = Math.atan2(nearestEnemy.y - b.y, nearestEnemy.x - b.x);
          const currentAngle = Math.atan2(b.vy, b.vx);
          const diff = targetAngle - currentAngle;
          const turn = Math.max(-0.15, Math.min(0.15, diff));
          const newAngle = currentAngle + turn;
          const speed = 14;
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        }

        // Smoke trail
        if (Math.random() < 0.5) {
          this.particles.push({
            x: b.x,
            y: b.y + 8,
            vx: (Math.random() - 0.5) * 1,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 3 + 2,
            color: '#f43f5e',
            alpha: 0.7,
            decay: 0.08,
            life: 1,
            shape: 'smoke',
          });
        }
      }

      b.x += b.vx;
      b.y += b.vy;

      // Out of bounds check
      if (b.y < -50 || b.y > CANVAS_HEIGHT + 50 || b.x < -50 || b.x > CANVAS_WIDTH + 50) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Collisions: Player bullets hitting enemies
      if (b.isPlayer) {
        let bulletHit = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (this.checkBulletEnemyCollision(b, enemy)) {
            bulletHit = true;
            this.stats.shotsHit++;
            enemy.hp -= b.damage;

            // Hit spark
            this.createExplosion(b.x, b.y, b.color, 4);

            // Floating damage
            if (b.damage >= 40) {
              this.addFloatingText(enemy.x, enemy.y - 15, `-${b.damage}`, '#fcd34d', 0.9);
            }

            // Check enemy death
            if (enemy.hp <= 0) {
              this.destroyEnemy(enemy, j);
            }

            if (!b.isLaserBeam) {
              break; // Beam penetrates, others disappear
            }
          }
        }

        if (bulletHit && !b.isLaserBeam) {
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Enemy bullets hitting player
        if (this.checkBulletPlayerCollision(b, this.player)) {
          this.bullets.splice(i, 1);
          this.hitPlayer(b.damage);
          continue;
        }
      }
    }
  }

  private checkBulletEnemyCollision(bullet: Bullet, enemy: Enemy): boolean {
    const dx = bullet.x - enemy.x;
    const dy = bullet.y - enemy.y;
    const distSq = dx * dx + dy * dy;
    const radius = enemy.radius;
    return distSq < radius * radius;
  }

  private checkBulletPlayerCollision(bullet: Bullet, player: Player): boolean {
    if (player.invulnerableTime > 0) return false;
    const dx = bullet.x - player.x;
    const dy = bullet.y - player.y;
    const distSq = dx * dx + dy * dy;
    const radius = player.width * 0.45;
    return distSq < radius * radius;
  }

  private destroyEnemy(enemy: Enemy, enemyIndex: number) {
    this.enemies.splice(enemyIndex, 1);
    this.stats.enemiesDefeated++;

    // Boss check
    if (enemy.isBoss) {
      this.stats.bossesDefeated++;
      sound.playExplosion('boss');
      this.createExplosion(enemy.x, enemy.y, '#f59e0b', 60);
      this.addScreenShake(25);
      this.addFloatingText(enemy.x, enemy.y, 'BOSS ANNIHILATED!', '#38bdf8', 1.8);
      // Spawn guaranteed good powerups
      this.spawnPowerUp(enemy.x - 40, enemy.y, 'SMART_BOMB');
      this.spawnPowerUp(enemy.x + 40, enemy.y, 'SHIELD');
      this.spawnPowerUp(enemy.x, enemy.y + 30, 'LASER_BEAM');
    } else {
      sound.playExplosion(enemy.type === 'CRUISER' ? 'large' : 'medium');
      this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'CRUISER' ? 24 : 12);
      this.addScreenShake(enemy.type === 'CRUISER' ? 8 : 4);
    }

    // Split asteroids
    if (enemy.type === 'ASTEROID' && enemy.splitCount && enemy.splitCount > 0) {
      for (let s = 0; s < 2; s++) {
        const miniAsteroid: Enemy = {
          id: Math.random(),
          type: 'ASTEROID',
          x: enemy.x + (s === 0 ? -15 : 15),
          y: enemy.y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2 + 1.5,
          width: enemy.width * 0.6,
          height: enemy.height * 0.6,
          hp: 20,
          maxHp: 20,
          scoreValue: 40,
          color: enemy.color,
          accentColor: enemy.accentColor,
          shootCooldown: 0,
          shootInterval: 0,
          phase: 0,
          stateTimer: 0,
          radius: (enemy.width * 0.6) / 2,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          splitCount: enemy.splitCount - 1,
        };
        this.enemies.push(miniAsteroid);
      }
    }

    // Combo system
    this.stats.combo++;
    this.stats.comboTimer = COMBO_TIMEOUT_MS;
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }

    // Multiplied Score
    const multiplier = Math.min(5, 1 + Math.floor(this.stats.combo / 4));
    const totalScore = enemy.scoreValue * multiplier;
    this.addScore(totalScore, enemy.x, enemy.y);

    if (this.stats.combo >= 4 && this.stats.combo % 4 === 0) {
      this.addFloatingText(enemy.x, enemy.y - 25, `${multiplier}X COMBO!`, '#ec4899', 1.2);
    }

    // Power-up drop chance
    const dropChance = enemy.type === 'CRUISER' ? 0.75 : enemy.isBoss ? 1.0 : 0.14;
    if (Math.random() < dropChance) {
      this.spawnRandomPowerUp(enemy.x, enemy.y);
    }

    this.onStatsChange?.(this.stats);
  }

  private addScore(amount: number, x?: number, y?: number) {
    this.stats.score += amount;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('galaxy_defender_highscore', this.stats.highScore.toString());
    }

    if (x !== undefined && y !== undefined) {
      this.addFloatingText(x, y, `+${amount}`, '#38bdf8', 1.0);
    }

    this.onStatsChange?.(this.stats);
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.stateTimer += dt;
      e.rotation += e.rotationSpeed;

      // Enemy specific AI patterns
      if (e.isBoss) {
        this.updateBossAI(e, dt);
      } else if (e.type === 'SCOUT') {
        // Swooping arcs
        e.y += e.vy;
        e.x += Math.sin(e.stateTimer * 0.003) * 3;
      } else if (e.type === 'FIGHTER') {
        // Zigzag pattern
        e.y += e.vy;
        e.x += Math.cos(e.stateTimer * 0.004) * 4;
      } else if (e.type === 'INTERCEPTOR') {
        e.y += e.vy;
        e.x += e.vx;
        // Bounce off canvas walls
        if (e.x < e.width || e.x > CANVAS_WIDTH - e.width) {
          e.vx *= -1;
        }
      } else if (e.type === 'CRUISER') {
        e.y += e.vy * 0.7;
        e.x += Math.sin(e.stateTimer * 0.002) * 1.5;
      } else if (e.type === 'ASTEROID') {
        e.x += e.vx;
        e.y += e.vy;
      }

      // Offscreen despawn
      if (e.y > CANVAS_HEIGHT + 100) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Collision with player
      const distToPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (distToPlayer < e.radius + this.player.width * 0.4) {
        this.hitPlayer(35);
        if (!e.isBoss) {
          e.hp -= 50;
          if (e.hp <= 0) {
            this.destroyEnemy(e, i);
            continue;
          }
        }
      }

      // Enemy Shooting logic
      if (e.shootInterval > 0) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0 && e.y > 0 && e.y < CANVAS_HEIGHT - 100) {
          this.enemyShoot(e);
          e.shootCooldown = e.shootInterval + Math.random() * 400;
        }
      }
    }
  }

  private updateBossAI(boss: Enemy, dt: number) {
    // Boss enters to y = 140
    if (boss.y < 140) {
      boss.y += 1.5;
    } else {
      // Oscillate horizontally
      boss.x += boss.vx;
      if (boss.x < 120 || boss.x > CANVAS_WIDTH - 120) {
        boss.vx *= -1;
      }
    }

    // Boss multi-pattern attacks
    boss.shootCooldown -= dt;
    if (boss.shootCooldown <= 0 && boss.y >= 130) {
      sound.playLaser('enemy');
      const hpPercent = boss.hp / boss.maxHp;

      if (hpPercent > 0.6) {
        // Pattern 1: Targeted spread
        for (let a = -2; a <= 2; a++) {
          const angle = Math.PI / 2 + a * 0.2;
          this.bullets.push({
            id: Math.random(),
            x: boss.x + a * 20,
            y: boss.y + 40,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            width: 6,
            height: 12,
            damage: 20,
            isPlayer: false,
            color: '#ef4444',
            glowColor: '#b91c1c',
          });
        }
        boss.shootCooldown = 900;
      } else if (hpPercent > 0.3) {
        // Pattern 2: Spiral Barrage
        boss.phase += 0.3;
        for (let s = 0; s < 3; s++) {
          const angle = boss.phase + (s * Math.PI * 2) / 3;
          this.bullets.push({
            id: Math.random(),
            x: boss.x,
            y: boss.y + 30,
            vx: Math.cos(angle) * 5.5,
            vy: Math.sin(angle) * 5.5,
            width: 7,
            height: 14,
            damage: 22,
            isPlayer: false,
            color: '#f97316',
            glowColor: '#ea580c',
          });
        }
        boss.shootCooldown = 400;
      } else {
        // Enraged Phase: Chaos Barrage + summon drone
        for (let a = -3; a <= 3; a++) {
          const angle = Math.PI / 2 + a * 0.25 + (Math.random() - 0.5) * 0.2;
          this.bullets.push({
            id: Math.random(),
            x: boss.x + a * 15,
            y: boss.y + 45,
            vx: Math.cos(angle) * 7,
            vy: Math.sin(angle) * 7,
            width: 8,
            height: 16,
            damage: 25,
            isPlayer: false,
            color: '#dc2626',
            glowColor: '#7f1d1d',
          });
        }
        boss.shootCooldown = 650;
      }
    }
  }

  private enemyShoot(e: Enemy) {
    sound.playLaser('enemy');
    if (e.type === 'SCOUT') {
      this.bullets.push({
        id: Math.random(),
        x: e.x,
        y: e.y + e.height / 2,
        vx: 0,
        vy: 6.5,
        width: 5,
        height: 12,
        damage: 15,
        isPlayer: false,
        color: '#f43f5e',
        glowColor: '#be123c',
      });
    } else if (e.type === 'FIGHTER') {
      [-10, 10].forEach(ox => {
        this.bullets.push({
          id: Math.random(),
          x: e.x + ox,
          y: e.y + e.height / 2,
          vx: ox * 0.1,
          vy: 7,
          width: 5,
          height: 14,
          damage: 18,
          isPlayer: false,
          color: '#fb923c',
          glowColor: '#c2410c',
        });
      });
    } else if (e.type === 'CRUISER') {
      // Aimed laser at player
      const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      this.bullets.push({
        id: Math.random(),
        x: e.x,
        y: e.y + e.height / 2,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        width: 7,
        height: 16,
        damage: 25,
        isPlayer: false,
        color: '#e11d48',
        glowColor: '#9f1239',
      });
    } else if (e.type === 'INTERCEPTOR') {
      this.bullets.push({
        id: Math.random(),
        x: e.x,
        y: e.y + e.height / 2,
        vx: (Math.random() - 0.5) * 3,
        vy: 8,
        width: 5,
        height: 14,
        damage: 20,
        isPlayer: false,
        color: '#c084fc',
        glowColor: '#7e22ce',
      });
    }
  }

  // --- PLAYER DAMAGE & DEATH ---

  public hitPlayer(damage: number) {
    if (this.player.invulnerableTime > 0) return;

    if (this.player.hasShield) {
      sound.playShieldHit();
      this.player.hasShield = false;
      this.player.invulnerableTime = 1200;
      this.addFloatingText(this.player.x, this.player.y - 30, 'SHIELD ABSORBED!', '#38bdf8', 1.2);
      this.createExplosion(this.player.x, this.player.y, '#38bdf8', 18);
      this.onPlayerChange?.(this.player);
      return;
    }

    // Life loss
    this.player.lives--;
    this.stats.combo = 0;
    sound.playPlayerHit();
    this.addScreenShake(16);
    this.createExplosion(this.player.x, this.player.y, '#ef4444', 25);
    this.player.invulnerableTime = PLAYER_CONFIG.invulnerableDuration;

    // Reset temporary weapons
    this.player.weapon = 'SINGLE';
    this.player.rapidFireRemaining = 0;
    this.player.speedBoostRemaining = 0;

    this.onPlayerChange?.(this.player);
    this.onStatsChange?.(this.stats);

    if (this.player.lives <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.status = 'GAMEOVER';
    sound.playExplosion('boss');
    this.createExplosion(this.player.x, this.player.y, '#f59e0b', 50);
    this.onStateChange?.(this.status);
  }

  // --- POWER UPS ---

  private spawnRandomPowerUp(x: number, y: number) {
    const types: PowerUpType[] = [
      'TRIPLE_SHOT',
      'RAPID_FIRE',
      'LASER_BEAM',
      'HOMING_MISSILE',
      'SHIELD',
      'SMART_BOMB',
      'EXTRA_LIFE',
      'SPEED_BOOST',
    ];
    // Weigh extra life lower if player has high lives
    let chosen = types[Math.floor(Math.random() * types.length)];
    if (chosen === 'EXTRA_LIFE' && this.player.lives >= 3 && Math.random() < 0.7) {
      chosen = 'TRIPLE_SHOT';
    }
    this.spawnPowerUp(x, y, chosen);
  }

  private spawnPowerUp(x: number, y: number, type: PowerUpType) {
    const config = POWER_UP_CONFIG[type];
    this.powerUps.push({
      id: Math.random(),
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 2.2,
      width: 28,
      height: 28,
      color: config.color,
      label: config.label,
      duration: config.duration,
    });
  }

  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += p.vy;
      p.x += p.vx;

      // Magnetic pull to player if close
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < 140) {
        const pull = 4.5;
        p.x += ((this.player.x - p.x) / dist) * pull;
        p.y += ((this.player.y - p.y) / dist) * pull;
      }

      // Collect powerup
      if (dist < this.player.width * 0.6) {
        this.collectPowerUp(p);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Offscreen
      if (p.y > CANVAS_HEIGHT + 40) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private collectPowerUp(p: PowerUp) {
    sound.playPowerUp();
    const config = POWER_UP_CONFIG[p.type];
    this.addFloatingText(this.player.x, this.player.y - 25, config.name.toUpperCase(), config.color, 1.3);
    this.createExplosion(p.x, p.y, config.color, 14);

    switch (p.type) {
      case 'TRIPLE_SHOT':
        this.player.weapon = 'TRIPLE';
        this.player.weaponTimeRemaining = config.duration;
        break;
      case 'RAPID_FIRE':
        this.player.rapidFireRemaining = config.duration;
        break;
      case 'LASER_BEAM':
        this.player.weapon = 'LASER';
        this.player.weaponTimeRemaining = config.duration;
        break;
      case 'HOMING_MISSILE':
        this.player.weapon = 'MISSILE';
        this.player.weaponTimeRemaining = config.duration;
        break;
      case 'SHIELD':
        this.player.hasShield = true;
        this.player.shieldTimeRemaining = config.duration;
        break;
      case 'SMART_BOMB':
        if (this.player.bombs < this.player.maxBombs) {
          this.player.bombs++;
        } else {
          this.addScore(500, this.player.x, this.player.y);
        }
        break;
      case 'EXTRA_LIFE':
        if (this.player.lives < this.player.maxLives) {
          this.player.lives++;
        } else {
          this.addScore(1000, this.player.x, this.player.y);
        }
        break;
      case 'SPEED_BOOST':
        this.player.speedBoostRemaining = config.duration;
        break;
    }

    this.onPlayerChange?.(this.player);
  }

  // --- VISUAL JUICE & PARTICLES ---

  public addScreenShake(amount: number) {
    if (!this.settings.screenShakeEnabled) return;
    this.screenShake = Math.min(25, this.screenShake + amount);
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 0.04 + 0.02,
        life: 1,
        shape: Math.random() < 0.2 ? 'ring' : 'spark',
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string, scale: number = 1) {
    this.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      scale,
      vy: -1.8,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.shape === 'ring') {
        p.size += 1.8;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateStars(dt: number) {
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * CANVAS_WIDTH;
      }
      star.alpha += (Math.random() - 0.5) * star.twinkleSpeed;
      star.alpha = Math.max(0.2, Math.min(1, star.alpha));
    }
  }

  // --- RENDERING PIPELINE ---

  public render() {
    const ctx = this.ctx;
    ctx.save();

    // Clear background
    ctx.fillStyle = '#030712'; // deep space darkness
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    // Render Parallax Stars
    this.renderStars(ctx);

    // Render Shockwave EMP ring
    if (this.shockwave) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.shockwave.x, this.shockwave.y, this.shockwave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${this.shockwave.alpha * 0.8})`;
      ctx.lineWidth = 14;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 25;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.shockwave.x, this.shockwave.y, this.shockwave.radius * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${this.shockwave.alpha * 0.6})`;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }

    // Render Power-Ups
    this.renderPowerUps(ctx);

    // Render Bullets
    this.renderBullets(ctx);

    // Render Enemies
    this.renderEnemies(ctx);

    // Render Player
    if (this.status !== 'GAMEOVER') {
      this.renderPlayer(ctx);
    }

    // Render Particles
    this.renderParticles(ctx);

    // Render Floating Combat Text
    this.renderFloatingTexts(ctx);

    // Render Wave Announcement Banner
    if (this.waveAnnouncement) {
      this.renderWaveAnnouncement(ctx);
    }

    ctx.restore();
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    for (const star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // Flicker when invulnerable
    if (p.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);

    // Shield Aura
    if (p.hasShield) {
      ctx.save();
      const shieldGlow = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldGlow})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, p.width * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating hex shield accents
      ctx.rotate(Date.now() * 0.002);
      ctx.setLineDash([8, 12]);
      ctx.strokeStyle = '#06b6d4';
      ctx.stroke();
      ctx.restore();
    }

    // Neon Starfighter Ship Body
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;

    // Wing cannons
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-22, -10, 4, 22);
    ctx.fillRect(18, -10, 4, 22);

    // Main hull path
    ctx.beginPath();
    ctx.moveTo(0, -26); // Nose
    ctx.lineTo(16, 10);
    ctx.lineTo(24, 18);
    ctx.lineTo(12, 22);
    ctx.lineTo(6, 16);
    ctx.lineTo(-6, 16);
    ctx.lineTo(-12, 22);
    ctx.lineTo(-24, 18);
    ctx.lineTo(-16, 10);
    ctx.closePath();

    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cockpit canopy glow
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(5, -4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fill();

    // Engine thruster glow
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(-8, 16, 3, 0, Math.PI * 2);
    ctx.arc(8, 16, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const b of this.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);

      ctx.shadowColor = b.glowColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.color;

      if (b.isLaserBeam) {
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        // Bright white center core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-b.width / 4, -b.height / 2, b.width / 2, b.height);
      } else if (b.isMissile) {
        // Rocket graphic
        const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
        ctx.rotate(angle);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(4, 6);
        ctx.lineTo(-4, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-2, 6, 4, 3);
      } else {
        // Rounded laser bolt
        ctx.beginPath();
        ctx.roundRect(-b.width / 2, -b.height / 2, b.width, b.height, 3);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotation);

      if (e.isBoss) {
        this.renderBoss(ctx, e);
      } else if (e.type === 'ASTEROID') {
        this.renderAsteroid(ctx, e);
      } else {
        this.renderStandardEnemy(ctx, e);
      }

      ctx.restore();
    }
  }

  private renderStandardEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;

    if (e.type === 'SCOUT') {
      // Dart drone
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(14, -14);
      ctx.lineTo(0, -8);
      ctx.lineTo(-14, -14);
      ctx.closePath();
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing eye core
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'FIGHTER') {
      // Winged fighter
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(18, -6);
      ctx.lineTo(12, -18);
      ctx.lineTo(0, -10);
      ctx.lineTo(-12, -18);
      ctx.lineTo(-18, -6);
      ctx.closePath();
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Engine lights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-8, -14, 3, 4);
      ctx.fillRect(5, -14, 3, 4);
    } else if (e.type === 'CRUISER') {
      // Heavy hexagonal ship
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(24, 8);
      ctx.lineTo(24, -18);
      ctx.lineTo(0, -26);
      ctx.lineTo(-24, -18);
      ctx.lineTo(-24, 8);
      ctx.closePath();
      ctx.fillStyle = '#311025';
      ctx.fill();
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Health bar above cruiser
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-20, -34, 40, 5);
      ctx.fillStyle = '#e11d48';
      const hpWidth = Math.max(0, (e.hp / e.maxHp) * 40);
      ctx.fillRect(-20, -34, hpWidth, 5);
    } else if (e.type === 'INTERCEPTOR') {
      // Sleek triangular dagger
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(16, -14);
      ctx.lineTo(0, -18);
      ctx.lineTo(-16, -14);
      ctx.closePath();
      ctx.fillStyle = '#2e1065';
      ctx.fill();
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private renderAsteroid(ctx: CanvasRenderingContext2D, e: Enemy) {
    const r = e.radius;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    // Jagged procedural polygon
    ctx.beginPath();
    const vertices = 8;
    for (let v = 0; v < vertices; v++) {
      const angle = (v / vertices) * Math.PI * 2;
      const mod = (v % 2 === 0 ? 0.85 : 1.15) * r;
      const x = Math.cos(angle) * mod;
      const y = Math.sin(angle) * mod;
      if (v === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crater accents
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(r * 0.25, -r * 0.2, r * 0.25, 0, Math.PI * 2);
    ctx.arc(-r * 0.3, r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBoss(ctx: CanvasRenderingContext2D, boss: Enemy) {
    // Mothership Dreadnought
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 20;

    // Outer wings
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(60, 20);
    ctx.lineTo(70, -20);
    ctx.lineTo(40, -45);
    ctx.lineTo(15, -35);
    ctx.lineTo(0, -45);
    ctx.lineTo(-15, -35);
    ctx.lineTo(-40, -45);
    ctx.lineTo(-70, -20);
    ctx.lineTo(-60, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pulsing Core
    const pulse = Math.sin(Date.now() * 0.008) * 4;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Laser Turrets
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-45, 15, 6, 16);
    ctx.fillRect(39, 15, 6, 16);
    ctx.fillRect(-22, 28, 6, 14);
    ctx.fillRect(16, 28, 6, 14);

    // Huge Boss Health Bar
    ctx.save();
    ctx.translate(0, -65);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(-70, 0, 140, 10);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-70, 0, 140, 10);

    const hpWidth = Math.max(0, (boss.hp / boss.maxHp) * 140);
    const grad = ctx.createLinearGradient(-70, 0, 70, 0);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(-70, 0, hpWidth, 10);
    ctx.restore();
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D) {
    for (const p of this.powerUps) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Pulsing outer orb
      const pulse = Math.sin(Date.now() * 0.007) * 3;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 15;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, p.width / 2 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner Badge text
      ctx.fillStyle = p.color;
      ctx.font = 'bold 12px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, 0, 1);

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${Math.round(14 * ft.scale)}px "Orbitron", monospace`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private renderWaveAnnouncement(ctx: CanvasRenderingContext2D) {
    if (!this.waveAnnouncement) return;
    const a = this.waveAnnouncement;
    const progress = 1 - a.timer / a.maxTimer;
    const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    // Banner background
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(0, CANVAS_HEIGHT / 2 - 70, CANVAS_WIDTH, 140);

    ctx.strokeStyle = a.text.includes('WARNING') ? '#ef4444' : '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, CANVAS_HEIGHT / 2 - 70, CANVAS_WIDTH, 140);

    // Main header
    ctx.font = 'bold 36px "Orbitron", monospace';
    ctx.fillStyle = a.text.includes('WARNING') ? '#ef4444' : '#38bdf8';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.fillText(a.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    // Subtext
    ctx.font = '600 16px "Rajdhani", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 5;
    ctx.fillText(a.subtext, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28);

    ctx.restore();
  }
}
