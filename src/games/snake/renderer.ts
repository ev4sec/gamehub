import { MAX_DPR } from '../../platform/canvas';
import { MAGNET_RADIUS, POWER_META, cellKey } from './engine/constants';
import { hasEffect } from './engine/engine';
import type { GameEvent, GameState, Vec } from './engine/types';
import { DEFAULT_SKIN, type Skin } from './skins';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
  size: number;
}

const TAU = Math.PI * 2;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function alphaOf(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private size = 480;
  private cell = 20;
  private skin: Skin = DEFAULT_SKIN;

  private particles: Particle[] = [];
  private floats: FloatText[] = [];
  private shake = 0;
  private flash = 0;
  private flashColor = '#ffffff';
  private elapsed = 0;

  private prevSnake: Vec[] = [];
  private prevRival: Vec[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d canvas context unavailable');
    this.ctx = ctx;
  }

  setSkin(skin: Skin): void {
    this.skin = skin;
  }

  /**
   * Sizes the backing store so nothing is blurry, at a ratio the phone can
   * actually afford. This used to take `devicePixelRatio` raw; on a handset
   * reporting 3 that is 2.25 times the fill rate of a capped canvas, on the
   * most expensive renderer in the project, for a difference no eye resolves.
   *
   * The two guarded assignments are not micro-optimisation. Writing
   * `canvas.width` clears the backing store even when the value is unchanged,
   * and a ResizeObserver fires on any layout pass, so an unrelated reflow used
   * to blank the frame. The element's size is left to its own classes.
   */
  resize(cssSize: number, grid: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.size = cssSize;
    this.cell = cssSize / grid;

    const px = Math.round(cssSize * dpr);
    if (this.canvas.width !== px) this.canvas.width = px;
    if (this.canvas.height !== px) this.canvas.height = px;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  reset(): void {
    this.particles = [];
    this.floats = [];
    this.shake = 0;
    this.flash = 0;
    this.prevSnake = [];
    this.prevRival = [];
  }

  /** Called immediately before `step`, so draw can interpolate between ticks. */
  snapshot(s: GameState): void {
    this.prevSnake = s.snake.map((p) => ({ ...p }));
    this.prevRival = s.rival ? s.rival.map((p) => ({ ...p })) : [];
  }

  consume(events: GameEvent[]): void {
    const sk = this.skin;
    for (const ev of events) {
      switch (ev.t) {
        case 'eat':
          this.burst(ev.pos, 16, sk.food, 5.5);
          this.floats.push({
            x: ev.pos.x + 0.5,
            y: ev.pos.y + 0.2,
            text: ev.combo > 1 ? `+${ev.gained}  x${ev.combo}` : `+${ev.gained}`,
            life: 900,
            max: 900,
            color: ev.combo > 1 ? sk.accent : '#e2e8f0',
            size: ev.combo > 1 ? 0.62 : 0.5,
          });
          this.shake = Math.max(this.shake, 2.2);
          break;
        case 'power': {
          const meta = POWER_META[ev.kind];
          this.burst(ev.pos, 24, meta.color, 7);
          this.floats.push({
            x: ev.pos.x + 0.5,
            y: ev.pos.y + 0.2,
            text: meta.label,
            life: 1100,
            max: 1100,
            color: meta.color,
            size: 0.62,
          });
          this.flash = Math.max(this.flash, 0.22);
          this.flashColor = meta.color;
          this.shake = Math.max(this.shake, 4);
          break;
        }
        case 'portal':
          this.burst(ev.from, 12, sk.accent, 6);
          this.burst(ev.to, 12, sk.accent, 6);
          break;
        case 'rivalDown':
          this.burst(ev.pos, 26, sk.rival, 8);
          this.floats.push({
            x: ev.pos.x + 0.5,
            y: ev.pos.y + 0.2,
            text: 'RIVAL DOWN +50',
            life: 1300,
            max: 1300,
            color: sk.rival,
            size: 0.6,
          });
          this.shake = Math.max(this.shake, 6);
          break;
        case 'hazard':
          this.burst(ev.pos, 8, sk.wallEdge, 3.5);
          this.shake = Math.max(this.shake, 1.6);
          break;
        case 'levelUp':
          this.flash = Math.max(this.flash, 0.3);
          this.flashColor = sk.accent;
          break;
        case 'death':
          this.burst(ev.pos, 34, sk.food, 10);
          this.flash = Math.max(this.flash, 0.42);
          this.flashColor = '#ef4444';
          this.shake = Math.max(this.shake, 13);
          break;
      }
    }
  }

  private burst(at: Vec, count: number, color: string, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + Math.random() * 0.6;
      const mag = speed * (0.35 + Math.random() * 0.75);
      this.particles.push({
        x: at.x + 0.5,
        y: at.y + 0.5,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        life: 520 + Math.random() * 380,
        max: 900,
        size: 0.07 + Math.random() * 0.12,
        color,
      });
    }
  }

  private advance(dt: number): void {
    const sec = dt / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * sec;
      p.y += p.vy * sec;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vy += 5 * sec;
    }

    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      if (f.life <= 0) this.floats.splice(i, 1);
      else f.y -= 0.9 * sec;
    }

    this.shake *= Math.pow(0.86, dt / 16.67);
    if (this.shake < 0.05) this.shake = 0;
    this.flash *= Math.pow(0.9, dt / 16.67);
    if (this.flash < 0.005) this.flash = 0;
  }

  /** Positions for index i, slid from where it was toward where it is. */
  private interpolate(cur: Vec[], prev: Vec[], alpha: number): Vec[] {
    if (prev.length === 0) return cur.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 }));
    const fallback = prev[prev.length - 1];
    return cur.map((p, i) => {
      const q = prev[i] ?? fallback;
      // A portal or a wrap moved this segment across the board; sliding it
      // there would draw a line through everything in between.
      if (Math.abs(p.x - q.x) > 1.5 || Math.abs(p.y - q.y) > 1.5) {
        return { x: p.x + 0.5, y: p.y + 0.5 };
      }
      return {
        x: q.x + (p.x - q.x) * alpha + 0.5,
        y: q.y + (p.y - q.y) * alpha + 0.5,
      };
    });
  }

  draw(s: GameState, alpha: number, dt: number): void {
    this.elapsed += dt;
    this.advance(dt);

    const ctx = this.ctx;
    const cell = this.cell;
    const size = this.size;
    const sk = this.skin;
    const t = this.elapsed / 1000;

    ctx.save();

    if (this.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shake,
        (Math.random() - 0.5) * this.shake,
      );
    }

    // Background
    const bg = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.1,
      size / 2, size / 2, size * 0.78,
    );
    bg.addColorStop(0, sk.bg);
    bg.addColorStop(1, sk.bgEdge);
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, size + 40, size + 40);

    // Grid
    ctx.strokeStyle = sk.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < s.gridW; i++) {
      ctx.moveTo(Math.round(i * cell) + 0.5, 0);
      ctx.lineTo(Math.round(i * cell) + 0.5, size);
    }
    for (let i = 1; i < s.gridH; i++) {
      ctx.moveTo(0, Math.round(i * cell) + 0.5);
      ctx.lineTo(size, Math.round(i * cell) + 0.5);
    }
    ctx.stroke();

    this.drawPortals(s, t);
    this.drawWalls(s);
    this.drawFood(s, t);
    this.drawDrops(s, t);

    if (s.rival) {
      const pts = this.interpolate(s.rival, this.prevRival, alpha);
      this.drawBody(pts, sk.rivalHead, sk.rival, 1, false);
    }

    const ghost = hasEffect(s, 'ghost');
    const snakePts = this.interpolate(s.snake, this.prevSnake, alpha);
    this.drawBody(snakePts, sk.head, sk.tail, ghost ? 0.55 : 1, true);

    if (hasEffect(s, 'magnet') && snakePts.length) {
      const h = snakePts[0];
      ctx.strokeStyle = alphaOf(POWER_META.magnet.color, 0.3 + 0.15 * Math.sin(t * 7));
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(h.x * cell, h.y * cell, (MAGNET_RADIUS + 0.5) * cell, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.drawParticles();
    this.drawFloats();

    ctx.restore();

    if (hasEffect(s, 'slow')) {
      ctx.fillStyle = alphaOf(POWER_META.slow.color, 0.07);
      ctx.fillRect(0, 0, size, size);
    }
    if (hasEffect(s, 'double')) {
      ctx.strokeStyle = alphaOf(POWER_META.double.color, 0.3 + 0.2 * Math.sin(t * 6));
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, size - 4, size - 4);
    }
    if (this.flash > 0) {
      ctx.fillStyle = alphaOf(this.flashColor, this.flash);
      ctx.fillRect(0, 0, size, size);
    }
  }

  private drawWalls(s: GameState): void {
    const ctx = this.ctx;
    const cell = this.cell;
    const sk = this.skin;

    for (let y = 0; y < s.gridH; y++) {
      for (let x = 0; x < s.gridW; x++) {
        if (!s.walls.has(cellKey(x, y))) continue;
        const px = x * cell;
        const py = y * cell;
        ctx.fillStyle = sk.wall;
        roundRect(ctx, px + 0.5, py + 0.5, cell - 1, cell - 1, cell * 0.18);
        ctx.fill();
        ctx.strokeStyle = sk.wallEdge;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  private drawPortals(s: GameState, t: number): void {
    const ctx = this.ctx;
    const cell = this.cell;

    s.portals.forEach((portal, index) => {
      const color = index === 0 ? this.skin.accent : this.skin.food;
      for (const end of [portal.a, portal.b]) {
        const cx = (end.x + 0.5) * cell;
        const cy = (end.y + 0.5) * cell;
        const spin = t * (index === 0 ? 1.8 : -1.8);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spin);
        ctx.strokeStyle = alphaOf(color, 0.85);
        ctx.lineWidth = cell * 0.11;
        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.36, 0, TAU * 0.7);
        ctx.stroke();
        ctx.rotate(-spin * 2.4);
        ctx.strokeStyle = alphaOf(color, 0.45);
        ctx.lineWidth = cell * 0.07;
        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.2, 0, TAU * 0.6);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  private drawFood(s: GameState, t: number): void {
    const ctx = this.ctx;
    const cell = this.cell;
    const sk = this.skin;

    for (const f of s.food) {
      const cx = (f.x + 0.5) * cell;
      const cy = (f.y + 0.5) * cell;
      const pulse = 1 + 0.11 * Math.sin(t * 5.5 + f.x + f.y);

      ctx.save();
      ctx.shadowColor = sk.foodGlow;
      ctx.shadowBlur = cell * 0.7;
      ctx.fillStyle = sk.food;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.31 * pulse, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(cx - cell * 0.1, cy - cell * 0.12, cell * 0.07, 0, TAU);
      ctx.fill();
    }
  }

  private drawDrops(s: GameState, t: number): void {
    const ctx = this.ctx;
    const cell = this.cell;

    for (const d of s.drops) {
      // Blink out the last stretch of its life as a warning.
      if (d.ttl < 26 && Math.floor(t * 8) % 2 === 0) continue;

      const meta = POWER_META[d.kind];
      const px = d.pos.x * cell;
      const py = d.pos.y * cell;
      const bob = Math.sin(t * 4 + d.pos.x) * cell * 0.05;

      ctx.save();
      ctx.translate(0, bob);
      ctx.shadowColor = alphaOf(meta.color, 0.8);
      ctx.shadowBlur = cell * 0.6;
      ctx.fillStyle = 'rgba(8,12,20,0.92)';
      roundRect(ctx, px + cell * 0.1, py + cell * 0.1, cell * 0.8, cell * 0.8, cell * 0.22);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = Math.max(1.4, cell * 0.08);
      ctx.stroke();

      ctx.fillStyle = meta.color;
      ctx.font = `600 ${cell * 0.46}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.glyph, px + cell * 0.5, py + cell * 0.54);
      ctx.restore();
    }
  }

  /**
   * Strokes the body one short segment at a time so the colour can run from
   * tail to head, with round caps making it read as a single continuous snake.
   */
  private drawBody(
    pts: Vec[],
    headColor: string,
    tailColor: string,
    opacity: number,
    isPlayer: boolean,
  ): void {
    if (pts.length === 0) return;
    const ctx = this.ctx;
    const cell = this.cell;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isPlayer) {
      ctx.shadowColor = this.skin.glow;
      ctx.shadowBlur = cell * 0.55;
    }

    const len = pts.length;
    for (let i = len - 1; i >= 1; i--) {
      const a = pts[i];
      const b = pts[i - 1];
      if (Math.abs(a.x - b.x) > 1.5 || Math.abs(a.y - b.y) > 1.5) continue;
      const ratio = (len - i) / len;
      ctx.strokeStyle = mix(tailColor, headColor, ratio);
      ctx.lineWidth = cell * (0.58 + 0.22 * ratio);
      ctx.beginPath();
      ctx.moveTo(a.x * cell, a.y * cell);
      ctx.lineTo(b.x * cell, b.y * cell);
      ctx.stroke();
    }

    // A single-segment snake has no line to stroke.
    if (len === 1) {
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(pts[0].x * cell, pts[0].y * cell, cell * 0.4, 0, TAU);
      ctx.fill();
    }

    const head = pts[0];
    const next = pts[1] ?? { x: head.x - 1, y: head.y };
    const dx = head.x - next.x;
    const dy = head.y - next.y;
    const mag = Math.hypot(dx, dy) || 1;
    const fx = dx / mag;
    const fy = dy / mag;

    ctx.shadowBlur = 0;
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(head.x * cell, head.y * cell, cell * 0.42, 0, TAU);
    ctx.fill();

    // Eyes, set forward and to either side of the direction of travel.
    const ex = head.x * cell + fx * cell * 0.12;
    const ey = head.y * cell + fy * cell * 0.12;
    const px = -fy;
    const py = fx;

    for (const sign of [-1, 1]) {
      const oxe = ex + px * sign * cell * 0.17;
      const oye = ey + py * sign * cell * 0.17;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(oxe, oye, cell * 0.11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(oxe + fx * cell * 0.045, oye + fy * cell * 0.045, cell * 0.055, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    const cell = this.cell;
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = alphaOf(p.color, a);
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, p.size * cell * (0.5 + a * 0.7), 0, TAU);
      ctx.fill();
    }
  }

  private drawFloats(): void {
    const ctx = this.ctx;
    const cell = this.cell;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floats) {
      const a = Math.max(0, f.life / f.max);
      ctx.font = `700 ${f.size * cell}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = `rgba(0,0,0,${a * 0.5})`;
      ctx.fillText(f.text, f.x * cell + 1, f.y * cell + 1);
      ctx.fillStyle = alphaOf(f.color, a);
      ctx.fillText(f.text, f.x * cell, f.y * cell);
    }
  }
}
