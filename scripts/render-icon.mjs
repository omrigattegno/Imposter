#!/usr/bin/env node
/**
 * Icon rasteriser: public/icon.svg (hand-drawn, the source of truth) -> every icon the PWA ships.
 *
 *   public/favicon.svg                  a copy of icon.svg
 *   public/icons/icon-192.png           manifest, purpose "any": rounded tile, transparent corners
 *   public/icons/icon-512.png           manifest, purpose "any"
 *   public/icons/icon-512-maskable.png  manifest, purpose "maskable": square, solid, art at 80% (safe zone)
 *   public/apple-touch-icon.png         180x180, square, solid RGB (no alpha channel; iOS rounds it itself)
 *
 * Re-run with `npm run icons`. The SVG is opened in the preinstalled Playwright Chromium (the same browser the
 * e2e tests use: PLAYWRIGHT_BROWSERS_PATH, default /opt/pw-browsers; see playwright.config.ts) and
 * screenshotted at each size, so the PNGs match what the browser draws from the vector. Never run
 * `playwright install` on the build box; on a machine without the preinstalled browser Playwright resolves
 * its own download as usual. No other dependency: the solid variants are re-encoded to RGB with node:zlib.
 *
 * icon.svg exposes three hooks (ids) this script drives per variant: #bg / #bg-clip (tile corner radius)
 * and #art (face + sparkles, scaled about the centre).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync, inflateSync, crc32 as zlibCrc32 } from 'node:zlib';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC = join(ROOT, 'public');
export const SOURCE = join(PUBLIC, 'icon.svg');

/** Corner radius of the rounded tile as a fraction of its width (iOS-like 22%). */
const CORNER = 112 / 512;
/** Maskable icons must keep their art inside the central 80% circle; this scale leaves margin on top. */
const MASKABLE_ART = 0.8;

export const VARIANTS = [
  { file: 'icons/icon-192.png', size: 192, rounded: true, alpha: true, art: 1 },
  { file: 'icons/icon-512.png', size: 512, rounded: true, alpha: true, art: 1 },
  { file: 'icons/icon-512-maskable.png', size: 512, rounded: false, alpha: false, art: MASKABLE_ART },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, alpha: false, art: 1 },
];

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

/** Same resolution as playwright.config.ts: an explicit executable when the image ships one. */
export function preinstalledChromium() {
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= browsersPath;
  const override = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (override && existsSync(override)) return override;
  const link = join(browsersPath, 'chromium'); // symlink maintained by the image
  if (existsSync(link)) return link;
  try {
    const revisions = readdirSync(browsersPath)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.slice('chromium-'.length)) - Number(a.slice('chromium-'.length)));
    for (const dir of revisions) {
      const exe = join(browsersPath, dir, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
  } catch {
    /* no preinstalled browsers: let Playwright resolve its own */
  }
  return undefined;
}

export async function launchBrowser() {
  const executablePath = preinstalledChromium();
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function pageHtml(svg) {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style>' +
    `</head><body>${svg}</body></html>`
  );
}

/**
 * Renders one variant of `svg` (the icon.svg text) to a PNG buffer. `hideArt` renders the tile and halo
 * alone (used by the safe-zone check in scripts' tests, not by the icon set).
 */
export async function renderVariant(page, svg, { size, rounded, alpha, art, hideArt = false }) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(pageHtml(svg), { waitUntil: 'load' });
  await page.evaluate(
    ({ size, rx, art, hideArt }) => {
      const svgEl = document.querySelector('svg');
      if (!svgEl) throw new Error('icon.svg: no <svg> root');
      svgEl.setAttribute('width', String(size));
      svgEl.setAttribute('height', String(size));
      for (const id of ['bg', 'bg-clip']) {
        const el = document.getElementById(id);
        if (!el) throw new Error(`icon.svg: missing #${id}`);
        el.setAttribute('rx', String(rx));
      }
      const artEl = document.getElementById('art');
      if (!artEl) throw new Error('icon.svg: missing #art');
      artEl.setAttribute('transform', `translate(256 256) scale(${art})`);
      if (hideArt) artEl.setAttribute('display', 'none');
    },
    { size, rx: rounded ? CORNER * 512 : 0, art, hideArt },
  );
  const png = await page.screenshot({
    type: 'png',
    omitBackground: alpha,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  return alpha ? png : stripAlpha(png);
}

/** Renders every variant with one browser; returns [{ file, png }]. */
export async function renderIcons(svg = readFileSync(SOURCE, 'utf8'), variants = VARIANTS) {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: 'dark' });
    const page = await context.newPage();
    const out = [];
    for (const v of variants) out.push({ file: v.file, png: await renderVariant(page, svg, v) });
    return out;
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// PNG: decode Chromium's RGBA screenshot and re-encode it as RGB (colour type 2) for the solid variants
// ---------------------------------------------------------------------------

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  if (typeof zlibCrc32 === 'function') return zlibCrc32(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

/** Minimal decoder for what Chromium emits: 8-bit RGB/RGBA, non-interlaced. Returns { width, height, channels, pixels }. */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG');
  let pos = 8;
  let header;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (!header) throw new Error('PNG without IHDR');
  const channels = { 2: 3, 6: 4 }[header.colorType];
  if (header.depth !== 8 || !channels || header.interlace !== 0) {
    throw new Error(`unsupported PNG (depth ${header.depth}, colour type ${header.colorType}, interlace ${header.interlace})`);
  }
  const { width, height } = header;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? row[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let pred;
      switch (filter) {
        case 0:
          pred = 0;
          break;
        case 1:
          pred = a;
          break;
        case 2:
          pred = b;
          break;
        case 3:
          pred = (a + b) >> 1;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default:
          throw new Error(`unknown PNG filter ${filter}`);
      }
      row[i] = (src[i] + pred) & 0xff;
    }
  }
  return { width, height, channels, pixels };
}

/** Encodes 8-bit RGB (channels 3) or RGBA (4) pixels; filter 0 on every row. */
export function encodePng(width, height, pixels, channels) {
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Drops the alpha channel (the tile covers the whole viewport, so every pixel is already opaque). */
export function stripAlpha(png) {
  const { width, height, channels, pixels } = decodePng(png);
  if (channels === 3) return png;
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, o = 0; i < pixels.length; i += 4, o += 3) {
    if (pixels[i + 3] !== 255) throw new Error('solid variant has a transparent pixel; does #bg cover the tile?');
    rgb[o] = pixels[i];
    rgb[o + 1] = pixels[i + 1];
    rgb[o + 2] = pixels[i + 2];
  }
  return encodePng(width, height, rgb, 3);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function write(rel, data) {
  const path = join(PUBLIC, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`${rel.padEnd(32)} ${String(statSync(path).size).padStart(7)} B`);
}

async function main() {
  const svg = readFileSync(SOURCE, 'utf8');
  write('favicon.svg', svg);
  for (const { file, png } of await renderIcons(svg)) write(file, png);
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
