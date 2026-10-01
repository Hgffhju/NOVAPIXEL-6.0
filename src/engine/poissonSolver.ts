/**
 * Professional Poisson gradient-domain image editing engine.
 * Solves discrete Poisson equation: Laplacian(f) = Laplacian(g) with Dirichlet boundary conditions.
 */

// Separable fast box blur for multi-frequency texture decomposition (Healing brush)
export function boxBlur(
  data: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  const output = new Float32Array(data.length);
  const temp = new Float32Array(data.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i <= radius && i < width; i++) {
        sum += data[(y * width + i) * 4 + c];
        count++;
      }
      for (let x = 0; x < width; x++) {
        temp[(y * width + x) * 4 + c] = sum / count;
        const removeIdx = x - radius;
        const addIdx = x + radius + 1;
        if (removeIdx >= 0) {
          sum -= data[(y * width + removeIdx) * 4 + c];
          count--;
        }
        if (addIdx < width) {
          sum += data[(y * width + addIdx) * 4 + c];
          count++;
        }
      }
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j <= radius && j < height; j++) {
        sum += temp[(j * width + x) * 4 + c];
        count++;
      }
      for (let y = 0; y < height; y++) {
        output[(y * width + x) * 4 + c] = sum / count;
        const removeIdx = y - radius;
        const addIdx = y + radius + 1;
        if (removeIdx >= 0) {
          sum -= temp[(removeIdx * width + x) * 4 + c];
          count--;
        }
        if (addIdx < height) {
          sum += temp[(addIdx * width + x) * 4 + c];
          count++;
        }
      }
    }
  }

  // Preserve alpha
  for (let i = 0; i < width * height; i++) {
    output[i * 4 + 3] = data[i * 4 + 3];
  }

  return output;
}

// Solve discrete Poisson equation using Successive Over-Relaxation (SOR)
export function solvePoisson(
  dest: Float32Array,
  source: Float32Array,
  mask: Uint8Array,
  width: number,
  height: number,
  iterations: number = 80
): Float32Array {
  const result = new Float32Array(width * height * 4);
  const holes: number[] = [];

  // Initialize result with dest values, collect hole coordinates
  for (let i = 0; i < width * height; i++) {
    const isHole = mask[i] > 0;
    if (isHole) {
      holes.push(i);
      result[i * 4] = source[i * 4];
      result[i * 4 + 1] = source[i * 4 + 1];
      result[i * 4 + 2] = source[i * 4 + 2];
      result[i * 4 + 3] = 255;
    } else {
      result[i * 4] = dest[i * 4];
      result[i * 4 + 1] = dest[i * 4 + 1];
      result[i * 4 + 2] = dest[i * 4 + 2];
      result[i * 4 + 3] = dest[i * 4 + 3];
    }
  }

  const omega = 1.6; // SOR relaxation parameter for fast convergence

  for (let iter = 0; iter < iterations; iter++) {
    for (let h = 0; h < holes.length; h++) {
      const idx = holes[h];
      const x = idx % width;
      const y = Math.floor(idx / width);

      for (let c = 0; c < 3; c++) {
        let neighborSum = 0;
        let neighbors = 0;
        const srcVal = source[idx * 4 + c];

        // 4-neighborhood
        const coords = [
          x > 0 ? y * width + (x - 1) : -1,
          x < width - 1 ? y * width + (x + 1) : -1,
          y > 0 ? (y - 1) * width + x : -1,
          y < height - 1 ? (y + 1) * width + x : -1,
        ];

        for (let n = 0; n < coords.length; n++) {
          const nIdx = coords[n];
          if (nIdx !== -1) {
            neighborSum += result[nIdx * 4 + c] + (srcVal - source[nIdx * 4 + c]);
            neighbors++;
          }
        }

        if (neighbors > 0) {
          const currentVal = result[idx * 4 + c];
          const targetVal = neighborSum / neighbors;
          result[idx * 4 + c] = currentVal + omega * (targetVal - currentVal);
        }
      }
    }
  }

  return result;
}

// Find best donor area for Spot Healing by sampling concentric search rings
export function findSpotDonor(
  canvas: HTMLCanvasElement,
  cx: number,
  cy: number,
  radius: number
): { ox: number; oy: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const hr = Math.ceil(radius * 4) + 4;
  const rx = Math.round(cx);
  const ry = Math.round(cy);
  const size = 2 * hr + 1;

  if (rx - hr < 0 || ry - hr < 0 || rx + hr >= canvas.width || ry + hr >= canvas.height) {
    return { ox: Math.round(radius * 2), oy: 0 };
  }

  const imgData = ctx.getImageData(rx - hr, ry - hr, size, size);
  const data = imgData.data;

  // Collect boundary ring coordinates
  const ring: [number, number][] = [];
  for (let y = -hr; y <= hr; y++) {
    for (let x = -hr; x <= hr; x++) {
      const d = Math.hypot(x, y);
      if (d >= radius && d <= radius * 1.35) {
        ring.push([x, y]);
      }
    }
  }

  if (ring.length < 8) return { ox: Math.round(radius * 2), oy: 0 };

  let bestSSD = 1e18;
  let bestOffset: { ox: number; oy: number } | null = null;

  // Evaluate candidate donor shifts
  for (const factor of [2.2, 3.0]) {
    for (let k = 0; k < 16; k++) {
      const angle = (k * Math.PI) / 8;
      const ox = Math.round(Math.cos(angle) * radius * factor);
      const oy = Math.round(Math.sin(angle) * radius * factor);

      let ssd = 0;
      let valid = true;

      for (let j = 0; j < ring.length; j += 2) {
        const [rx0, ry0] = ring[j];
        const qx = rx0 + ox + hr;
        const qy = ry0 + oy + hr;

        if (qx < 0 || qy < 0 || qx >= size || qy >= size) {
          valid = false;
          break;
        }

        const origIdx = ((ry0 + hr) * size + (rx0 + hr)) * 4;
        const donorIdx = (qy * size + qx) * 4;

        if (data[donorIdx + 3] < 200) {
          ssd += 1000;
          continue;
        }

        for (let c = 0; c < 3; c++) {
          const diff = data[origIdx + c] - data[donorIdx + c];
          ssd += diff * diff;
        }
      }

      if (valid && ssd < bestSSD) {
        bestSSD = ssd;
        bestOffset = { ox, oy };
      }
    }
  }

  return bestOffset || { ox: Math.round(radius * 2), oy: 0 };
}
