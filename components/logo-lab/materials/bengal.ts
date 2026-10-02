import type { LogoMaterial } from "../types";

/** Bengal: the craft and street-light of home. */
export const BENGAL: LogoMaterial[] = [
  {
    key: "bishnupur-terracotta",
    label: "Bishnupur Terracotta",
    category: "bengal",
    relief: 0.06,
    light: 150,
    heroTime: 2.0,
    loop: "Dusk light rakes across the temple wall",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Temple-panel terracotta: raised mark, a recessed frame, and rosette friezes top and bottom like the Bishnupur panels.
float rosettes(vec2 uv) {
  vec2 q = vec2(uv.x * 3.1, (abs(uv.y) - 1.29) * 3.1);
  vec2 c = vec2(fract(q.x) - 0.5, q.y);
  float r = length(c), a = atan(c.y, c.x);
  float petal = smoothstep(0.34, 0.29, r * (1.0 + 0.32 * cos(a * 4.0)));
  float eye = smoothstep(0.09, 0.06, r);
  vec2 l = vec2(fract(q.x + 0.5) - 0.5, q.y);
  float leaf = smoothstep(0.07, 0.03, abs(l.y - 0.18 * sin(l.x * 6.0))) * smoothstep(0.5, 0.3, abs(l.x));
  return max(petal - eye * 0.6, leaf * 0.7);
}
float surface(vec2 uv, vec4 f) {
  float s = 0.005 * (vnoise(uv * 85.0) - 0.5) + 0.008 * (fbm(uv * 11.0) - 0.5);
  vec4 v = voronoi(uv * 26.0);
  s -= 0.007 * smoothstep(0.14, 0.0, v.x) * step(0.92, v.z);
  float band = smoothstep(1.15, 1.17, abs(uv.y));
  s += band * (-0.022 + 0.034 * rosettes(uv));
  float frame = abs(sdBox2(uv, vec2(1.02, 1.12), 0.03));
  s -= 0.018 * smoothstep(0.035, 0.015, frame) * (1.0 - band);
  return s;
}
vec3 shade(Hit h) {
  float sweep = 0.55 * sin(uTime * 0.35);
  setLight(h, lightAt(2.55 + sweep, 0.32 + 0.12 * cos(uTime * 0.35)));
  vec3 clay = mix(hex(0x8f3a2c), hex(0xb8584a), fbm(h.uv * 5.0 + 2.0));
  clay = mix(clay, hex(0xc47a62), 0.35 * smoothstep(0.55, 0.8, vnoise(h.uv * 40.0)));
  clay *= 0.85 + 0.25 * h.h;
  clay = mix(clay, hex(0x6b2a20), h.edge * 0.4);
  vec3 warm = litDielectric(h, clay, 0.88, 0.22);
  return warm * vec3(1.08, 0.95, 0.85);
}
`,
  },
  {
    key: "chandannagar-lights",
    label: "Chandannagar Lights",
    category: "bengal",
    relief: 0.0,
    heroTime: 1.3,
    loop: "Chase sequences ripple along the strokes",
    glsl: /* glsl */ `
#define HAS_SDF
// Jagaddhatri-procession serial lights: a dark board of tiny bulbs on a bamboo lattice; the mark is drawn in bulbs.
// The board is a thick round slab with a bamboo-wrapped edge, so it keeps its body when it turns or flips; the
// bulbs light both faces.
#define CELL 0.042
#define CT 0.12
#define CB 0.04
float materialSDF(vec3 p) {
  vec2 w = vec2(length(p.xy) - 1.1 + CB, abs(p.z) - CT + CB);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - CB;
}
vec3 bulbColour(float id) {
  int k = int(floor(id * 6.0));
  if (k == 0) return vec3(1.0, 0.12, 0.08);
  if (k == 1) return vec3(0.1, 1.0, 0.25);
  if (k == 2) return vec3(0.2, 0.4, 1.0);
  if (k == 3) return vec3(1.0, 0.75, 0.1);
  if (k == 4) return vec3(1.0, 0.25, 0.7);
  return vec3(1.0, 0.92, 0.75);
}
vec3 bulbs(vec2 uv) {
  vec3 glow = vec3(0.0);
  vec2 cell = floor(uv / CELL);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(i, j);
    vec2 centre = (c + 0.5) * CELL;
    vec4 f = field(centre);
    float on = step(f.x, 0.012);
    if (on < 0.5) continue;
    // Each part of the mark gets its own colour and its own chase.
    float part = f.y < 0.0 ? 0.0 : f.z < 0.0 ? 1.0 : 2.0;
    float id = fract(part * 0.37 + 0.13 + (part == 2.0 ? floor(aroundMark(centre) * 3.0) * 0.21 : 0.0));
    float along = aroundMark(centre) * 28.0 + length(centre) * 6.0;
    float chase = part == 0.0 ? step(0.5, fract(along * 0.5 - uTime * 1.6)) : 0.55 + 0.45 * sin(along - uTime * 4.0 + part * 2.0);
    float flicker = 0.85 + 0.15 * hash12(c + floor(uTime * 12.0));
    float d = length(uv - centre) / CELL;
    float lit = chase * flicker;
    vec3 col = bulbColour(id);
    glow += col * lit * (exp(-d * d * 22.0) * 7.0 + exp(-d * d * 2.2) * 0.35);
    glow += vec3(0.05, 0.04, 0.03) * (1.0 - lit) * exp(-d * d * 30.0);
  }
  return glow;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  vec3 board = vec3(0.004, 0.003, 0.003);
  // Bamboo lattice every few cells.
  vec2 g = abs(fract(uv / (CELL * 8.0)) - 0.5) * CELL * 8.0;
  float stick = smoothstep(0.012, 0.006, min(g.x, g.y));
  vec3 bamboo = mix(hex(0x3a2a14), hex(0x6b5126), vnoise(uv * vec2(4.0, 60.0)));
  vec3 face = mix(board, bamboo * 0.12, stick) + bulbs(uv);
  if (h.edge < 0.02) return face;
  // The edge: bamboo wrapped round the board, lit like a solid object.
  vec3 wrap = mix(hex(0x6b5126), hex(0xa07a3c), vnoise(vec2(atan(h.p.y, h.p.x) * 30.0, h.p.z * 60.0)));
  vec3 wall = litDielectric(h, wrap * 0.5, 0.55, 0.2);
  return mix(face, wall, h.edge);
}
`,
  },
  {
    key: "sandesh-mould",
    label: "Sandesh Mould",
    category: "bengal",
    relief: 0.0,
    light: 140,
    heroTime: 7.6,
    loop: "Chhena is pressed into the carved mould, scraped level, takes the gur pattern, is prised up, and carried off",
    glsl: /* glsl */ `
#define HAS_SDF
// A round chhanch: a carved sheesham sandesh mould, its carving stained with nolen gur. The loop is the making:
// (0-1.2 s) the empty mould, gur glistening in the carved mark; (1.2-3.4) a lump of chhena is dropped in and thumbed
// down to fill the dish; (3.4-4.4) a knife scrapes it level; (4.4-5.4) it takes the pattern, gur-caramel in the
// mark; (5.6-7) it is prised up and tips; (9-10) it is carried off, leaving the stained mould for the next one.
#define SM_T 0.1
#define SM_FLOOR 0.035
float smU() { return mod(uTime, 12.0); }
float smMark(vec2 q, float w) { return 1.0 - smoothstep(-w, w, field(q).x); }
float smBoard(vec3 p) {
  float r = length(p.xy);
  vec2 w = vec2(r - 1.14 + 0.035, abs(p.z) - SM_T + 0.035);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.035;
  // A round dish gouged into the face, the mark cut deeper into its floor (the negative).
  float floorZ = SM_FLOOR - 0.035 * smMark(p.xy, 0.012);
  float cav = max(r - 1.075, floorZ - p.z);
  return smax(slab, -cav, 0.01);
}
/** Sandesh-local position (its base on the dish floor at z = 0): prised up and tipped, then slid off. */
vec3 smSweetQ(vec3 p) {
  float u = smU();
  float l = smoothstep(5.6, 7.0, u), c = smoothstep(9.0, 10.0, u);
  vec3 q = p - vec3(1.35 * c * c, 0.0, SM_FLOOR + 0.06 * l);
  float a = 0.04 * l + 0.05 * c;
  return vec3(q.x, cos(a) * q.y + sin(a) * q.z, -sin(a) * q.y + cos(a) * q.z);
}
float smSweet(vec3 p) {
  float u = smU();
  if (u < 1.2 || u > 10.1) return 1.0;
  float pr = smoothstep(1.2, 3.4, u);
  vec3 q = smSweetQ(p);
  float r = length(q.xy);
  // A lump that spreads to fill the dish as it is thumbed down, domed until the knife passes.
  float R = mix(0.35, 1.03, pr);
  float dome = mix(0.1, 0.025, pr) * smoothstep(-0.03, 0.03, q.x - mix(-1.2, 1.2, smoothstep(3.4, 4.4, u)));
  float top = mix(0.24, 0.12, pr) - dome * sat(r / R) * sat(r / R);
  vec2 d1 = q.xy - vec2(-0.32, 0.18), d2 = q.xy - vec2(0.3, -0.25);
  top -= 0.025 * sin(PI * pr) * (exp(-dot(d1, d1) / 0.03) + exp(-dot(d2, d2) / 0.03));
  // The pattern comes up on the top.
  top += 0.025 * smMark(q.xy, 0.02) * smoothstep(4.4, 5.4, u);
  return smax(r - R, max(-q.z, q.z - top), 0.03) * 0.8;
}
float materialSDF(vec3 p) { return min(smBoard(p), smSweet(p)); }
vec3 smWood(Hit h) {
  vec2 q = h.p.xy;
  // Sheesham, oiled dark: tight grain along y with darker streaks; the side wall is end grain.
  float warp = fbm(q * vec2(1.4, 0.35) + 3.0);
  float ph = (q.x + 0.32 * warp) * 52.0;
  float fleck = vnoise(vec2(q.x * 70.0, q.y * 5.0));
  vec3 wood = mix(hex(0x1e0c05), hex(0x4a2412), (0.5 + 0.5 * sin(ph)) * 0.6 + fleck * 0.4);
  h.wn = normalize(h.wn + uRot * vec3(0.05 * cos(ph), 0.0, 0.0));
  float dish = (1.0 - smoothstep(1.06, 1.08, length(q))) * (1.0 - smoothstep(SM_T - 0.02, SM_T - 0.008, h.p.z)) * step(0.0, h.p.z);
  // Gouge marks fan round the dish; the carving is paler where the knife cut fresh fibre.
  float gouge = 0.5 + 0.5 * sin(atan(q.y, q.x) * 64.0 + length(q) * 20.0 + vnoise(q * 9.0) * 4.0);
  wood = mix(wood, mix(hex(0x3a1c0c), hex(0x6b3a1c), gouge), dish * 0.7);
  // Years of nolen gur stain the carved mark a glossy caramel.
  float gur = smMark(q, 0.01) * dish;
  wood = mix(wood, hex(0x8a4612) * (0.8 + 0.3 * vnoise(q * 20.0)), gur * 0.85);
  wood *= 1.0 - 0.35 * h.edge;
  return litDielectric(h, wood, mix(0.4, 0.18, gur), mix(0.55, 0.9, gur));
}
vec3 smSweetShade(Hit h) {
  float u = smU();
  vec2 q = smSweetQ(h.p).xy;
  float pr = smoothstep(1.2, 3.4, u);
  // Chhena: crumbly while it goes in, a fine soft grain once pressed.
  float g1 = vnoise(q * 150.0), g2 = vnoise(q * 48.0 + 7.0);
  h.wn = normalize(h.wn + uRot * vec3(g1 - 0.5, g2 - 0.5, 0.0) * mix(0.5, 0.2, pr));
  vec3 milk = mix(hex(0xeadcbb), hex(0xf8f1df), g2 * 0.7 + 0.3 * g1);
  milk = mix(milk, hex(0xdcc69a), 0.3 * h.edge);
  // The pattern takes the gur from the carving: caramel in the raised mark.
  float m = smMark(q, 0.02) * smoothstep(4.4, 5.6, u);
  milk = mix(milk, mix(hex(0x9a5520), hex(0xb87335), g2), m * 0.95);
  vec3 col = litDielectric(h, milk, mix(0.72, 0.35, m), mix(0.16, 0.5, m));
  // Milky subsurface: light bleeds round into the shadow side, warm.
  float nl = dot(h.wn, h.l);
  col += milk * vec3(1.0, 0.8, 0.58) * 0.3 * sat(nl * 0.5 + 0.5) * (1.0 - sat(nl));
  return col;
}
vec3 shade(Hit h) { return smSweet(h.p) < smBoard(h.p) ? smSweetShade(h) : smWood(h); }
`,
  },
  {
    key: "kantha-stitch",
    label: "Kantha Stitch",
    category: "bengal",
    relief: 0.0,
    heroTime: 8.8,
    loop: "The thread sews itself in, row by row, then unpicks",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Kantha: a disc covered in old cotton saris, layered and quilted with running stitch. The ground is quilted in
// wavy concentric rows that pucker the cloth; the mark is filled with coloured thread in rows following its outline.
float kanthaRows(vec2 uv) { return length(uv) / 0.045 + 0.25 * sin(atan(uv.y, uv.x) * 3.0); }
float surface(vec2 uv, vec4 f) {
  float s = 0.0015 * sin(TAU * kanthaRows(uv)) + 0.003 * (vnoise(uv * 6.0) - 0.5);
  return s + 0.0025 * smoothstep(0.01, -0.02, f.x);
}
/** How far the needle has got (0..1): sews for 9 s, holds, then unpicks quickly. */
float kanthaProgress() {
  float u = mod(uTime, 12.0);
  return u < 9.0 ? u / 9.0 * 1.03 : 1.03 * (1.0 - smoothstep(10.5, 12.0, u));
}
/** Thread per part: madder red rim, indigo glyphs, turmeric smile. */
vec3 kanthaThread(float part) {
  if (part < 0.5) return hex(0xa81c26);
  if (part < 1.5) return hex(0x1b2c6b);
  return hex(0xd8961a);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  vec4 f = h.f;
  float r = length(uv), a = atan(uv.y, uv.x);
  // The top sari: faded off-white cotton, a scatter of printed butis, worn through to a green one below.
  vec3 cloth = mix(hex(0xd9cdb4), hex(0xe6dcc7), fbm(uv * 2.2 + 5.0));
  vec2 bc = fract(uv * 6.0 + vec2(0.5 * floor(uv.y * 6.0), 0.0)) - 0.5;
  float buti = smoothstep(0.1, 0.07, length(bc) * (1.0 + 0.4 * cos(atan(bc.y, bc.x) * 5.0)));
  cloth = mix(cloth, hex(0xc4847c), buti * 0.4);
  float worn = smoothstep(0.64, 0.72, fbm(uv * 3.0 + 11.0));
  cloth = mix(cloth, hex(0x8e9e7e), worn * 0.45);
  // The printed laal-paar border round the disc: faded madder, black pin-stripes, a chain of lozenges.
  float band = smoothstep(1.008, 1.018, r);
  vec3 paar = hex(0x9d3a2e);
  float loz = smoothstep(0.36, 0.3, abs(fract(a * r * 9.0) - 0.5) + abs(r - 1.06) / 0.05);
  paar = mix(paar, hex(0xd8c39a), loz * 0.75);
  float pin = smoothstep(0.006, 0.0025, abs(r - 1.026)) + smoothstep(0.006, 0.0025, abs(r - 1.094));
  paar = mix(paar, hex(0x1a1210), sat(pin));
  cloth = mix(cloth, paar * (0.85 + 0.15 * vnoise(uv * 9.0)), band);
  // Round the edge the cloth is turned under and overcast in red.
  float hem = smoothstep(0.3, 0.1, abs(fract(a * 1.14 / 0.03 + h.p.z * 9.0) - 0.5)) * smoothstep(0.4, 0.7, h.edge);
  cloth = mix(cloth, hex(0xa81c26), hem);
  // Ground quilting: pale running stitch in wavy concentric rows, offset row to row.
  float ry = kanthaRows(uv);
  float gcr = fract(ry) - 0.5;
  float gax = fract(a * r / 0.032 + floor(ry) * 0.5);
  float gst = smoothstep(0.13, 0.06, abs(gcr)) * smoothstep(0.0, 0.08, gax) * smoothstep(0.62, 0.54, gax) * smoothstep(0.008, 0.02, f.x) * (1.0 - band);
  // The mark: rows of stitches parallel to its outline, each part in its own thread.
  float d = -f.x;
  float part = f.y <= min(f.z, f.w) ? 0.0 : (f.z <= f.w ? 2.0 : 1.0);
  vec2 cen = part == 1.0 ? vec2(sign(uv.x) * 0.28, 0.36) : vec2(0.0);
  vec2 q = uv - cen;
  float arc = atan(q.y, q.x) * max(length(q), 0.08);
  float row = floor(d / 0.018);
  float cr = fract(d / 0.018) - 0.5;
  float ax = fract(arc / 0.034 + row * 0.5);
  float st = smoothstep(0.42, 0.26, abs(cr)) * smoothstep(0.0, 0.07, ax) * smoothstep(0.64, 0.56, ax) * step(0.003, d);
  // Sewing order: round the rim, then ঋ, then ভ, then along the smile.
  float ord = part == 0.0 ? aroundMark(uv) * 0.32
            : part == 1.0 ? 0.32 + (uv.x < 0.0 ? 0.0 : 0.2) + 0.2 * fract(atan(q.y, q.x) / TAU + 0.25)
            : 0.72 + 0.28 * sat(uv.x * 0.55 + 0.5);
  ord += row * 0.003;
  float prog = kanthaProgress();
  float sewn = step(ord, prog);
  float lead = exp(-pow((prog - ord) * 50.0, 2.0)) * sewn;
  // Before it is sewn the design is only a traced line of indigo chalk.
  float tr = smoothstep(0.006, 0.001, abs(f.x)) * (1.0 - sewn) * 0.6;
  vec3 thr = kanthaThread(part) * (0.85 + 0.3 * hash12(vec2(row, part)));
  float mst = st * sewn;
  vec2 gdir = fieldGrad(uv, 0);
  vec2 radial = uv / max(r, 1e-3);
  h.wn = normalize(h.wn + uRot * vec3(-gdir * cr * 1.6 * mst + radial * gcr * 1.6 * gst, 0.0));
  vec3 alb = mix(cloth, hex(0x3a5c9a), tr);
  alb = mix(alb, hex(0xf1ebde), gst);
  alb = mix(alb, thr, mst);
  float threadAmt = max(gst, mst);
  vec3 col = litDielectric(h, alb, mix(0.92, 0.5, threadAmt), mix(0.1, 0.3, threadAmt));
  // The newest stitches catch a glint as the thread is pulled through.
  col += (thr * 0.8 + vec3(0.3, 0.28, 0.25)) * lead * st;
  return col * (h.side > 0.0 ? 1.0 : 0.6);
}
`,
  },
  {
    key: "shola-pith",
    label: "Shola Pith",
    category: "bengal",
    relief: 0.045,
    light: 110,
    heroTime: 2.4,
    loop: "The aarti lamp is circled three times before it, then set down to flicker",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Daker saaj: milk-white shola-pith filigree (the mark, cut with an incised inner line and pierced dots) pinned on a
// deep red velvet ground inside a braided gold zari border set with sequins. The loop is the aarti: (0-1 s) the
// pancha-pradip is raised; (1-7.5) circled three times clockwise before it, light and shadow wheeling over the pith
// and every sequin flashing as the flame passes; (7.5-8.5) it is lowered and set down, and (8.5-12) only its flicker
// lights the piece from below.
/** Braided zari band 0..1 and its braid relief. */
float shZari(vec2 uv) { float r = length(uv); return smoothstep(1.015, 1.03, r); }
float surface(vec2 uv, vec4 f) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float mk = 1.0 - smoothstep(-0.02, 0.02, f.x);
  // Shola: an incised line inside every edge and pierced dots down the thick strokes.
  float s = -0.007 * smoothstep(0.006, 0.0015, abs(f.x + 0.017));
  s -= 0.008 * smoothstep(-0.03, -0.036, f.x) * smoothstep(0.3, 0.18, abs(fract(a * max(r, 0.2) / 0.04) - 0.5));
  s += mk * 0.002 * (vnoise(uv * 60.0) - 0.5);
  // Velvet pile on the ground.
  s += (1.0 - mk) * 0.0008 * (vnoise(uv * 140.0) - 0.5);
  // Zari: a raised braid of twisted gold thread.
  float z = shZari(uv);
  s += z * (0.008 + 0.004 * cos(TAU * (a * 1.07 / 0.028 + (r - 1.07) / 0.03)));
  return s;
}
/** The pancha-pradip: world position and brightness. */
vec4 shLamp() {
  float u = mod(uTime, 12.0);
  float fl = 0.82 + 0.18 * (0.6 * vnoise(vec2(uTime * 7.0, 1.0)) + 0.4 * vnoise(vec2(uTime * 19.0, 5.0)));
  float circ = smoothstep(1.0, 7.5, u);
  float ang = PI * 0.5 - TAU * 3.0 * circ;
  vec3 orbit = vec3(1.05 * cos(ang), 1.05 * sin(ang) + 0.08 * sin(u * 5.0), 0.85);
  vec3 rest = vec3(0.25, -1.55, 0.9);
  vec3 raised = vec3(0.0, 1.05, 0.85);
  vec3 pos = u < 1.0 ? mix(rest, raised, smoothstep(0.0, 1.0, u)) : (u < 7.5 ? orbit : mix(raised, rest, smoothstep(7.5, 8.5, u)));
  float inten = mix(0.45, 1.0, smoothstep(0.0, 1.0, u) * (1.0 - smoothstep(7.5, 8.5, u)));
  return vec4(pos, inten * fl);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float r = length(uv), a = atan(uv.y, uv.x);
  vec4 lamp = shLamp();
  vec3 L = lamp.xyz - h.wp;
  float dist2 = dot(L, L);
  setLight(h, L);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 flame = vec3(1.0, 0.8, 0.56) * lamp.w * 2.2 / (0.25 + dist2);
  float nl = sat(dot(h.wn, h.l));
  float nv = sat(dot(h.wn, h.v));
  vec3 amb = vec3(0.04, 0.035, 0.03);
  float mk = h.h;
  float zari = shZari(uv) * (1.0 - mk);
  // Shola pith: milk-white, matte, faintly translucent at the cut edges.
  vec4 v = voronoi(uv * 120.0);
  vec3 pith = hex(0xf4f0e4) * (0.9 + 0.1 * smoothstep(0.0, 0.15, v.w));
  vec3 cPith = pith * (flame * (nl * sh * 0.9 + 0.12) + amb * 2.0) + pith * flame * 0.2 * h.edge;
  // Velvet: deep crimson, crushed in places, with the bright sheen velvet gets toward grazing.
  float crush = 0.8 + 0.35 * fbm(uv * 4.0 + 3.0);
  vec3 vel = hex(0x5c0715) * crush;
  vec3 cVel = vel * (flame * nl * sh + amb) + hex(0xd0304a) * pow(1.0 - nv, 2.5) * (flame * (0.4 + 0.6 * nl) + amb);
  // Zari: gold braid; sequins on it, each tilted its own way so they flash in turn as the lamp passes.
  float cell = TAU / 44.0;
  float k = floor(a / cell + 0.5);
  float t = (a / cell - k) * cell * r;
  float seq = smoothstep(0.013, 0.009, length(vec2(t, r - 1.075))) * step(1.0, shZari(uv) + 0.001);
  vec3 tilt = (vec3(hash11(k * 1.7), hash11(k * 3.1 + 2.0), 0.0) - 0.5) * 0.9;
  vec3 nz = normalize(h.wn + uRot * tilt * seq);
  vec3 gold = vec3(0.95, 0.72, 0.36);
  vec3 rf = reflect(-h.v, nz);
  vec3 cZari = gold * (flame * (nl * sh * 0.5 + ggx(nz, h.v, h.l, mix(0.38, 0.12, seq)) * sh * mix(2.0, 6.0, seq)) + amb * 1.5);
  cZari += fresnel3(dot(nz, h.v), gold) * studioDiffuse(rf) * 0.25 * h.ao;
  vec3 col = mix(mix(cVel, cZari, zari), cPith, mk);
  return col;
}
`,
  },
  {
    key: "kumartuli-clay",
    label: "Kumartuli Clay",
    category: "bengal",
    relief: 0.0,
    light: 120,
    heroTime: 16.4,
    loop: "An idol is made: straw, rough clay, smoothed Ganga clay, cracks filled, white primer, eyes painted; then immersion",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Kumartuli: the mark made the way the kumors of north Kolkata make an idol, stage by stage on a wooden plank.
// (0-2.4 s) the kathamo: straw bundled along the strokes, bound in jute; (2.4-4.8) handfuls of rough entel clay
// with rice husk; (5-8) wet hands smooth the fine Ganga clay over it; (8-10.2) it dries pale and cracks; (10.2-11.4)
// the cracks are worked shut; (11.5-13.8) the white khori-mati primer is brushed on; (14-16.3) chokkhu daan, the
// eyes painted on ঋ and ভ, the last ritual stroke; (16.6-18) bisarjan: the river takes the clay back to straw.
#define KC_P 18.0
float kcU() { return mod(uTime, KC_P); }
/** Stage masks at uv: x = rough clay, y = smoothed, z = washed away by the river, w = shared noise. */
vec4 kcStage(vec2 uv) {
  float u = kcU();
  float n = vnoise(uv * 5.0 + 3.0);
  float wash = smoothstep(0.0, 0.2, (u - 16.6) / 1.3 - n * 0.8);
  float c1 = smoothstep(0.0, 0.25, (u - 2.4) / 2.2 - n * 0.8) * (1.0 - wash);
  float sm = smoothstep(0.0, 0.06, (u - 5.0) / 2.8 - (0.85 * aroundMark(uv) + 0.15 * n)) * c1;
  return vec4(c1, sm, wash, n);
}
float surface(vec2 uv, vec4 f) {
  vec4 st = kcStage(uv);
  float lump = vnoise(uv * 14.0) - 0.5;
  // Straw: bundles along the strokes (stalks follow the outline), bulging where the twine binds them; a plank below.
  float mk = smoothstep(0.012, -0.012, f.x);
  float tie = smoothstep(0.38, 0.46, abs(fract(aroundMark(uv) * 70.0) - 0.5));
  float straw = mk * (0.02 + 0.003 * sin(f.x * 520.0) + 0.004 * tie) + (1.0 - mk) * 0.0015 * sin(uv.x * 40.0 + lump * 3.0);
  // Rough clay: slopped on thick, lumpy, edges blurred.
  float m1 = smoothstep(0.03, -0.01, f.x + 0.02 * lump);
  float rough = 0.008 + 0.006 * lump + m1 * (0.022 + 0.004 * lump);
  // Smooth Ganga clay: crisp edges, a skin-smooth ground.
  float fine = 0.006 + 0.022 * smoothstep(0.012, -0.012, f.x);
  return mix(mix(straw, rough, st.x), fine, st.y);
}
vec3 shade(Hit h) {
  float u = kcU();
  vec2 uv = h.uv;
  vec4 f = h.f;
  vec4 st = kcStage(uv);
  float n2 = vnoise(uv * 11.0 + 7.0);
  float alive = 1.0 - st.z;
  // Straw and jute on a plank.
  float mk = smoothstep(0.012, -0.012, f.x);
  float tie = smoothstep(0.38, 0.46, abs(fract(aroundMark(uv) * 70.0) - 0.5));
  vec3 straw = mix(hex(0x6b5223), hex(0xc9a75a), 0.5 + 0.5 * sin(f.x * 520.0 + n2 * 3.0));
  straw = mix(straw, hex(0x7d5f33), tie);
  vec3 plank = mix(hex(0x3a2412), hex(0x5a3a1e), 0.5 + 0.5 * sin(uv.x * 40.0 + st.w * 3.0));
  vec3 col = mix(plank, straw, mk);
  float rough = 0.8, spec = 0.15;
  // Rough first clay with husk.
  vec3 entel = mix(hex(0x3d3128), hex(0x5a4a3b), n2);
  entel = mix(entel, hex(0x9a7e45), smoothstep(0.8, 0.9, vnoise(uv * vec2(110.0, 40.0))) * 0.6);
  col = mix(col, entel, st.x);
  // Smooth Ganga clay: grey and wet under the hands, a bright wet streak at the front of each swipe.
  float dry = smoothstep(8.0, 10.2, u + 0.8 * (n2 - 0.5)) * alive;
  vec3 ganga = mix(mix(hex(0x3f3a35), hex(0x4c4640), n2), mix(hex(0x9c8f7c), hex(0xb2a690), n2), dry);
  col = mix(col, ganga, st.y);
  float wetFront = st.y * (1.0 - smoothstep(0.0, 0.25, (u - 5.0) / 2.8 - (0.85 * aroundMark(uv) + 0.15 * st.w)));
  rough = mix(rough, mix(0.22, 0.95, dry), st.y);
  spec = mix(spec, mix(0.8, 0.08, dry), st.y) + wetFront * 0.6;
  // Drying cracks, then worked shut with wet clay (dark lines that fade).
  vec4 v = voronoi(uv * 9.0 + 2.0);
  float cw = 0.06 * dry;
  float crack = cw > 0.002 ? smoothstep(cw, cw * 0.35, v.w) : 0.0;
  float fill = smoothstep(10.2, 11.4, u + 0.6 * (n2 - 0.5));
  col = mix(col, mix(hex(0x120d09), hex(0x4c4640), fill), crack * st.y * (1.0 - fill * fill));
  h.ao *= 1.0 - 0.5 * crack * st.y * (1.0 - fill);
  // Khori-mati primer brushed on left to right, streaky at the brush's edge.
  float pw = smoothstep(0.0, 0.08, (u - 11.5) / 2.3 - (uv.x * 0.45 + 0.5) - 0.12 * vnoise(uv * vec2(3.0, 40.0))) * st.y * alive;
  col = mix(col, mix(hex(0xe2dccb), hex(0xf2eee2), vnoise(uv * vec2(4.0, 60.0))), pw);
  rough = mix(rough, 0.9, pw);
  spec = mix(spec, 0.08, pw);
  // Chokkhu daan: the eyes, ঋ then ভ, painted black with a vermilion lid line, stroke by stroke.
  vec2 q = uv - vec2(sign(uv.x) * 0.28, 0.36);
  float ord = (uv.x < 0.0 ? 0.0 : 0.5) + 0.5 * fract(atan(q.y, q.x) / TAU + 0.25);
  float painted = step(ord, sat((u - 14.0) / 2.3)) * alive * step(f.w, min(f.y, f.z));
  float eye = smoothstep(0.004, -0.004, f.w) * painted;
  float lid = smoothstep(0.012, 0.007, abs(f.w - 0.009)) * painted;
  col = mix(col, hex(0xb3161a), lid);
  col = mix(col, hex(0x0a0807), eye);
  rough = mix(rough, 0.3, max(eye, lid));
  spec = mix(spec, 0.6, max(eye, lid));
  // Bisarjan: the wash front is dark and wet.
  float wf = st.z * (1.0 - smoothstep(0.0, 0.3, (u - 16.6) / 1.3 - st.w * 0.8 - 0.2));
  col *= 1.0 - 0.5 * wf;
  return litDielectric(h, col, rough, sat(spec));
}
`,
  },
  {
    key: "dokra-brass",
    label: "Dokra Brass",
    category: "bengal",
    relief: 0.0,
    light: 135,
    heroTime: 14.4,
    loop: "Lost wax: threads wound, clay coat, firing, the mould cracked off, raw brass rubbed bright",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Dokra, the lost-wax brass of Bankura and Bardhaman, cast in order. (0-3.4 s) dark resin-wax threads are wound
// along the strokes over a clay core, then spirals and a rope border over the ground; (3.5-5.4) the clay coat is
// slapped on; (5.6-8.6) it is fired and glows; (8.4-9.2) the mould cracks, (9.2-10.6) and falls away in chunks;
// (10.6-14) the raw, blackened brass is rubbed bright on its high points. (15.2-16) the next core is set out.
#define DK_P 16.0
float dkU() { return mod(uTime, DK_P); }
/** Thread relief 0..1: strung beads on the rim, twisted coils along the strokes, spirals and a rope on the ground. */
float dkThread(vec2 uv, vec4 f) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float along = a * max(r, 0.2);
  if (f.x < 0.008) {
    if (f.y < 0.0) {
      float b = fract(along / 0.05) - 0.5;
      float c = (-f.y - 0.043) / 0.04;
      return sat(1.0 - 4.0 * (b * b + c * c));
    }
    return 0.5 + 0.5 * cos(TAU * (-f.x / 0.021 + along * 2.5));
  }
  if (r > 1.02) {
    float c = (r - 1.065) / 0.04;
    return (0.5 + 0.5 * cos(TAU * (a * 1.065 / 0.032 + c * 0.6))) * sat(1.0 - c * c);
  }
  vec2 c = fract(uv / 0.16) - 0.5;
  float cr = length(c) * 0.16;
  float sp = 0.5 + 0.5 * cos(TAU * (cr / 0.013 - atan(c.y, c.x) / TAU));
  return sp * smoothstep(0.072, 0.06, cr) * smoothstep(0.02, 0.04, f.x);
}
/** Order along the strokes the wax is wound in (0..1). */
float dkOrd(vec2 uv, vec4 f) {
  if (f.y <= min(f.z, f.w)) return aroundMark(uv) * 0.35;
  if (f.z <= f.w) return 0.75 + 0.25 * sat(uv.x * 0.62 + 0.5);
  vec2 q = uv - vec2(sign(uv.x) * 0.28, 0.36);
  return 0.35 + (uv.x < 0.0 ? 0.0 : 0.2) + 0.2 * fract(atan(q.y, q.x) / TAU + 0.25);
}
/** x = wax (or cast) present, y = clay coat, z = mould fallen away, w = next core (reset). */
vec4 dkStage(vec2 uv, vec4 f) {
  float u = dkU();
  float n = vnoise(uv * 4.0 + 1.0);
  float onMark = smoothstep(0.012, 0.0, f.x);
  float wax = onMark * smoothstep(0.0, 0.03, sat(u / 2.6) - dkOrd(uv, f)) + (1.0 - onMark) * smoothstep(2.6, 3.4, u);
  float coat = smoothstep(0.0, 0.2, (u - 3.5) / 1.9 - n * 0.8);
  float chunk = hash12(floor(uv * 6.0 + 0.6 * n));
  float fallen = step(chunk, (u - 9.2) / 1.4);
  float reset = smoothstep(0.0, 0.2, (u - 15.2) / 0.8 - n * 0.8);
  return vec4(wax * (1.0 - reset), coat * (1.0 - fallen), fallen, reset);
}
float surface(vec2 uv, vec4 f) {
  vec4 st = dkStage(uv, f);
  float th = dkThread(uv, f);
  float onMark = smoothstep(0.008, -0.004, f.x);
  float castH = mix(0.009 * th, 0.022 + 0.006 * (th - 0.5), onMark);
  float coatH = 0.01 + 0.75 * castH + 0.004 * (vnoise(uv * 10.0) - 0.5);
  return mix(castH * st.x, coatH, st.y);
}
vec3 dkGlow(float t) { return vec3(1.0, 0.16, 0.02) * t * t * 1.2 + vec3(1.0, 0.5, 0.18) * pow(t, 5.0) * 0.9; }
vec3 shade(Hit h) {
  float u = dkU();
  vec2 uv = h.uv;
  vec4 f = h.f;
  vec4 st = dkStage(uv, f);
  float th = dkThread(uv, f);
  float onMark = smoothstep(0.008, -0.004, f.x);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  float nl = sat(dot(h.wn, h.l));
  vec3 r = reflect(-h.v, h.wn);
  float n2 = vnoise(uv * 20.0);
  // The clay core and the wax on it (before the coat), or the cast once the mould is off.
  vec3 core = mix(hex(0x8a7d6c), hex(0xa09381), n2);
  vec3 wax = mix(hex(0x3a1a0a), hex(0x5e3216), th);
  float castOn = st.z * st.x;
  vec3 alb = mix(core, wax, st.x * (1.0 - st.z));
  float rough = mix(0.85, 0.3, st.x * (1.0 - st.z));
  float spec = mix(0.1, 0.6, st.x * (1.0 - st.z));
  // The coat: red-brown clay, fired black-brown.
  float fired = smoothstep(5.6, 7.0, u);
  vec3 coat = mix(mix(hex(0x7b5236), hex(0x8f6643), n2), mix(hex(0x2e1c12), hex(0x4a2e1c), n2), fired);
  // Cracks in the fired mould just before it is knocked off.
  vec4 v = voronoi(uv * 6.0 + 0.6 * vnoise(uv * 4.0 + 1.0));
  float crack = smoothstep(0.08, 0.02, v.w) * smoothstep(8.4, 9.2, u);
  coat *= 1.0 - 0.8 * crack;
  alb = mix(alb, coat, st.y);
  rough = mix(rough, 0.95, st.y);
  spec = mix(spec, 0.05, st.y);
  vec3 col = alb * (nl * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  col += spec * (fresnel(dot(h.wn, h.v), 0.04) * mix(studioDiffuse(r), studioEnv(r), (1.0 - rough) * (1.0 - rough)) * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * 2.0);
  // The cast: blackened raw brass, clay still in the hollows; rubbed bright on the high points, stroke by stroke.
  float rub = smoothstep(0.0, 0.05, sat((u - 10.6) / 3.2) - dkOrd(uv, f));
  float hi = smoothstep(0.3, 0.75, th) * mix(0.7, 1.0, onMark) * rub;
  vec3 base = mix(vec3(0.11, 0.075, 0.035) * (0.7 + 0.5 * n2), vec3(0.9, 0.64, 0.3) * (0.85 + 0.2 * n2), hi);
  base = mix(base, vec3(0.05, 0.035, 0.025), (1.0 - smoothstep(0.1, 0.5, th)) * 0.7 * (1.0 - hi));
  float mr = mix(0.7, 0.4, hi);
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), (1.0 - mr) * (1.0 - mr));
  vec3 metal = fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * (ggx(h.wn, h.v, h.l, mr) * 2.5 + nl * 0.5) * sh;
  col = mix(col, metal, castOn * (1.0 - st.y));
  // Firing: the coat glows from the kiln, fiercest just after the brass is poured, then drains to dull red.
  float heat = smoothstep(5.6, 6.6, u) * (1.0 - smoothstep(7.4, 8.8, u));
  float t = heat * (0.55 + 0.45 * vnoise(uv * 6.0 + uTime * 1.5)) * mix(1.0, 0.6, n2);
  col = col * (1.0 - 0.8 * heat * st.y) + dkGlow(t) * st.y + dkGlow(heat * 0.6) * crack * st.y;
  return col;
}
`,
  },
  {
    key: "bankura-horse",
    label: "Bankura Horse",
    category: "bengal",
    relief: 0.05,
    heroTime: 3.0,
    loop: "It turns slowly on the plinth, the light moving across it",
    glsl: /* glsl */ `
#define HAS_SURFACE
// The Bankura horse's vocabulary on a terracotta medallion: glossy fired orange-red clay, the mark raised and framed
// by incised lines, punched dots down the strokes like the horse's mane, a dotted collar round the edge.
float bhIncise(vec2 uv, vec4 f) {
  float off = smoothstep(0.012, 0.025, f.x);
  float r = length(uv), a = atan(uv.y, uv.x);
  float m = smoothstep(0.0065, 0.002, abs(f.x + 0.02));               // a line just inside every stroke
  m = max(m, smoothstep(0.0065, 0.0025, abs(r - 1.028)) * off);       // the collar: two rings...
  m = max(m, smoothstep(0.0065, 0.0025, abs(r - 1.1)));
  float cell = TAU / 64.0;
  float t = (fract(a / cell + 0.5) - 0.5) * cell * r;
  m = max(m, smoothstep(0.016, 0.01, length(vec2(t, r - 1.064))));    // ...with punched dots between
  // Mane dots down the middle of the thicker strokes.
  float md = smoothstep(-0.026, -0.033, f.x) * smoothstep(0.26, 0.16, abs(fract(a * max(r, 0.2) / 0.045) - 0.5));
  return max(m, md);
}
float surface(vec2 uv, vec4 f) { return 0.003 * (vnoise(uv * 28.0) - 0.5) - 0.008 * bhIncise(uv, f); }
vec3 shade(Hit h) {
  // Turning on the plinth: the key light swings slowly round the piece and back.
  float turn = sin(uTime * 0.42);
  setLight(h, lightAt(1.57 + 1.15 * turn, 0.5 - 0.12 * abs(turn)));
  vec2 uv = h.uv;
  vec3 clay = mix(hex(0xa8381a), hex(0xd25d28), fbm(uv * 2.6 + 1.0));
  // Fire-clouds: smoky black patches from the open kiln.
  float smoke = smoothstep(0.58, 0.82, fbm(uv * 1.5 + 9.0));
  clay = mix(clay, hex(0x2e1610), smoke * 0.55);
  float inc = bhIncise(uv, h.f);
  clay = mix(clay, hex(0x4a170a), inc * 0.7);
  clay *= 0.9 + 0.12 * h.h;
  clay = mix(clay, hex(0x7a2a12), h.edge * 0.3);
  // Bankura pieces are slipped and burnished before firing: a real gloss, broken by pores.
  float pore = smoothstep(0.75, 0.9, vnoise(uv * 70.0));
  return litDielectric(h, clay, mix(0.28, 0.6, sat(pore + inc)), mix(0.85, 0.3, pore));
}
`,
  },
  {
    key: "alpona",
    label: "Alpona",
    category: "bengal",
    relief: 0.0,
    light: 125,
    heroTime: 11.5,
    loop: "The alpona is painted stroke by stroke, then mopped away",
    glsl: /* glsl */ `
// Alpona: rice paste drawn with a fingertip on a polished red-oxide floor disc, as for Lakshmi puja. Soft blobby
// lines, a ring of fingertip dots, a ruled outer line, painted stroke by stroke; wet paste is grey, dry is chalk.
float apProgress() { float u = mod(uTime, 14.0); return u < 10.0 ? u / 10.0 : 1.0; }
float apFade() { return 1.0 - smoothstep(12.6, 14.0, mod(uTime, 14.0)); }
/** Lay one element (coverage c, reached by the finger at moment o) into the running coverage and wetness. */
void apAdd(inout float cov, inout float wet, float c, float o, float prog) {
  float on = c * smoothstep(o, o + 0.006, prog);
  if (on > cov) { cov = on; wet = 1.0 - sat((prog - o) * 7.0); }
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  vec4 f = h.f;
  float prog = apProgress();
  float wob = 0.012 * (vnoise(uv * 24.0) - 0.5) + 0.005 * (vnoise(uv * 70.0 + 3.0) - 0.5);
  float r = length(uv), a = atan(uv.y, uv.x);
  float ang = aroundMark(uv);
  float cov = 0.0, wet = 0.0;
  // The mark: the rim dash by dash, then ঋ and ভ top to bottom, then the smile left to right.
  float m = smoothstep(0.004, -0.004, f.x + wob - 0.003);
  float om;
  if (f.y <= min(f.z, f.w)) om = ang * 0.3;
  else if (f.z <= f.w) om = 0.6 + 0.14 * sat(uv.x * 0.6 + 0.5);
  else om = (uv.x < 0.0 ? 0.3 : 0.45) + 0.15 * sat((0.7 - uv.y) / 0.6);
  apAdd(cov, wet, m * step(0.0, h.side), om, prog);
  // A ring of fingertip dots outside the rim, big and small in turn.
  float cell = TAU / 48.0;
  float k = floor(a / cell + 0.5);
  float td = (a / cell - k) * cell * r;
  float rad = mod(k, 2.0) < 0.5 ? 0.016 : 0.009;
  apAdd(cov, wet, smoothstep(rad, rad - 0.006, length(vec2(td, r - 1.045)) + wob * 0.5), 0.75 + 0.13 * ang, prog);
  // A drawn outer line.
  apAdd(cov, wet, smoothstep(0.009, 0.004, abs(r - 1.088) + wob * 0.4), 0.88 + 0.12 * ang, prog);
  // Red-oxide floor: polished, mottled by the trowel, an old hairline crack or two.
  vec3 floorC = mix(hex(0x5e140b), hex(0x7d2414), fbm(uv * 2.0 + 3.0));
  floorC = mix(floorC, hex(0x4a0f08), 0.4 * smoothstep(0.55, 0.8, fbm(uv * 7.0 + 1.0)));
  vec4 v = voronoi(uv * 2.5 + 4.0);
  floorC *= 1.0 - 0.35 * smoothstep(0.02, 0.0, v.w);
  // Paste: grey and see-through while wet, chalk white and lumpy once dry.
  float dens = 0.78 + 0.22 * vnoise(uv * 16.0 + 5.0);
  vec3 paste = mix(hex(0xf3efe6), mix(floorC, vec3(0.72, 0.7, 0.65), 0.55), wet);
  float kk = cov * dens * apFade();
  vec3 alb = mix(floorC, paste, kk);
  return litDielectric(h, alb, mix(0.2, mix(0.92, 0.35, wet), kk), mix(0.9, mix(0.05, 0.5, wet), kk));
}
`,
  },
  {
    key: "shankha-pola",
    label: "Shankha Pola",
    category: "bengal",
    relief: 0.006,
    light: 135,
    heroTime: 3.4,
    loop: "A pearly sheen rolls across the shell",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Shankha-pola: a carved conch-shell bangle's white, layered and faintly pearly, with lac-red pola inlaid in the
// mark. A filed border of notches like the bangle's edge, and an iridescent sheen that rolls across in the loop.
float spLayers(vec2 uv) { return 0.5 + 0.5 * sin((length(uv) * 1.4 + uv.x * 0.3 + 0.35 * vnoise(uv * 2.5)) * 60.0); }
float surface(vec2 uv, vec4 f) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float band = smoothstep(1.0, 1.015, r) * (1.0 - smoothstep(1.105, 1.12, r));
  float s = band * 0.005 * (abs(sin(a * 60.0)) - 0.6);
  s -= 0.005 * smoothstep(0.006, 0.002, abs(r - 1.03));
  s += 0.0012 * spLayers(uv);
  // The seam where the lac meets the shell.
  return s - 0.004 * smoothstep(0.006, 0.0, abs(f.x));
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float lay = spLayers(uv);
  // Conch white: creamy growth layers, a little translucent.
  vec3 shell = mix(hex(0xe6dcc8), hex(0xf8f4eb), lay);
  shell = mix(shell, hex(0xd6c7a8), 0.22 * smoothstep(0.5, 0.85, fbm(uv * 3.0 + 4.0)));
  if (h.edge > 0.4) shell *= 0.82 + 0.18 * abs(sin(atan(h.p.y, h.p.x) * 90.0));
  // Lac: deep red resin, glossy.
  vec3 lac = mix(hex(0x8a0c14), hex(0xb0161c), vnoise(uv * 12.0));
  vec3 col = litDielectric(h, mix(shell, lac, h.h), mix(0.32, 0.14, h.h), mix(0.55, 1.0, h.h));
  // Shell glows a touch from within; lac glows red.
  col += mix(shell * 0.05 * studioDiffuse(h.wn), lac * 0.12, h.h);
  // The pearly sheen: a soft band rolling diagonally across the shell, tinted by thin-film colour from its layers.
  float s = fract(uTime * 0.15) * 4.8 - 2.4;
  vec3 rf = reflect(-h.v, h.wn);
  float band = exp(-pow((dot(uv, vec2(0.7, 0.7)) + 0.6 * dot(rf.xy, vec2(0.7, 0.7)) - s) / 0.28, 2.0));
  vec3 pearl = thinFilm(0.32 + 0.12 * lay, sat(dot(h.wn, h.v)));
  col += pearl * band * 0.55 * (0.6 + 0.4 * lay) * (1.0 - h.h);
  return col * (1.0 - 0.5 * smoothstep(0.006, 0.0, abs(h.f.x)));
}
`,
  },
  {
    key: "sindoor-alta",
    label: "Sindoor & Alta",
    category: "bengal",
    relief: 0.0,
    light: 130,
    heroTime: 10.2,
    loop: "Sindoor khela: a fingertip drags the mark through the powder, pinches are flicked, alta drops bloom into paste",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Sindoor khela on a brass thala heaped with sindoor. (0-5 s) a fingertip drags through the powder along each stroke
// of the mark, baring the brass and pushing ridges up either side; (5.2-8) pinches are taken and flicked, each
// puffing up and settling as dust; (8-11.5) drops of alta fall and bloom into the powder, turning it to a glossy
// crimson paste; (12.2-13.8) fresh sindoor is sifted over and the plate is full again.
#define SA_P 14.0
float saU() { return mod(uTime, SA_P); }
/** Order along the strokes in which the finger reaches a point (0..1). */
float saOrd(vec2 uv, vec4 f) {
  if (f.y <= min(f.z, f.w)) return aroundMark(uv) * 0.35;
  if (f.z <= f.w) return 0.75 + 0.25 * sat(uv.x * 0.62 + 0.5);
  vec2 q = uv - vec2(sign(uv.x) * 0.28, 0.36);
  return 0.35 + (uv.x < 0.0 ? 0.0 : 0.2) + 0.2 * fract(atan(q.y, q.x) / TAU + 0.25);
}
vec2 saPinchPos(int i) {
  if (i == 0) return vec2(-0.6, 0.12);
  if (i == 1) return vec2(0.62, 0.05);
  if (i == 2) return vec2(-0.2, -0.12);
  return vec2(0.28, -0.78);
}
vec2 saDropPos(int i) {
  if (i == 0) return vec2(-0.64, -0.3);
  if (i == 1) return vec2(0.66, -0.32);
  if (i == 2) return vec2(-0.3, -0.8);
  return vec2(0.05, 0.82);
}
/** x = groove (finger has bared the brass), y = ridge, z = pinch craters, w = refill. */
vec4 saDig(vec2 uv, vec4 f, float n) {
  float u = saU();
  float drag = smoothstep(0.0, 0.02, sat(u / 5.0) - saOrd(uv, f));
  float groove = smoothstep(0.012, -0.004, f.x) * drag;
  float ridge = exp(-pow((f.x - 0.022) / 0.012, 2.0)) * drag;
  float crater = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 d = uv - saPinchPos(i);
    crater = max(crater, smoothstep(0.065, 0.03, length(d) + 0.015 * n) * step(5.2 + 0.6 * float(i), u));
  }
  float refill = smoothstep(0.0, 0.3, (u - 12.2) / 1.5 - 0.5 * n);
  return vec4(groove, ridge, crater, refill) * vec4(vec3(1.0 - refill), 1.0);
}
/** x = alta paste amount, y = a fresh drop's bead height. */
vec2 saAlta(vec2 uv, float n) {
  float u = saU();
  float paste = 0.0, bead = 0.0;
  for (int i = 0; i < 4; i++) {
    float age = u - 8.0 - 0.8 * float(i);
    if (age < 0.0) continue;
    float d = length(uv - saDropPos(i));
    float R = 0.04 + 0.2 * sqrt(sat(age / 1.6));
    float a = atan(uv.y - saDropPos(i).y, uv.x - saDropPos(i).x);
    paste = max(paste, smoothstep(R, R - 0.03, d + 0.1 * (n - 0.5) + 0.025 * sin(a * 7.0 + float(i) * 2.0) * sat(age)));
    bead = max(bead, 0.016 * (1.0 - sat(age / 0.5)) * smoothstep(0.05, 0.0, d));
  }
  return vec2(paste, bead);
}
float surface(vec2 uv, vec4 f) {
  float r = length(uv);
  float n = vnoise(uv * 6.0);
  float lip = 0.012 * smoothstep(1.04, 1.09, r);
  float bed = 0.02 * smoothstep(1.05, 0.99, r);
  float grain = 0.003 * (vnoise(uv * 90.0) - 0.5);
  vec4 dg = saDig(uv, f, n);
  vec2 al = saAlta(uv, n) * (1.0 - dg.w);
  float powder = (bed + grain) * (1.0 - dg.x) * (1.0 - 0.7 * dg.z) + 0.008 * dg.y * smoothstep(1.0, 0.95, r);
  // Paste slumps and goes smooth.
  powder = mix(powder, (bed * 0.75 + 0.006 * dg.y) * (1.0 - dg.x), al.x) + al.y;
  return lip + powder;
}
/** Lighting sharing one shadow value. */
vec3 saDiel(Hit h, vec3 alb, float rough, float spec, float sh) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 diff = alb * (sat(dot(h.wn, h.l)) * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  vec3 refl = mix(studioDiffuse(r), studioEnv(r), (1.0 - rough) * (1.0 - rough));
  return diff + spec * (fresnel(dot(h.wn, h.v), 0.04) * refl * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * vec3(1.0, 0.96, 0.9) * 2.0);
}
vec3 saMetal(Hit h, vec3 base, float rough, float sh) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), (1.0 - rough) * (1.0 - rough));
  return fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
}
vec3 shade(Hit h) {
  float u = saU();
  vec2 uv = h.uv;
  vec4 f = h.f;
  float r = length(uv);
  float n = vnoise(uv * 6.0);
  vec4 dg = saDig(uv, f, n);
  vec2 al = saAlta(uv, n) * (1.0 - dg.w);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  // Settled dust from the flicked pinches, speckling everything near where each one landed.
  float dust = 0.0, puff = 0.0;
  for (int i = 0; i < 4; i++) {
    float age = u - 5.2 - 0.6 * float(i);
    if (age < 0.0) continue;
    vec2 land = saPinchPos(i) + vec2(0.12, 0.08) * (hash22(vec2(float(i), 3.0)) - 0.5) * 2.0;
    float d2 = dot(uv - land, uv - land);
    float pr = 0.08 + 0.32 * sat(age / 0.8);
    puff = max(puff, exp(-d2 / (pr * pr)) * (1.0 - sat(age / 1.3)));
    dust = max(dust, exp(-d2 / 0.06) * smoothstep(0.4, 1.0, age));
  }
  float speck = step(0.72, hash12(floor(uv * 140.0))) * dust * (1.0 - dg.w);
  // Brass where the finger has passed (and the lip).
  float bare = max(max(dg.x, smoothstep(1.04, 1.07, r)), dg.z * 0.8) * (1.0 - speck);
  vec3 brass = vec3(0.9, 0.66, 0.3) * (0.9 + 0.1 * sin(r * 260.0));
  vec3 metal = saMetal(h, brass, 0.22 + 0.12 * vnoise(uv * 16.0), sh);
  // Sindoor: vivid, dead matte, grainy; alta paste: deep crimson and wet.
  float g = vnoise(uv * 160.0);
  vec3 powder = mix(hex(0xd8261a), hex(0xf2501f), g) * (0.85 + 0.2 * n);
  vec3 paste = mix(hex(0x8a0618), hex(0xa50f1e), g);
  vec3 alb = mix(powder, paste, al.x);
  vec3 pc = saDiel(h, alb, mix(1.0, 0.12, al.x), mix(0.03, 1.0, al.x), sh) * mix(0.85 + 0.15 * g, 1.0, al.x);
  vec3 col = mix(pc, metal, bare);
  // The puffs: a soft red haze over the coin as each pinch is flicked.
  col = mix(col, hex(0xff8a5a), 0.85 * puff * (0.5 + 0.5 * vnoise(uv * 12.0 + uTime)));
  return col;
}
`,
  },
  {
    key: "jamdani-weave",
    label: "Jamdani Weave",
    category: "bengal",
    relief: 0.0,
    light: 120,
    heroTime: 1.8,
    loop: "The muslin breathes in a breeze",
    glsl: /* glsl */ `
#define HAS_SDF
// Jamdani: fine charcoal Dhaka muslin, stretched in a brass ring and lit from behind, so open you can see the light
// through it. The mark is woven in by hand as supplementary weft: thick, opaque floats laid on the loom grid, so
// every curve steps like a pixel. Zari on the rim and the border, butis over the ground.
float jdWave(vec2 p) {
  float pin = sat(1.0 - dot(p, p) / 1.12);
  return pin * (0.035 * sin(p.x * 2.2 + uTime * 1.3) * cos(p.y * 1.7 - uTime * 0.9) + 0.015 * sin(p.y * 3.1 + p.x * 1.2 + uTime * 2.1));
}
float jdHoop(vec3 p) { return sdBox2(vec2(length(p.xy) - 1.1, p.z), vec2(0.04, 0.07), 0.02); }
float materialSDF(vec3 p) {
  float cloth = max(length(p.xy) - 1.08, abs(p.z - jdWave(p.xy)) - 0.008) * 0.85;
  return min(cloth, jdHoop(p));
}
/** jd lighting sharing one shadow value. */
vec3 jdDiel(Hit h, vec3 alb, float rough, float spec, float sh) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 diff = alb * (sat(dot(h.wn, h.l)) * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  vec3 refl = mix(studioDiffuse(r), studioEnv(r), (1.0 - rough) * (1.0 - rough));
  return diff + spec * (fresnel(dot(h.wn, h.v), 0.04) * refl * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * vec3(1.0, 0.96, 0.9) * 2.0);
}
vec3 jdMetal(Hit h, vec3 base, float rough, float sh) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), (1.0 - rough) * (1.0 - rough));
  return fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
}
vec3 shade(Hit h) {
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  if (jdHoop(h.p) < 0.004) return jdMetal(h, vec3(0.88, 0.66, 0.34), 0.3, sh);
  // Face coordinates on the un-billowed cloth, so the motif stays put as it waves.
  float side = h.p.z - jdWave(h.p.xy) >= 0.0 ? 1.0 : -1.0;
  vec2 uv = side > 0.0 ? h.p.xy : vec2(-h.p.x, h.p.y);
  float px = 3.24 / min(uRes.x, uRes.y);
  float fineK = 1.0 - smoothstep(0.0035, 0.008, px);
  // Ground: plain-woven warp and weft, handspun, so the weft slubs.
  vec2 g = uv / 0.012;
  vec2 c = fract(g) - 0.5;
  float slub = vnoise(vec2(uv.x * 3.0, floor(g.y) * 0.37));
  float warpT = smoothstep(0.34, 0.16, abs(c.x));
  float weftT = smoothstep(0.3 + 0.12 * slub, 0.1, abs(c.y));
  float cover = mix(0.55, sat(warpT + weftT - warpT * weftT), fineK);
  // Supplementary weft: the mark sampled on the loom grid, so its edges step.
  vec2 bq = floor(uv / 0.024);
  vec2 cc = (bq + 0.5) * 0.024;
  vec4 fc = field(cc);
  float motif = step(fc.x, 0.004);
  // Butis over the ground: little diamond-flowers in a half-drop repeat.
  vec2 bt = vec2(mod(bq.x + mod(floor(bq.y / 10.0), 2.0) * 5.0, 10.0) - 5.0, mod(bq.y, 10.0) - 5.0);
  float bs = abs(bt.x) + abs(bt.y);
  float rc = length(cc);
  float buti = step(bs, 2.5) * step(0.5, abs(bs - 1.0)) * step(0.08, fc.x) * step(rc, 0.86);
  // The border: two zari lines with stepped teeth between, also on the grid.
  float teeth = step(rc - 1.03, 0.035 * (1.0 - 2.0 * abs(fract(atan(cc.y, cc.x) * 24.0 / TAU) - 0.5)));
  float paar = max(step(abs(rc - 1.02), 0.012), step(abs(rc - 1.07), 0.012)) + step(1.02, rc) * step(rc, 1.07) * teeth;
  paar = sat(paar) * step(1.005, rc) * step(rc, 1.085);
  float extra = max(max(motif, buti), paar);
  float zari = max(motif * step(fc.y, 0.004), paar);
  // The floats lie along the weft: a fat round thread in every row of a motif cell.
  float rowc = fract(uv.y / 0.012) - 0.5;
  float fl = smoothstep(0.5, 0.32, abs(rowc));
  float floatCov = extra * mix(0.92, 0.75 + 0.25 * fl, fineK);
  h.wn = normalize(h.wn + uRot * vec3(0.0, rowc * 1.2 * extra * fineK, 0.0));
  // Light from behind the hoop: the open weave lets it straight through, the threads glow with what they scatter.
  vec3 back = vec3(1.0, 0.86, 0.66) * 0.35 * exp(-dot(h.suv, h.suv) * 0.5);
  vec3 alb = mix(hex(0x2e2e30), hex(0xf6f2e8), floatCov * (1.0 - zari));
  float opaque = max(cover, floatCov);
  vec3 col = jdDiel(h, alb, 0.82, 0.12, sh) * opaque * 0.85 + back * (1.0 - opaque) * 0.8 + back * alb * opaque * 0.3;
  vec3 gold = jdMetal(h, vec3(0.95, 0.75, 0.4), 0.3, sh) * (0.75 + 0.25 * fl) + back * vec3(0.4, 0.3, 0.12) * 0.15;
  return mix(col, gold, zari * floatCov);
}
`,
  },
  {
    key: "patachitra-scroll",
    label: "Patachitra Scroll",
    category: "bengal",
    relief: 0.0,
    light: 130,
    heroTime: 11.8,
    loop: "A patua paints it: black outline in tapering strokes, colours dabbed in, gum varnish glinting as it dries",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Patachitra: a patua paints the mark on a disc of hand-made paper. (0-5.5 s) the brush lays the lamp-black outline
// in tapering, confident strokes: ঋ, ভ, the smile, then a flick for each rim dash, wet and glossy at the brush;
// (5.5-9) mineral and plant colours are dabbed in: alta red, turmeric yellow, leaf green; (9-12) a coat of bel gum is
// brushed over and glints in patches as it dries; (12.5-13.6) a fresh sheet is slid over for the next one.
#define PT_P 14.0
float ptU() { return mod(uTime, PT_P); }
float surface(vec2 uv, vec4 f) { return 0.0018 * (vnoise(uv * vec2(70.0, 12.0)) - 0.5) + 0.002 * (vnoise(uv * 6.0) - 0.5); }
/** The outline stroke a point belongs to: x = when the brush starts it, y = its duration, z = position along it 0..1. */
vec3 ptStroke(vec2 uv, vec4 f) {
  if (f.y <= min(f.z, f.w)) {
    float oct = aroundMark(uv) * 8.0;
    float k = floor(oct + 0.5);
    return vec3(0.75 + 0.03 * mod(k, 8.0), 0.026, sat(oct - k + 0.5));
  }
  if (f.z <= f.w) return vec3(0.56, 0.18, sat(uv.x * 0.62 + 0.5));
  vec2 q = uv - vec2(sign(uv.x) * 0.28, 0.36);
  return vec3(uv.x < 0.0 ? 0.0 : 0.29, 0.26, fract(atan(q.y, q.x) / TAU + 0.25));
}
vec3 shade(Hit h) {
  float u = ptU();
  vec2 uv = h.uv;
  vec4 f = h.f;
  float n = vnoise(uv * 20.0);
  // A fresh sheet slides over from the left at the end of the loop.
  float xs = mix(-1.25, 1.25, smoothstep(12.5, 13.6, u));
  float fresh = step(uv.x, xs);
  // Paper: hand-made, fibrous, faintly foxed.
  vec3 paper = mix(hex(0xd8c39a), hex(0xe8d7b0), vnoise(uv * 3.0 + 1.0));
  paper *= 0.92 + 0.08 * vnoise(uv * vec2(60.0, 9.0));
  vec3 col = paper;
  float rough = 0.85, spec = 0.08;
  float paint = (1.0 - fresh) * step(0.0, h.side);
  // Colour dabs: each region filled dab by dab (alta red ঋভ, turmeric smile, leaf-green rim), wet when just laid.
  float cp = sat((u - 5.5) / 3.5);
  vec4 v = voronoi(uv * 30.0);
  vec3 dabC; float st0;
  if (f.y <= min(f.z, f.w)) { dabC = hex(0x3f7a2e); st0 = 0.66; }
  else if (f.z <= f.w) { dabC = hex(0xe0a420); st0 = 0.42; }
  else { dabC = hex(0xc0182a); st0 = 0.0; }
  float tDab = st0 + v.z * 0.3;
  float dab = smoothstep(0.0, 0.02, cp - tDab) * smoothstep(0.002, -0.004, f.x + 0.004 * (n - 0.5)) * paint;
  float dabWet = dab * (1.0 - sat((cp - tDab) * 6.0));
  col = mix(col, dabC * (0.88 + 0.2 * v.x), dab);
  // The outline: brush pressure swells and thins with direction, tapers at both ends of each stroke and to a
  // point at the moving tip; the line is wet black right behind the brush.
  vec3 sk = ptStroke(uv, f);
  float prog = sat(u / 5.5);
  float tp = sk.x + sk.y * sk.z;
  vec2 g = fieldGrad(uv, 0);
  float press = 0.006 + 0.009 * abs(dot(g, vec2(0.6, 0.8)));
  float taper = mix(0.35, 1.0, pow(sin(PI * sk.z), 0.5));
  float tip = sqrt(sat((prog - tp) / (0.25 * sk.y)));
  float wdt = press * taper * tip;
  float line = smoothstep(wdt, wdt * 0.45, abs(f.x - 0.003 + 0.002 * (n - 0.5))) * step(tp, prog) * paint;
  float lineWet = line * (1.0 - sat((prog - tp) * 10.0));
  col = mix(col, hex(0x0c0a09), line);
  // Gum varnish: brushed on left to right, then drying in patches; each patch glints as it goes off.
  float vn = vnoise(uv * 5.0 + 9.0);
  float coat = smoothstep(0.0, 0.05, (u - 9.0) / 0.8 - (uv.x * 0.45 + 0.5)) * paint;
  float tDry = 10.0 + 1.6 * vn;
  float wetV = coat * (1.0 - smoothstep(tDry - 0.2, tDry + 0.2, u));
  float glint = coat * exp(-pow((u - tDry) * 4.0, 2.0)) * smoothstep(0.6, 0.9, vnoise(uv * 18.0 + 3.0));
  float streak = vnoise(vec2(uv.x * 4.0, uv.y * 70.0)) - 0.5;
  h.wn = normalize(h.wn + uRot * vec3(0.0, streak * 0.25 * wetV, 0.0));
  float wet = max(max(dabWet, lineWet), wetV);
  rough = mix(mix(0.85, 0.5, line), 0.08, wet);
  rough = mix(rough, 0.45, coat * (1.0 - wetV));
  spec = mix(mix(0.08, 0.3, line), 1.0, wet) + 0.25 * coat;
  col = litDielectric(h, col, rough, sat(spec));
  col += vec3(1.0, 0.95, 0.85) * glint * 0.9;
  // The edge of the new sheet throws a soft shadow on the old one.
  col *= 1.0 - 0.5 * exp(-max(uv.x - xs, 0.0) / 0.03) * (1.0 - fresh) * step(12.5, u);
  return col;
}
`,
  },
];
