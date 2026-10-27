// Colors: hex ↔ rgb, and OKLab for blends that never pass through gray.
export const rgb = h => { const n = parseInt(h.slice(1), 16); return {r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255}; };
export const hex = ({r, g, b}) => "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const toLin = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
const toSrgb = c => 255 * (c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055);
export const toLab = ({r, g, b}) => {
  r = toLin(r); g = toLin(g); b = toLin(b);
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
};
export const fromLab = ([L, A, B]) => {
  const l = (L + .3963377774 * A + .2158037573 * B) ** 3, m = (L - .1055613458 * A - .0638541728 * B) ** 3, s = (L - .0894841775 * A - 1.291485548 * B) ** 3;
  return {r: toSrgb(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s), g: toSrgb(-1.2684380046 * l + 2.6097574011 * m - .3413193965 * s), b: toSrgb(-.0041960863 * l - .7034186147 * m + 1.707614701 * s)};
};
export const fuse = (a, b, t) => { const A = toLab(rgb(a)), B = toLab(rgb(b)); return hex(fromLab(A.map((v, i) => v + (B[i] - v) * t))); };
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
