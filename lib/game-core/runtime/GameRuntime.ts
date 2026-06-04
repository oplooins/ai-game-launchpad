import type { Actor, GameState, InputState } from "./GameState";
import { actorFromEnemy, actorFromPickup, createInitialState, makeEffect, makeProjectile } from "./GameState";
import type { GameBlueprint } from "../blueprint/schema";

function hit(a: { x: number; y: number; r: number }, b: { x: number; y: number; r: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function nearestTarget(from: Actor, state: GameState) {
  const targets = [...state.enemies.filter((e) => e.alive), ...(state.boss && state.boss.alive ? [state.boss] : [])];
  let best: Actor | undefined;
  let bestDistance = Infinity;
  for (const target of targets) {
    const d = Math.hypot(target.x - from.x, target.y - from.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = target;
    }
  }
  return best;
}

export class GameRuntime {
  state: GameState;
  input: InputState;

  constructor(blueprint: GameBlueprint, width: number, height: number) {
    this.state = createInitialState(blueprint, width, height);
    this.input = { left: false, right: false, up: false, down: false, attack: false, dash: false, pointerDown: false, pointerX: width / 2, pointerY: height / 2 };
  }

  resize(width: number, height: number) {
    this.state.width = width;
    this.state.height = height;
  }

  setInput(input: Partial<InputState>) {
    this.input = { ...this.input, ...input };
  }

  step(dt: number) {
    const state = this.state;
    if (state.status !== "playing") return;
    state.frame += 1;
    state.time += dt;

    if (state.blueprint.gameType === "endlessRunner") this.updateRunner(dt);
    else if (state.blueprint.gameType === "platformer") this.updatePlatformer(dt);
    else if (state.blueprint.gameType === "towerDefense") this.updateTowerDefense(dt);
    else if (state.blueprint.gameType === "cardBattle") this.updateCardBattle(dt);
    else this.updateArena(dt);

    this.updateProjectiles(dt);
    this.updatePickups();
    this.updateEffects(dt);
    this.checkEndState();
  }

  private firePlayerShot(targetX?: number, targetY?: number) {
    const state = this.state;
    const player = state.player;
    if (player.cooldown > 0) return;
    let tx = targetX;
    let ty = targetY;
    const target = nearestTarget(player, state);
    if ((tx === undefined || ty === undefined) && target) {
      tx = target.x;
      ty = target.y;
    }
    if (tx === undefined || ty === undefined) {
      tx = player.x + (player.vx || 1) * 200;
      ty = player.y + (player.vy || 0) * 200;
    }
    const count = state.blueprint.difficulty === "hard" ? 2 : 3;
    const baseAngle = Math.atan2(ty - player.y, tx - player.x);
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 0.13;
      const angle = baseAngle + offset;
      const fakeTarget = { x: player.x + Math.cos(angle) * 200, y: player.y + Math.sin(angle) * 200 };
      state.projectiles.push(makeProjectile(player, fakeTarget.x, fakeTarget.y, "player", state.blueprint.palette.accent, 28, 680));
    }
    state.effects.push(makeEffect("text", player.x - 12, player.y - 32, state.blueprint.palette.accent, { text: "SHOT", life: 0.35 }));
    player.cooldown = 0.16;
  }

  private updateArena(dt: number) {
    const state = this.state;
    const player = state.player;
    const input = this.input;
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hitFlash = Math.max(0, player.hitFlash - dt);

    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const len = Math.max(1, Math.hypot(dx, dy));
    dx /= len;
    dy /= len;
    if (dx || dy) {
      player.vx = dx;
      player.vy = dy;
    }
    const dash = input.dash && dx + dy !== 0 ? 2.7 : 1;
    player.x = clamp(player.x + dx * player.speed * dash * dt, 40, state.width - 40);
    player.y = clamp(player.y + dy * player.speed * dash * dt, 120, state.height - 40);
    if (input.attack || input.pointerDown) this.firePlayerShot(input.pointerDown ? input.pointerX : undefined, input.pointerDown ? input.pointerY : undefined);

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.cooldown -= dt;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      const ex = player.x - enemy.x;
      const ey = player.y - enemy.y;
      const dist = Math.max(1, Math.hypot(ex, ey));
      if (enemy.archetype === "drone") {
        enemy.x += Math.sin(state.time * 3 + enemy.x) * 25 * dt;
        enemy.y += Math.cos(state.time * 2.4 + enemy.y) * 25 * dt;
        if (enemy.cooldown <= 0) {
          state.projectiles.push(makeProjectile(enemy, player.x, player.y, "enemy", state.blueprint.palette.danger, 8, 260));
          enemy.cooldown = 1.2 + Math.random() * 0.9;
        }
      } else if (enemy.archetype === "robot") {
        if (dist > 160) {
          enemy.x += (ex / dist) * enemy.speed * dt;
          enemy.y += (ey / dist) * enemy.speed * dt;
        }
        if (enemy.cooldown <= 0 && dist < 330) {
          for (let i = -1; i <= 1; i++) {
            const a = Math.atan2(ey, ex) + i * 0.18;
            state.projectiles.push(makeProjectile(enemy, enemy.x + Math.cos(a) * 200, enemy.y + Math.sin(a) * 200, "enemy", "#f97316", 10, 300));
          }
          enemy.cooldown = 2.1;
        }
      } else {
        enemy.x += (ex / dist) * enemy.speed * dt;
        enemy.y += (ey / dist) * enemy.speed * dt;
      }
      if (hit(player, enemy)) this.damagePlayer(enemy.archetype === "beast" ? 14 : 8);
    }

    this.updateBoss(dt);
  }

  private updateBoss(dt: number) {
    const state = this.state;
    const boss = state.boss;
    if (!boss || !boss.alive) return;
    const player = state.player;
    boss.cooldown -= dt;
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    boss.x += Math.sin(state.time * 0.8) * 15 * dt;
    boss.y += Math.cos(state.time * 0.9) * 15 * dt;
    if (boss.cooldown <= 0) {
      const phase = boss.hp < boss.maxHp * 0.33 ? 3 : boss.hp < boss.maxHp * 0.66 ? 2 : 1;
      const count = phase === 1 ? 6 : phase === 2 ? 10 : 14;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + state.time;
        state.projectiles.push(makeProjectile(boss, boss.x + Math.cos(a) * 260, boss.y + Math.sin(a) * 260, "boss", state.blueprint.palette.danger, 12, 260 + phase * 40));
      }
      state.projectiles.push(makeProjectile(boss, player.x, player.y, "boss", state.blueprint.palette.accent, 18, 360));
      boss.cooldown = phase === 1 ? 2.2 : phase === 2 ? 1.6 : 1.1;
    }
  }

  private updateRunner(dt: number) {
    const state = this.state;
    const p = state.player;
    p.cooldown = Math.max(0, p.cooldown - dt);
    const ground = state.height - 82;
    p.vy += 1450 * dt;
    p.y += p.vy * dt;
    if (p.y > ground) {
      p.y = ground;
      p.vy = 0;
    }
    if ((this.input.up || this.input.attack) && p.y >= ground - 1) p.vy = -680;
    p.x = 140;
    state.score += dt * 12;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.x -= (220 + state.wave * 18) * dt;
      if (enemy.x < -80) {
        enemy.x = state.width + Math.random() * 500;
        enemy.y = ground;
        enemy.alive = true;
      }
      if (hit(p, enemy)) this.damagePlayer(10);
    }
  }

  private updatePlatformer(dt: number) {
    this.updateRunner(dt);
    const p = this.state.player;
    if (this.input.left) p.x -= p.speed * dt;
    if (this.input.right) p.x += p.speed * dt;
    p.x = clamp(p.x, 30, this.state.width - 30);
  }

  private updateTowerDefense(dt: number) {
    const state = this.state;
    state.score += dt * 2;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.x -= enemy.speed * dt;
      if (enemy.x < 80) {
        enemy.alive = false;
        this.damagePlayer(8);
      }
      if (enemy.cooldown <= 0) {
        enemy.cooldown = 0.5;
      } else enemy.cooldown -= dt;
    }
    if (this.input.attack || this.input.pointerDown) {
      const dummy: Actor = { ...state.player, x: this.input.pointerX || 180, y: this.input.pointerY || state.height / 2 };
      state.towers.push(dummy);
      state.effects.push(makeEffect("text", dummy.x, dummy.y, state.blueprint.palette.accent, { text: "TOWER", life: 0.5 }));
      this.input.pointerDown = false;
    }
    for (const tower of state.towers) {
      tower.cooldown -= dt;
      if (tower.cooldown <= 0) {
        const target = state.enemies.find((e) => e.alive && Math.abs(e.y - tower.y) < 90);
        if (target) state.projectiles.push(makeProjectile(tower, target.x, target.y, "player", state.blueprint.palette.accent, 22, 520));
        tower.cooldown = 0.8;
      }
    }
  }

  private updateCardBattle(dt: number) {
    const state = this.state;
    state.player.cooldown -= dt;
    if (this.input.attack && state.player.cooldown <= 0 && state.boss?.alive) {
      state.boss.hp -= 35;
      state.score += 35;
      state.effects.push(makeEffect("text", state.boss.x - 30, state.boss.y - 80, state.blueprint.palette.accent, { text: "CARD HIT", life: 0.8 }));
      state.player.cooldown = 0.6;
    }
  }

  private updateProjectiles(dt: number) {
    const state = this.state;
    for (const p of state.projectiles) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.cooldown -= dt;
      const owner = p.data?.owner;
      const damage = Number(p.data?.damage || 10);
      if (owner === "player") {
        for (const enemy of state.enemies) {
          if (enemy.alive && hit(p, enemy)) {
            this.damageActor(enemy, damage);
            p.alive = false;
            state.score += 10;
          }
        }
        if (state.boss?.alive && hit(p, state.boss)) {
          this.damageActor(state.boss, damage);
          p.alive = false;
          state.score += 15;
        }
      } else if (hit(p, state.player)) {
        this.damagePlayer(damage);
        p.alive = false;
      }
      if (p.cooldown <= 0 || p.x < -80 || p.y < -80 || p.x > state.width + 80 || p.y > state.height + 80) p.alive = false;
    }
    state.projectiles = state.projectiles.filter((p) => p.alive);
  }

  private updatePickups() {
    const state = this.state;
    for (const pickup of state.pickups) {
      if (!pickup.alive) continue;
      if (hit(state.player, pickup)) {
        pickup.alive = false;
        const type = pickup.archetype;
        if (type === "healthPack") state.player.hp = Math.min(state.player.maxHp, state.player.hp + 26);
        else state.score += type === "energyCore" || type === "coin" ? 50 : 25;
        state.effects.push(makeEffect("text", pickup.x, pickup.y, state.blueprint.palette.accent, { text: type === "healthPack" ? "+HP" : "+SCORE", life: 0.75 }));
      }
    }
  }

  private updateEffects(dt: number) {
    const state = this.state;
    for (const e of state.effects) e.life -= dt;
    state.effects = state.effects.filter((e) => e.life > 0);
  }

  private damagePlayer(amount: number) {
    const player = this.state.player;
    if (player.hitFlash > 0) return;
    player.hp -= amount;
    player.hitFlash = 0.35;
    this.state.effects.push(makeEffect("explosion", player.x, player.y, this.state.blueprint.palette.danger, { r: 24, life: 0.25 }));
  }

  private damageActor(actor: Actor, amount: number) {
    actor.hp -= amount;
    actor.hitFlash = 0.2;
    this.state.effects.push(makeEffect("explosion", actor.x, actor.y, this.state.blueprint.palette.accent, { r: actor.kind === "boss" ? 44 : 22, life: 0.28 }));
    this.state.effects.push(makeEffect("text", actor.x - 8, actor.y - actor.r - 16, "#fef3c7", { text: `-${Math.round(amount)}`, life: 0.55 }));
    if (actor.hp <= 0) {
      actor.alive = false;
      this.state.effects.push(makeEffect("explosion", actor.x, actor.y, this.state.blueprint.palette.accent, { r: actor.kind === "boss" ? 90 : 36, life: 0.6 }));
    }
  }

  private checkEndState() {
    const state = this.state;
    if (state.player.hp <= 0) state.status = "lost";
    if (state.boss && !state.boss.alive) state.status = "won";
    if (!state.enemies.some((e) => e.alive) && state.status === "playing" && state.boss?.alive) {
      state.wave += 1;
      const spawned = state.blueprint.enemies.flatMap((enemy, groupIndex) => Array.from({ length: Math.max(1, Math.ceil(enemy.count / 2)) }).map((_, i) => {
        const actor = actorFromEnemy(enemy, groupIndex * 10 + i + state.wave * 99, state.width, state.height);
        actor.hp += state.wave * 6;
        actor.maxHp = actor.hp;
        actor.speed += state.wave * 5;
        return actor;
      }));
      state.enemies = spawned;
      state.pickups = state.blueprint.items.map((item, i) => actorFromPickup(item, i + state.wave * 10, state.width, state.height));
      state.effects.push(makeEffect("text", state.width / 2 - 40, state.height / 2, state.blueprint.palette.accent, { text: `WAVE ${state.wave}`, life: 1.2 }));
    }
  }
}
