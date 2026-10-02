/**
 * The logo as a signed distance field. The mark's four SVG paths (rim, smile,
 * ঋ, ভ) are rasterised separately and run through an exact Euclidean distance
 * transform (Felzenszwalb & Huttenlocher), then packed into one RGBA float
 * texture the shaders sample:
 *
 *   R = the whole mark   G = the dashed rim   B = the smile   A = ঋ + ভ
 *
 * Values are signed distances in "logo units": the mark's radius is 1, centre
 * at the origin, y up; negative inside a shape. The texture covers
 * [-FIELD_EXTENT, FIELD_EXTENT]² with row 0 at the top (+y).
 */

export const FIELD_EXTENT = 1.6;
const SIZE = 1024;
const INF = 1e20;

/** Squared 1D distance transform of `f` (length n) into `d`. */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dq = q - v[k];
    d[q] = dq * dq + f[v[k]];
  }
}

/** Euclidean distance (px) from every pixel to the nearest pixel where `seed` is true. */
function edt2d(seed: (i: number) => boolean, n: number): Float64Array {
  const grid = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) grid[i] = seed(i) ? 0 : INF;
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) f[y] = grid[y * n + x];
    edt1d(f, n, d, v, z);
    for (let y = 0; y < n; y++) grid[y * n + x] = d[y];
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) f[x] = grid[y * n + x];
    edt1d(f, n, d, v, z);
    for (let x = 0; x < n; x++) grid[y * n + x] = Math.sqrt(d[x]);
  }
  return grid;
}

/** Signed distance (logo units) for a coverage mask: negative inside. */
function signedField(mask: Uint8Array, n: number, pxPerUnit: number): Float32Array {
  const outside = edt2d((i) => mask[i] === 1, n);
  const inside = edt2d((i) => mask[i] === 0, n);
  const out = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) {
    // Each pixel's distance is measured to the nearest pixel of the other set; half a pixel puts the edge between them.
    out[i] = (mask[i] ? -(inside[i] - 0.5) : outside[i] - 0.5) / pxPerUnit;
  }
  return out;
}

export interface LogoField {
  size: number;
  /** RGBA float32, row 0 at the top. */
  data: Float32Array;
}

/** Path data from the logo SVG, in document order: rim, smile, ঋ, ভ. */
export async function loadLogoPaths(url = "/media/logo-mark.svg") {
  const text = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  const [, , vw, vh] = (svg?.getAttribute("viewBox") ?? "0 0 32 32").split(/[\s,]+/).map(Number);
  const paths = [...doc.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");
  if (paths.length < 4) throw new Error(`Expected 4 paths in the logo, found ${paths.length}.`);
  return { paths, width: vw, height: vh };
}

export async function buildLogoField(): Promise<LogoField> {
  const { paths, width, height } = await loadLogoPaths();
  const n = SIZE;
  const pxPerUnit = n / (2 * FIELD_EXTENT);
  // Logo units: centre of the viewBox at 0, the mark's radius (half its width) = 1.
  const svgPerUnit = width / 2;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  const maskFor = (indices: number[]) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, n, n);
    // SVG y runs down, same as canvas rows, so row 0 is the top of the mark.
    const scale = pxPerUnit / svgPerUnit;
    ctx.setTransform(scale, 0, 0, scale, n / 2 - (width / 2) * scale, n / 2 - (height / 2) * scale);
    ctx.fillStyle = "#fff";
    for (const i of indices) ctx.fill(new Path2D(paths[i]));
    const pixels = ctx.getImageData(0, 0, n, n).data;
    const mask = new Uint8Array(n * n);
    for (let i = 0; i < n * n; i++) mask[i] = pixels[i * 4 + 3] >= 128 ? 1 : 0;
    return mask;
  };

  const channels = [
    signedField(maskFor([0, 1, 2, 3]), n, pxPerUnit),
    signedField(maskFor([0]), n, pxPerUnit),
    signedField(maskFor([1]), n, pxPerUnit),
    signedField(maskFor([2, 3]), n, pxPerUnit),
  ];
  const data = new Float32Array(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    data[i * 4] = channels[0][i];
    data[i * 4 + 1] = channels[1][i];
    data[i * 4 + 2] = channels[2][i];
    data[i * 4 + 3] = channels[3][i];
  }
  return { size: n, data };
}

/**
 * Glyph atlas for type materials (ASCII, metal type): 16 x 2 cells. Row 0 is a
 * density ramp, light to dark; row 1 is Bengali letters.
 */
export const GLYPH_ROWS = [" .,:;-=+*cox%#&@", "অআকখগঘচজতদনপবমর"];
export function buildGlyphAtlas(): HTMLCanvasElement {
  const cell = 48;
  const canvas = document.createElement("canvas");
  canvas.width = cell * 16;
  canvas.height = cell * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  GLYPH_ROWS.forEach((row, r) => {
    ctx.font = r === 0 ? `bold ${cell * 0.8}px Menlo, monospace` : `${cell * 0.72}px "Kohinoor Bangla", "Noto Sans Bengali", "Bangla MN", sans-serif`;
    [...row].forEach((ch, c) => ctx.fillText(ch, c * cell + cell / 2, r * cell + cell * 0.55));
  });
  return canvas;
}
