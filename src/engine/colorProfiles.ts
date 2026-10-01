import { ColorProfileName, BitDepth, CurvesAdjustment, LevelsAdjustment } from '../types';

// Standard chromatic adaptation matrix and Bradford adaptors
export interface ColorProfile {
  name: ColorProfileName;
  M: number[];   // 3x3 matrix to XYZ D50
  Mi: number[];  // 3x3 inverse matrix
  trc: number[]; // Parametric curve parameters [gamma, a, b, c, d, e, f]
}

const SRGB_TRC = [2.4, 1 / 1.055, 0.055 / 1.055, 1 / 12.92, 0.04045, 0, 0];
const LIN_TRC = [1, 1, 0, 0, 0, 0, 0];

const mm = (a: number[], b: number[]): number[] => {
  const r: number[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    }
  }
  return r;
};

const mv = (m: number[], v: [number, number, number]): [number, number, number] => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

function inv3(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const D = a * A + b * B + c * C;
  return [
    A, c * h - b * i, b * f - c * e,
    B, a * i - c * g, c * d - a * f,
    C, b * g - a * h, a * e - b * d,
  ].map((x) => x / (D || 1e-9));
}

function mkProf(
  name: ColorProfileName,
  pr: [[number, number], [number, number], [number, number]],
  wp: [number, number],
  trc: number[]
): ColorProfile {
  const col = ([x, y]: [number, number]): [number, number, number] => [x / y, 1, (1 - x - y) / y];
  const c = pr.map(col);
  const W = col(wp);
  const Mx = [c[0][0], c[1][0], c[2][0], 1, 1, 1, c[0][2], c[1][2], c[2][2]];
  const S = mv(inv3(Mx), W);
  const M = [
    Mx[0] * S[0], Mx[1] * S[1], Mx[2] * S[2],
    S[0], S[1], S[2],
    Mx[6] * S[0], Mx[7] * S[1], Mx[8] * S[2],
  ];
  const B = [0.8951, 0.2664, -0.1614, -0.7502, 1.7135, 0.0367, 0.0389, -0.0685, 1.0296];
  const ws = mv(B, W);
  const wd = mv(B, [0.9642, 1, 0.8249]);
  const A = mm(mm(inv3(B), [wd[0] / ws[0], 0, 0, 0, wd[1] / ws[1], 0, 0, 0, wd[2] / ws[2]]), B);
  const M5 = mm(A, M);
  return { name, M: M5, Mi: inv3(M5), trc };
}

export const COLOR_PROFILES: Record<ColorProfileName, ColorProfile> = {
  sRGB: mkProf('sRGB', [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]], [0.3127, 0.329], SRGB_TRC),
  'Display P3': mkProf('Display P3', [[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]], [0.3127, 0.329], SRGB_TRC),
  'Adobe RGB': mkProf('Adobe RGB', [[0.64, 0.33], [0.21, 0.71], [0.15, 0.06]], [0.3127, 0.329], [2.19921875, 1, 0, 0, 0, 0, 0]),
  'Rec.2020': mkProf('Rec.2020', [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]], [0.3127, 0.329], [1 / 0.45, 1 / 1.099, 0.099 / 1.099, 1 / 4.5, 0.081, 0, 0]),
};

// ICC Parametric curve decode/encode
export const decTRC = (p: number[], x: number): number => {
  return x >= p[4]
    ? Math.pow(Math.max(0, p[1] * x + p[2]), p[0]) + p[5]
    : p[3] * x + p[6];
};

export const encTRC = (p: number[], y: number): number => {
  const th = p[3] * p[4] + p[6];
  return y >= th
    ? (Math.pow(Math.max(0, y - p[5]), 1 / p[0]) - p[2]) / p[1]
    : (y - p[6]) / p[3];
};

// Monotone cubic Hermite spline interpolation for Curves
export function evaluateMonotoneSpline(pts: [number, number][], x: number): number {
  if (!pts || pts.length === 0) return x;
  if (pts.length === 1) return pts[0][1];
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

  let i = 0;
  while (i < pts.length - 1 && x > pts[i + 1][0]) i++;

  const n = pts.length;
  const sl: number[] = [];
  for (let j = 0; j < n - 1; j++) {
    sl.push((pts[j + 1][1] - pts[j][1]) / Math.max(1e-6, pts[j + 1][0] - pts[j][0]));
  }

  const m: number[] = [sl[0]];
  for (let j = 1; j < n - 1; j++) {
    m.push(sl[j - 1] * sl[j] <= 0 ? 0 : (sl[j - 1] + sl[j]) / 2);
  }
  m.push(sl[n - 2]);

  for (let j = 0; j < n - 1; j++) {
    if (sl[j] === 0) {
      m[j] = m[j + 1] = 0;
    } else {
      const a = m[j] / sl[j];
      const b = m[j + 1] / sl[j];
      const q = a * a + b * b;
      if (q > 9) {
        const t = 3 / Math.sqrt(q);
        m[j] = t * a * sl[j];
        m[j + 1] = t * b * sl[j];
      }
    }
  }

  const h = pts[i + 1][0] - pts[i][0];
  const t = (x - pts[i][0]) / Math.max(1e-6, h);
  const t2 = t * t;
  const t3 = t2 * t;

  return (
    (2 * t3 - 3 * t2 + 1) * pts[i][1] +
    (t3 - 2 * t2 + t) * h * m[i] +
    (-2 * t3 + 3 * t2) * pts[i + 1][1] +
    (t3 - t2) * h * m[i + 1]
  );
}

// Build 256-lookup table for Curves
export function buildCurveLUT(curve: CurvesAdjustment): {
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
} {
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);

  for (let i = 0; i < 256; i++) {
    const norm = i / 255;
    // Composite channel first, then master RGB
    const rVal = evaluateMonotoneSpline(curve.R.pts, norm);
    const gVal = evaluateMonotoneSpline(curve.G.pts, norm);
    const bVal = evaluateMonotoneSpline(curve.B.pts, norm);

    const rFinal = evaluateMonotoneSpline(curve.RGB.pts, rVal);
    const gFinal = evaluateMonotoneSpline(curve.RGB.pts, gVal);
    const bFinal = evaluateMonotoneSpline(curve.RGB.pts, bVal);

    r[i] = Math.min(255, Math.max(0, Math.round(rFinal * 255)));
    g[i] = Math.min(255, Math.max(0, Math.round(gFinal * 255)));
    b[i] = Math.min(255, Math.max(0, Math.round(bFinal * 255)));
  }

  return { r, g, b };
}

// Build 256-lookup table for Levels
export function buildLevelsLUT(levels: LevelsAdjustment): {
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
} {
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);

  const applyChannel = (
    val: number,
    ch: { ib: number; g: number; iw: number; ob: number; ow: number }
  ) => {
    const norm = (val - ch.ib) / Math.max(1, ch.iw - ch.ib);
    const clamped = Math.min(1, Math.max(0, norm));
    const gammaCorrected = Math.pow(clamped, 1 / Math.max(0.1, ch.g));
    const out = ch.ob + gammaCorrected * (ch.ow - ch.ob);
    return Math.min(255, Math.max(0, Math.round(out)));
  };

  for (let i = 0; i < 256; i++) {
    const rVal = applyChannel(i, levels.R);
    const gVal = applyChannel(i, levels.G);
    const bVal = applyChannel(i, levels.B);

    r[i] = applyChannel(rVal, levels.RGB);
    g[i] = applyChannel(gVal, levels.RGB);
    b[i] = applyChannel(bVal, levels.RGB);
  }

  return { r, g, b };
}
