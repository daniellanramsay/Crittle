// Draws the placeholder app icons for Phase 0 (Phase 0 brief, step 8): a paw in
// the accent colour on the page colour, inside the middle 60% of the square
// (DECISIONS §6). Uses only Node's built-in modules. Phase 6 replaces these
// icons with Daniella's own.
//
// Run from the project folder: node tools/make-placeholder-icons.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { config } from '../src/config.js';

const ICONS = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];

// The paw in a unit square (y points down): the main pad, then four toes.
// Each part is an ellipse; turn tilts it clockwise, in degrees.
const PAW = [
  { x: 0.5, y: 0.63, rx: 0.17, ry: 0.14, turn: 0 },
  { x: 0.28, y: 0.46, rx: 0.068, ry: 0.082, turn: -25 },
  { x: 0.41, y: 0.33, rx: 0.072, ry: 0.088, turn: -10 },
  { x: 0.59, y: 0.33, rx: 0.072, ry: 0.088, turn: 10 },
  { x: 0.72, y: 0.46, rx: 0.068, ry: 0.082, turn: 25 },
];

const SAMPLES = 4; // 4 × 4 samples per pixel give smooth edges

const background = rgb(config.colours.background);
const paw = rgb(config.colours.accent);
const folder = new URL('../icons/', import.meta.url);

mkdirSync(folder, { recursive: true });
for (const [name, size] of ICONS) {
  writeFileSync(new URL(name, folder), encodePng(size, draw(size)));
  console.log(`icons/${name}: ${size} × ${size}`);
}

function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function insidePaw(x, y) {
  return PAW.some(({ x: cx, y: cy, rx, ry, turn }) => {
    const a = (turn * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const u = dx * Math.cos(a) + dy * Math.sin(a);
    const v = -dx * Math.sin(a) + dy * Math.cos(a);
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
  });
}

// PNG scanlines: a filter byte (0, none), then red, green and blue for each pixel.
function draw(size) {
  const stride = 1 + size * 3;
  const pixels = Buffer.alloc(stride * size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (px + (sx + 0.5) / SAMPLES) / size;
          const y = (py + (sy + 0.5) / SAMPLES) / size;
          if (insidePaw(x, y)) hits++;
        }
      }
      const cover = hits / SAMPLES ** 2;
      const at = py * stride + 1 + px * 3;
      for (let c = 0; c < 3; c++) {
        pixels[at + c] = Math.round(background[c] + (paw[c] - background[c]) * cover);
      }
    }
  }
  return pixels;
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13); // compression, filter and interlace stay 0
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bits per channel
  header[9] = 2; // colour type: RGB, no transparency
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}
