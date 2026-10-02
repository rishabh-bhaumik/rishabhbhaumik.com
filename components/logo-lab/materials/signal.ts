import type { LogoMaterial } from "../types";

/** Tech and signal, continued: displays, fields and physical computing. Listed under Tech. */
export const SIGNAL: LogoMaterial[] = [
  {
    key: "e-ink",
    label: "E-ink",
    category: "tech",
    relief: 0.0,
    light: 135,
    heroTime: 3.5,
    loop: "A full refresh flashes black and white and wipes the ghosts",
    glsl: /* glsl */ `
// A round e-paper badge: grey electrophoretic "paper" behind a matte front, in a soft-touch plastic bezel.
// Between refreshes the last page ghosts through more and more; a full refresh flashes
// (invert, black, white, black, white, then the particles settle into the new image) and wipes them.
#define EINK_P 6.0
/** Ghost of the previous page: justified lines of words, set in the round screen. */
float einkGhostText(vec2 uv) {
  float row = floor((uv.y + 1.3) / 0.105);
  float ly = fract((uv.y + 1.3) / 0.105);
  float line = smoothstep(0.3, 0.38, ly) * (1.0 - smoothstep(0.7, 0.78, ly));
  float cx = uv.x * 6.5 + hash11(row) * 5.0;
  float word = step(0.12, hash12(vec2(row, floor(cx)))) * step(fract(cx), 0.8);
  float letter = step(0.3, hash12(vec2(floor(uv.x * 58.0), row)));
  // Lines are justified to the circle, like a round watch face of text.
  float yc = (row + 0.5) * 0.105 - 1.3;
  float halfW = sqrt(max(0.9 - yc * yc, 0.0));
  return line * word * letter * step(abs(uv.x), halfW);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float t = mod(uTime, EINK_P);
  float r = length(uv);
  float sd = r - 1.04;
  float screen = (1.0 - smoothstep(-0.003, 0.003, sd)) * step(0.0, h.side) * (1.0 - h.edge);
  // Capsule grain: each tiny cell switches on its own, so edges and flashes are speckled.
  float grain = hash12(floor(uv * 380.0));
  float cov = 1.0 - smoothstep(-0.01, 0.01, h.f.x);
  float ink = step(grain * 0.98 + 0.01, cov);
  // Ghosting builds up over the cycle; the refresh resets it.
  float ghost = einkGhostText(uv) * mix(0.03, 0.16, smoothstep(0.9, EINK_P, t));
  float dark = max(ink, ghost);
  if (t < 0.84) {
    float k = floor(t / 0.14);
    float fr = fract(t / 0.14);
    if (k < 0.5) dark = 1.0 - dark;
    else if (k < 1.5) dark = 1.0;
    else if (k < 2.5) dark = 0.0;
    else if (k < 3.5) dark = 1.0;
    else if (k < 4.5) dark = 0.0;
    else dark = ink * step(grain, fr * 1.25);
    // Particles never move all at once: mottle the flash frames.
    dark = sat(dark + (hash12(floor(uv * 380.0) + floor(t / 0.14) * 7.0) - 0.5) * 0.25);
  }
  vec3 paper = hex(0xbdbbb2) * (0.94 + 0.08 * vnoise(uv * 70.0) + 0.05 * (hash12(floor(uv * 380.0) + 17.0) - 0.5));
  vec3 disp = mix(paper, hex(0x262626), sat(dark));
  // The panel sits a hair below the bezel: a thin inner shadow.
  disp *= 0.75 + 0.25 * smoothstep(0.0, 0.04, -sd);
  // Bezel: soft-touch plastic with a moulded grip knurl round the outside.
  float knurl = 0.5 + 0.5 * sin(atan(uv.y, uv.x) * 120.0);
  vec3 bezel = hex(0x1b1b1d) * (0.9 + 0.2 * vnoise(uv * 120.0)) * (1.0 - 0.25 * knurl * h.edge);
  vec3 albedo = mix(bezel, disp, screen);
  return litDielectric(h, albedo, mix(0.55, 0.75, screen), mix(0.35, 0.18, screen));
}
`,
  },
  {
    key: "pcb",
    label: "PCB",
    category: "tech",
    relief: 0.012,
    light: 120,
    heroTime: 1.2,
    loop: "Current pulses travel the traces",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A round two-layer board, like a wearable module: green solder mask over copper. The glyphs and smile are
// copper pours under the mask, the rim dashes bare ENIG-gold pads, stitched with vias. Around them, 45-degree
// routing, a few 0603 parts, a silkscreen outline and castellated gold half-holes round the edge.
float pcbOct(vec2 q) { q = abs(q); return max(max(q.x, q.y), (q.x + q.y) * 0.7071); }
/** Background routing: a sparse truchet of chamfered traces on a 0.1 grid. x = distance to the centreline, y = a phase along it. */
vec2 pcbRoute(vec2 uv) {
  vec2 g = uv / 0.1;
  vec2 c = floor(g), r = fract(g) - 0.5;
  float hv = hash12(c + 7.0);
  if (hv < 0.38) return vec2(1.0, 0.0);
  if (hv > 0.69) r.x = -r.x;
  float d1 = abs(pcbOct(r - 0.5) - 0.5);
  float d2 = abs(pcbOct(r + 0.5) - 0.5);
  return vec2(min(d1, d2) * 0.1, c.x + c.y + r.x - r.y);
}
/** Where routing is allowed: clear of the mark and of the board edge. */
float pcbKeep(vec2 uv, vec4 f) {
  return smoothstep(0.06, 0.08, f.x) * (1.0 - smoothstep(1.0, 1.03, length(uv)));
}
/** One shadow, many finishes: dielectric (metal = 0) to metal (metal = 1). sh = the softShadow, computed once. */
vec3 pcbLit(Hit h, vec3 albedo, float rough, float spec, float metal, float sh) {
  vec3 r = reflect(-h.v, h.wn);
  float nv = dot(h.wn, h.v);
  float gl = (1.0 - rough) * (1.0 - rough);
  float g = ggx(h.wn, h.v, h.l, rough) * sh;
  vec3 die = albedo * (sat(dot(h.wn, h.l)) * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  die += spec * (fresnel(nv, 0.04) * mix(studioDiffuse(r), studioEnv(r), gl) * h.ao + g * vec3(1.0, 0.96, 0.9) * 2.0);
  vec3 met = fresnel3(nv, albedo) * mix(studioDiffuse(r) * 2.0, studioEnv(r), gl) * h.ao + albedo * g * 2.5;
  return mix(die, met, metal);
}
float surface(vec2 uv, vec4 f) {
  float tr = 1.0 - smoothstep(0.006, 0.009, pcbRoute(uv).x);
  return 0.004 * tr * pcbKeep(uv, f);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  vec4 f = h.f;
  float aa = 0.003;
  float keep = pcbKeep(uv, f);
  vec2 rt = pcbRoute(uv);
  float trace = (1.0 - smoothstep(0.006, 0.009, rt.x)) * keep;
  float markCu = 1.0 - smoothstep(-aa, aa, f.x);
  float pad = 1.0 - smoothstep(-aa, aa, f.y);
  float gold = pad;
  float silk = 0.0;
  // Stitching vias along the pour, and a few at loose ends of the routing.
  vec2 vc = (floor(uv / 0.15) + 0.5) * 0.15;
  float onPour = step(field(vc).x, -0.014) * step(0.3, hash12(vc * 9.1));
  vec2 rc = (floor(uv / 0.1) + 0.5) * 0.1;
  float loose = step(hash12(floor(uv / 0.1) + 7.0), 0.1) * keep;
  float dv = length(uv - vc), dr = length(uv - rc);
  gold = max(gold, max(onPour * (1.0 - smoothstep(0.019, 0.024, dv)), loose * (1.0 - smoothstep(0.018, 0.022, dr))));
  float hole = max(onPour * (1.0 - smoothstep(0.008, 0.011, dv)), loose * (1.0 - smoothstep(0.007, 0.009, dr)));
  // Castellated half-holes round the edge (object xy, so they run onto the side wall).
  float ang = atan(h.p.y, h.p.x);
  float ci = floor(ang / (TAU / 28.0) + 0.5);
  vec2 cpos = 1.14 * vec2(cos(ci * TAU / 28.0), sin(ci * TAU / 28.0));
  float dcs = length(h.p.xy - cpos);
  gold = max(gold, 1.0 - smoothstep(0.045, 0.05, dcs));
  hole = max(hole, (1.0 - smoothstep(0.022, 0.026, dcs)) * (1.0 - h.edge));
  // A few 0603 parts between the glyphs: black body, tinned end caps, a silkscreen courtyard.
  vec2 ccell = floor(uv / 0.3);
  vec2 cc = (ccell + 0.5) * 0.3 + (hash22(ccell) - 0.5) * 0.08;
  float hasPart = step(0.4, hash12(ccell + 3.0)) * step(0.17, field(cc).x) * step(length(cc), 0.85);
  vec2 q = uv - cc;
  if (hash12(ccell + 5.0) > 0.5) q = q.yx;
  float body = step(sdBox2(q, vec2(0.026, 0.018), 0.003), 0.0) * hasPart;
  float term = step(sdBox2(vec2(abs(q.x) - 0.036, q.y), vec2(0.01, 0.019), 0.002), 0.0) * hasPart;
  silk = max(silk, (1.0 - smoothstep(0.0025, 0.0045, abs(sdBox2(q, vec2(0.066, 0.034), 0.004)))) * hasPart);
  trace *= 1.0 - hasPart * step(sdBox2(q, vec2(0.08, 0.05), 0.0), 0.0);
  // Board outline and a pin-1 dot in silkscreen.
  silk = max(silk, 1.0 - smoothstep(0.003, 0.005, abs(length(uv) - 1.065)));
  silk = max(silk, 1.0 - smoothstep(0.012, 0.016, length(uv - vec2(-0.62, -0.78))));
  float cu = max(trace, markCu * (1.0 - pad));
  // Solder mask: dark green over bare laminate, a lighter yellow-green where copper lies under it.
  vec3 maskC = mix(hex(0x0a3a1a), hex(0x2f7a32), cu) * (0.9 + 0.14 * vnoise(uv * 24.0));
  // Blend the finishes per pixel, then light once.
  vec3 alb = maskC; float rough = 0.3, spec = 0.6, metal = 0.0;
  // The routed edge shows the FR-4 core in fine glass-weave layers.
  vec3 fr4 = mix(hex(0x9c9466), hex(0x6f6a44), 0.5 + 0.5 * sin(h.p.z * 320.0));
  alb = mix(alb, fr4, h.edge); rough = mix(rough, 0.7, h.edge); spec = mix(spec, 0.1, h.edge);
  float sk = silk * (1.0 - gold) * (1.0 - h.edge);
  alb = mix(alb, vec3(0.82, 0.83, 0.8), sk); rough = mix(rough, 0.75, sk); spec = mix(spec, 0.1, sk);
  alb = mix(alb, vec3(1.0, 0.76, 0.4), gold); rough = mix(rough, 0.3 + 0.12 * vnoise(uv * 90.0), gold); metal = gold;
  alb = mix(alb, hex(0x111111), body); rough = mix(rough, 0.4, body); spec = mix(spec, 0.4, body); metal *= 1.0 - body;
  alb = mix(alb, vec3(0.75, 0.75, 0.73), term); rough = mix(rough, 0.35, term); metal = max(metal, term);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 col = pcbLit(h, alb, rough, spec, metal, sh) * (1.0 - hole);
  // Current: packets of light running round the mark's pour and along a few traces.
  vec3 glowC = vec3(0.35, 1.0, 0.8);
  float ph = fract(aroundMark(uv) * 3.0 + length(uv) * 0.7 - uTime * 0.25);
  float z = (ph - 0.5) / 0.04;
  float pulse = exp(-z * z) * (1.0 - h.edge);
  col += glowC * pulse * markCu * 2.2;
  col += glowC * pulse * 0.35 * exp(-max(f.x, 0.0) * 45.0) * (1.0 - markCu);
  float phB = fract(rt.y * 0.35 - uTime * 0.9);
  float zb = (phB - 0.5) / 0.05;
  col += glowC * trace * exp(-zb * zb) * 1.4 * step(0.5, hash12(floor(uv / 0.1) + 1.0));
  return col;
}
`,
  },
  {
    key: "pin-art",
    label: "Pin Art",
    category: "tech",
    relief: 0.0,
    light: 135,
    heroTime: 4.6,
    loop: "A hand presses the mark through from behind; the frame is tipped and the pins slide back",
    glsl: /* glsl */ `
#define HAS_SDF
// A round pin-screen toy: a black ring frame holding a dense grid of steel pins. The loop is the toy's own
// story (9 s): an unseen hand presses in from behind (fingertips first, the press travelling down the fingers
// as they spread, then the palm drives the centre), pins at the edge of the press lag and settle unevenly; the
// hand withdraws and the impression holds; then the frame is tipped back and the pins slide home under gravity
// in a wave from the bottom, a few sticking, until it is set upright with a knock and pressed again.
#define PIN_S 0.042
#define PIN_R 0.0175
#define PIN_P 9.0
float pinPh() { return fract(uTime / PIN_P); }
/** The tip: the top of the frame leans back while the pins slide home. */
float pinTilt() { float ph = pinPh(); return 0.1 * smoothstep(0.6, 0.68, ph) * (1.0 - smoothstep(0.86, 0.94, ph)); }
vec3 pinFrame(vec3 p) { p.yz = rot2(-pinTilt()) * p.yz; return p; }
/** How far the pin at grid centre c stands out (z of its head); negative = no pin there. */
float pinHeight(vec2 c) {
  if (length(c) > 1.0) return -1.0;
  float shape = 1.0 - smoothstep(-0.02, 0.07, field(c).x);
  if (shape < 0.001) return 0.02;
  float ph = pinPh();
  float hs = hash12(c * 31.0), hs2 = fract(hs * 13.7 + 0.31);
  // The hand, from behind: palm low in the middle, four fingers pointing up and spreading.
  vec2 q = c - vec2(0.0, -0.25);
  float r = length(q);
  float rise = 1.0;
  if (ph < 0.46) {
    float spread = mix(0.22, 0.34, smoothstep(0.1, 0.3, ph));
    float x = (atan(q.y, q.x) - PI * 0.5) / spread + 1.5;
    float dk = abs(x - clamp(floor(x + 0.5), 0.0, 3.0)) * spread;
    // Fingertips touch first, the press runs down each finger; between the fingers fills last.
    float tFinger = 0.1 + 0.1 * (1.0 - sat(r / 1.0)) + 0.25 * sat(dk * r / 0.25);
    float tPalm = 0.2 + 0.1 * sat(r / 0.5);
    // The edge of the press lags.
    float ta = min(tFinger, tPalm) + 0.05 * (1.0 - shape) + 0.025 * hs;
    rise = smoothstep(ta, ta + 0.07, ph);
    rise = 1.0 - (1.0 - rise) * (1.0 - rise);
  }
  // The palm pushes the centre deepest; pins on the shoulders of the press settle at uneven heights.
  float depth = (0.8 + 0.2 * exp(-r * r * 4.0)) * mix(0.55 + 0.55 * hs2, 1.0, shape);
  // The hand withdraws: a few pins ease back a hair.
  depth *= 1.0 - 0.05 * smoothstep(0.4, 0.44, ph) * hs2;
  // Tipped: the pins slide home in a wave from the bottom, a few stick until the frame is knocked upright.
  float tb = 0.62 + 0.18 * sat((c.y + 1.0) * 0.5) + 0.02 * hs;
  float slide = smoothstep(tb, tb + 0.05, ph);
  slide *= slide * mix(1.0, 0.6, step(hs2, 0.06));
  slide = mix(slide, 1.0, smoothstep(0.94, 0.97, ph));
  return 0.02 + 0.2 * shape * depth * rise * (1.0 - slide);
}
float pinOne(vec3 p, vec2 c) {
  float hz = pinHeight(c);
  if (hz < 0.0) return 1.0;
  vec2 r = p.xy - c;
  float head = length(vec3(r, p.z - hz)) - PIN_R;
  float zc = hz * 0.5, hl = hz * 0.5;
  float shaft = max(length(r) - 0.0055, abs(p.z - zc) - hl);
  return min(head, shaft);
}
float materialSDF(vec3 p) {
  p = pinFrame(p);
  float rr = length(p.xy);
  float outer = rr - 1.14;
  float inner = rr - 1.035;
  // The ring frame (rounded), and the back plate the pins slide through.
  vec2 fw = vec2(max(outer, -inner) + 0.02, abs(p.z + 0.02) - 0.08 + 0.02);
  float frame = min(max(fw.x, fw.y), 0.0) + length(max(fw, 0.0)) - 0.02;
  float plate = max(outer, abs(p.z + 0.04) - 0.04);
  float d = min(frame, plate);
  if (inner > 0.03) return min(d, inner);
  // No pin is out before the press or after the reset: the field is flat then.
  float ph = pinPh();
  float zTop = 0.0375 + 0.21 * smoothstep(0.08, 0.12, ph) * (1.0 - smoothstep(0.95, 0.975, ph));
  if (p.z > zTop + 0.02) return min(d, p.z - zTop);
  // Away from the mark every pin is at rest (heads no higher than z = 0.0375), and a raised pin is at
  // least (fx - 0.07 - head) away sideways: skip the per-pin work while that bound is generous.
  float fx = field(p.xy).x;
  float lb = min(p.z - 0.0375, fx - 0.09);
  if (lb > PIN_S - PIN_R) return min(d, lb);
  // Well clear of the mark every nearby pin is identical and at rest: the nearest cell's pin is exact.
  if (fx > 0.11 && rr < 0.97) {
    vec2 r = p.xy - (floor(p.xy / PIN_S) + 0.5) * PIN_S;
    return min(d, min(length(vec3(r, p.z - 0.02)) - PIN_R, max(length(r) - 0.0055, abs(p.z - 0.01) - 0.01)));
  }
  // Only the four nearest pins can be closer than this: every other one is at least a cell away.
  vec2 c0 = (floor(p.xy / PIN_S - 0.5) + 0.5) * PIN_S;
  float pins = PIN_S - PIN_R;
  pins = min(pins, pinOne(p, c0));
  pins = min(pins, pinOne(p, c0 + vec2(PIN_S, 0.0)));
  pins = min(pins, pinOne(p, c0 + vec2(0.0, PIN_S)));
  pins = min(pins, pinOne(p, c0 + vec2(PIN_S)));
  return min(d, pins);
}
/** A short shadow march: the pins only shade their neighbours, so 10 steps over 0.45 is plenty. */
float pinShadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.01;
  for (int i = 0; i < 10; i++) {
    float d = sceneSDF(ro + rd * t);
    res = min(res, 10.0 * d / t);
    t += clamp(d, 0.015, 0.09);
    if (res < 0.01 || t > 0.45) break;
  }
  return sat(res);
}
vec3 shade(Hit h) {
  // A raking light so the impression throws shadows across the pin field.
  setLight(h, lightAt(2.3, 0.68));
  float sh = pinShadow(h.p + h.n * 0.004, h.lo);
  vec3 r = reflect(-h.v, h.wn);
  vec3 fp = pinFrame(h.p);
  bool isFrame = length(fp.xy) > 1.03 || fp.z < 0.002;
  vec2 c = (floor(fp.xy / PIN_S) + 0.5) * PIN_S;
  vec3 steel = vec3(0.6, 0.61, 0.63) * (0.85 + 0.2 * hash12(c * 7.3));
  // Pins that have travelled catch the light; the field at rest sits in the frame's shade.
  float proud = smoothstep(0.03, 0.12, fp.z);
  if (isFrame) {
    // Black moulded plastic.
    vec3 al = hex(0x0e0e10);
    vec3 col = al * (sat(dot(h.wn, h.l)) * sh * 1.6 + studioDiffuse(h.wn) * h.ao);
    return col + 0.5 * (fresnel(dot(h.wn, h.v), 0.04) * mix(studioDiffuse(r), studioEnv(r), 0.42) * h.ao + ggx(h.wn, h.v, h.l, 0.35) * sh * 2.0);
  }
  // Steel, as litMetal, with the short shadow.
  float rough = 0.18 + 0.12 * hash12(c * 3.1);
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), (1.0 - rough) * (1.0 - rough));
  vec3 col = fresnel3(dot(h.wn, h.v), steel) * env * h.ao + steel * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
  return col * mix(0.55, 1.0, proud);
}
`,
  },
  {
    key: "voxel",
    label: "Voxel",
    category: "tech",
    relief: 0.0,
    light: 135,
    heroTime: 4.0,
    loop: "The voxel coin builds itself cube by cube, holds, then falls apart",
    glsl: /* glsl */ `
#define HAS_SDF
// A voxel coin, like a pickup in a block game: a pixelated disc of slate-violet cubes with the mark built
// on top in bevelled cubes (rim in gold, smile in coral, glyphs in cream). In the loop the base rises in
// from below, the mark drops in cube by cube around the ring, holds, then it all comes apart again.
#define VOX 0.045
float voxPhase() { return fract(uTime / 8.0); }
/** Presence 0..1 of a cube at cell centre c on layer l (0 = mark, 1 = base), and its z flight offset o. */
float voxAlive(vec2 c, float l, out float o) {
  float ph = voxPhase();
  float del = l > 0.5 ? 0.06 * length(c) + 0.02 * hash12(c * 7.0) : 0.08 + 0.12 * aroundMark(c) + 0.025 * hash12(c * 13.0);
  float a1 = smoothstep(del, del + 0.11, ph);
  float a2 = 1.0 - smoothstep(0.68 + del * 0.9, 0.79 + del * 0.9, ph);
  // Base cubes rise from below and sink back; mark cubes drop in from above and lift away.
  float dir = l > 0.5 ? -1.0 : 1.0;
  o = dir * (1.0 - a1 * a2) * 0.22;
  return a1 * a2;
}
float voxBox(vec3 q, float a) {
  float b = VOX * 0.5 * a - 0.0015;
  float rr = min(0.005, max(b, 0.0));
  vec3 w = abs(q) - vec3(max(b - rr, 0.0));
  return length(max(w, 0.0)) + min(max(w.x, max(w.y, w.z)), 0.0) - rr;
}
float voxCell(vec3 p, vec2 c, bool markNear) {
  float d = 1.0;
  float o;
  if (length(c) < 1.1) {
    float a = voxAlive(c, 1.0, o);
    if (a > 0.02) d = voxBox(p - vec3(c, -0.5 * VOX + o), a);
  }
  if (markNear && field(c).x < 0.012) {
    float a = voxAlive(c, 0.0, o);
    if (a > 0.02) d = min(d, voxBox(p - vec3(c, 0.5 * VOX + o), a));
  }
  return d;
}
float materialSDF(vec3 p) {
  // While the model holds (no cube in flight) it spans exactly one layer either side of z = 0.
  float ph = voxPhase();
  float fly = (ph > 0.34 && ph < 0.68) ? 0.0 : 0.23;
  float zb = abs(p.z) - VOX - fly;
  if (zb > 0.02) return zb;
  // Lower bounds: mark cubes sit only on cells on the mark; base cubes only in the disc and below z = 0.
  float fx = field(p.xy).x;
  float markB = max(fx - 0.045, p.z - VOX - fly);
  float baseB = max(max(p.z, -p.z - VOX - fly), length(p.xy) - 1.14);
  float lb = min(markB, baseB);
  if (lb > 0.5 * VOX) return lb;
  bool near = fx < 0.09;
  vec2 c0 = (floor(p.xy / VOX - 0.5) + 0.5) * VOX;
  float d = 0.5 * VOX;
  d = min(d, voxCell(p, c0, near));
  d = min(d, voxCell(p, c0 + vec2(VOX, 0.0), near));
  d = min(d, voxCell(p, c0 + vec2(0.0, VOX), near));
  d = min(d, voxCell(p, c0 + vec2(VOX), near));
  return d;
}
vec3 shade(Hit h) {
  vec3 pin = h.p - h.n * 0.006;
  vec2 c = (floor(pin.xy / VOX) + 0.5) * VOX;
  vec4 f = field(c);
  vec3 base = hex(0x3a2f6e);
  if (pin.z > 0.0 && f.x < 0.012) {
    base = hex(0xf3ead8);
    if (f.y <= min(f.z, f.w)) base = hex(0xffc23d);
    else if (f.z <= f.w) base = hex(0xff7a59);
  }
  base *= 0.88 + 0.16 * hash13(vec3(c, floor(pin.z / VOX)) * 11.0);
  return litDielectric(h, base, 0.42, 0.35);
}
`,
  },
  {
    key: "wireframe",
    label: "Wireframe",
    category: "tech",
    relief: 0.05,
    light: 135,
    heroTime: 5.4,
    loop: "The coin is modelled live: primitive, edge loops, extrude, bevel, subdivide, render, then Ctrl+Z back",
    glsl: /* glsl */ `
#define HAS_SDF
// Modelling the coin live in a 3D viewport (14 s):
//  0.00  a 16-sided cylinder primitive, its cap a triangle fan;
//  0.08  edge loops are inserted across the cap, one after another, into a quad grid;
//  0.26  the mark is extruded face by face: faces turn orange as they are selected, then pull up
//        (the rim first, then the glyphs, then the smile);
//  0.52  a bevel rounds every extruded edge (new loops appear just inside each top face);
//  0.62  subdivision: two levels, the 16-gon goes round and the blocky mark smooths into the real relief;
//  0.76  the wire overlay fades out to a shaded viewport render;
//  0.88  undo history rewinds in nine fast Ctrl+Z steps back to the primitive.
#define WF_G 20.0
#define WF_P 14.0
/** The modelling clock: forward to 0.88, then back in discrete undo steps. */
float wfStage() {
  float ph = fract(uTime / WF_P);
  if (ph < 0.88) return ph;
  float k = floor((ph - 0.88) / 0.12 * 9.0);
  return 0.86 * (1.0 - (k + 1.0) / 9.0);
}
/** A regular n-gon of circumradius COIN_R, vertices at (k + 0.5) * TAU / n. */
float wfPoly(vec2 p, float n) {
  float sector = TAU / n;
  float l = mod(atan(p.y, p.x) + 0.5 * sector, sector) - 0.5 * sector;
  return length(p) * cos(l) - COIN_R * cos(PI / n);
}
/** When the face at cell c is selected (its extrusion follows). Rim, then glyphs, then smile. */
float wfSel(vec2 c, vec4 f) {
  float part = f.y <= min(f.z, f.w) ? 0.0 : (f.w <= f.z ? 1.0 : 2.0);
  float ord = part == 0.0 ? aroundMark(c) : (part == 1.0 ? sat(0.5 - c.y * 0.6 + c.x * 0.15) : sat(c.x * 0.6 + 0.5));
  return 0.26 + 0.075 * part + 0.06 * ord;
}
float wfExt(float s, float ts) { float e = smoothstep(ts + 0.02, ts + 0.05, s); return e * e * (3.0 - 2.0 * e); }
/** One extruded face: a column on cell c, rounded by the bevel. */
float wfColumn(vec3 p, vec2 c, float s, float bev) {
  vec4 f = field(c);
  if (f.x > 0.0) return 1.0;
  float e = wfExt(s, wfSel(c, f));
  if (e < 0.01) return 1.0;
  float hgt = abs(uRelief) * e;
  float hb = 0.5 / WF_G;
  float rb = 0.011 * bev;
  vec3 q = p - vec3(c, COIN_T + hgt * 0.5 - 0.005);
  vec3 w = abs(q) - vec3(hb - rb, hb - rb, hgt * 0.5 + 0.005 - rb);
  return length(max(w, 0.0)) + min(max(w.x, max(w.y, w.z)), 0.0) - rb;
}
float materialSDF(vec3 p) {
  float s = wfStage();
  float bev = smoothstep(0.52, 0.58, s);
  float sub = smoothstep(0.62, 0.7, s);
  float d2 = mix(wfPoly(p.xy, 16.0), length(p.xy) - COIN_R, sub);
  float R = mix(0.002, COIN_BEVEL, max(bev * 0.5, sub));
  vec2 w = vec2(d2 + R, abs(p.z) - COIN_T + R);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - R;
  if (p.z < 0.0) return slab;
  float fx = field(p.xy).x;
  float onFace = smoothstep(COIN_T * 0.35, COIN_T, p.z);
  float dS = slab - abs(uRelief) * (1.0 - smoothstep(-RELIEF_W, RELIEF_W, fx)) * onFace;
  if (sub > 0.999) return dS;
  // The blocky extrusions: only the four nearest columns can beat half a cell, and none stand off the mark.
  float dB = slab;
  float lb = max(fx - 0.036, p.z - COIN_T - abs(uRelief));
  if (lb > 0.5 / WF_G) dB = min(dB, lb);
  else if (s > 0.27) {
    vec2 c0 = (floor(p.xy * WF_G - 0.5) + 0.5) / WF_G;
    float cols = 0.5 / WF_G;
    cols = min(cols, wfColumn(p, c0, s, bev));
    cols = min(cols, wfColumn(p, c0 + vec2(1.0 / WF_G, 0.0), s, bev));
    cols = min(cols, wfColumn(p, c0 + vec2(0.0, 1.0 / WF_G), s, bev));
    cols = min(cols, wfColumn(p, c0 + vec2(1.0 / WF_G), s, bev));
    dB = min(dB, cols);
  }
  return mix(dB, dS, sub);
}
float wfLine(float d, float fw) { return (1.0 - smoothstep(0.3 * fw, fw, d)) * sat(1.4 - fw * 3.0); }
vec3 shade(Hit h) {
  float s = wfStage();
  float loops = smoothstep(0.08, 0.25, s);
  float bev = smoothstep(0.52, 0.58, s);
  float sub = smoothstep(0.62, 0.7, s);
  float rnd = smoothstep(0.76, 0.84, s);
  vec2 uv = h.p.xy;
  float r = length(uv);
  float side = step(0.5, h.edge);
  float coinSide = side * step(COIN_R - 0.04, r);
  float top = step(0.0, h.p.z) * (1.0 - side);
  float pix = h.t * 0.736 / min(uRes.x, uRes.y) / max(abs(dot(h.wn, h.v)), 0.25);
  // The primitive: a triangle fan on the cap, vertical edges round the side, the cap's rim edge.
  float sector = TAU / 16.0;
  float av = mod(atan(uv.y, uv.x) - 0.5 * sector, sector);
  float da = min(av, sector - av);
  float fan = wfLine(r * sin(da), pix) * top * (1.0 - loops) * (1.0 - sub);
  float vEdge = wfLine(COIN_R * da, pix) * coinSide * (1.0 - sub);
  float d2 = mix(wfPoly(uv, 16.0), r - COIN_R, sub);
  float rimE = max(wfLine(-d2, pix) * top, wfLine(COIN_T - abs(h.p.z), pix) * coinSide);
  // Edge loops, slid in one by one: columns first, then rows.
  vec2 g = uv * WF_G;
  vec2 gi = floor(g + 0.5);
  vec2 dl = abs(g - gi);
  float fwG = pix * WF_G;
  float ox = sat((gi.x / WF_G + 1.14) / 2.28), oy = sat((1.14 - gi.y / WF_G) / 2.28);
  float lx = step(ox, loops * 2.0), ly = step(oy, loops * 2.0 - 1.0);
  float grid = max(wfLine(dl.x, fwG) * lx, wfLine(dl.y, fwG) * ly) * (1.0 - sub);
  // Which face we are on, and its state.
  vec3 pin = h.p - h.n * 0.004;
  vec2 c = (floor(pin.xy * WF_G) + 0.5) / WF_G;
  vec4 fc = field(c);
  float onCell = step(fc.x, 0.0);
  float ts = wfSel(c, fc);
  float selected = onCell * step(ts, s) * (1.0 - smoothstep(0.5, 0.53, s)) * (1.0 - sub);
  float colTop = onCell * step(COIN_T + 0.004, h.p.z) * (1.0 - side);
  float colWall = side * (1.0 - coinSide);
  // Column walls: their vertical corner edges and top rim.
  float corner = wfLine(max(dl.x, dl.y), fwG) * colWall;
  float hgt = abs(uRelief) * wfExt(s, ts);
  float topRim = wfLine(abs(h.p.z - COIN_T - hgt), pix * 1.5) * colWall;
  // The bevel's new loops, just inside each extruded face.
  float bevL = wfLine(abs(min(0.5 - dl.x, 0.5 - dl.y) - 0.2), fwG) * bev * colTop * (1.0 - sub);
  // Subdivision: a denser cage over the smoothed surface (level 1, then level 2).
  float gS = WF_G * 2.0 * (1.0 + smoothstep(0.66, 0.67, s));
  vec2 gs = uv * gS;
  float fS = pix * gS;
  vec2 ds = abs(gs - floor(gs + 0.5));
  float subW = max(wfLine(ds.x, fS), wfLine(ds.y, fS)) * top * sub;
  float wire = max(max(max(fan, vEdge), max(rimE, grid)), max(max(corner, topRim), max(bevL, subW)));
  wire *= 1.0 - rnd;
  // Viewport solid shading, faceted by the mesh normals.
  float nl = sat(dot(h.wn, h.l));
  vec3 face = vec3(0.05, 0.055, 0.065) * (0.25 + 0.75 * nl) + vec3(0.02) * pow(sat(dot(reflect(-h.l, h.wn), h.v)), 16.0);
  // Selected faces go orange; once pulled up they catch the light brighter than the cap.
  float pulled = wfExt(s, ts);
  face = mix(face, vec3(0.32, 0.12, 0.02) * (0.4 + 0.6 * nl) * mix(0.55, 1.25, pulled), selected * 0.85);
  vec3 wireC = mix(vec3(0.55, 0.62, 0.7), vec3(1.0, 0.55, 0.12), selected);
  vec3 col = face + wireC * wire * 0.8;
  // The final render: a satin silver coin.
  if (rnd > 0.001) col = mix(col, litMetal(h, vec3(0.86, 0.86, 0.88), 0.26), rnd);
  return col;
}
`,
  },
  {
    key: "datamosh",
    label: "Glitch / Datamosh",
    category: "tech",
    relief: 0.0,
    light: 135,
    heroTime: 3.4,
    loop: "A dropped keyframe: the last scene's pan smears onto the mark, then an I-frame decodes it clean block by block",
    glsl: /* glsl */ `
// A round display playing a datamoshed clip, decoded at 24 fps (6 s, 144 frames):
//  frames 0-16   the previous shot: a slow pan across hills at dusk;
//  frame 17      cut to the mark, but its I-frame has been dropped, so the P-frames that follow are applied
//                to the dusk picture: every 16x16 macroblock keeps sliding along the pan's motion vector
//                (each block's estimate a little off), the content tears at block seams, goes blocky, and
//                the new shot's residuals bleed the mark in as ghosted, smeared luma in the old colours;
//  frame 108     a keyframe lands and decodes in coding order, raster scan of macroblocks, top-left first;
//  then the clean picture holds until the next cut.
#define DM_B 0.13
#define DM_PAN 0.0075
/** The clean new shot: the mark in warm white on a deep gradient. */
vec3 moshImage(vec2 uv) {
  vec4 f = field(uv);
  vec3 bg = mix(hex(0x14062e), hex(0x0a3b5c), sat(0.5 + 0.4 * uv.y + 0.2 * uv.x));
  vec2 o = uv - vec2(-0.6, 0.5);
  bg += hex(0x4100cf) * 0.6 * exp(-dot(o, o) * 1.5);
  float m = 1.0 - smoothstep(-0.008, 0.008, f.x);
  float glow = exp(-max(f.x, 0.0) * 18.0) * 0.25;
  return bg + vec3(1.0, 0.9, 0.78) * (m * 1.6 + glow);
}
/** The previous shot: dusk over a ridge of hills, the sun low. */
vec3 dmPrev(vec2 uv) {
  vec3 sky = mix(hex(0xff9a3c), hex(0x3a1a5e), sat(uv.y * 0.6 + 0.4));
  vec2 so = uv - vec2(0.9, 0.12);
  sky += vec3(1.0, 0.85, 0.5) * (1.0 - smoothstep(0.2, 0.23, length(so))) * 1.2;
  float hill = -0.25 + 0.25 * vnoise(vec2(uv.x * 1.6, 3.0)) + 0.06 * vnoise(vec2(uv.x * 6.0, 7.0));
  float land = 1.0 - smoothstep(hill - 0.01, hill + 0.01, uv.y);
  return mix(sky, hex(0x1c0f24) * (0.8 + 0.4 * vnoise(uv * 8.0)), land);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float n = mod(floor(uTime * 24.0), 144.0);
  vec2 bc = floor(uv / DM_B);
  vec3 col;
  if (n < 17.0) {
    col = dmPrev(uv + vec2(n * DM_PAN, 0.0));
  } else {
    float k = n - 16.0;
    // The pan's motion vector, as each block estimated it.
    vec2 mv = vec2(DM_PAN, 0.0) + (hash22(bc + 3.0) - 0.5) * vec2(0.006, 0.004);
    vec2 q = uv + mv * k;
    // Prediction error piles up: blocks lose detail to their 4x4 sub-blocks.
    float sb = DM_B * 0.25;
    q = mix(q, (floor(q / sb) + 0.5) * sb, sat(k / 50.0) * step(0.4, hash12(bc + 7.0)));
    vec2 base = vec2(16.0 * DM_PAN, 0.0);
    vec3 old = dmPrev(q + base) * 0.5 + dmPrev(q - mv * 2.0 + base) * 0.3 + dmPrev(q - mv * 4.0 + base) * 0.2;
    // Residuals of the new shot: its edges arrive first, then its luma, smeared back along the vectors.
    vec3 mk = moshImage(uv) * 0.6 + moshImage(uv - mv * 3.0) * 0.4;
    float bleed = sat(k / 70.0);
    float edge = exp(-abs(field(uv - mv * 2.0).x) * 40.0) * sat(k / 10.0);
    col = old * (1.0 - 0.45 * bleed) + old * (luma(mk) * 1.4 * bleed) + mix(old, vec3(1.0), 0.5) * edge * 0.5;
    // The keyframe: macroblocks decode clean in raster order, about 30 a frame.
    if (n >= 108.0) {
      float idx = floor((1.2 - uv.y) / DM_B) * 19.0 + floor((uv.x + 1.2) / DM_B);
      if (idx < (n - 107.0) * 30.0) col = moshImage(uv);
    }
  }
  // The panel: a faint RGB stripe and a glass front, in a black bezel ring.
  vec2 pg = fract(h.uv * 160.0);
  vec3 sub = vec3(step(pg.x, 0.333), step(0.333, pg.x) * step(pg.x, 0.666), step(0.666, pg.x));
  col *= mix(vec3(1.0), sub * 2.4, 0.04);
  float screen = (1.0 - h.edge) * step(0.0, h.side) * (1.0 - smoothstep(1.045, 1.055, length(h.uv)));
  float fr = fresnel(dot(h.wn, h.v), 0.04);
  vec3 glass = col * 0.9 + studioEnv(reflect(-h.v, h.wn)) * fr * 0.6;
  if (screen > 0.999) return glass;
  return mix(litDielectric(h, hex(0x0c0c0e), 0.4, 0.4), glass, screen);
}
`,
  },
  {
    key: "liquid-metal",
    label: "Liquid Metal",
    category: "tech",
    relief: 0.05,
    light: 135,
    heroTime: 1.0,
    loop: "Ripples wobble through the mercury",
    glsl: /* glsl */ `
#define HAS_SDF
// A coin of mercury: a fat, round-shouldered disc of liquid chrome with the mark welling up out of it on soft
// shoulders, perfectly mirror-bright, with wobbles and ripples running through as if the table were tapped.
float lmWaves(vec2 p) {
  float t = uTime;
  float w = 0.006 * sin(dot(p, vec2(0.8, 0.6)) * 13.0 - t * 3.1);
  w += 0.005 * sin(dot(p, vec2(-0.5, 0.86)) * 17.0 - t * 2.3);
  // A drop every 3 s: a ring that spreads out and dies away before the next.
  float tp = fract(t / 3.0), k = floor(t / 3.0);
  vec2 c = vec2(0.35 * sin(k * 2.7), 0.3 * cos(k * 1.9));
  float r = length(p - c);
  float front = tp * 1.4;
  w += 0.012 * sin(r * 30.0 - tp * 22.0) * exp(-r * 2.5) * (1.0 - tp) * (1.0 - smoothstep(front - 0.05, front + 0.05, r));
  return w;
}
float materialSDF(vec3 p) {
  // A pool with a deep meniscus: big rounded edge.
  float R = 0.07, T = 0.09;
  vec2 w = vec2(length(p.xy) - 1.12 + R, abs(p.z) - T + R);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - R;
  // The mark wells up from a wobbling surface, sampled through a slow warp.
  vec2 q = p.xy + 0.012 * vec2(sin(p.y * 6.0 + uTime * 1.7), cos(p.x * 5.0 - uTime * 1.3));
  float m = 1.0 - smoothstep(-0.035, 0.035, field(q).x);
  float front = smoothstep(0.02, 0.08, p.z);
  float d = slab - (uRelief * m + lmWaves(p.xy)) * front;
  return d * 0.8;
}
/** The studio plus a dim room and table, so the chrome has something to mirror. */
vec3 lmEnv(vec3 r) {
  vec3 c = studioEnv(r);
  c += vec3(0.32, 0.33, 0.36) * 0.35 * smoothstep(-0.05, 0.25, r.y) * (1.0 - smoothstep(0.4, 0.95, r.y));
  c += vec3(0.5, 0.45, 0.4) * 0.25 * smoothstep(-0.7, -0.15, r.y) * (1.0 - smoothstep(-0.12, -0.02, r.y));
  return c;
}
vec3 shade(Hit h) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 base = vec3(0.78, 0.79, 0.82);
  vec3 f = fresnel3(dot(h.wn, h.v), base);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  return f * lmEnv(r) * (0.4 + 0.6 * h.ao) + base * ggx(h.wn, h.v, h.l, 0.06) * sh * 3.0;
}
`,
  },
  {
    key: "ferrofluid",
    label: "Ferrofluid",
    category: "tech",
    relief: 0.0,
    light: 135,
    heroTime: 4.4,
    loop: "A magnet under the plate drags a crest of spikes along each stroke, then is pulled away and the fluid slumps back",
    glsl: /* glsl */ `
#define HAS_SDF
// Ferrofluid lying in mark-shaped channels cut into a brushed steel coin, with a magnet moving underneath
// (12 s). The magnet traces each stroke in turn: once round the rim, then down the ঋ, across the ভ, along the
// smile. Spikes grow where its field is strongest, lean towards it and merge or split as it passes; behind it
// the fluid bunches up along the channel. Then the magnet is pulled away: the spikes collapse into a glossy
// puddle that spills over the steel and slowly drains back into the channels.
#define FF_S 0.075
#define FF_P 12.0
float ffPh() { return fract(uTime / FF_P); }
/** Where the magnet is (logo units) at loop phase ph. */
vec2 ffPath(float ph) {
  if (ph < 0.3) {
    float a = PI * 0.5 - TAU * sat((ph - 0.03) / 0.27);
    return 0.95 * vec2(cos(a), sin(a));
  }
  if (ph < 0.47) {
    float u = (ph - 0.3) / 0.17;
    return u < 0.5 ? mix(vec2(-0.5, 0.58), vec2(-0.3, 0.2), u * 2.0) : mix(vec2(-0.3, 0.2), vec2(-0.42, -0.18), u * 2.0 - 1.0);
  }
  if (ph < 0.62) {
    float u = (ph - 0.47) / 0.15;
    return u < 0.5 ? mix(vec2(0.1, 0.5), vec2(0.5, 0.47), u * 2.0) : mix(vec2(0.5, 0.47), vec2(0.34, 0.1), u * 2.0 - 1.0);
  }
  float a = mix(PI * 1.08, PI * 1.92, sat((ph - 0.62) / 0.14));
  return vec2(0.0, -0.05) + vec2(0.42, 0.48) * vec2(cos(a), sin(a));
}
/** Field strength: slides in, eases between strokes, pulled away at the end. */
float ffMag(float ph) {
  float m = smoothstep(0.0, 0.03, ph) * (1.0 - smoothstep(0.76, 0.79, ph));
  float gap = min(min(abs(ph - 0.3), abs(ph - 0.47)), abs(ph - 0.62));
  return m * mix(0.45, 1.0, smoothstep(0.0, 0.02, gap));
}
float ffMark(float fx) { return 1.0 - smoothstep(-0.025, 0.015, fx); }
/** The fluid surface height over xy (without spikes). */
float ffFluidH(vec2 xy, float fx, float ph, float mag) {
  float m = ffMark(fx);
  float H = 0.05 + 0.03 * m;
  // Bunched up along the channel behind the magnet.
  vec2 m1 = ffPath(max(ph - 0.025, 0.0)) - xy, m2 = ffPath(max(ph - 0.05, 0.0)) - xy;
  H += 0.032 * m * mag * (0.7 * exp(-dot(m1, m1) / 0.03) + 0.45 * exp(-dot(m2, m2) / 0.04));
  // Pulled away: a puddle spreads where the spikes were, then drains back into the channels.
  float pud = smoothstep(0.76, 0.79, ph) * (1.0 - smoothstep(0.8, 0.99, ph));
  if (pud > 0.0) {
    vec2 e = ffPath(0.76) - xy;
    float sg = 0.12 + 0.16 * smoothstep(0.77, 0.86, ph);
    H = smax(H, 0.06 + 0.055 * pud * exp(-dot(e, e) / (sg * sg)), 0.02);
  }
  return H;
}
/** The steel coin with the channels cut into it. */
float ffPlate(vec3 p, float fx) {
  float R = 0.03, T = 0.08;
  vec2 w = vec2(length(p.xy) - COIN_R + R, abs(p.z) - T + R);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - R;
  return slab + 0.035 * (1.0 - smoothstep(-0.015, 0.025, fx)) * smoothstep(0.03, 0.08, p.z);
}
float ffSpike(vec3 p, vec2 c, vec2 M, float mag) {
  float m = ffMark(field(c).x);
  vec2 tm = M - c;
  float dM = length(tm);
  float hc = 0.18 * m * mag * exp(-dM * dM / 0.07) * (0.7 + 0.4 * hash12(c * 19.0));
  if (hc < 0.006) return 1.0;
  float rb = FF_S * 0.5;
  float y = p.z - 0.075;
  // Spikes lean towards the magnet.
  vec2 lean = tm / max(dM, 1e-3) * 0.5 * sat(dM / 0.25);
  float q = length(p.xy - c - lean * max(y, 0.0));
  float side = (q * hc + y * rb - rb * hc) / sqrt(hc * hc + rb * rb);
  return max(side, -y) * 0.8;
}
float materialSDF(vec3 p) {
  float ph = ffPh();
  float mag = ffMag(ph);
  float fx = field(p.xy).x;
  float plate = ffPlate(p, fx);
  if (p.z < 0.0) return plate;
  float fl = max((p.z - ffFluidH(p.xy, fx, ph, mag)) * 0.6, length(p.xy) - 1.1);
  if (p.z > 0.3) return min(plate, min(fl, p.z - 0.28));
  vec2 M = ffPath(ph);
  // Spikes only stand on the strokes within ~0.5 of the magnet: elsewhere that distance bounds them.
  float lb = max(fx - 0.15, length(p.xy - M) - 0.66);
  if (mag > 0.01 && lb > 0.03) {
    fl = min(fl, lb);
  } else if (mag > 0.01) {
    vec2 c0 = (floor(p.xy / FF_S - 0.5) + 0.5) * FF_S;
    float sp = FF_S * 0.5;
    sp = min(sp, ffSpike(p, c0, M, mag));
    sp = min(sp, ffSpike(p, c0 + vec2(FF_S, 0.0), M, mag));
    sp = min(sp, ffSpike(p, c0 + vec2(0.0, FF_S), M, mag));
    sp = min(sp, ffSpike(p, c0 + vec2(FF_S), M, mag));
    fl = smin(fl, sp, 0.03);
  }
  return min(plate, fl);
}
/** The studio plus a grey surround: black gloss is defined entirely by what it reflects. */
vec3 ffEnv(vec3 r) {
  return studioEnv(r) * 1.7 + vec3(0.3, 0.3, 0.29) * 0.5 * sat(r.y * 0.5 + 0.5) + vec3(0.16, 0.15, 0.14) * (1.0 - smoothstep(-0.3, 0.1, r.y));
}
vec3 shade(Hit h) {
  // Steel where the plate is the nearer surface; fluid everywhere else.
  bool steel = ffPlate(h.p, h.f.x) < 0.003;
  if (steel) {
    float brush = vnoise(vec2(length(h.p.xy) * 300.0, atan(h.p.y, h.p.x) * 3.0));
    return litMetal(h, vec3(0.55, 0.56, 0.58), 0.3 + 0.12 * brush);
  }
  vec3 r = reflect(-h.v, h.wn);
  float fr = fresnel(dot(h.wn, h.v), 0.06);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 col = vec3(0.004) * (studioDiffuse(h.wn) + sat(dot(h.wn, h.l)) * sh);
  col += fr * ffEnv(r) * (0.35 + 0.65 * h.ao);
  col += ggx(h.wn, h.v, h.l, 0.07) * sh * vec3(1.0, 0.97, 0.92);
  return col;
}
`,
  },
  {
    key: "cymatics",
    label: "Cymatics",
    category: "tech",
    relief: 0.0,
    light: 100,
    heroTime: 0.3,
    loop: "The tone sweeps; the sand re-forms at each resonance, then into the mark",
    glsl: /* glsl */ `
// A round Chladni plate: black steel on a driver, dusted with fine sand. As the tone sweeps, sand dances off
// the moving areas and settles on the nodal lines (spokes and rings on a circular plate), re-forming into a new
// figure at each resonance, until one frequency draws the mark.
/** One shadow, many finishes: dielectric (metal = 0) to metal (metal = 1). sh = the softShadow, computed once. */
vec3 cymLit(Hit h, vec3 albedo, float rough, float spec, float metal, float sh) {
  vec3 r = reflect(-h.v, h.wn);
  float nv = dot(h.wn, h.v);
  float gl = (1.0 - rough) * (1.0 - rough);
  float g = ggx(h.wn, h.v, h.l, rough) * sh;
  vec3 die = albedo * (sat(dot(h.wn, h.l)) * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  die += spec * (fresnel(nv, 0.04) * mix(studioDiffuse(r), studioEnv(r), gl) * h.ao + g * vec3(1.0, 0.96, 0.9) * 2.0);
  vec3 met = fresnel3(nv, albedo) * mix(studioDiffuse(r) * 2.0, studioEnv(r), gl) * h.ao + albedo * g * 2.5;
  return mix(die, met, metal);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float ph = fract(uTime / 9.0);
  float sw = 2.0 + 5.0 * ph;
  float n = floor(sw + 0.5);
  float dn = abs(sw - n);
  float res = 1.0 - smoothstep(0.03, 0.2, dn);
  // Circular plate modes: n nodal diameters, rings that slide as the tone sweeps.
  float r = length(uv) / 1.1;
  float th = atan(uv.y, uv.x);
  float mr = 1.2 + 0.55 * sw;
  float A = abs(cos(n * th) * sin(mr * PI * r) + 0.35 * cos((n + 2.0) * th) * sin((mr + 1.0) * PI * r));
  // The mark's own figure: sand lies on the strokes.
  float Am = max(h.f.x, 0.0) * 9.0 + 0.04 * vnoise(uv * 12.0);
  float w = 1.0 - smoothstep(0.08, 0.2, min(ph, 1.0 - ph));
  float amp = mix(A, Am, w);
  float k = mix(mix(4.0, 26.0, res), 34.0, w);
  float sand = exp(-amp * k);
  // Grains: a speckle that keeps re-rolling while the plate buzzes off-resonance.
  float buzz = (1.0 - res) * (1.0 - w);
  vec2 gc = floor(uv * 160.0);
  float g = hash12(gc + floor(uTime * 24.0) * step(0.3, buzz) * 13.0);
  float cover = mix(sand, step(g, sand * 1.1), 0.55);
  cover = max(cover, step(0.985, g) * 0.6);
  vec3 sandC = hex(0xe9dcc1) * (0.85 + 0.25 * hash12(gc + 5.0));
  // Black steel with fine lathe rings from facing the plate.
  float lathe = vnoise(vec2(length(uv) * 260.0, 0.5));
  float sm = sat(cover) * (1.0 - h.edge);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  return cymLit(h, mix(vec3(0.035, 0.036, 0.04), sandC, sm), mix(0.3 + 0.12 * lathe, 0.95, sm), 0.05, 1.0 - sm, sh);
}
`,
  },
];
