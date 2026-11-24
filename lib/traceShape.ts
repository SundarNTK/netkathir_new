import * as THREE from "three";

type P = [number, number];

/**
 * Turns a transparent PNG (logo/icon) into real vector shapes by tracing its alpha mask with marching squares,
 * so it can be extruded into a genuine 3D mesh. Holes (the ring of the "@", counters, etc.) are preserved.
 * Returns the shapes (centred, unit-sized) and a colour sampler that reads the original image colours.
 */
export function traceImageToShapes(img: CanvasImageSource, N = 200, size = 1) {
  const cv = document.createElement("canvas");
  const iw = (img as { naturalWidth?: number; width: number }).naturalWidth ?? (img as { width: number }).width;
  const ih = (img as { naturalHeight?: number; height: number }).naturalHeight ?? (img as { height: number }).height;
  const Ny = Math.max(8, Math.round((N * ih) / iw)); // keeps the image's own proportions
  cv.width = N;
  cv.height = Ny;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, N, Ny);
  const data = ctx.getImageData(0, 0, N, Ny).data;

  const W = N + 2; // padded so every shape closes
  const H = Ny + 2;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < Ny; y++) for (let x = 0; x < N; x++) mask[(y + 1) * W + x + 1] = data[(y * N + x) * 4 + 3] > 56 ? 1 : 0;

  // ---- marching squares -> segments (coordinates doubled so edge midpoints are integers)
  const segs: [P, P][] = [];
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      const tl = mask[y * W + x], tr = mask[y * W + x + 1], br = mask[(y + 1) * W + x + 1], bl = mask[(y + 1) * W + x];
      const idx = tl * 8 + tr * 4 + br * 2 + bl;
      if (idx === 0 || idx === 15) continue;
      const T: P = [2 * x + 1, 2 * y], R: P = [2 * x + 2, 2 * y + 1], B: P = [2 * x + 1, 2 * y + 2], L: P = [2 * x, 2 * y + 1];
      switch (idx) {
        case 1: case 14: segs.push([L, B]); break;
        case 2: case 13: segs.push([B, R]); break;
        case 3: case 12: segs.push([L, R]); break;
        case 4: case 11: segs.push([T, R]); break;
        case 5: segs.push([T, L], [B, R]); break;
        case 6: case 9: segs.push([T, B]); break;
        case 7: case 8: segs.push([T, L]); break;
        case 10: segs.push([T, R], [L, B]); break;
      }
    }
  }

  // ---- link segments into closed loops
  const key = (p: P) => p[0] + "," + p[1];
  const adj = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      const l = adj.get(k);
      if (l) l.push(i);
      else adj.set(k, [i]);
    }
  });
  const used = new Uint8Array(segs.length);
  const loops: P[][] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const loop: P[] = [segs[i][0], segs[i][1]];
    let end = segs[i][1];
    const startKey = key(segs[i][0]);
    for (let guard = 0; guard < 200000; guard++) {
      if (key(end) === startKey) break;
      const list = adj.get(key(end));
      const nxt = list?.find((j) => !used[j]);
      if (nxt === undefined) break;
      used[nxt] = 1;
      const s = segs[nxt];
      const other = key(s[0]) === key(end) ? s[1] : s[0];
      loop.push(other);
      end = other;
    }
    if (loop.length > 8) loops.push(loop);
  }

  // ---- simplify (Douglas–Peucker on two halves of each closed loop)
  const dp = (pts: P[], eps: number): P[] => {
    if (pts.length < 3) return pts;
    const a = pts[0], b = pts[pts.length - 1];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    let max = 0, mi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
      if (d > max) { max = d; mi = i; }
    }
    if (max > eps) return [...dp(pts.slice(0, mi + 1), eps).slice(0, -1), ...dp(pts.slice(mi), eps)];
    return [a, b];
  };
  // Keep the outline detailed, then round the pixel stairs into a smooth corner.
  const chaikin = (pts: P[]): P[] => {
    const next: P[] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    return next;
  };
  const resample = (pts: P[], step: number): P[] => {
    const n = pts.length;
    if (n < 3) return pts;
    const out: P[] = [pts[0]];
    let remain = step;
    for (let i = 0; i < n; i++) {
      let ax = pts[i][0];
      let ay = pts[i][1];
      const b = pts[(i + 1) % n];
      let dx = b[0] - ax;
      let dy = b[1] - ay;
      let len = Math.hypot(dx, dy);
      while (len >= remain && len > 1e-4) {
        const t = remain / len;
        ax += dx * t;
        ay += dy * t;
        out.push([ax, ay]);
        dx = b[0] - ax;
        dy = b[1] - ay;
        len = Math.hypot(dx, dy);
        remain = step;
      }
      remain -= len;
    }
    if (out.length > 3) out.pop();
    return out.length >= 3 ? out : pts;
  };
  // Corner-preserving smoothing: curves become smooth, genuine corners (letter edges, leaf tips) stay sharp.
  const sharpSmooth = (pts: P[]): P[] => {
    let cur = pts;
    for (let k = 0; k < 2; k++) {
      const n = cur.length;
      const corner = cur.map((p, i) => {
        const a = cur[(i + n - 1) % n], b = cur[(i + 1) % n];
        const v1x = p[0] - a[0], v1y = p[1] - a[1], v2x = b[0] - p[0], v2y = b[1] - p[1];
        const l = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1;
        return (v1x * v2x + v1y * v2y) / l < 0.62; // turns sharper than ~52 degrees stay corners
      });
      const out: P[] = [];
      for (let i = 0; i < n; i++) {
        const p = cur[i], q = cur[(i + 1) % n];
        out.push(corner[i] ? p : [0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]]);
        out.push(corner[(i + 1) % n] ? q : [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]);
      }
      cur = out;
    }
    return cur;
  };
  const simple = loops
    .map((l) => {
      const h = Math.floor(l.length / 2);
      const reduced = [...dp(l.slice(0, h + 1), 0.9).slice(0, -1), ...dp(l.slice(h), 0.9).slice(0, -1)];
      if (reduced.length < 3) return reduced;
      return sharpSmooth(reduced);
    })
    .filter((l) => l.length >= 3);

  const area = (l: P[]) => {
    let a = 0;
    for (let i = 0; i < l.length; i++) {
      const p = l[i], q = l[(i + 1) % l.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return a / 2;
  };
  const inside = (pt: P, l: P[]) => {
    let c = false;
    for (let i = 0, j = l.length - 1; i < l.length; j = i++) {
      if (l[i][1] > pt[1] !== l[j][1] > pt[1] && pt[0] < ((l[j][0] - l[i][0]) * (pt[1] - l[i][1])) / (l[j][1] - l[i][1]) + l[i][0]) c = !c;
    }
    return c;
  };

  const items = simple.filter((l) => Math.abs(area(l)) > 24).map((pts) => ({ pts, a: Math.abs(area(pts)) }));
  const depth = items.map((it, i) => items.reduce((d, o, j) => (j !== i && inside(it.pts[0], o.pts) ? d + 1 : d), 0));
  const toXY = (p: P): THREE.Vector2 => new THREE.Vector2(((p[0] / 2 - 1 - N / 2) / N) * size, (-(p[1] / 2 - 1 - Ny / 2) / N) * size);

  const shapes: THREE.Shape[] = [];
  items.forEach((it, i) => {
    if (depth[i] % 2 !== 0) return; // holes are attached below
    const shape = new THREE.Shape(it.pts.map(toXY));
    items.forEach((h, j) => {
      if (depth[j] === depth[i] + 1 && inside(h.pts[0], it.pts)) shape.holes.push(new THREE.Path(h.pts.map(toXY)));
    });
    shapes.push(shape);
  });

  // original colours for the front face / sides
  const sample = (x: number, y: number): [number, number, number] => {
    const cx = Math.min(N - 1, Math.max(0, Math.round((x / size + 0.5) * N)));
    const cy = Math.min(Ny - 1, Math.max(0, Math.round(Ny / 2 - (y / size) * N)));
    for (let r = 0; r < 4; r++) {
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          const px = Math.min(N - 1, Math.max(0, cx + ox)), py = Math.min(Ny - 1, Math.max(0, cy + oy));
          const i = (py * N + px) * 4;
          if (data[i + 3] > 120) return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
        }
      }
    }
    return [0.2, 0.7, 0.3];
  };
  return { shapes, sample };
}
