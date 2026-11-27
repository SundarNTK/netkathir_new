/* Canvas effects for the opening.
   - 2027 reveal: the calendar's year breaks into thousands of points of gold light that swirl across the screen and
     rebuild a monumental "2027" (sampled from the real DOM text, so it lines up exactly), over drifting gold bokeh.
   - Finale: a warp-speed star tunnel.
   Plain 2D canvas, one shared ticker, nothing runs unless a flag is on. */

export type FxFlags = {
  warpOn: boolean;
  warp: number;
  kill?: boolean;
  bokeh?: boolean;
  morph?: number; // 0 → 1: particles travel from the calendar year to the big year
  morphOut?: number; // 0 → 1: particles settle into gold dust and fade as the solid year takes over
};

type P = {
  sx: number; sy: number; tx: number; ty: number; cx: number; cy: number;
  x: number; y: number; px: number; py: number;
  delay: number; size: number; ph: number; hue: number; dx: number; dy: number;
};
type Bokeh = { x: number; y: number; r: number; vy: number; vx: number; a: number; gold: boolean; ph: number };
type Star = { a: number; z: number; sp: number; col: string };

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function glowSprite(r: number, g: number, b: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.2, `rgba(${r},${g},${b},0.9)`);
  grd.addColorStop(0.5, `rgba(${r},${g},${b},0.22)`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grd;
  x.fillRect(0, 0, 64, 64);
  return c;
}

/** a camera-lens bokeh disc: soft edge, slightly brighter rim */
function bokehSprite(r: number, g: number, b: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const grd = x.createRadialGradient(64, 64, 0, 64, 64, 62);
  grd.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
  grd.addColorStop(0.82, `rgba(${r},${g},${b},0.7)`);
  grd.addColorStop(0.92, `rgba(${r},${g},${b},0.9)`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grd;
  x.beginPath();
  x.arc(64, 64, 62, 0, Math.PI * 2);
  x.fill();
  return c;
}

/**
 * Sample the lit pixels of an element's text, in viewport coordinates. Each character is drawn where the browser
 * actually laid it out (measured with a Range), so letter-spacing and kerning match the DOM text exactly.
 */
function sampleText(el: HTMLElement, gap: number) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  // the element may be scaled by a parent transform: correct the font size by the rendered/laid-out ratio
  const k = el.offsetWidth ? r.width / el.offsetWidth : 1;
  const fs = parseFloat(cs.fontSize) * k;
  const w = Math.max(1, Math.ceil(r.width));
  const h = Math.max(1, Math.ceil(r.height));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  x.textAlign = "left";
  x.textBaseline = "alphabetic";
  x.fillStyle = "#fff";
  const node = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  if (node) {
    const txt = node.textContent ?? "";
    const range = document.createRange();
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (!ch.trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const cr = range.getBoundingClientRect();
      const m = x.measureText(ch);
      // the character's line box is centred on its font ascent+descent; find the baseline inside it
      const fa = m.fontBoundingBoxAscent ?? fs * 0.9;
      const fd = m.fontBoundingBoxDescent ?? fs * 0.22;
      const base = cr.top - r.top + (cr.height - (fa + fd)) / 2 + fa;
      x.fillText(ch, cr.left - r.left, base);
    }
  }
  const d = x.getImageData(0, 0, w, h).data;
  const pts: [number, number][] = [];
  for (let yy = 0; yy < h; yy += gap) {
    for (let xx = 0; xx < w; xx += gap) {
      if (d[(yy * w + xx) * 4 + 3] > 140) pts.push([r.left + xx, r.top + yy]);
    }
  }
  return pts;
}

export function createFx(fxCv: HTMLCanvasElement, wpCv: HTMLCanvasElement, f: FxFlags) {
  const fx = fxCv.getContext("2d")!;
  const wp = wpCv.getContext("2d")!;
  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25); // soft glows don't need retina resolution; keeps every frame cheap
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

  const gold = glowSprite(255, 208, 110);
  const warm = glowSprite(255, 236, 190);
  const green = glowSprite(120, 235, 160);
  const bGold = bokehSprite(246, 210, 130);
  const bGreen = bokehSprite(70, 190, 110);

  let parts: P[] = [];
  const bokeh: Bokeh[] = [];
  const stars: Star[] = Array.from({ length: 280 }, () => ({ a: Math.random() * Math.PI * 2, z: Math.random(), sp: 0.5 + Math.random() * 0.9, col: pick(["#fde68a", "#86efac", "#ffffff", "#facc15", "#4ade80"]) }));
  let t = 0;
  let dirty = false;
  let wpDirty = false;

  const spawnBokeh = () => {
    bokeh.length = 0;
    const n = W < 700 ? 14 : 26;
    for (let i = 0; i < n; i++) {
      const near = Math.random();
      bokeh.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 14 + near * (W < 700 ? 40 : 70),
        vy: -(4 + near * 14),
        vx: (Math.random() - 0.5) * 6,
        a: 0.05 + (1 - near) * 0.1,
        gold: Math.random() > 0.3,
        ph: Math.random() * 6.28,
      });
    }
  };

  /** build the particle field: from the calendar year (src) to the big year (dst) */
  const formText = (src: HTMLElement, dst: HTMLElement) => {
    const small = W < 700;
    const dRect = dst.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(dst).fontSize) || 200;
    let gap = Math.max(3, Math.round(fs / (small ? 34 : 46)));
    let to = sampleText(dst, gap);
    const cap = small ? 1200 : 2200;
    if (to.length > cap) {
      // one resample at the spacing that fits the budget (point count falls with the square of the spacing)
      gap = Math.ceil(gap * Math.sqrt(to.length / cap));
      to = sampleText(dst, gap);
    }
    const from = sampleText(src, Math.max(2, Math.round(gap * 0.4)));
    const cx = dRect.left + dRect.width / 2;
    parts = to.map(([gx, gy], i) => {
      // nudge each point off the sampling grid so the lettering reads as scattered light, not a dot matrix
      const tx = gx + (Math.random() - 0.5) * gap * 0.9;
      const ty = gy + (Math.random() - 0.5) * gap * 0.9;
      const [sx, sy] = from.length ? from[Math.floor((i / to.length) * from.length)] : [W / 2, H / 2];
      // each point arcs through the air on its own curve, sweeping wide around the centre
      const side = sx < cx ? -1 : 1;
      const mx = (sx + tx) / 2 + side * (W * (0.12 + Math.random() * 0.28));
      const my = (sy + ty) / 2 - H * (0.1 + Math.random() * 0.3);
      return {
        sx, sy, tx, ty, cx: mx, cy: my, x: sx, y: sy, px: sx, py: sy,
        delay: Math.random() * 0.4 + (Math.abs(sx - cx) / W) * 0.25,
        size: 2 + Math.random() * 2.6,
        ph: Math.random() * 6.28,
        hue: Math.random(),
        dx: (Math.random() - 0.5) * 60,
        dy: -20 - Math.random() * 70,
      };
    });
    dirty = true;
  };

  const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  const tickFx = (dt: number) => {
    t += dt;
    if (f.kill) {
      parts = [];
      bokeh.length = 0;
      f.kill = false;
    }
    if (f.bokeh && !bokeh.length) spawnBokeh();
    if (!f.bokeh && bokeh.length) bokeh.length = 0;

    if (!parts.length && !bokeh.length) {
      if (dirty) {
        fx.clearRect(0, 0, W, H);
        dirty = false;
      }
      return;
    }
    dirty = true;
    fx.clearRect(0, 0, W, H);
    fx.globalCompositeOperation = "lighter";

    for (const b of bokeh) {
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.ph += dt * 0.6;
      if (b.y < -b.r * 2) {
        b.y = H + b.r;
        b.x = Math.random() * W;
      }
      fx.globalAlpha = b.a * (0.75 + 0.25 * Math.sin(b.ph));
      const s = b.r * 2;
      fx.drawImage(b.gold ? bGold : bGreen, b.x - b.r, b.y - b.r, s, s);
    }

    const m = f.morph ?? 0;
    const out = f.morphOut ?? 0;
    // streaks are batched into two paths (one per colour) and stroked once each: far cheaper than a stroke per point
    const trailGold = new Path2D();
    const trailGreen = new Path2D();
    let trails = 0;
    for (const p of m > 0 ? parts : []) {
      const k = Math.min(1, Math.max(0, (m - p.delay * 0.55) / 0.55));
      const e = ease(k);
      const u = 1 - e;
      p.px = p.x;
      p.py = p.y;
      // quadratic bezier from the calendar to the big year
      p.x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx;
      p.y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
      // once the solid year takes over, the light lifts away as fine gold dust
      p.x += p.dx * out * out;
      p.y += p.dy * out * out;
      const arrived = k >= 1;
      const shimmer = arrived ? 0.7 + 0.3 * Math.sin(t * 6 + p.ph) : 1;
      const a = (k > 0 ? 1 : 0.85) * shimmer * (1 - out);
      if (a <= 0.01) continue;
      const moving = k > 0 && k < 1;
      if (moving) {
        const tp = p.hue > 0.82 ? trailGreen : trailGold;
        tp.moveTo(p.px - (p.x - p.px) * 0.8, p.py - (p.y - p.py) * 0.8);
        tp.lineTo(p.x, p.y);
        trails++;
      }
      const sz = p.size * (moving ? 4.2 : 3.2) * (1 + out * 0.5);
      fx.globalAlpha = a;
      fx.drawImage(p.hue > 0.82 ? green : p.hue > 0.6 ? warm : gold, p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
    if (trails) {
      fx.lineCap = "round";
      fx.lineWidth = 1.3;
      fx.globalAlpha = 0.28;
      fx.strokeStyle = "rgb(255,214,130)";
      fx.stroke(trailGold);
      fx.strokeStyle = "rgb(150,240,180)";
      fx.stroke(trailGreen);
    }
    if (out >= 1) parts = [];
    fx.globalAlpha = 1;
    fx.globalCompositeOperation = "source-over";
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
    formText,
    resize,
    clear: () => {
      fx.clearRect(0, 0, W, H);
      wp.clearRect(0, 0, W, H);
    },
  };
}
