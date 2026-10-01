/**
 * Convolution & Photographic Pixel Filters Engine
 */

export function applyGaussianBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
) {
  if (radius <= 0) return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const temp = new Uint8ClampedArray(data.length);

  const r = Math.round(radius);
  const size = r * 2 + 1;

  // Horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const px = Math.min(width - 1, Math.max(0, x + k));
        const idx = (y * width + px) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        aSum += data[idx + 3];
        count++;
      }
      const outIdx = (y * width + x) * 4;
      temp[outIdx] = rSum / count;
      temp[outIdx + 1] = gSum / count;
      temp[outIdx + 2] = bSum / count;
      temp[outIdx + 3] = aSum / count;
    }
  }

  // Vertical blur
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const py = Math.min(height - 1, Math.max(0, y + k));
        const idx = (py * width + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        aSum += temp[idx + 3];
        count++;
      }
      const outIdx = (y * width + x) * 4;
      data[outIdx] = rSum / count;
      data[outIdx + 1] = gSum / count;
      data[outIdx + 2] = bSum / count;
      data[outIdx + 3] = aSum / count;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function applySharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number = 0.5
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  // Kernel: [0, -1, 0; -1, 5, -1; 0, -1, 0]
  const centerWeight = 1 + 4 * amount;
  const edgeWeight = -amount;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];
        const center = copy[idx + c];

        const val = center * centerWeight + (top + bottom + left + right) * edgeWeight;
        data[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function applyInvert(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imgData, 0, 0);
}

export function applyDesaturate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 709 Luminance weights
    const luma = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    data[i] = luma;
    data[i + 1] = luma;
    data[i + 2] = luma;
  }
  ctx.putImageData(imgData, 0, 0);
}
