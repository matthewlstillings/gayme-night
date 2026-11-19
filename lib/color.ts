/**
 * Quick guide bands: a calmer version of each game's colour.
 * Every band gets the same lightness (OKLCH L = BAND_L), so a bright accent such as Wingspan's sky blue
 * stops flashing in a dim room and a dark one such as Betrayal's red still carries dark ink at 7:1 or more.
 * Hue is kept; chroma is trimmed only as far as the colour needs to stay inside sRGB.
 */
export const BAND_L = 0.7;

type RGB = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as RGB;
}

function rgbToOklab([r, g, b]: RGB): RGB {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Linear sRGB, unclamped, so the caller can tell when a colour falls outside the gamut. */
function oklabToLinear([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const hex2 = (v: number) => Math.round(Math.min(1, Math.max(0, fromLinear(v))) * 255).toString(16).padStart(2, '0');

/** The game's colour at band lightness, as #rrggbb. Returns the input unchanged if it isn't a 6-digit hex colour. */
export function bandColor(accent: string, lightness = BAND_L): string {
  const rgb = hexToRgb(accent);
  if (!rgb) return accent;
  const [, a, b] = rgbToOklab(rgb);
  const c = Math.hypot(a, b);
  const h = Math.atan2(b, a);
  // Trim chroma until the colour fits sRGB (binary search, 20 steps is far below one 8-bit step).
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const lin = oklabToLinear([lightness, mid * Math.cos(h), mid * Math.sin(h)]);
    if (lin.every((v) => v >= -1e-6 && v <= 1 + 1e-6)) lo = mid;
    else hi = mid;
  }
  const lin = oklabToLinear([lightness, lo * Math.cos(h), lo * Math.sin(h)]);
  return `#${lin.map(hex2).join('')}`;
}

/** WCAG 2 contrast ratio between two #rrggbb colours. */
export function contrast(x: string, y: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = (hexToRgb(hex) ?? [0, 0, 0]).map(toLinear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [p, q] = [lum(x), lum(y)].sort((m, n) => n - m);
  return (p + 0.05) / (q + 0.05);
}
