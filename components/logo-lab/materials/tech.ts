import type { LogoMaterial } from "../types";

/**
 * Shared by the screen and sensor materials (prepended to their GLSL).
 * Displays are emissive images with exact colours, so `tkFlat` returns the
 * linear HDR value ACES + gamma turn back into a given linear display colour.
 */
const KIT = /* glsl */ `
vec3 tkFlat(vec3 lin) {
  vec3 x = clamp(lin, 0.0, 0.97);
  return (sqrt(-10127.0 * x * x + 13702.0 * x + 9.0) + 59.0 * x - 3.0) / (502.0 - 486.0 * x);
}
vec3 tkDisplay(vec3 srgb) { return tkFlat(pow(max(srgb, 0.0), vec3(2.2))); }
/** One screen pixel in logo units at ray distance t. */
float tkPx(float t) { return 0.7364 * t / min(uRes.x, uRes.y); }
float tkLine(float d, float w, float px) {
  float ww = max(w, px * 0.5);
  return sat((ww + px * 0.5 - abs(d)) / px) * min(1.0, w / (px * 0.5));
}
float tkFill(float d, float px) { return sat(0.5 - d / px); }
/** Reflection of the studio in a curved glass face (object-space bulge normal). */
vec3 tkGlass(Hit h, vec2 uv, float bulge, float amount) {
  vec3 gn = normalize(uRot * normalize(vec3(uv * bulge, 1.0)));
  return studioEnv(reflect(-h.v, gn)) * fresnel(sat(dot(gn, h.v)), 0.04) * amount;
}
`;

/** Tech and signal: screens, sensors, scopes, data — each a round device face. */
export const TECH: LogoMaterial[] = [
  {
    key: "led-matrix",
    label: "LED Matrix",
    category: "tech",
    relief: 0.0,
    heroTime: 1.1,
    loop: "A scan bar rolls down and ripple rings spread from the centre",
    glsl:
      KIT +
      /* glsl */ `
// A round LED panel: domed LEDs in black housings on dark solder mask, lit to the mark (rim violet, letters warm
// white, smile amber), each a touch different in brightness. A refresh bar rolls down the panel and ripple rings
// expand from the centre, briefly lighting the LEDs they cross. Ringed in black anodised aluminium.
#define LM_P 0.04
vec3 lmColour(vec4 f) {
  if (f.w < 0.01) return vec3(1.0, 0.86, 0.62);
  if (f.z < 0.01) return vec3(1.0, 0.5, 0.08);
  return vec3(0.5, 0.32, 1.0);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float px = tkPx(h.t);
  float r = length(uv);
  if (h.edge > 0.5 || h.side < 0.0 || r > 1.07) return litMetal(h, vec3(0.06, 0.06, 0.065), 0.35);
  vec2 cell = floor(uv / LM_P);
  vec2 lc = fract(uv / LM_P) - 0.5;
  vec2 c = (cell + 0.5) * LM_P;
  vec4 f = field(c);
  float present = step(length(c), 1.03);
  float on = sat(0.5 - f.x / LM_P * 1.6);
  float rp = fract(uTime / 3.0);
  float ring = exp(-pow((length(c) - rp * 1.5) / 0.06, 2.0)) * (1.0 - rp);
  float scan = exp(-pow((c.y - (1.2 - fract(uTime / 2.4) * 2.4)) / 0.07, 2.0));
  float pulse = 0.72 + 0.28 * sin(length(c) * 16.0 - uTime * 5.0);
  vec3 emit = lmColour(f) * on * (pulse + 0.6 * scan);
  emit += vec3(0.2, 0.8, 1.0) * ring * (0.35 + 0.65 * on) * 0.8 + vec3(0.3, 0.9, 1.0) * scan * 0.05 * (1.0 - on);
  emit *= (0.85 + 0.15 * hash12(cell)) * present;
  float rr = length(lc);
  float lens = (1.0 - smoothstep(0.33, 0.33 + px / LM_P, rr)) * present;
  float housing = (1.0 - smoothstep(0.42, 0.45, rr)) * present;
  vec2 hl = lc - vec2(-0.1, 0.12);
  vec3 offLens = vec3(0.03) + vec3(0.06) * exp(-dot(hl, hl) * 90.0);
  vec3 col = vec3(0.005, 0.008, 0.007) * (0.8 + 0.4 * vnoise(uv * 80.0));
  col = mix(col, vec3(0.012), housing);
  col = mix(col, offLens + emit * (0.6 + 1.6 * exp(-rr * rr * 14.0)) * 6.0, lens);
  col += emit * exp(-rr * rr * 3.0) * 0.5 * (1.0 - lens);
  return col;
}
`,
  },
  {
    key: "one-bit-dither",
    label: "1-bit Dither",
    category: "tech",
    relief: 0.05,
    heroTime: 1.0,
    loop: "The light circles the coin and the Bayer pattern re-dithers",
    glsl:
      KIT +
      /* glsl */ `
#define HAS_SURFACE
#define HAS_POST
// A struck coin (raised mark, a beaded ring, a raised border) shot under a circling light, then reduced to a
// 1-bit Bayer 8x8 ordered dither in display space: two inks, warm paper white and near-black, nothing in between.
float surface(vec2 uv, vec4 f) {
  float r = length(uv);
  float border = 0.02 * smoothstep(1.04, 1.07, r);
  float a = atan(uv.y, uv.x);
  vec2 b = vec2((fract(a / TAU * 96.0) - 0.5) * TAU * 1.03 / 96.0, r - 1.03);
  return border + 0.012 * (1.0 - smoothstep(0.004, 0.012, length(b)));
}
vec3 shade(Hit h) {
  setLight(h, lightAt(uTime * 0.8, 0.55));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  float nl = sat(dot(h.wn, h.l));
  vec3 r = reflect(-h.v, h.wn);
  return vec3(0.33) * (nl * sh * 1.6 + 0.08 * h.ao) + vec3(ggx(h.wn, h.v, h.l, 0.3) * sh * 1.5) + studioDiffuse(r) * 0.35 * h.ao;
}
float dbBayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float dbBayer4(vec2 a) { return dbBayer2(0.5 * a) * 0.25 + dbBayer2(a); }
float dbBayer8(vec2 a) { return dbBayer4(0.5 * a) * 0.25 + dbBayer2(a); }
vec3 post(vec3 col, vec2 suv, vec2 px) {
  float v = sat((luma(col) - 0.03) * 1.2);
  float bit = step(dbBayer8(floor(px / 2.0)) + 0.5 / 64.0, v);
  return mix(vec3(0.055, 0.05, 0.045), vec3(0.93, 0.92, 0.88), bit);
}
`,
  },
  {
    key: "ascii",
    label: "ASCII",
    category: "tech",
    relief: 0.06,
    heroTime: 2.0,
    loop: "Characters cascade down the columns, reshuffling the letters on the mark",
    glsl:
      KIT +
      /* glsl */ `
#define HAS_RENDER
// The lit relief coin rebuilt from type: each screen cell traces one ray through its centre and picks a glyph from
// the density ramp by brightness; on the mark the cells are set in Bengali letters instead (violet). Matrix-style
// cascades run down each column, brightening the cells they pass and reshuffling the letters.
#define AS_ROWS 40.0
vec3 shade(Hit h) { return vec3(0.0); }
vec3 render(vec3 ro, vec3 rd, vec2 suv) {
  float chh = 2.0 / AS_ROWS;
  vec2 cs = vec2(chh * 0.68, chh);
  vec2 cell = floor(suv / cs);
  vec2 cuv = fract(suv / cs);
  vec2 csuv = (cell + 0.5) * cs;
  vec3 rdc = normalize(vec3(csuv * (1.62 / 4.4), -1.0));
  vec2 ga = vec2(0.5 + (cuv.x - 0.5) * 0.68, cuv.y);
  // The cascade: a head per column falling at its own speed; behind > 0 once it has passed this row.
  float sp = 6.0 + 8.0 * hash11(cell.x * 3.17 + 1.0);
  float span = AS_ROWS + 20.0;
  float X = uTime * sp + hash11(cell.x * 7.3 + 2.0) * span;
  float rowTop = AS_ROWS * 0.5 - cell.y;
  float behind = mod(X, span) - 6.0 - rowTop;
  float trail = behind >= 0.0 ? exp(-behind * 0.25) : 0.0;
  float passes = floor((X - rowTop - 6.0) / span);
  float flick = (behind >= 0.0 && behind < 3.0) ? floor(uTime * 14.0) : 0.0;
  vec3 col = vec3(0.0);
  Hit h;
  if (trace(ro, rdc, h)) {
    h.suv = csuv;
    float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
    float nl = sat(dot(h.wn, h.l));
    float lum = sat(0.06 + 0.7 * nl * sh + 0.35 * ggx(h.wn, h.v, h.l, 0.35) * sh + 0.1 * h.ao);
    lum *= 1.0 - 0.35 * h.edge;
    // A cell joins the mark if the stroke passes near its centre (strokes are about a cell wide).
    if (h.f.x < 0.03 && h.edge < 0.5) {
      int gi = int(hash12(cell * 1.7 + vec2(passes * 3.1, flick)) * 15.99);
      float g = glyph(gi, 1, ga);
      col = vec3(0.82, 0.66, 1.0) * g * (0.9 + 0.5 * lum) + vec3(0.95, 0.92, 1.0) * g * trail * 0.6;
      // Inverse-video cell behind the letter so the strokes read as solid runs.
      vec2 cb = abs(cuv - 0.5);
      col += vec3(0.22, 0.1, 0.5) * (0.7 + 0.5 * lum) * step(max(cb.x, cb.y), 0.47) * (1.0 - g);
    } else {
      float g = glyph(int(lum * 15.99), 0, ga);
      col = vec3(0.34, 0.39, 0.43) * g * (0.2 + 0.55 * lum) + vec3(0.75, 1.0, 0.9) * g * trail * 0.4;
    }
  } else {
    int gi = 1 + int(hash12(cell + passes) * 5.0);
    col = vec3(0.25, 0.4, 0.35) * glyph(gi, 0, ga) * trail * 0.6;
  }
  return tkDisplay(col);
}
`,
  },
  {
    key: "thermal",
    label: "Thermal",
    category: "tech",
    relief: 0.04,
    heroTime: 4.4,
    loop: "Heat rises up through the strokes, pools at the top, then the disc cools",
    glsl:
      KIT +
      /* glsl */ `
// A heat-camera image (iron-bow palette: black, indigo, magenta, red, orange, yellow, white) of a disc whose raised
// mark is a heating element. Heat climbs from the bottom through the strokes (letters hottest, then smile, then
// rim), conducts a little into the disc, pools at the top, then everything cools. Side walls and grazing faces read
// cooler (lower emissivity); sensor noise sits on a coarse pixel grid.
vec3 thIron(float t) {
  float x = sat(t) * 6.0;
  vec3 c = mix(vec3(0.0, 0.0, 0.02), vec3(0.13, 0.03, 0.42), sat(x));
  c = mix(c, vec3(0.55, 0.06, 0.58), sat(x - 1.0));
  c = mix(c, vec3(0.86, 0.2, 0.25), sat(x - 2.0));
  c = mix(c, vec3(0.98, 0.55, 0.06), sat(x - 3.0));
  c = mix(c, vec3(1.0, 0.86, 0.2), sat(x - 4.0));
  return mix(c, vec3(1.0, 1.0, 0.92), sat(x - 5.0));
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  vec4 f = h.f;
  float ph = fract(uTime / 9.0);
  float element = 1.0 - smoothstep(-0.01, 0.03, f.x);
  float core = sat(-f.x / 0.035);
  float part = f.w < 0.01 ? 1.0 : (f.z < 0.01 ? 0.85 : 0.7);
  float body = 0.17 + 0.09 * (1.0 - smoothstep(0.2, 1.14, length(uv))) + 0.05 * (vnoise(uv * 2.5 + 7.0) - 0.5);
  float front = mix(-1.25, 1.25, smoothstep(0.0, 0.45, ph));
  float rise = 1.0 - smoothstep(front - 0.25, front + 0.05, uv.y);
  float pool = smoothstep(0.3, 0.62, ph) * smoothstep(-0.3, 0.9, uv.y);
  float level = (0.6 * rise + 0.35 * pool) * (1.0 - smoothstep(0.62, 1.0, ph));
  float flow = fbm(uv * 3.0 - vec2(0.0, uTime * 0.35));
  float spread = exp(-max(f.x, 0.0) * 9.0);
  float T = body + 0.12 * element;
  T += level * (0.55 * element * (0.75 + 0.25 * core) * part + 0.16 * spread);
  T += 0.07 * (flow - 0.5);
  T -= 0.14 * h.edge;
  T *= mix(0.78, 1.0, sat(dot(h.wn, h.v)));
  T += (hash12(floor(uv * 90.0) + floor(uTime * 9.0)) - 0.5) * 0.02;
  return tkDisplay(thIron(T));
}
`,
  },
  {
    key: "oscilloscope",
    label: "Oscilloscope",
    category: "tech",
    relief: 0.0,
    heroTime: 2.0,
    loop: "The beam traces the mark part by part, leaving a decaying phosphor afterglow",
    glsl:
      KIT +
      /* glsl */ `
// A round XY vector scope tube: a P31 green beam draws the outline of the mark, rim first, then each letter,
// then the smile. The line is thin and hot at the beam head and decays along the trace direction (afterglow);
// a faint persistent image stays. An illuminated graticule with minor ticks on the axes, curved glass reflections.
#define OS_S 0.97
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float px = tkPx(h.t);
  float r = length(uv);
  if (h.edge > 0.5 || h.side < 0.0 || r > 1.03) return litDielectric(h, vec3(0.03, 0.035, 0.03), 0.5, 0.4);
  vec3 col = vec3(0.004, 0.008, 0.006);
  // Graticule: 0.2 divisions, minor ticks every 0.04 on the axes.
  vec2 g = abs(fract(uv / 0.2 + 0.5) - 0.5) * 0.2;
  float grat = tkLine(min(g.x, g.y), 0.0012, px) * 0.6;
  float tx = tkLine((fract(uv.x / 0.04 + 0.5) - 0.5) * 0.04, 0.001, px) * step(abs(uv.y), 0.018);
  float ty = tkLine((fract(uv.y / 0.04 + 0.5) - 0.5) * 0.04, 0.001, px) * step(abs(uv.x), 0.018);
  col += vec3(0.05, 0.11, 0.09) * max(grat, max(tx, ty)) * step(r, 0.98);
  // Which path this point is nearest, and how far along the beam's schedule it sits.
  vec2 m = uv / OS_S;
  float mpx = px / OS_S;
  vec4 f = field(m);
  float dr = abs(f.y), ds = abs(f.z), dg = abs(f.w);
  float d, start, len, s;
  if (dr <= ds && dr <= dg) {
    d = dr; start = 0.0; len = 0.45; s = aroundMark(m);
  } else if (dg <= ds) {
    bool left = m.x < 0.05;
    vec2 c0 = left ? vec2(-0.27, 0.2) : vec2(0.32, 0.29);
    d = dg; start = left ? 0.45 : 0.67; len = left ? 0.22 : 0.2;
    s = fract(atan(m.y - c0.y, m.x - c0.x) / TAU + 0.25);
  } else {
    d = ds; start = 0.87; len = 0.13; s = sat((m.x + 0.45) / 0.9);
  }
  float age = fract(fract(uTime / 3.2) - (start + s * len));
  float I = 0.1 + 1.5 * exp(-age * 6.0);
  float head = exp(-age * 90.0);
  float core = exp(-pow(d / (1.2 * mpx + 0.002), 2.0));
  float halo = exp(-d / 0.025) * 0.18;
  col += vec3(0.25, 1.0, 0.45) * (core * I * 3.0 + halo * I) + vec3(0.7, 1.0, 0.8) * core * head * 6.0;
  // Channel readout bars, top left.
  vec2 q = uv - vec2(-0.1, -0.78);
  col += vec3(0.1, 0.4, 0.2) * step(0.0, q.x) * step(q.x, 0.2) * step(abs(q.y), 0.012) * step(0.3, fract(q.x / 0.04));
  col *= 1.0 - 0.25 * r * r;
  return col + tkGlass(h, uv, 0.25, 0.5);
}
`,
  },
  {
    key: "lidar",
    label: "LiDAR",
    category: "tech",
    relief: 0.06,
    heroTime: 1.2,
    loop: "A scan plane sweeps across, refreshing the point cloud as it passes",
    glsl:
      KIT +
      /* glsl */ `
#define HAS_RENDER
// A LiDAR point cloud of the coin: sensor-space scan rows of returns (jittered along each row), each point a ray
// traced to the object, coloured by elevation and depth on a turbo ramp; the mark returns brighter and larger
// (retroreflective paint). A scan plane sweeps across; fresh points flare white and fall back to their colour.
vec3 shade(Hit h) { return vec3(0.0); }
vec3 ldTurbo(float x) {
  const vec4 kr4 = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
  const vec4 kg4 = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
  const vec4 kb4 = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
  const vec2 kr2 = vec2(-152.94239396, 59.28637943);
  const vec2 kg2 = vec2(4.27729857, 2.82956604);
  const vec2 kb2 = vec2(-89.90310912, 27.34824973);
  x = sat(x);
  vec4 v4 = vec4(1.0, x, x * x, x * x * x);
  vec2 v2 = v4.zw * v4.z;
  return sat3(vec3(dot(v4, kr4) + dot(v2, kr2), dot(v4, kg4) + dot(v2, kg2), dot(v4, kb4) + dot(v2, kb2)));
}
vec3 render(vec3 ro, vec3 rd, vec2 suv) {
  float cs = 2.0 / 115.0;
  vec2 cell = floor(suv / cs);
  vec2 j = hash22(cell + 0.37) - 0.5;
  vec2 sp = (cell + 0.5 + vec2(j.x * 0.7, j.y * 0.2)) * cs;
  float pr = length(suv - sp) / cs;
  if (pr > 0.6 || hash12(cell * 0.71 + 3.0) < 0.1) return vec3(0.0);
  Hit h;
  if (!trace(ro, normalize(vec3(sp * (1.62 / 4.4), -1.0)), h)) return vec3(0.0);
  vec3 wp = h.wp;
  float sweepX = -1.6 + 3.2 * fract(uTime / 3.2);
  float fresh = exp(-fract((sweepX - wp.x) / 3.2) * 5.0);
  float mark = h.h * (1.0 - h.edge);
  vec3 tc = pow(ldTurbo(0.5 + 0.36 * wp.y + 1.1 * wp.z), vec3(2.2));
  float inten = (0.45 + 0.4 * sat(dot(h.wn, h.v))) * mix(0.45, 1.6, mark);
  float rad = 0.18 + 0.16 * mark + 0.06 * fresh;
  float dotA = 1.0 - smoothstep(rad - 0.1, rad + 0.06, pr);
  vec3 col = tc * inten * (0.45 + 0.55 * fresh) * 2.2 + vec3(1.0) * fresh * fresh * fresh * 0.5 * inten;
  col += vec3(0.6, 1.0, 1.0) * exp(-abs(wp.x - sweepX) * 80.0) * 1.2;
  return col * dotA;
}
`,
  },
  {
    key: "sonar",
    label: "Sonar",
    category: "tech",
    relief: 0.0,
    heroTime: 2.6,
    loop: "The sweep turns; the mark returns as green echoes that fade until the next pass",
    glsl:
      KIT +
      /* glsl */ `
// A round PPI sonar display: range rings, bearing lines every 30 degrees, a ticked outer scale. The sweep turns
// clockwise with a fading wedge; the mark comes back as echoes binned into polar range/bearing cells, each with its
// own strength each revolution, plus sea clutter near the centre and the odd stray contact. Green P7-style phosphor.
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float px = tkPx(h.t);
  float r = length(uv);
  float R = 1.02;
  if (h.edge > 0.5 || h.side < 0.0 || r > R + 0.02) {
    vec3 c = litDielectric(h, vec3(0.03, 0.035, 0.03), 0.45, 0.4);
    float tick = step(abs(fract(aroundMark(uv) * 36.0 + 0.5) - 0.5), 0.06) * step(1.06, r) * step(r, 1.1);
    return c + vec3(0.12) * tick * (1.0 - h.edge) * step(0.0, h.side);
  }
  float b = fract(0.25 - atan(uv.y, uv.x) / TAU);
  float age = fract(fract(uTime / 4.0) - b);
  // Polar return cells: 2% of range by 0.8 degrees, re-rolled every revolution.
  float rb = floor(r / 0.02), ab = floor(b * 450.0);
  float bc = (ab + 0.5) / 450.0, rc = (rb + 0.5) * 0.02;
  vec2 c = rc * vec2(sin(bc * TAU), cos(bc * TAU));
  float scanN = floor(uTime / 4.0 - b);
  vec4 f = field(c / 0.97);
  float ret = (1.0 - smoothstep(-0.005, 0.02, f.x)) * (0.6 + 0.4 * hash12(vec2(rb, ab) + scanN * 1.7));
  float clutter = smoothstep(0.55, 0.95, hash12(vec2(rb, ab) * 1.3 + scanN)) * exp(-r * 4.0) * 0.8;
  float blip = step(0.9985, hash12(vec2(rb * 0.7, ab) + scanN * 3.1)) * 0.7;
  float echo = max(ret, max(clutter, blip)) * (exp(-age * 3.2) + 0.04);
  float beam = exp(-age * 260.0) + 0.12 * exp(-age * 14.0);
  float ringD = abs(fract(r / (R * 0.25) + 0.5) - 0.5) * R * 0.25;
  float grid = tkLine(ringD, 0.0012, px);
  grid = max(grid, tkLine(abs(fract(b * 12.0 + 0.5) - 0.5) / 12.0 * TAU * r, 0.0008, px));
  grid = max(grid, tkLine(abs(fract(b * 72.0 + 0.5) - 0.5) / 72.0 * TAU * r, 0.0008, px) * step(R - 0.035, r));
  grid = max(grid, tkFill(r - 0.012, px));
  vec3 phos = vec3(0.2, 1.0, 0.45);
  vec3 col = vec3(0.003, 0.01, 0.006) + phos * (echo * 2.6 + beam * 1.2 + grid * 0.12);
  col *= 1.0 - 0.2 * r * r;
  return col + tkGlass(h, uv, 0.2, 0.45);
}
`,
  },
];
