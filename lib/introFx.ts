/* Canvas effects for the opening: real-looking fireworks + confetti for the celebration, and a warp-speed
   tunnel for the "AI era" finale. Plain 2D canvas, one shared ticker, nothing runs unless a flag is on. */

export type FxFlags = { fire: boolean; confetti: boolean; warpOn: boolean; warp: number };

const GOLD = ["#facc15", "#fbbf24", "#f59e0b", "#fde68a"];
const GREEN = ["#16a34a", "#22c55e", "#15803d", "#4ade80"];
const MIX = [...GOLD, ...GREEN, "#ffffff"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

type Rocket = { x: number; y: number; vx: number; vy: number; fuse: number; col: string };
type Spark = { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number; col: string; w: number; twinkle: boolean };
type Chip = { x: number; y: number; vy: number; vx: number; w: number; h: number; rot: number; vr: number; ph: number; sw: number; col: string; delay: number };
type Star = { a: number; z: number; sp: number; col: string };

export function createFx(fxCv: HTMLCanvasElement, wpCv: HTMLCanvasElement, f: FxFlags) {
  const fx = fxCv.getContext("2d")!;
  const wp = wpCv.getContext("2d")!;
  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [fxCv, wpCv]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wp.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const rockets: Rocket[] = [];
  const sparks: Spark[] = [];
  const chips: Chip[] = [];
  const stars: Star[] = Array.from({ length: 280 }, () => ({ a: Math.random() * Math.PI * 2, z: Math.random(), sp: 0.5 + Math.random() * 0.9, col: pick(["#fde68a", "#86efac", "#ffffff", "#facc15", "#4ade80"]) }));
  let launchT = 0;
  let wasConfetti = false;
  let dirty = false;
  let wpDirty = false;

  const burst = (x: number, y: number, big: boolean) => {
    const n = big ? 120 : 80;
    const ring = Math.random() > 0.55;
    const c1 = pick(MIX);
    const c2 = pick(MIX);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.08;
      const sp = ring ? 230 : 90 + Math.random() * 270;
      sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.1 + Math.random() * 0.9, col: i % 3 ? c1 : c2, w: 1.4 + Math.random() * 1.4, twinkle: Math.random() > 0.6 });
    }
    // a bright flash at the core
    sparks.push({ x, y, px: x, py: y, vx: 0, vy: 0, life: 0, max: 0.25, col: "#fff7c2", w: 26, twinkle: false });
  };

  const tickFx = (dt: number) => {
    if (f.fire) {
      launchT -= dt;
      if (launchT <= 0) {
        launchT = 0.28 + Math.random() * 0.3;
        const x = W * (0.12 + Math.random() * 0.76);
        const rise = H * (0.5 + Math.random() * 0.25);
        rockets.push({ x, y: H + 10, vx: (Math.random() - 0.5) * 40, vy: -(rise / 0.95), fuse: 0.85 + Math.random() * 0.25, col: pick(GOLD) });
      }
    }
    if (f.confetti && !wasConfetti) {
      for (let i = 0; i < 190; i++) {
        const left = i % 2 === 0;
        chips.push({
          x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vy: 110 + Math.random() * 190, vx: (Math.random() - 0.5) * 60,
          w: 6 + Math.random() * 7, h: 10 + Math.random() * 9, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 9, ph: Math.random() * 6.28, sw: 20 + Math.random() * 40,
          col: pick(left ? [...GOLD, "#ffffff"] : [...GREEN, "#fde68a"]), delay: Math.random() * 1.6,
        });
      }
    }
    wasConfetti = f.confetti;
    if (!f.fire && !f.confetti && !rockets.length && !sparks.length && !chips.length) {
      if (dirty) {
        fx.clearRect(0, 0, W, H);
        dirty = false;
      }
      return;
    }
    dirty = true;
    // fade the previous frame so sparks leave trails
    fx.globalCompositeOperation = "destination-out";
    fx.fillStyle = "rgba(0,0,0,0.22)";
    fx.fillRect(0, 0, W, H);
    fx.globalCompositeOperation = "source-over";

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.fuse -= dt;
      r.vy += 90 * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      fx.fillStyle = r.col;
      fx.beginPath();
      fx.arc(r.x, r.y, 2.4, 0, 6.3);
      fx.fill();
      if (Math.random() > 0.3) sparks.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: (Math.random() - 0.5) * 24, vy: 30 + Math.random() * 40, life: 0, max: 0.45, col: "#fbbf24", w: 1.4, twinkle: false });
      if (r.fuse <= 0) {
        burst(r.x, r.y, Math.random() > 0.5);
        rockets.splice(i, 1);
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.max) {
        sparks.splice(i, 1);
        continue;
      }
      s.px = s.x;
      s.py = s.y;
      s.vx *= 1 - 1.6 * dt;
      s.vy = s.vy * (1 - 1.6 * dt) + 200 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.life / s.max;
      const tw = s.twinkle ? 0.5 + 0.5 * Math.sin(s.life * 40) : 1;
      fx.globalAlpha = Math.max(0, k * tw);
      fx.strokeStyle = s.col;
      fx.fillStyle = s.col;
      if (s.w > 10) {
        fx.beginPath();
        fx.arc(s.x, s.y, s.w * (1 + (1 - k) * 2), 0, 6.3);
        fx.fill();
      } else {
        fx.lineWidth = s.w * (0.5 + k * 0.7);
        fx.lineCap = "round";
        fx.beginPath();
        fx.moveTo(s.px, s.py);
        fx.lineTo(s.x, s.y);
        fx.stroke();
      }
    }
    fx.globalAlpha = 1;
    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i];
      if (c.delay > 0) {
        c.delay -= dt;
        continue;
      }
      c.y += c.vy * dt;
      c.ph += dt * 3;
      c.x += (c.vx + Math.sin(c.ph) * c.sw) * dt;
      c.rot += c.vr * dt;
      if (c.y > H + 30) {
        chips.splice(i, 1);
        continue;
      }
      fx.save();
      fx.translate(c.x, c.y);
      fx.rotate(c.rot);
      fx.scale(1, Math.cos(c.ph * 1.7)); // flutter: the piece turns edge-on and back
      fx.fillStyle = c.col;
      fx.globalAlpha = 0.95;
      fx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      fx.restore();
    }
    fx.globalAlpha = 1;
  };

  const tickWarp = (dt: number) => {
    if (!f.warpOn) {
      if (wpDirty) {
        wp.clearRect(0, 0, W, H);
        wpDirty = false;
      }
      return;
    }
    wpDirty = true;
    wp.clearRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H * 0.46;
    const R = Math.hypot(W, H) * 0.62;
    const speed = 0.12 + f.warp * 0.85;
    wp.lineCap = "round";
    for (const s of stars) {
      const z0 = s.z;
      s.z -= dt * speed * s.sp;
      if (s.z <= 0.02) {
        s.z = 1;
        s.a = Math.random() * Math.PI * 2;
        continue;
      }
      const r1 = Math.pow(1 - s.z, 2.3) * R + 4;
      const r0 = Math.pow(1 - Math.min(1, s.z + (z0 - s.z) * (1 + f.warp * 3)), 2.3) * R + 4;
      const cs = Math.cos(s.a);
      const sn = Math.sin(s.a);
      wp.strokeStyle = s.col;
      wp.globalAlpha = Math.min(1, (1 - s.z) * 1.5);
      wp.lineWidth = 0.8 + (1 - s.z) * (1.2 + f.warp * 1.6);
      wp.beginPath();
      wp.moveTo(cx + cs * r0, cy + sn * r0);
      wp.lineTo(cx + cs * r1, cy + sn * r1);
      wp.stroke();
    }
    wp.globalAlpha = 1;
  };

  return {
    tick: (dtSec: number) => {
      const dt = Math.min(dtSec, 0.05);
      tickFx(dt);
      tickWarp(dt);
    },
    resize,
    clear: () => {
      fx.clearRect(0, 0, W, H);
      wp.clearRect(0, 0, W, H);
    },
  };
}
