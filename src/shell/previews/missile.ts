import { clamp, easeOut, lerp, stage } from './paint';
import { MISSILE } from './palette';
import type { PreviewSpec } from './driver';

/**
 * Three warheads coming down, one interceptor going up, and the bloom where
 * they meet. The whole loop is a pure function of elapsed time: no state, no
 * simulation, and every event is a hand-placed beat, which is what lets the
 * still frame be chosen by picking a millisecond.
 */

const PERIOD = 6000;

const SKY_TOP = 8;
const GROUND_Y = 74;
const BATTERY_X = 80;

/** Warheads, as start column, target column and the beat each one enters on. */
const THREATS = [
  { sx: 38, tx: 44, at: 0, dur: 4200 },
  { sx: 104, tx: 112, at: 700, dur: 4600 },
  { sx: 66, tx: 58, at: 1500, dur: 4000 },
];

/** The one the player takes out, and when. */
const KILL_INDEX = 1;
const FIRE_AT = 1500;
const IMPACT_AT = 2100;
const BLAST_MS = 1100;
const BLAST_R = 11;

const CITIES = [30, 46, 58, 100, 112, 126];

function threatPoint(i: number, t: number): { x: number; y: number; k: number } {
  const spec = THREATS[i];
  const k = clamp((t - spec.at) / spec.dur, 0, 1);
  return { x: lerp(spec.sx, spec.tx, k), y: lerp(SKY_TOP, GROUND_Y, k), k };
}

/** Where the interceptor is aimed: wherever the doomed warhead is at impact. */
function aimPoint(): { x: number; y: number } {
  const p = threatPoint(KILL_INDEX, IMPACT_AT);
  return { x: p.x, y: p.y };
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    g.fillStyle = MISSILE.ground;
    g.fillRect(0, GROUND_Y, 160, 90 - GROUND_Y);

    for (const x of CITIES) {
      g.fillStyle = MISSILE.city;
      g.fillRect(x - 3, GROUND_Y - 5, 2, 5);
      g.fillRect(x, GROUND_Y - 8, 2.4, 8);
      g.fillRect(x + 3.2, GROUND_Y - 4, 2, 4);
    }

    g.fillStyle = MISSILE.battery;
    g.beginPath();
    g.moveTo(BATTERY_X - 6, GROUND_Y);
    g.lineTo(BATTERY_X, GROUND_Y - 7);
    g.lineTo(BATTERY_X + 6, GROUND_Y);
    g.closePath();
    g.fill();

    g.fillStyle = MISSILE.ammo;
    for (let i = 0; i < 4; i++) g.fillRect(BATTERY_X - 3 + i * 2, GROUND_Y - 2.6, 1.2, 1.2);

    g.lineWidth = 0.9;
    g.lineCap = 'round';

    THREATS.forEach((spec, i) => {
      // The intercepted warhead stops existing at the impact beat rather than
      // fading: a trail that lingers past its own explosion reads as a miss.
      if (i === KILL_INDEX && t >= IMPACT_AT) return;
      if (t < spec.at) return;

      const p = threatPoint(i, t);
      g.strokeStyle = MISSILE.trail;
      g.globalAlpha = 0.55;
      g.beginPath();
      g.moveTo(spec.sx, SKY_TOP);
      g.lineTo(p.x, p.y);
      g.stroke();

      g.globalAlpha = 1;
      g.fillStyle = MISSILE.trail;
      g.beginPath();
      g.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      g.fill();
    });

    const aim = aimPoint();
    if (t >= FIRE_AT && t < IMPACT_AT) {
      const k = (t - FIRE_AT) / (IMPACT_AT - FIRE_AT);
      const x = lerp(BATTERY_X, aim.x, k);
      const y = lerp(GROUND_Y - 7, aim.y, k);

      g.strokeStyle = MISSILE.interceptor;
      g.globalAlpha = 0.8;
      g.beginPath();
      g.moveTo(BATTERY_X, GROUND_Y - 7);
      g.lineTo(x, y);
      g.stroke();
      g.globalAlpha = 1;
    }

    if (t >= IMPACT_AT && t < IMPACT_AT + BLAST_MS) {
      const since = (t - IMPACT_AT) / BLAST_MS;
      // Grows fast and falls away slowly, which is the shape of the real one.
      const r = BLAST_R * (since < 0.35 ? easeOut(since / 0.35) : 1 - (since - 0.35) / 0.65);

      g.globalAlpha = 0.85;
      g.fillStyle = MISSILE.blastEdge;
      g.beginPath();
      g.arc(aim.x, aim.y, Math.max(0, r), 0, Math.PI * 2);
      g.fill();

      g.globalAlpha = 1;
      g.fillStyle = MISSILE.blastCore;
      g.beginPath();
      g.arc(aim.x, aim.y, Math.max(0, r * 0.5), 0, Math.PI * 2);
      g.fill();
    }

    g.globalAlpha = 1;
  });
}

export const missilePreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // Peak bloom, with the other two warheads still on their way down.
  stillMs: 2450,
};
