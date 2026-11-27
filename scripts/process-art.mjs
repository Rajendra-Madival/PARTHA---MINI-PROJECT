import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const INCOMING_DIR = path.join(ROOT, 'art', 'incoming');
const OUT_DIR = path.join(ROOT, 'public', 'landing', 'art');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const SKY_FILES = [
  { name: 's0-sky', quality: 76, mobileQuality: 74 },
  { name: 's1-sky', quality: 78, mobileQuality: 76 },
  { name: 's2-sky', alt: 's2-sky_1', quality: 78, mobileQuality: 76 },
  { name: 's3-sky', quality: 78, mobileQuality: 76 },
  { name: 's4-sky', quality: 78, mobileQuality: 76 },
  { name: 's5-sky', quality: 78, mobileQuality: 76 },
];

const MAGENTA_FILES = [
  { name: 's0-land', width: 1920, quality: 76 },
  { name: 's0-fore', width: 1920, quality: 80 },
  { name: 's1-land', width: 1920, quality: 80 },
  { name: 's1-fore', width: 1920, quality: 80 },
  { name: 's2-land', width: 1920, quality: 80 },
  { name: 's2-fore', width: 1920, quality: 80 },
  { name: 's3-land', width: 1920, quality: 80 },
  { name: 's3-fore', width: 1920, quality: 80 },
  { name: 's4-land', width: 1920, quality: 80 },
  { name: 's4-fore', width: 1920, quality: 80 },
  { name: 's5-gate-closed', width: 1920, quality: 80 },
  { name: 's5-gate-open', width: 1920, quality: 80 },
];

function resolveInput(name, altName) {
  const primary = path.join(INCOMING_DIR, `${name}.png`);
  if (fs.existsSync(primary)) return primary;
  if (altName) {
    const alt = path.join(INCOMING_DIR, `${altName}.png`);
    if (fs.existsSync(alt)) return alt;
  }
  return null;
}

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

function colorDist(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isBorderMagenta(r, g, b) {
  const dist = colorDist(r, g, b, 255, 0, 255);
  if (dist <= 65) return true;
  const [h, s, v] = rgbToHsv(r, g, b);
  return h >= 282 && h <= 328 && s >= 0.52 && v >= 0.4 && r > g + 35 && b > g + 35;
}

function isPocketMagenta(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  return h >= 285 && h <= 330 && s > 0.6 && v > 0.6;
}

function featherAndDespillMagenta(data, w, h) {
  const origAlpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) origAlpha[i] = data[i * 4 + 3];

  // Mark pixels within 2px of transparency so thin grass/leaf anti-aliasing gets despilled
  const distToClear = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (origAlpha[idx] === 0) continue;
      let minDist = 9;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || origAlpha[ny * w + nx] === 0) {
            const md = Math.max(Math.abs(dx), Math.abs(dy));
            if (md < minDist) minDist = md;
          }
        }
      }
      if (minDist <= 2) distToClear[idx] = minDist;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const borderDist = distToClear[idx];
      if (borderDist === 0) continue;

      const p = idx * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const [hue, sat] = rgbToHsv(r, g, b);

      let transparentCount = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let cleanCount = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && origAlpha[nIdx] === 0) {
            transparentCount++;
          }
          if (origAlpha[nIdx] > 0 && distToClear[nIdx] === 0) {
            const np = nIdx * 4;
            const [nh, ns] = rgbToHsv(data[np], data[np + 1], data[np + 2]);
            if (!(nh >= 270 && nh <= 336 && ns > 0.25)) {
              sumR += data[np];
              sumG += data[np + 1];
              sumB += data[np + 2];
              cleanCount++;
            }
          }
        }
      }

      if (borderDist === 1 && transparentCount > 0) {
        data[p + 3] = Math.max(84, Math.round(255 * (1 - transparentCount * 0.1)));
      }

      // Despill magenta/pink anti-aliased fringe pixels toward clean interior neighbors
      const looksMagentaFringe = hue >= 270 && hue <= 336 && sat > 0.18 && r > g + 10 && b > g + 8;
      if (looksMagentaFringe) {
        if (cleanCount > 0) {
          data[p] = Math.round(sumR / cleanCount);
          data[p + 1] = Math.round(sumG / cleanCount);
          data[p + 2] = Math.round(sumB / cleanCount);
        } else {
          const cap = Math.min(255, g + 10);
          data[p] = Math.min(r, cap);
          data[p + 2] = Math.min(b, cap);
        }
      }
    }
  }
}

async function processMagentaImage(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const pushIfMagenta = (x, y) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    const p = idx * 4;
    if (isBorderMagenta(data[p], data[p + 1], data[p + 2])) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    pushIfMagenta(x, 0);
    pushIfMagenta(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfMagenta(0, y);
    pushIfMagenta(w - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    data[idx * 4 + 3] = 0;
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) pushIfMagenta(x - 1, y);
    if (x < w - 1) pushIfMagenta(x + 1, y);
    if (y > 0) pushIfMagenta(x, y - 1);
    if (y < h - 1) pushIfMagenta(x, y + 1);
  }

  // Enclosed magenta pockets pass (strict HSV so pink lotus petals stay intact)
  let pocketCleared = 0;
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    if (data[p + 3] === 0) continue;
    if (isPocketMagenta(data[p], data[p + 1], data[p + 2])) {
      data[p + 3] = 0;
      pocketCleared++;
    }
  }

  featherAndDespillMagenta(data, w, h);
  return { data, w, h, pocketCleared };
}

function sampleBackgroundColor(data, w, h) {
  // Sample top-left, top-right, bottom-left corners (avoiding bottom-right sparkle mark)
  const samples = [
    [3, 3],
    [w - 4, 3],
    [3, h - 4],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of samples) {
    const p = (y * w + x) * 4;
    r += data[p];
    g += data[p + 1];
    b += data[p + 2];
  }
  return [Math.round(r / 3), Math.round(g / 3), Math.round(b / 3)];
}

function removeWhiteSpokePockets(data, w, h, bg, minArea = 600, tol = 18) {
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let removedRegions = 0;

  for (let i = 0; i < w * h; i++) {
    if (seen[i] || data[i * 4 + 3] === 0) continue;
    const p = i * 4;
    if (colorDist(data[p], data[p + 1], data[p + 2], bg[0], bg[1], bg[2]) > tol) {
      continue;
    }

    let head = 0;
    let tail = 0;
    seen[i] = 1;
    queue[tail++] = i;
    while (head < tail) {
      const idx = queue[head++];
      const x = idx % w;
      const y = (idx - x) / w;
      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < w - 1 ? idx + 1 : -1,
        y > 0 ? idx - w : -1,
        y < h - 1 ? idx + w : -1,
      ];
      for (const nIdx of neighbors) {
        if (nIdx < 0 || seen[nIdx] || data[nIdx * 4 + 3] === 0) continue;
        const np = nIdx * 4;
        if (colorDist(data[np], data[np + 1], data[np + 2], bg[0], bg[1], bg[2]) <= tol) {
          seen[nIdx] = 1;
          queue[tail++] = nIdx;
        }
      }
    }

    if (tail >= minArea) {
      removedRegions++;
      for (let k = 0; k < tail; k++) {
        data[queue[k] * 4 + 3] = 0;
      }
    }
  }
  return removedRegions;
}

function featherWhiteEdges(data, w, h, bg) {
  const origAlpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) origAlpha[i] = data[i * 4 + 3];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (origAlpha[idx] === 0) continue;
      let touchesBg = false;
      for (let dy = -1; dy <= 1 && !touchesBg; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || origAlpha[ny * w + nx] === 0) {
            touchesBg = true;
            break;
          }
        }
      }
      if (!touchesBg) continue;
      const p = idx * 4;
      const d = colorDist(data[p], data[p + 1], data[p + 2], bg[0], bg[1], bg[2]);
      if (d < 68) {
        // Pull subtle bright anti-aliased edge pixel toward darker interior neighbor & lower alpha slightly
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let cnt = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nIdx = ny * w + nx;
            if (origAlpha[nIdx] > 0) {
              const np = nIdx * 4;
              if (colorDist(data[np], data[np + 1], data[np + 2], bg[0], bg[1], bg[2]) >= 72) {
                sumR += data[np];
                sumG += data[np + 1];
                sumB += data[np + 2];
                cnt++;
              }
            }
          }
        }
        if (cnt > 0) {
          data[p] = Math.round(sumR / cnt);
          data[p + 1] = Math.round(sumG / cnt);
          data[p + 2] = Math.round(sumB / cnt);
        }
        data[p + 3] = Math.min(data[p + 3], d < 36 ? 150 : 195);
      }
    }
  }
}

async function processWhiteBgImage(inputPath, { removeInnerPockets = false, tol = 12 } = {}) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const bg = sampleBackgroundColor(data, w, h);

  // Mask bottom-right sparkle corner (tiny watermark outside subject bounds)
  const brMarginX = Math.max(0, w - Math.round(w * 0.055));
  const brMarginY = Math.max(0, h - Math.round(h * 0.055));
  for (let y = brMarginY; y < h; y++) {
    for (let x = brMarginX; x < w; x++) {
      data[(y * w + x) * 4 + 3] = 0;
    }
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const pushIfBg = (x, y) => {
    const idx = y * w + x;
    if (visited[idx] || data[idx * 4 + 3] === 0) return;
    const p = idx * 4;
    if (colorDist(data[p], data[p + 1], data[p + 2], bg[0], bg[1], bg[2]) <= tol) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    data[idx * 4 + 3] = 0;
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < w - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < h - 1) pushIfBg(x, y + 1);
  }

  let removedPockets = 0;
  if (removeInnerPockets) {
    removedPockets = removeWhiteSpokePockets(data, w, h, bg, 600, 18);
  }

  featherWhiteEdges(data, w, h, bg);
  return { data, w, h, bg, removedPockets };
}

function getOpaqueBounds(data, w, h, alphaThreshold = 12) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function expandBoxWithPadding(bounds, w, h, paddingRatio = 0.02) {
  const bw = bounds.maxX - bounds.minX + 1;
  const bh = bounds.maxY - bounds.minY + 1;
  const padX = Math.round(bw * paddingRatio);
  const padY = Math.round(bh * paddingRatio);
  const left = Math.max(0, bounds.minX - padX);
  const top = Math.max(0, bounds.minY - padY);
  const right = Math.min(w - 1, bounds.maxX + padX);
  const bottom = Math.min(h - 1, bounds.maxY + padY);
  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

async function saveCutoutWebp({ data, w, h, box, resizeOpts, outPath, quality = 82, alphaQuality = 90 }) {
  await sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } })
    .extract(box)
    .resize(resizeOpts)
    .webp({ quality, alphaQuality, effort: 6 })
    .toFile(outPath);
}

async function buildContactSheet(cutoutNames) {
  const cols = 3;
  const tileW = 420;
  const tileH = 270;
  const labelH = 30;
  const cellW = tileW;
  const cellH = tileH + labelH;
  const rows = Math.ceil(cutoutNames.length / cols);
  const sheetW = cols * cellW;
  const sheetH = rows * cellH;

  // Build 3-band background PNG per tile: Dark (#0B1026), Mid-Grey (#6B7280), Pink checker (#FCE7F3 / #F9A8D4)
  const bgRaw = Buffer.alloc(tileW * tileH * 4);
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const p = (y * tileW + x) * 4;
      if (x < tileW / 3) {
        bgRaw[p] = 11;
        bgRaw[p + 1] = 16;
        bgRaw[p + 2] = 38;
      } else if (x < (tileW * 2) / 3) {
        bgRaw[p] = 107;
        bgRaw[p + 1] = 114;
        bgRaw[p + 2] = 128;
      } else {
        const checker = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0;
        bgRaw[p] = checker ? 252 : 249;
        bgRaw[p + 1] = checker ? 231 : 196;
        bgRaw[p + 2] = checker ? 243 : 222;
      }
      bgRaw[p + 3] = 255;
    }
  }
  const tileBgBuf = await sharp(bgRaw, { raw: { width: tileW, height: tileH, channels: 4 } }).png().toBuffer();

  const composites = [];
  for (let idx = 0; idx < cutoutNames.length; idx++) {
    const name = cutoutNames[idx];
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x0 = col * cellW;
    const y0 = row * cellH;

    composites.push({ input: tileBgBuf, left: x0, top: y0 });

    const assetBuf = await sharp(path.join(OUT_DIR, `${name}.webp`))
      .resize({ width: tileW - 16, height: tileH - 16, fit: 'inside' })
      .png()
      .toBuffer();
    const assetMeta = await sharp(assetBuf).metadata();
    const ox = x0 + Math.round((tileW - (assetMeta.width ?? tileW)) / 2);
    const oy = y0 + Math.round((tileH - (assetMeta.height ?? tileH)) / 2);
    composites.push({ input: assetBuf, left: ox, top: oy });

    const labelSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${labelH}">
        <rect width="100%" height="100%" fill="#111827"/>
        <text x="12" y="20" fill="#F9FAFB" font-family="sans-serif" font-size="14" font-weight="600">${name}.webp</text>
      </svg>`,
    );
    composites.push({ input: labelSvg, left: x0, top: y0 + tileH });
  }

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 17, g: 24, b: 39, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(SCREENSHOTS_DIR, 'V32-cutouts.png'));
}

async function main() {
  const cutoutList = [];

  // 1. Sky images
  for (const sky of SKY_FILES) {
    const src = resolveInput(sky.name, sky.alt);
    if (!src) {
      console.warn(`MISSING sky: ${sky.name}.png`);
      continue;
    }
    await sharp(src)
      .resize({ width: 1920 })
      .webp({ quality: sky.quality, effort: 6 })
      .toFile(path.join(OUT_DIR, `${sky.name}.webp`));

    await sharp(src)
      .resize({ width: 960 })
      .webp({ quality: sky.mobileQuality, effort: 6 })
      .toFile(path.join(OUT_DIR, `${sky.name}-960.webp`));
  }

  // 2. Magenta-keyed scene layers & gates (full 16:9 frame, no trimming)
  for (const item of MAGENTA_FILES) {
    const src = resolveInput(item.name);
    if (!src) {
      console.warn(`MISSING magenta layer: ${item.name}.png`);
      continue;
    }
    const { data, w, h, pocketCleared } = await processMagentaImage(src);
    const rawSharp = sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } });

    await rawSharp
      .clone()
      .resize({ width: item.width })
      .webp({ quality: item.quality, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `${item.name}.webp`));

    await rawSharp
      .clone()
      .resize({ width: 960 })
      .webp({ quality: Math.max(76, item.quality - 2), alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `${item.name}-960.webp`));

    cutoutList.push(item.name);
    console.log(`Processed ${item.name} (pockets cleared: ${pocketCleared})`);
  }

  // 3. Rama pair on exact same crop box & padding, 1100px tall
  const ramaReadyPath = resolveInput('rama-ready');
  const ramaDrawPath = resolveInput('rama-draw');
  if (ramaReadyPath && ramaDrawPath) {
    const ready = await processWhiteBgImage(ramaReadyPath, { removeInnerPockets: true, tol: 14 });
    const draw = await processWhiteBgImage(ramaDrawPath, { removeInnerPockets: true, tol: 14 });
    const b1 = getOpaqueBounds(ready.data, ready.w, ready.h);
    const b2 = getOpaqueBounds(draw.data, draw.w, draw.h);
    const union = {
      minX: Math.min(b1.minX, b2.minX),
      minY: Math.min(b1.minY, b2.minY),
      maxX: Math.max(b1.maxX, b2.maxX),
      maxY: Math.max(b1.maxY, b2.maxY),
    };
    const box = expandBoxWithPadding(union, ready.w, ready.h, 0.02);

    await saveCutoutWebp({
      ...ready,
      box,
      resizeOpts: { height: 1100 },
      outPath: path.join(OUT_DIR, 'rama-ready.webp'),
    });
    await saveCutoutWebp({
      ...draw,
      box,
      resizeOpts: { height: 1100 },
      outPath: path.join(OUT_DIR, 'rama-draw.webp'),
    });
    cutoutList.push('rama-ready', 'rama-draw');
    console.log(`Processed rama-ready & rama-draw with shared crop ${box.width}x${box.height}`);
  }

  // 4. Lotus pair on exact same crop box & padding, 1000px tall
  const budPath = resolveInput('lotus-bud');
  const openPath = resolveInput('lotus-open');
  if (budPath && openPath) {
    const bud = await processWhiteBgImage(budPath, { tol: 12 });
    const open = await processWhiteBgImage(openPath, { tol: 12 });
    const b1 = getOpaqueBounds(bud.data, bud.w, bud.h);
    const b2 = getOpaqueBounds(open.data, open.w, open.h);
    const union = {
      minX: Math.min(b1.minX, b2.minX),
      minY: Math.min(b1.minY, b2.minY),
      maxX: Math.max(b1.maxX, b2.maxX),
      maxY: Math.max(b1.maxY, b2.maxY),
    };
    const box = expandBoxWithPadding(union, bud.w, bud.h, 0.02);

    await saveCutoutWebp({
      ...bud,
      box,
      resizeOpts: { height: 1000 },
      outPath: path.join(OUT_DIR, 'lotus-bud.webp'),
    });
    await saveCutoutWebp({
      ...open,
      box,
      resizeOpts: { height: 1000 },
      outPath: path.join(OUT_DIR, 'lotus-open.webp'),
    });
    cutoutList.push('lotus-bud', 'lotus-open');
    console.log(`Processed lotus-bud & lotus-open with shared crop ${box.width}x${box.height}`);
  }

  // 5. Individual trimmed props
  const singles = [
    { name: 'sage', resizeOpts: { height: 900 }, tol: 11, removeInnerPockets: false },
    { name: 'chariot', resizeOpts: { width: 1500 }, tol: 11, removeInnerPockets: true },
    { name: 'wheel', resizeOpts: { width: 640 }, tol: 14, removeInnerPockets: true },
    { name: 'conch', resizeOpts: { width: 640 }, tol: 11, removeInnerPockets: false },
    { name: 'diya', resizeOpts: { width: 640 }, tol: 12, removeInnerPockets: false },
  ];

  for (const s of singles) {
    const src = resolveInput(s.name);
    if (!src) {
      console.warn(`MISSING prop: ${s.name}.png`);
      continue;
    }
    const proc = await processWhiteBgImage(src, {
      removeInnerPockets: s.removeInnerPockets,
      tol: s.tol,
    });
    const bounds = getOpaqueBounds(proc.data, proc.w, proc.h);
    const box = expandBoxWithPadding(bounds, proc.w, proc.h, 0.02);
    await saveCutoutWebp({
      ...proc,
      box,
      resizeOpts: s.resizeOpts,
      outPath: path.join(OUT_DIR, `${s.name}.webp`),
    });
    cutoutList.push(s.name);
    console.log(`Processed ${s.name} (crop ${box.width}x${box.height}, pockets=${proc.removedPockets})`);
  }

  await buildContactSheet(cutoutList);

  // Report per-image sizes and Hero budget check
  const outFiles = fs.readdirSync(OUT_DIR).sort();
  let totalBytes = 0;
  for (const f of outFiles) {
    const sz = fs.statSync(path.join(OUT_DIR, f)).size;
    totalBytes += sz;
    console.log(`${f.padEnd(28)} ${(sz / 1024).toFixed(1)} KB`);
  }
  const heroDesktopBytes =
    fs.statSync(path.join(OUT_DIR, 's0-sky.webp')).size +
    fs.statSync(path.join(OUT_DIR, 's0-land.webp')).size +
    fs.statSync(path.join(OUT_DIR, 'rama-ready.webp')).size;
  console.log(`HERO DESKTOP TOTAL: ${(heroDesktopBytes / 1024).toFixed(1)} KB`);
  console.log(`ALL ASSETS TOTAL:   ${(totalBytes / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
