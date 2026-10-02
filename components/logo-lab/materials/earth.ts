import type { LogoMaterial } from "../types";

/** Earth and mineral: stone, metal, the ground itself. */
export const EARTH: LogoMaterial[] = [
  {
    key: "river-stone",
    label: "River Stone",
    category: "earth",
    relief: -0.05,
    light: 125,
    heroTime: 4.0,
    loop: "Rain wets the stone, then it dries",
    glsl: /* glsl */ `
#define HAS_SURFACE
// The mark chiselled into a river boulder: rough skin, tool ridges in the grooves, rain that comes and goes.
float wetness() { return smoothstep(0.1, 0.9, 0.5 + 0.5 * sin(uTime * 0.45)); }
float surface(vec2 uv, vec4 f) {
  float inGroove = 1.0 - smoothstep(-0.02, 0.01, f.x);
  float s = 0.016 * (fbm(uv * 3.0 + 4.0) - 0.5) + 0.005 * (fbm(uv * 16.0) - 0.5);
  s *= 1.0 - inGroove * 0.6;
  s += inGroove * 0.0025 * sin((uv.x * 0.7 + uv.y) * 160.0 + vnoise(uv * 20.0) * 3.0);
  return s;
}
vec3 shade(Hit h) {
  float w = wetness();
  float groove = h.h;
  vec3 stone = mix(hex(0x5f554c), hex(0x8f8273), fbm(h.uv * 3.5 + 1.0));
  stone = mix(stone, hex(0xa49884), 0.3 * smoothstep(0.6, 0.9, vnoise(h.uv * 30.0)));
  stone = mix(stone, hex(0x3d3530), groove * 0.55);
  stone *= mix(1.0, 0.5, w);
  // Rain beads: little bright lenses that appear with the wet.
  vec4 v = voronoi(h.uv * 18.0 + floor(uTime * 0.45 / TAU) * 3.1);
  float bead = smoothstep(0.22, 0.12, v.x) * step(0.55, v.z) * w;
  float rough = mix(0.9, 0.18, w);
  vec3 col = litDielectric(h, stone, rough, mix(0.2, 0.9, w));
  vec3 r = reflect(-h.v, normalize(h.wn + vec3(hash22(floor(h.uv * 18.0)) - 0.5, 0.0) * 0.6));
  col += bead * studioEnv(r) * 0.25;
  return col;
}
`,
  },
  {
    key: "gold-bar",
    label: "Gold Bar",
    category: "earth",
    relief: 0.045,
    light: 135,
    heroTime: 1.6,
    loop: "A shine sweeps across the gold",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Fine gold bar: brushed field, a struck border, the mark raised; a band of light sweeps across in the loop.
float surface(vec2 uv, vec4 f) {
  float brush = 0.0006 * (vnoise(vec2(uv.x * 6.0, uv.y * 420.0)) - 0.5);
  float border = abs(sdBox2(uv, vec2(1.28, 0.98), 0.08));
  float rim = smoothstep(0.03, 0.012, border) * 0.012;
  return brush + rim;
}
vec3 shade(Hit h) {
  vec3 gold = vec3(1.0, 0.74, 0.32);
  float scratches = smoothstep(0.985, 1.0, vnoise(vec2(h.uv.x * 2.0 + h.uv.y * 9.0, h.uv.y * 300.0)));
  float rough = 0.16 + 0.12 * fbm(h.uv * 8.0) + scratches * 0.2;
  vec3 col = litMetal(h, gold, rough);
  // The sweep: a soft strip of light crossing the reflections diagonally.
  vec3 r = reflect(-h.v, h.wn);
  float s = fract(uTime * 0.22) * 3.4 - 1.7;
  float band = exp(-pow((r.x * 0.75 + r.y * 0.65 - s) / 0.09, 2.0));
  col += gold * band * 6.0 * fresnel3(dot(h.wn, h.v), gold);
  col *= mix(vec3(1.0), vec3(0.75, 0.55, 0.35), h.edge * 0.4);
  return col;
}
`,
  },
  {
    key: "wet-mud",
    label: "Wet Mud",
    category: "earth",
    relief: -0.045,
    light: 130,
    heroTime: 2.6,
    loop: "Gas bubbles swell, pop and ooze back into the mud",
    glsl: /* glsl */ `
#define HAS_SURFACE
// River-bank mud with the mark pressed in like a footprint: slumped lips either side of every stroke,
// rain-water standing in the grooves, and marsh-gas bubbles that swell, pop into a ring and slump away.
vec2 mudSway() { return 0.06 * vec2(sin(uTime * 0.31), cos(uTime * 0.23)); }
float surface(vec2 uv, vec4 f) {
  // Heavy lumps that slowly slump as the mud oozes.
  float s = 0.014 * (fbm(uv * 2.2 + mudSway() + 3.0) - 0.5);
  // The squeezed-up lip either side of a pressed stroke.
  float lip = smoothstep(0.0, 0.03, f.x) * smoothstep(0.12, 0.03, f.x);
  s += 0.012 * lip * (0.6 + 0.8 * vnoise(uv * 9.0));
  return s;
}
// Bubbles on a jittered grid. xy = normal tilt, z = bubble skin, w = pop ring.
vec4 mudBubbles(vec2 uv) {
  vec2 g = uv * 5.5;
  vec2 c = floor(g);
  vec4 o = vec4(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = c + vec2(float(i), float(j));
    vec2 rnd = hash22(id);
    if (rnd.x < 0.55) continue;
    float life = fract(uTime * (0.12 + 0.1 * rnd.y) + rnd.x * 7.3);
    vec2 centre = id + 0.2 + 0.6 * hash22(id + 3.7);
    vec2 d = g - centre;
    float dist = length(d);
    float rMax = 0.42 * (0.5 + 0.5 * rnd.y);
    if (life < 0.8) {
      // Swelling dome: a flattened sphere cap.
      float r = rMax * smoothstep(0.0, 0.75, life);
      if (dist < r) {
        float z = sqrt(max(r * r - dist * dist, 0.0));
        o.xy += 0.5 * d / max(z, 0.15 * r + 1e-3);
        o.z = 1.0;
      }
    } else {
      // Popped: a ring of mud spreads out and sinks back.
      float pop = (life - 0.8) / 0.2;
      float ringR = rMax * (1.0 + pop * 0.7);
      float x = (dist - ringR) / 0.07;
      float ring = exp(-x * x) * (1.0 - pop);
      o.w += ring;
      o.xy += (d / max(dist, 1e-3)) * x * ring * 0.6;
    }
  }
  return o;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  vec4 b = mudBubbles(uv);
  // Standing water in the press; its level breathes a little.
  float pond = (1.0 - smoothstep(-0.03, -0.008, h.f.x + 0.006 * sin(uTime * 0.5))) * (1.0 - h.edge);
  // Mud: near-black umber, silt-lighter on the lumps, darker where pressed.
  float n = fbm(uv * 4.0 + mudSway() * 2.0);
  vec3 mud = mix(hex(0x1c130b), hex(0x3e2c1b), n);
  mud = mix(mud, hex(0x5a4430), 0.25 * smoothstep(0.6, 0.85, vnoise(uv * 22.0)));
  mud *= mix(1.0, 0.7, h.h);
  // Water lies flat; bubbles and pop rings tilt whatever they break through.
  vec3 flatN = normalize(uRot * vec3(0.0, 0.0, h.side));
  h.wn = normalize(mix(h.wn, flatN, pond));
  h.wn = normalize(h.wn + uRot * vec3(b.x * h.side, b.y, 0.0) * 0.6);
  // Gloss is patchy on mud (some of it is skinning over), mirror-like on water and bubble skins.
  float rough = mix(0.34, 0.12, smoothstep(0.35, 0.65, vnoise(uv * 7.0 - mudSway())));
  rough = mix(rough, 0.03, max(pond, b.z));
  vec3 water = mix(hex(0x120c07), hex(0x2a2015), 0.5 * smoothstep(-0.02, -0.06, h.f.x));
  vec3 alb = mix(mud, water, pond);
  alb *= 1.0 - 0.3 * sat(b.w);
  vec3 col = litDielectric(h, alb, rough, mix(0.9, 1.6, max(pond, b.z)));
  col += b.z * 0.06 * studioEnv(reflect(-h.v, h.wn));
  return col;
}
`,
  },
  {
    key: "lava",
    label: "Lava",
    category: "earth",
    relief: 0.035,
    light: 120,
    heroTime: 2.0,
    loop: "Magma pulses along the strokes under drifting crust",
    glsl: /* glsl */ `
#define HAS_SURFACE
// The mark as lava channels on a cold basalt disc. Each stroke is a raised levee of black crust with
// an open channel of magma down its middle; skins of cooling crust ride the flow, the levees are
// split by glowing fissures, and pulses of hotter magma run along the strokes. The face around the
// mark is plain, dull basalt, warmed only by the glow spilling over the channel lips.
// The magma is pure emission on a blackbody ramp (deep red -> orange -> yellow-white at its hottest).
float surface(vec2 uv, vec4 f) {
  float m = 1.0 - smoothstep(-0.004, 0.004, f.x);
  // The channel sinks down the stroke centre between two crusted levees.
  float depth = sat(-f.x / 0.03);
  float s = -0.016 * smoothstep(0.35, 1.0, depth) * m;
  return s + 0.0025 * (vnoise(uv * 40.0) - 0.5) * (0.4 + 0.6 * m);
}
vec3 lavaHeat(float t) {
  t = sat(t);
  return vec3(pow(t, 1.4), pow(t, 3.2) * 0.5, pow(t, 7.0) * 0.22) * 9.0;
}
// A pulse of hotter magma travelling along the strokes.
float lavaPulse(vec2 uv) { return 0.62 + 0.38 * sin(uTime * TAU / 4.0 - aroundMark(uv) * TAU * 3.0); }
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float face = 1.0 - h.edge;
  float m = (1.0 - smoothstep(-0.004, 0.004, h.f.x)) * face;
  float depth = sat(-h.f.x / 0.03);
  float pulse = lavaPulse(uv);
  // Crust skins carried along each stroke (two-phase flow map along the stroke direction).
  vec2 dir = strokeDir(uv);
  float t1 = fract(uTime * 0.25), t2 = fract(uTime * 0.25 + 0.5);
  float n1 = vnoise((uv - dir * t1 * 0.2) * 16.0);
  float n2 = vnoise((uv - dir * t2 * 0.2) * 16.0 + 3.7);
  float flow = n1 * (1.0 - abs(2.0 * t1 - 1.0)) + n2 * (1.0 - abs(2.0 * t2 - 1.0));
  float skin = smoothstep(0.5, 0.72, flow) * (1.0 - 0.6 * depth);
  float channel = smoothstep(0.3, 0.75, depth);
  float magmaT = channel * (0.55 + 0.45 * depth) * pulse * (1.0 - 0.55 * skin);
  // Levees: black crust split by glowing fissures.
  float levee = m * (1.0 - channel);
  vec4 v = voronoi(uv * 30.0);
  float fiss = (1.0 - smoothstep(0.0, 0.06, v.w)) * levee;
  // Basalt: plain, dark and dull off the mark; glassier, blacker crust on it.
  vec3 rock = mix(hex(0x0e0d0c), hex(0x1d1a18), fbm(uv * 3.0 + 4.0)) * (0.9 + 0.1 * vnoise(uv * 60.0));
  rock = mix(rock, hex(0x080707), m);
  vec3 col = litDielectric(h, rock, mix(0.85, 0.45, m), mix(0.2, 0.5, m)) * (1.0 - 0.9 * channel * m);
  col += lavaHeat(magmaT * m);
  col += lavaHeat(fiss * 0.5 * pulse);
  // Glow spilling over the lips onto the basalt just outside the stroke.
  float spill = exp(-max(h.f.x, 0.0) / 0.025) * (1.0 - m) * face;
  col += vec3(1.0, 0.2, 0.03) * spill * 0.35 * pulse;
  return col;
}
`,
  },
  {
    key: "geode",
    label: "Geode",
    category: "earth",
    relief: 0.04,
    light: 140,
    heroTime: 1.8,
    loop: "Amethyst facets catch the light and sparkle",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A geode cracked open: a rough grey-brown husk, bands of blue-grey agate, a cavity of fine druzy quartz,
// and the mark grown out of it as a cluster of amethyst points.
float surface(vec2 uv, vec4 f) {
  float inMark = 1.0 - smoothstep(-0.02, 0.02, f.x);
  float s = 0.006 * (fbm(uv * 5.0 + 2.0) - 0.5) * (1.0 - inMark);
  s += inMark * 0.012 * vnoise(uv * 34.0);
  return s;
}
// Nearest crystal point on a jittered grid. xy = offset from its apex, z = id.
vec3 geodeFacet(vec2 p) {
  vec2 n = floor(p), fr = fract(p);
  float best = 8.0;
  vec3 o = vec3(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 d = fr - (g + hash22(n + g));
    float dd = dot(d, d);
    if (dd < best) { best = dd; o = vec3(d, hash12(n + g)); }
  }
  return o;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  // The light wobbles a touch so the facets take turns flashing.
  setLight(h, h.l + 0.35 * vec3(sin(uTime * 0.6), cos(uTime * 0.45), 0.0));
  float inMark = h.h * (1.0 - h.edge);
  vec3 r0 = reflect(-h.v, h.wn);
  // ── Amethyst: six-sided pyramids, purple at the tips, smoky at the roots.
  vec3 fc = geodeFacet(uv * 26.0);
  float a = atan(fc.y, fc.x) + fc.z * TAU;
  float a6 = (floor(a / (TAU / 6.0)) + 0.5) * (TAU / 6.0);
  vec2 face = vec2(cos(a6), sin(a6));
  float apex = sat(length(fc.xy) / 0.7);
  vec3 fn = normalize(vec3(face * 0.9, 1.0));
  vec3 crysN = normalize(h.wn + uRot * vec3(fn.x * h.side, fn.y, 0.0) * 1.1);
  vec3 purple = mix(hex(0xa468ec), hex(0x3a0f6a), apex);
  purple = mix(purple, hex(0xe8dcf5), smoothstep(-0.015, 0.0, h.f.x));   // milky quartz where the cluster roots
  Hit hc = h;
  hc.wn = crysN;
  vec3 crystal = litDielectric(hc, purple, 0.06, 1.6);
  crystal += purple * 0.6 * (1.0 - apex) * (0.6 + 0.4 * sat(dot(crysN, h.l)));   // light glowing through
  // Sparkle: one facet in a few flashes as the light moves.
  float facetId = hash12(vec2(fc.z * 91.0, a6 * 3.0));
  float tw = pow(0.5 + 0.5 * sin(uTime * 2.3 + facetId * 60.0), 24.0);
  float spec = pow(sat(dot(reflect(-h.v, crysN), h.l)), 60.0);
  crystal += vec3(1.0, 0.95, 1.0) * (spec * 2.5 + tw * step(0.7, facetId) * 3.0) * (1.0 - apex * 0.5);
  // ── The cut face around it: druzy cavity inside the rim, agate bands, then the husk.
  float rr = length(uv * vec2(1.0, 0.92)) + 0.05 * (fbm(uv * 3.0) - 0.5);
  float band = 0.5 + 0.5 * sin(rr * 75.0 + 4.0 * vnoise(uv * 4.0));
  vec3 agate = mix(hex(0x3e4855), hex(0x9aa3ad), band);
  agate = mix(agate, hex(0xdedcd6), smoothstep(0.88, 1.0, band) * 0.6);
  vec2 dg = floor(uv * 90.0);
  float dz = hash12(dg);
  vec3 druzy = mix(hex(0x231d2a), hex(0x5c516b), dz);   // smoky druzy quartz, so the amethyst reads
  float druzyGlint = step(0.93, dz) * pow(0.5 + 0.5 * sin(uTime * 3.0 + dz * 80.0), 12.0);
  vec3 husk = mix(hex(0x1e160f), hex(0x433224), fbm(uv * 6.0 + 3.0));
  float cavity = 1.0 - smoothstep(0.84, 0.9, rr);
  float shell = smoothstep(1.12, 1.2, rr);
  vec3 ground = mix(agate, druzy, cavity);
  ground = mix(ground, husk, max(shell, h.edge));
  float groundRough = mix(0.35, 0.9, max(shell, h.edge));
  vec3 rest = litDielectric(h, ground, groundRough, 0.5);
  rest += druzyGlint * cavity * (1.0 - h.edge) * vec3(1.6, 1.5, 1.7);
  rest += cavity * 0.02 * studioEnv(r0);
  return mix(rest, crystal, inMark);
}
`,
  },
  {
    key: "marble",
    label: "Marble",
    category: "earth",
    relief: -0.035,
    light: 150,
    heroTime: 3.2,
    loop: "A gallery light sweeps across the carving",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Carrara statuario: warm white stone with soft grey veins, polished face, the mark cut as a sunk relief
// with honed, tooled walls. Light enters the stone a little, so it glows rather than just reflecting.
float surface(vec2 uv, vec4 f) {
  float inCut = 1.0 - smoothstep(-0.02, 0.01, f.x);
  return inCut * 0.002 * (vnoise(uv * 45.0) - 0.5);
}
float marbleVein(vec2 p, float sharp) {
  float w = fbm(p * 1.3 + 2.0) * 5.0 + fbm(p * 3.1 + 7.0) * 1.5;
  float s = p.x * 1.1 + p.y * 1.6 + w;
  float veinMain = pow(1.0 - abs(sin(s * 1.4)), sharp);
  float fine = pow(1.0 - abs(sin(s * 4.7 + w * 2.0)), sharp * 2.2) * 0.5;
  return sat(veinMain + fine);
}
vec3 shade(Hit h) {
  // A light on a slow arc across the plaque, and a highlight streak travelling with it.
  float sw = sin(uTime * 0.4);
  setLight(h, lightAt(PI * 0.5 + 1.2 * sw, 0.42));
  // Veins run through the block, so wrap them onto the sides using depth.
  vec2 p = h.p.xy + vec2(h.p.z * 0.7, -h.p.z * 0.4);
  float vSharp = marbleVein(p, 14.0);
  float vSoft = pow(vSharp, 0.35) * 0.35;   // the same vein seen deeper in the stone, blurred
  float cloud = fbm(p * 2.2 + 11.0);
  vec3 stone = mix(hex(0xf1eee8), hex(0xd2d1cd), smoothstep(0.4, 0.75, cloud));
  stone = mix(stone, hex(0xa7aaae), vSoft);
  stone = mix(stone, hex(0x676c73), vSharp * 0.85);
  float cut = h.h * (1.0 - h.edge);
  stone *= 1.0 - 0.06 * cut;
  float rough = mix(0.06, 0.5, cut);
  vec3 col = litDielectric(h, stone, rough, mix(1.0, 0.4, cut));
  // Translucency: wrapped, slightly warm light scattered back out of the stone.
  float wrap = sat(dot(h.wn, h.l) * 0.5 + 0.5);
  col += stone * vec3(1.0, 0.93, 0.85) * 0.18 * wrap * h.ao;
  // The sweep: a soft strip of the gallery light gliding over the polish.
  vec3 r = reflect(-h.v, h.wn);
  float bx = (r.x * 0.9 + r.y * 0.3 - sw * 0.9) / 0.12;
  float band = exp(-bx * bx);
  col += vec3(1.0, 0.97, 0.92) * band * 1.2 * fresnel(dot(h.wn, h.v), 0.04) * (1.0 - cut) * 6.0;
  return col;
}
`,
  },
  {
    key: "sand",
    label: "Sand",
    category: "earth",
    relief: 0.028,
    light: 165,
    heroTime: 0.5,
    loop: "A gust buries the mark in sand, then scours it clean",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A dune face at low sun: wind ripples migrating across, the mark standing proud and wind-packed.
// Every sixteen seconds a gust drifts sand over it from the windward side, then a second gust scours it bare.
#define SAND_PERIOD 16.0
float sandX(vec2 uv) { return uv.x * 0.36 + 0.5 + uv.y * 0.08; }
vec2 sandFronts() {
  float p = fract(uTime / SAND_PERIOD);
  return vec2(mix(-0.5, 1.5, sat(p * 2.6)), mix(-0.5, 1.5, sat((p - 0.5) * 2.6)));
}
float sandCover(vec2 uv) {
  vec2 fr = sandFronts();
  float x = sandX(uv) + 0.3 * (vnoise(uv * 3.0 + 5.0) - 0.5);
  return sat((fr.x - x) / 0.25) * (1.0 - sat((fr.y - x) / 0.25));
}
float sandRipple(vec2 uv) {
  vec2 w = vec2(0.8, 0.6);
  float ph = dot(uv, w) * 52.0 + 5.0 * vnoise(uv * 3.2) - uTime * 0.6;
  float s = fract(ph / TAU);
  // Long gentle windward slope, short steep lee face.
  return smoothstep(0.0, 0.8, s) * smoothstep(1.0, 0.82, s);
}
float surface(vec2 uv, vec4 f) {
  float m = 1.0 - smoothstep(-0.022, 0.022, f.x);
  float c = sandCover(uv);
  float loose = max(1.0 - m, c);
  float s = 0.004 * sandRipple(uv) * loose;
  // Drifted sand fills the ground up to (just over) the mark, leaving a ghost of it.
  s += c * (0.026 * (1.0 - m) + 0.006);
  return s;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float c = sandCover(uv);
  float m = h.h * (1.0 - c);
  float rip = sandRipple(uv);
  vec3 sand = mix(hex(0xb47a42), hex(0xcf9a5e), vnoise(uv * 9.0)) * 0.8;
  // Dark heavy-mineral grains collect in the ripple troughs.
  sand = mix(sand, hex(0x7f5531), 0.35 * (1.0 - rip) * (1.0 - m));
  // The mark is wind-packed and a touch damp underneath: darker, smoother.
  sand = mix(sand, hex(0xa8743f), m * 0.55);
  // Freshly drifted sand is paler and finer.
  sand = mix(sand, hex(0xead0a0), c * 0.25 * (1.0 - h.h * 0.5));
  sand = mix(sand, hex(0x8a6a48), h.edge * 0.3);
  vec3 col = litDielectric(h, sand, mix(0.95, 0.7, m), 0.15);
  // Quartz grains glinting, twinkling as the grains shift.
  vec2 gc = floor(uv * 95.0);
  float g = hash12(gc + floor(uTime * 3.0) * 0.37 * (1.0 - m));
  float face = pow(sat(dot(reflect(-h.v, h.wn), h.l)), 3.0);
  col += step(0.985, g) * face * vec3(1.0, 0.94, 0.82) * 1.8;
  // Airborne streaks riding each front across the plaque.
  vec2 fr = sandFronts();
  float x = sandX(uv);
  vec2 gx = (vec2(x) - fr) / 0.18;
  float gust = exp(-gx.x * gx.x) + exp(-gx.y * gx.y);
  float streak = vnoise(vec2(uv.x * 3.0 - uTime * 5.0, uv.y * 38.0));
  col += hex(0xf0d8a8) * 0.22 * gust * smoothstep(0.45, 0.9, streak);
  return col;
}
`,
  },
  {
    key: "salt-crystals",
    label: "Salt Crystals",
    category: "earth",
    relief: 0.008,
    light: 150,
    heroTime: 8.5,
    loop: "Halite cubes grow along the strokes as the brine dries, then dissolve",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Brine painted along the strokes on a disc of riven Welsh slate. As it dries, a white crust forms
// in the strokes and cubic halite crystals nucleate along them, sweeping round the mark and growing
// out from each stroke's centreline (the biggest show hopper steps). Then a damp spell dissolves them.
// The slate around the mark stays plain and dark; only a few strays settle just off the strokes.
float saltGrow() {
  float p = fract(uTime / 12.0);
  return smoothstep(0.02, 0.7, p) * (1.0 - smoothstep(0.88, 1.0, p));
}
float surface(vec2 uv, vec4 f) {
  // Slate cleavage: faint laminations and a gently stepped face.
  return 0.0012 * (vnoise(vec2(uv.x * 2.0, uv.y * 30.0)) - 0.5) + 0.003 * (fbm(uv * 2.5) - 0.5);
}
// Halite cubes on a jittered grid, only on the strokes. xy = normal tilt, z = coverage, w = id (or -gap outside).
vec4 saltCubes(vec2 uv, float grow) {
  float cs = 0.045;
  vec2 cell = floor(uv / cs);
  vec4 o = vec4(0.0, 0.0, 0.0, -1.0);
  float topZ = -1.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(float(i), float(j));
    vec2 rnd = hash22(c);
    vec2 centre = (c + 0.25 + 0.5 * rnd) * cs;
    float fx = field(centre).x;
    // On the strokes; just a few strays a little way off them.
    if (fx > -0.004 && (fx > 0.05 || hash12(c + 3.3) < 0.88)) continue;
    // Growth sweeps round the mark and spreads out from each centreline.
    float start = 0.45 * aroundMark(centre) + 0.2 * sat((fx + 0.04) / 0.05) + 0.15 * hash12(c + 7.1);
    float age = sat((grow - start) / 0.3);
    if (age <= 0.0) continue;
    float size = cs * (0.22 + 0.42 * rnd.y) * sqrt(age) * (fx > 0.0 ? 0.6 : 1.0);
    mat2 R = rot2(hash12(c + 2.3) * 1.5708);
    vec2 d = R * (uv - centre);
    vec2 ad = abs(d);
    float box = max(ad.x, ad.y);
    if (box > size) { o.w = max(o.w, -(box - size)); continue; }
    if (size < topZ) continue;
    topZ = size;
    vec2 dirL = ad.x > ad.y ? vec2(sign(d.x), 0.0) : vec2(0.0, sign(d.y));
    vec2 tilt = vec2(0.0);
    float bev = size * 0.3;
    if (box > size - bev) tilt = (dirL * R) * 1.1;                          // bevelled cube edges
    else if (size > cs * 0.42 && box < size * 0.5 && box > size * 0.2) tilt = -(dirL * R) * 0.5; // hopper funnel
    o = vec4(tilt, 1.0, hash12(c + 9.7));
  }
  return o;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float grow = saltGrow();
  float face = 1.0 - h.edge;
  vec4 s = saltCubes(uv, grow);
  s.z *= face;
  // Cubes cast a short shadow away from the light.
  vec2 toL = h.lo.xy / max(h.lo.z, 0.35);
  float shadow = saltCubes(uv + toL * 0.018, grow).z * (1.0 - s.z) * face;
  float m = (1.0 - smoothstep(-0.004, 0.004, h.f.x)) * face;
  // Slate: blue-black with faint banding, plain off the mark.
  vec3 slate = mix(hex(0x1b1f24), hex(0x2c3239), fbm(uv * vec2(1.5, 6.0) + 3.0));
  // On the strokes: wet glazed brine at first, drying to a white crust as the crystals grow.
  float brine = m * (1.0 - grow);
  float crust = m * grow * (0.55 + 0.45 * smoothstep(0.3, 0.7, vnoise(uv * 70.0)));
  vec3 alb = slate * (1.0 - 0.4 * brine);
  alb = mix(alb, hex(0xc9ced3), crust * 0.85);
  float contact = s.w < 0.0 ? 1.0 - smoothstep(0.0, 0.012, -s.w) : 0.0;
  alb *= (1.0 - 0.55 * shadow) * (1.0 - 0.4 * contact * (1.0 - s.z) * m);
  // One shadowed lighting pass: the cube normal and finish replace the slate's where a cube sits.
  Hit hc = h;
  bool cube = s.z > 0.5;
  bool topFace = dot(s.xy, s.xy) < 1e-4;
  if (cube) {
    hc.wn = normalize(h.wn + uRot * vec3(s.x * h.side, s.y, 0.0));
    // Clear tops show the crust through them; the bevels are frosted white.
    alb = topFace ? mix(alb * 1.3, hex(0xe6ebef), 0.55) : hex(0xf2f4f6);
  }
  float rough = cube ? (topFace ? 0.08 : 0.3) : mix(0.7, 0.12, brine);
  float spec = cube ? 1.4 : mix(0.15, 1.2, brine);
  vec3 col = litDielectric(hc, alb, rough, spec);
  if (cube) {
    float sp = pow(sat(dot(reflect(-h.v, hc.wn), h.l)), 120.0);
    float tw = pow(0.5 + 0.5 * sin(uTime * 2.7 + s.w * 70.0), 30.0) * step(0.6, s.w);
    col += vec3(1.0) * (sp * 3.0 + tw * 2.5);
  }
  return col;
}
`,
  },
  {
    key: "amber",
    label: "Amber",
    category: "earth",
    relief: 0.0,
    light: 140,
    heroTime: 3.0,
    loop: "Glints travel through the amber and across its dome",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Baltic amber polished into a cabochon. The mark is a fossil inclusion lying mid-stone, seen through the
// refracting dome (so it shifts with parallax), with trapped air bubbles and resin dust at other depths.
float surface(vec2 uv, vec4 f) {
  vec2 q = uv / vec2(1.12, 1.34);
  return 0.028 * (1.0 - dot(q, q)) - 0.012 + 0.0015 * (vnoise(uv * 5.0) - 0.5);
}
// Where a refracted ray inside the stone meets the plane z = zl, in face coordinates.
vec2 amberAt(Hit h, vec3 r, float zl) {
  float t = abs(h.p.z - zl * h.side) / max(abs(r.z), 0.25);
  vec3 p = h.p + r * t;
  return h.side > 0.0 ? p.xy : vec2(-p.x, p.y);
}
// Trapped air: x = bubble body, y = its dark rim, z = the bright inner glint.
vec3 amberBubbles(vec2 p, float seed) {
  vec2 g = p * 6.0 + seed;
  vec2 c = floor(g);
  float on = step(0.7, hash12(c + 9.1 + seed));
  float r = 0.08 + 0.14 * hash12(c + 1.7 + seed);
  vec2 l = (fract(g) - 0.5 - (hash22(c + seed) - 0.5) * 0.5) / r;
  float d = length(l);
  float body = on * smoothstep(1.0, 0.9, d);
  float rim = body * smoothstep(0.5, 0.95, d);
  float glint = on * smoothstep(0.3, 0.0, length(l - vec2(-0.35, 0.38)));
  return vec3(body, rim, glint);
}
vec3 shade(Hit h) {
  // The key light orbits slowly so its glint slides over the dome.
  setLight(h, lightAt(uTime * 0.45 + 2.2, 0.55 + 0.15 * sin(uTime * 0.3)));
  vec3 rdO = transpose(uRot) * h.rd;
  vec3 r = refract(rdO, h.n, 1.0 / 1.54);
  if (dot(r, r) < 1e-4) r = rdO;
  // The fossil, mid-stone.
  vec2 fuv = amberAt(h, r, 0.0);
  float fx = field(fuv).x;
  float fossil = 1.0 - smoothstep(-0.012, 0.012, fx);
  float fossilEdge = smoothstep(0.03, 0.0, abs(fx + 0.004));
  // Body colour: light transmitted through a path of honey resin.
  vec2 qd = h.uv / vec2(1.12, 1.34);
  float path = (0.26 + 0.22 * dot(qd, qd)) / max(abs(r.z), 0.3) + h.edge * 0.4;
  vec3 trans = exp(-vec3(1.5, 5.2, 14.0) * path);
  float flow = fbm(fuv * vec2(1.6, 4.0) + 3.0);   // flow lines from when the resin ran
  vec3 glow = trans * (0.9 + 0.6 * sat(dot(h.wn, h.l)) + 0.5 * flow);
  glow *= mix(1.0, 0.85, smoothstep(0.55, 0.75, flow));
  // The inclusion: dark, slightly translucent tissue with a lighter edge.
  vec3 fossilCol = hex(0x2a1406) * (0.5 + 0.5 * vnoise(fuv * 30.0));
  glow = mix(glow, fossilCol * (0.4 + trans * 0.6), fossil * 0.92);
  glow += trans * fossilEdge * 0.25;
  // Bubbles at two other depths, and fine resin dust.
  vec3 b1 = amberBubbles(amberAt(h, r, 0.05), 0.0);
  vec3 b2 = amberBubbles(amberAt(h, r, -0.05) * 1.4, 17.0);
  glow *= (1.0 - 0.7 * b1.y) * (1.0 - 0.5 * b2.y);
  float dust = step(0.82, vnoise(amberAt(h, r, 0.03) * 70.0));
  glow *= 1.0 - 0.5 * dust;
  // A glint travels through: a sheet of light sliding across the interior, lighting what it passes.
  float sweep = fract(uTime * 0.14) * 4.0 - 2.0;
  float bx = (fuv.x * 0.6 + fuv.y * 0.8 - sweep) / 0.22;
  float band = exp(-bx * bx);
  glow += band * (vec3(1.0, 0.8, 0.45) * 3.0 * (b1.z + 0.6 * b2.z) + trans * 1.4 * (dust + fossilEdge) + trans * 0.35);
  glow += (b1.z + 0.5 * b2.z) * vec3(1.0, 0.85, 0.6) * 0.5;
  // Surface: a polished dielectric shell over it all.
  float fr = fresnel(dot(h.wn, h.v), 0.045);
  vec3 refl = studioEnv(reflect(-h.v, h.wn));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 col = glow * (1.0 - fr) + fr * refl * h.ao + ggx(h.wn, h.v, h.l, 0.05) * sh * vec3(1.0, 0.95, 0.88) * 3.0;
  return col;
}
`,
  },
  {
    key: "worn-brass-coin",
    label: "Worn Brass Coin",
    category: "earth",
    relief: 0.05,
    light: 135,
    heroTime: 1.2,
    loop: "A glint rolls across the worn brass",
    glsl: /* glsl */ `
#define HAS_SURFACE
// An old brass coin from a bazaar tin: dark patina packed into the recesses, high points rubbed bright
// by a century of pockets, hairline scratches, dings, a raised border and a milled edge.
float surface(vec2 uv, vec4 f) {
  float r = length(uv);
  float rim = smoothstep(1.04, 1.07, r) * 0.022;
  float wear = 0.003 * (fbm(uv * 6.0 + 1.0) - 0.5);
  float ding = -0.004 * smoothstep(0.82, 0.95, vnoise(uv * 7.0 + 4.0));
  return rim + wear + ding;
}
float brassScratch(vec2 uv, float a, float seed) {
  vec2 q = rot2(a) * uv;
  return smoothstep(0.965, 1.0, vnoise(vec2(q.x * 1.5 + seed, q.y * 260.0)));
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float r = length(uv);
  // The glint: the key light swings, and a strip of brightness rolls across the reflections.
  setLight(h, h.l + 0.4 * vec3(sin(uTime * 0.5), 0.0, 0.0));
  // Milled edge: reeding on the side wall.
  float ang = atan(h.p.y, h.p.x);
  vec3 tang = vec3(-sin(ang), cos(ang), 0.0);
  float reed = cos(ang * 160.0);
  h.wn = normalize(h.wn + uRot * tang * reed * 0.45 * h.edge);
  // High points: the raised mark and the border, rubbed bright.
  float high = max(h.h, smoothstep(1.05, 1.08, r)) * (1.0 - h.edge);
  // Recesses: the ground right beside the raised work, under the border, and anything occluded.
  float recess = (1.0 - h.h) * (smoothstep(0.07, 0.0, h.f.x) + smoothstep(0.98, 1.05, r) * (1.0 - smoothstep(1.05, 1.08, r)));
  float n = fbm(uv * 5.0 + 9.0);
  float patina = sat(recess * 0.9 + (1.0 - high) * (0.25 + 0.5 * n) + (1.0 - h.ao) * 1.5 - 0.15);
  patina = smoothstep(0.25, 0.75, patina) * (1.0 - high * 0.85);
  patina = max(patina, h.edge * smoothstep(0.0, -0.6, reed) * 0.7);   // grime between the reeds
  // Scratches: three sets of hairlines, brighter than the metal around them.
  float sc = max(max(brassScratch(uv, 0.4, 1.0), brassScratch(uv, -1.1, 7.0)), brassScratch(uv, 2.2, 13.0));
  vec3 brass = mix(vec3(0.88, 0.66, 0.32), vec3(0.98, 0.8, 0.48), high);
  brass *= 0.85 + 0.15 * n;
  float rough = mix(0.42, 0.16, high) - sc * 0.12;
  vec3 metal = litMetal(h, brass, rough);
  vec3 rr = reflect(-h.v, h.wn);
  float s = fract(uTime * 0.2) * 3.4 - 1.7;
  float bx = (rr.x * 0.7 + rr.y * 0.7 - s) / 0.12;
  float band = exp(-bx * bx);
  metal += brass * band * 3.5 * fresnel3(dot(h.wn, h.v), brass) * (0.4 + 0.6 * high);
  metal += brass * sc * 0.08;
  vec3 crud = mix(hex(0x2b2412), hex(0x34402a), smoothstep(0.5, 0.8, n));
  vec3 grime = litDielectric(h, crud, 0.85, 0.2);
  return mix(metal, grime, patina);
}
`,
  },
  {
    key: "satin-silver",
    label: "Satin Silver",
    category: "earth",
    relief: 0.04,
    light: 135,
    heroTime: 2.4,
    loop: "A light orbits the hammered silver",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A silversmith's medallion: a hand-hammered satin field, the mark raised and softly burnished,
// and a twisted rope bezel laid round the edge. A single light orbits it.
float surface(vec2 uv, vec4 f) {
  float d = sdEllipse2(uv, vec2(1.12, 1.34));
  // Rope: a two-strand cord, 0.1 wide, its strands twisting along the edge.
  float across = (d + 0.085) / 0.05;
  float env = sqrt(max(1.0 - across * across, 0.0));
  float a = atan(uv.y / 1.34, uv.x / 1.12);
  float tw = fract(a * 60.0 / TAU + across * 0.35);
  float tc = tw * 2.0 - 1.0;
  float strand = sqrt(max(1.0 - tc * tc, 0.0));
  float rope = 0.024 * env * (0.55 + 0.45 * strand);
  // A small sunk channel inside the rope, where the bezel meets the field.
  float channel = -0.004 * smoothstep(0.03, 0.0, abs(d + 0.15));
  return rope + channel;
}
// Hammer dimples: tilt towards the nearest blow's centre (a shallow dish).
vec2 silverHammer(vec2 p) {
  vec2 n = floor(p), fr = fract(p);
  float best = 8.0;
  vec2 o = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 d = fr - (g + hash22(n + g));
    float dd = dot(d, d);
    if (dd < best) { best = dd; o = d; }
  }
  return -o;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  // The orbiting light, and the studio reflection turning with it.
  float orb = uTime * 0.7;
  setLight(h, lightAt(orb, 0.55));
  float d = sdEllipse2(uv, vec2(1.12, 1.34));
  float onRope = smoothstep(-0.14, -0.13, d) * (1.0 - h.edge);
  float field0 = (1.0 - onRope) * (1.0 - h.edge);
  vec2 hm = silverHammer(uv * 9.0);
  vec2 tilt = hm * 0.28 * field0 * (1.0 - 0.6 * h.h);
  h.wn = normalize(h.wn + uRot * vec3(tilt.x * h.side, tilt.y, 0.0));
  vec3 silver = vec3(0.96, 0.95, 0.92);
  // Warm grey tarnish settles where the polishing cloth cannot reach.
  silver *= mix(vec3(1.0), vec3(0.62, 0.56, 0.47), sat((1.0 - h.ao) * 1.6) * 0.9);
  float rough = mix(0.34, 0.2, h.h) + 0.06 * (fbm(uv * 12.0) - 0.5) - onRope * 0.1;
  vec3 r = reflect(-h.v, h.wn);
  r.xy = rot2(orb) * r.xy;
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), (1.0 - rough) * (1.0 - rough));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 f = fresnel3(dot(h.wn, h.v), silver);
  vec3 col = f * env * h.ao + silver * ggx(h.wn, h.v, h.l, rough) * sh * 3.0;
  return col;
}
`,
  },
  {
    key: "chrome",
    label: "Chrome",
    category: "earth",
    relief: 0.045,
    light: 135,
    heroTime: 1.0,
    loop: "The studio wheels around in the mirror",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Show-car chrome: a flawless mirror of a photo studio — seamless-paper horizon, softboxes, strip lights —
// and the whole studio slowly wheeling around the coin.
float surface(vec2 uv, vec4 f) { return smoothstep(1.05, 1.08, length(uv)) * 0.018; }
vec3 chromeEnv(vec3 d) {
  d.xz = rot2(uTime * 0.45) * d.xz;
  vec3 c = studioEnv(d);
  // Bright grey paper above, dark floor below, a crisp horizon between.
  c += mix(vec3(0.012, 0.011, 0.01), vec3(0.2, 0.21, 0.23) * (0.6 + 0.4 * d.y), smoothstep(-0.015, 0.015, d.y));
  // Two tall strip lights so the mirror always has a line to show.
  float ang = atan(d.x, d.z + 1e-5);
  c += vec3(2.4) * smoothstep(0.06, 0.03, abs(ang - 2.2)) * smoothstep(-0.25, 0.0, d.y) * smoothstep(0.85, 0.55, d.y);
  c += vec3(1.5, 1.45, 1.35) * smoothstep(0.05, 0.02, abs(ang + 1.0)) * smoothstep(-0.1, 0.1, d.y) * smoothstep(0.9, 0.6, d.y);
  return c;
}
vec3 shade(Hit h) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 base = vec3(0.78, 0.79, 0.8);
  vec3 f = fresnel3(dot(h.wn, h.v), base);
  vec3 col = f * chromeEnv(r) * mix(0.35, 1.0, h.ao);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 16.0);
  col += base * ggx(h.wn, h.v, h.l, 0.04) * sh * 2.0;
  return col;
}
`,
  },
  {
    key: "verdigris-copper",
    label: "Verdigris Copper",
    category: "earth",
    relief: 0.045,
    light: 140,
    heroTime: 5.0,
    loop: "Green patina creeps out of the recesses, then recedes",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A copper plaque left out in the monsoon: rosy metal on the high points, a dark cuprite front, and powdery
// green verdigris blooming out of every recess. In the loop the patina creeps over it and recedes again.
float surface(vec2 uv, vec4 f) {
  float frame = abs(sdBox2(uv, vec2(1.06, 1.2), 0.08));
  float s = 0.014 * smoothstep(0.035, 0.012, frame);
  s += 0.0025 * (vnoise(uv * 14.0) - 0.5);
  return s;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float k = 0.5 - 0.5 * cos(uTime * 0.35);
  float frame = abs(sdBox2(uv, vec2(1.06, 1.2), 0.08));
  float bead = smoothstep(0.035, 0.012, frame);
  // Where water sits: beside the raised work, along the bead, in occlusion, on the walls.
  float recess = (1.0 - h.h) * (smoothstep(0.1, 0.0, h.f.x) + smoothstep(0.08, 0.035, frame) * (1.0 - bead));
  recess = sat(recess + (1.0 - h.ao) * 2.0 + h.edge * 0.6 + 0.3 * (1.0 - h.h) * (1.0 - bead));
  float n = fbm(uv * 5.0 + 2.0);
  float amount = recess * 0.9 + n * 0.6 - 0.3 + 0.15 * vnoise(uv * 24.0);
  float th = mix(1.25, 0.15, k);
  float patina = smoothstep(th, th + 0.12, amount);
  float cuprite = smoothstep(th - 0.25, th, amount) * (1.0 - patina);
  // Copper: rosy where rubbed, browner where tarnished.
  float high = max(h.h, bead) * (1.0 - h.edge);
  vec3 copper = mix(vec3(0.62, 0.32, 0.2), vec3(0.95, 0.62, 0.48), 0.45 + 0.55 * max(high, n * 0.6));
  copper *= mix(1.0, 0.4, cuprite);
  float rough = 0.3 + 0.18 * (fbm(uv * 9.0) - 0.5) - high * 0.12;
  vec3 metal = litMetal(h, copper, rough);
  // Verdigris: crumbly powder, its own little relief.
  float g0 = vnoise(uv * 60.0);
  vec2 gt = vec2(vnoise(uv * 60.0 + vec2(0.4, 0.0)) - g0, vnoise(uv * 60.0 + vec2(0.0, 0.4)) - g0) * -1.5;
  Hit hp = h;
  hp.wn = normalize(h.wn + uRot * vec3(gt.x * h.side, gt.y, 0.0) * patina);
  vec3 green = mix(hex(0x3c8a73), hex(0x93d6b8), smoothstep(0.3, 0.8, g0 + 0.3 * (n - 0.5)));
  green = mix(green, hex(0x2c5f52), (1.0 - h.ao) * 0.6);
  vec3 crust = litDielectric(hp, green, 0.92, 0.12);
  return mix(metal, crust, patina);
}
`,
  },
  {
    key: "cast-iron-rust",
    label: "Cast-iron Rust",
    category: "earth",
    relief: 0.05,
    light: 140,
    heroTime: 6.0,
    loop: "Rust blooms and spreads across the iron",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A sand-cast iron plaque, like a Calcutta tram-depot sign: grainy black skin, a cast border bead,
// the mark worn to a dull shine — and orange-brown rust blooming, flaking and pitting across it.
float surface(vec2 uv, vec4 f) {
  float frame = abs(sdBox2(uv, vec2(1.05, 1.19), 0.1));
  float s = 0.018 * smoothstep(0.045, 0.02, frame);
  s += 0.004 * (vnoise(uv * 55.0) - 0.5);
  s += 0.004 * (fbm(uv * 4.0) - 0.5);
  return s;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float spread = 0.5 - 0.5 * cos(uTime * 0.3);
  float frame = abs(sdBox2(uv, vec2(1.05, 1.19), 0.1));
  float bead = smoothstep(0.045, 0.02, frame);
  float high = max(h.h, bead) * (1.0 - h.edge);
  // Rust starts where water lingers (recesses, edges) and blooms outwards in blotches.
  float recess = sat((1.0 - h.h) * smoothstep(0.08, 0.0, h.f.x) + (1.0 - h.ao) * 2.0 + h.edge * 0.5);
  float a = fbm(uv * 3.2 + 5.0) * 0.9 + recess * 0.5 + 0.25 * vnoise(uv * 14.0) - high * 0.25;
  float th = mix(1.15, 0.25, spread);
  float rust = smoothstep(th, th + 0.08, a);
  float stain = smoothstep(th - 0.2, th, a) * (1.0 - rust);
  // Flakes: plates of scale with dark gaps, each lifted at its own angle.
  vec4 v = voronoi(uv * 16.0);
  float gap = smoothstep(0.08, 0.0, v.w) * rust;
  vec2 lift = (hash22(vec2(v.z * 91.0, 3.0)) - 0.5) * 0.6 * rust;
  // Pits: corrosion craters in both rust and iron.
  vec4 v2 = voronoi(uv * 45.0);
  float pit = smoothstep(0.16, 0.05, v2.x) * step(0.72, v2.z) * (0.4 + 0.6 * max(rust, stain));
  // Iron: dark grey, sand-cast, a dull shine on rubbed high points, rust-stained near the bloom.
  vec3 iron = mix(vec3(0.2, 0.2, 0.2), vec3(0.42, 0.41, 0.4), high);
  iron = mix(iron, vec3(0.35, 0.18, 0.1), stain * 0.7);
  vec3 metal = litMetal(h, iron, mix(0.55, 0.3, high) + stain * 0.2) + iron * studioDiffuse(h.wn) * 0.15;
  Hit hr = h;
  hr.wn = normalize(h.wn + uRot * vec3(lift.x * h.side, lift.y, 0.0));
  float tone = hash12(vec2(v.z * 37.0, 1.0));
  vec3 scale = mix(hex(0x5a2410), hex(0x9a4516), tone);
  scale = mix(scale, hex(0xc4711f), smoothstep(0.75, 0.95, tone) * 0.8);
  scale = mix(scale, hex(0xb8873a), smoothstep(0.6, 0.9, vnoise(uv * 40.0)) * 0.3);
  scale *= 1.0 - 0.75 * gap;
  vec3 rc = litDielectric(hr, scale, 0.95, 0.1);
  vec3 col = mix(metal, rc, rust);
  col *= 1.0 - 0.7 * pit;
  return col;
}
`,
  },
  {
    key: "kintsugi",
    label: "Kintsugi",
    category: "earth",
    relief: 0.04,
    light: 140,
    heroTime: 9.5,
    loop: "The cracks fill with gold, then reopen",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A celadon tile, broken and mended the kintsugi way: the mark in white glaze, glaze pooled jade-dark at
// its feet, and cracks running through it all. In the loop gold lacquer runs along the cracks and fills them.
float surface(vec2 uv, vec4 f) {
  return 0.0025 * (vnoise(uv * 3.0 + 1.0) - 0.5);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  // The break: a handful of big shards, their edges roughened.
  vec2 q = uv * 1.6 + 0.12 * vec2(vnoise(uv * 6.0), vnoise(uv * 6.0 + 7.0));
  vec4 v = voronoi(q + 3.7);
  float hair = smoothstep(0.022, 0.006, v.w);
  float seam = smoothstep(0.06, 0.03, v.w);
  // Gold runs out from the top-left corner, along every crack; the joins hold, then reopen.
  float cyc = fract(uTime / 12.0);
  float prog = sat(cyc / 0.75) * 1.25;
  float s = length(uv - vec2(-1.1, 1.3)) / 3.2 + 0.08 * (vnoise(uv * 4.0) - 0.5);
  float gold = smoothstep(prog, prog - 0.05, s) * (1.0 - smoothstep(0.9, 1.0, cyc));
  float fx = (s - prog) / 0.03;
  float front = exp(-fx * fx) * (1.0 - smoothstep(0.75, 0.8, cyc));
  // Each shard sits a hair off true: a slight tilt and tint of its own.
  vec2 off = (hash22(vec2(v.z * 73.1, 2.0)) - 0.5) * 0.06;
  h.wn = normalize(h.wn + uRot * vec3(off.x * h.side, off.y, 0.0));
  // Glaze: celadon ground, white mark, darker jade where it pooled against the raised strokes.
  vec3 glaze = mix(hex(0x8fb59a), hex(0xa3c2a8), vnoise(uv * 5.0));
  glaze = mix(glaze, hex(0x6f9a82), (1.0 - h.h) * smoothstep(0.06, 0.0, h.f.x) * 0.8);
  glaze = mix(glaze, hex(0xeeeae0), h.h);
  glaze *= 0.97 + 0.06 * (v.z - 0.5);
  // Fine craquelure in the glaze.
  float craq = smoothstep(0.03, 0.0, voronoi(uv * 22.0).w) * 0.18;
  glaze *= 1.0 - craq;
  // Unglazed foot on the side walls: buff stoneware.
  glaze = mix(glaze, hex(0xb59a78), smoothstep(0.5, 0.9, h.edge));
  vec3 cer = litDielectric(h, glaze, mix(0.07, 0.8, smoothstep(0.5, 0.9, h.edge)), 1.0);
  cer += glaze * 0.08 * h.ao;   // a little light carried inside the glaze
  // Open cracks are dark hairlines.
  cer *= 1.0 - 0.85 * hair * (1.0 - gold);
  // Gold: lacquer dusted with gold powder, a bead slightly proud of the glaze.
  vec3 gc = vec3(1.0, 0.76, 0.34);
  vec3 g = litMetal(h, gc, 0.28 + 0.1 * vnoise(uv * 80.0));
  g += vec3(1.0, 0.6, 0.16) * (0.08 + 0.3 * sat(dot(h.wn, h.l))) * h.ao;   // the gold powder scatters, it is not a mirror
  g += gc * front * 3.0;
  return mix(cer, g, seam * gold);
}
`,
  },
];
