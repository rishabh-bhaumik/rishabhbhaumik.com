import type { LogoMaterial } from "../types";

/** India — craft traditions across the country. */
export const INDIA: LogoMaterial[] = [
  {
    key: "bidriware",
    label: "Bidriware",
    category: "india",
    relief: 0.008,
    light: 140,
    heroTime: 1.6,
    loop: "The light turns and the inlaid silver glints against the black",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Bidri of Bidar: a zinc-copper alloy turned dead matte black with the soil of the old fort, silver
// hammered into engraved channels and filed flush. The mark is silver sheet laid as close-set wires
// (they run parallel to every edge, as tarkashi does), with a wire poppy vine around the border.
// It sits on maroon velvet, as Bidri is always shown.
float bidriVine(vec2 uv) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float ring = max(smoothstep(0.008, 0.004, abs(r - 1.015)), smoothstep(0.008, 0.004, abs(r - 1.12)));
  float vine = smoothstep(0.0065, 0.003, abs(r - 1.065 - 0.026 * sin(a * 16.0)));
  // Leaves tucked into each crook of the vine, alternating sides.
  float c = fract(a * 16.0 / TAU);
  vec2 q1 = vec2((c - 0.25) * 0.418, r - 1.037);
  vec2 q2 = vec2((c - 0.75) * 0.418, r - 1.093);
  float leaf = 1.0 - smoothstep(0.75, 1.0, min(length(q1 / vec2(0.034, 0.012)), length(q2 / vec2(0.034, 0.012))));
  return max(max(ring, vine), leaf) * step(r, 1.135);
}
// litDielectric / litMetal with one shared shadow (each shade() casts one shadow ray).
vec3 bidriDiel(Hit h, float sh, vec3 albedo, float rough, float spec) {
  float nl = sat(dot(h.wn, h.l));
  vec3 diff = albedo * (nl * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  float fr = fresnel(dot(h.wn, h.v), 0.04);
  vec3 rr = reflect(-h.v, h.wn);
  vec3 refl = mix(studioDiffuse(rr), studioEnv(rr), (1.0 - rough) * (1.0 - rough));
  return diff + spec * (fr * refl * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * vec3(1.0, 0.96, 0.9) * 2.0);
}
vec3 bidriMetal(Hit h, float sh, vec3 base, float rough) {
  vec3 rr = reflect(-h.v, h.wn);
  vec3 env = mix(studioDiffuse(rr) * 2.0, studioEnv(rr), (1.0 - rough) * (1.0 - rough));
  return fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
}
float surface(vec2 uv, vec4 f) {
  // Filed-flush inlay stands a hair proud; the black is a fine, even matte.
  return 0.0012 * (vnoise(uv * 150.0) - 0.5) + 0.002 * bidriVine(uv);
}
vec3 shade(Hit h) {
  float t = uTime * TAU / 8.0;
  setLight(h, lightAt(2.2 + 0.8 * sin(t), 0.5 + 0.18 * cos(2.0 * t)));
  float face = 1.0 - h.edge;
  float inl = (1.0 - smoothstep(-0.004, 0.004, h.f.x)) * face;
  float silver = max(inl, bidriVine(h.uv) * face);
  // Wire lay: tiny ridges parallel to every stroke edge.
  float ph = h.f.x * TAU / 0.011;
  vec2 g = fieldGrad(h.uv, 0);
  h.wn = normalize(h.wn + uRot * vec3(g * sin(ph) * 0.12 * inl, 0.0));
  // The blackened alloy: soft, oiled matte with faint grey mottling.
  float tone = fbm(h.uv * 5.0 + 3.0);
  vec3 zinc = mix(hex(0x0c0c0d), hex(0x1c1a18), tone);
  zinc = mix(zinc, hex(0x242220), 0.3 * smoothstep(0.6, 0.9, vnoise(h.uv * 45.0)));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 black = bidriDiel(h, sh, zinc, 0.5, 0.35);
  vec3 ag = vec3(0.96, 0.95, 0.92);
  float rough = 0.14 + 0.08 * (0.5 + 0.5 * cos(ph)) * inl + 0.08 * vnoise(h.uv * 30.0);
  vec3 met = bidriMetal(h, sh, ag, rough);
  // Tarnish creeps in from the channel walls.
  met *= mix(vec3(1.0), vec3(0.72, 0.66, 0.58), smoothstep(-0.014, 0.0, h.f.x) * inl);
  // The glint: a narrow band of light crossing the silver as the light turns, with pin sparkles in it.
  vec3 r = reflect(-h.v, h.wn);
  float band = exp(-pow((dot(r.xy, vec2(0.8, 0.6)) - 1.1 * sin(t)) / 0.08, 2.0));
  float spark = step(0.993, hash12(floor(h.uv * 240.0)));
  met += ag * band * (3.0 + spark * 20.0) * fresnel(dot(h.wn, h.v), 0.9);
  return mix(black, met, silver);
}
`,
  },
  {
    key: "meenakari",
    label: "Meenakari",
    category: "india",
    relief: 0.0,
    light: 130,
    heroTime: 2.4,
    loop: "A light circles and the enamel flashes colour cell by cell",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Jaipur meenakari: champlevé enamel on gold. Channels are cut into the gold, packed with ground
// glass and fired; thin gold walls (the cloisons) stand between the colours. Ruby glyphs, emerald
// smile, sapphire rim, a border of alternating ruby and emerald petals. The gold under the
// translucent enamel is engine-turned, so the colour flashes as the light moves over it.
float meenaPetal(vec2 uv, out float id) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float s = a * 28.0 / TAU;
  id = mod(floor(s), 2.0);
  vec2 q = vec2((fract(s) - 0.5) * 2.0, (r - 1.07) / 0.04);
  return 1.0 - smoothstep(0.8, 0.92, length(q * vec2(1.25, 1.0)));
}
// litDielectric / litMetal with one shared shadow (each shade() casts one shadow ray).
vec3 meenaDiel(Hit h, float sh, vec3 albedo, float rough, float spec) {
  float nl = sat(dot(h.wn, h.l));
  vec3 diff = albedo * (nl * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  float fr = fresnel(dot(h.wn, h.v), 0.04);
  vec3 rr = reflect(-h.v, h.wn);
  vec3 refl = mix(studioDiffuse(rr), studioEnv(rr), (1.0 - rough) * (1.0 - rough));
  return diff + spec * (fr * refl * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * vec3(1.0, 0.96, 0.9) * 2.0);
}
vec3 meenaMetal(Hit h, float sh, vec3 base, float rough) {
  vec3 rr = reflect(-h.v, h.wn);
  vec3 env = mix(studioDiffuse(rr) * 2.0, studioEnv(rr), (1.0 - rough) * (1.0 - rough));
  return fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
}
// The enamel field inside the mark, stopping short of a gold wall along every edge.
float meenaMark(vec4 f) { return 1.0 - smoothstep(-0.013, -0.009, f.x); }
float surface(vec2 uv, vec4 f) {
  float id;
  float pet = meenaPetal(uv, id);
  // Enamel sits a touch below the gold after firing and polishing.
  return -0.005 * max(meenaMark(f), pet);
}
vec3 shade(Hit h) {
  float t = uTime * TAU / 10.0;
  setLight(h, lightAt(t + 0.6, 0.5 + 0.2 * sin(2.0 * t)));
  float face = 1.0 - h.edge;
  float pid;
  float pet = meenaPetal(h.uv, pid) * face;
  float enMark = meenaMark(h.f) * face;
  // Inner cloisons: gold walls dividing each stroke into separately fired cells.
  vec4 vc = voronoi(h.uv * 11.0 + 2.0);
  float wall2 = smoothstep(0.05, 0.025, vc.w);
  float enamel = max(enMark * (1.0 - wall2), pet);
  vec3 ruby = hex(0xa3001c), emerald = hex(0x006b35), sapphire = hex(0x0b2a96);
  vec3 ec = (h.f.w < h.f.z && h.f.w < h.f.y) ? ruby : (h.f.z < h.f.y ? emerald : sapphire);
  if (enMark < 0.5) ec = pid > 0.5 ? emerald : ruby;
  // Every fired cell takes the colour a little deeper or lighter.
  ec *= 0.8 + 0.4 * vc.z;
  float depth = sat(-h.f.x / 0.035) * enMark;
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  float turn = 0.5 + 0.5 * sin(length(h.uv - vec2(0.0, 0.1)) * 420.0);
  vec3 gold = vec3(1.0, 0.76, 0.33);
  // Light passes through the glass, bounces off the engraved gold and comes back coloured.
  vec3 under = gold * ec * 2.4 * (ggx(h.wn, h.v, h.l, 0.28 + 0.15 * turn) * sh * 3.0 + 0.08 * h.ao);
  vec3 glass = meenaDiel(h, sh, ec * mix(0.55, 0.3, depth), 0.04, 1.0);
  vec3 enamelCol = glass + under * mix(1.0, 0.55, depth);
  // Gold: polished walls, a chased (punch-matted) ground.
  float punch = hash12(floor(h.uv * 160.0));
  float onWall = (1.0 - smoothstep(-0.002, 0.002, h.f.x)) * (1.0 - enamel);
  float rough = mix(0.3 + 0.12 * punch, 0.12, onWall);
  vec3 goldCol = meenaMetal(h, sh, gold, rough) * mix(1.0, 0.85 + 0.15 * punch, (1.0 - onWall) * face);
  return mix(goldCol, enamelCol, enamel);
}
`,
  },
  {
    key: "kundan",
    label: "Kundan",
    category: "india",
    relief: 0.03,
    light: 125,
    heroTime: 0.9,
    loop: "The stones sparkle one after another around the mark",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Kundan: uncut stones bedded in strips of 24-carat foil pressed in cold, so the setting is soft,
// buttery gold that climbs the stones. Polki (uncut diamond) along the glyphs, rubies in the smile,
// emeralds on the rim, a ring of seed pearls round the coin's edge. Each stone has a flat table and irregular
// facets with foil behind it; a sparkle runs from stone to stone around the mark.
#define KUN_CELL 0.068
float kundanPearl(vec2 uv, out vec2 q) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float s = a * 100.0 / TAU;
  q = vec2((fract(s) - 0.5) * TAU * 1.07 / 100.0, r - 1.07);
  return sat(1.0 - dot(q, q) / (0.033 * 0.033));
}
// litDielectric / litMetal with one shared shadow (each shade() casts one shadow ray).
vec3 kundanDiel(Hit h, float sh, vec3 albedo, float rough, float spec) {
  float nl = sat(dot(h.wn, h.l));
  vec3 diff = albedo * (nl * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  float fr = fresnel(dot(h.wn, h.v), 0.04);
  vec3 rr = reflect(-h.v, h.wn);
  vec3 refl = mix(studioDiffuse(rr), studioEnv(rr), (1.0 - rough) * (1.0 - rough));
  return diff + spec * (fr * refl * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * vec3(1.0, 0.96, 0.9) * 2.0);
}
vec3 kundanMetal(Hit h, float sh, vec3 base, float rough) {
  vec3 rr = reflect(-h.v, h.wn);
  vec3 env = mix(studioDiffuse(rr) * 2.0, studioEnv(rr), (1.0 - rough) * (1.0 - rough));
  return fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
}
float surface(vec2 uv, vec4 f) {
  vec2 q;
  float pr = kundanPearl(uv, q);
  // Pearls are domed here only slightly; their roundness comes from the shading normal.
  return 0.012 * pr * (2.0 - pr) + 0.0012 * (vnoise(uv * 120.0) - 0.5);
}
float kundanStones(vec2 uv, out vec2 facet, out float sid, out float part, out float sd, out vec3 star) {
  vec2 cell = floor(uv / KUN_CELL);
  sd = 1.0; facet = vec2(0.0); sid = 0.0; part = 0.0; star = vec3(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(float(i), float(j));
    vec2 centre = (c + 0.5 + (hash22(c) - 0.5) * 0.35) * KUN_CELL;
    vec4 fc = field(centre);
    // A stone only where the stroke is wide enough to hold it.
    float rad = min(-fc.x - 0.007, 0.027);
    if (rad < 0.012) continue;
    vec2 q = uv - centre;
    float rot = hash12(c + 7.3) * TAU;
    float a = atan(q.y, q.x);
    float r = length(q);
    float d = r * (1.0 + 0.07 * cos(6.0 * (a + rot)) + 0.05 * cos(3.0 * a - rot)) - rad;
    float id = hash12(c + 1.7);
    // Sparkle in turn: a wave travels round the mark, each stone flaring once per lap.
    float ph = fract(uTime / 6.0 - aroundMark(centre) - 0.12 * id);
    float flare = exp(-pow(min(ph, 1.0 - ph) * 22.0, 2.0));
    vec2 gq = q - vec2(cos(rot), sin(rot)) * rad * 0.35;
    float g2 = dot(gq, gq);
    star += flare * vec3(1.0, 0.97, 0.9) * (exp(-g2 * 9000.0) * 6.0 +
      (exp(-abs(gq.x) * 420.0 - abs(gq.y) * 55.0) + exp(-abs(gq.y) * 420.0 - abs(gq.x) * 55.0)) * 1.2);
    if (d < sd) {
      sd = d; sid = id;
      part = (fc.w < fc.z && fc.w < fc.y) ? 0.0 : (fc.z < fc.y ? 1.0 : 2.0);
      float fa = (floor((a + rot) / (TAU / 7.0)) + 0.5) * (TAU / 7.0) - rot;
      float tilt = sat((r / rad - 0.45) / 0.55);
      facet = vec2(cos(fa), sin(fa)) * tilt * 0.55;
    }
  }
  return 1.0 - smoothstep(-0.0015, 0.0015, sd);
}
vec3 shade(Hit h) {
  float t = uTime * TAU / 6.0;
  setLight(h, lightAt(2.1 + 0.35 * sin(t), 0.6));
  float face = step(h.edge, 0.5);
  vec2 facet; float sid, part, sd; vec3 star;
  float stone = kundanStones(h.uv, facet, sid, part, sd, star) * face;
  vec3 gold = vec3(1.0, 0.71, 0.29);
  // Foil setting: soft, buttery, burnished where it laps over each stone.
  float lip = (1.0 - smoothstep(0.0, 0.007, sd)) * step(0.0, sd);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 col = kundanMetal(h, sh, gold, mix(0.34, 0.14, lip) + 0.1 * vnoise(h.uv * 60.0));
  // Seed pearls.
  vec2 pq;
  float pearl = kundanPearl(h.uv, pq);
  if (pearl > 0.001 && face > 0.5) {
    float a = atan(h.uv.y, h.uv.x);
    vec2 off = vec2(-sin(a), cos(a)) * pq.x + vec2(cos(a), sin(a)) * pq.y;
    float nz = sqrt(max(0.033 * 0.033 - dot(pq, pq), 0.0));
    Hit hp = h;
    hp.wn = normalize(uRot * normalize(vec3(off.x * h.side, off.y, h.side * nz)));
    vec3 pc = kundanDiel(hp, sh, vec3(0.9, 0.87, 0.82), 0.25, 0.9);
    col = pc * mix(vec3(1.0), thinFilm(0.32, sat(dot(hp.wn, h.v))), 0.15);
  }
  // Stones: a facet normal, foil light coming back through the body, a sharp surface reflection.
  if (stone > 0.0) {
    Hit hs = h;
    hs.wn = normalize(uRot * normalize(vec3(facet.x * h.side, facet.y, h.side)));
    vec3 body = part < 0.5 ? mix(vec3(0.8, 0.79, 0.76), vec3(0.62, 0.6, 0.58), sid) : (part < 1.5 ? hex(0x9a0018) : hex(0x00663a));
    if (part < 0.5) body *= 0.85 + 0.3 * vnoise(h.uv * 80.0);
    float cosv = sat(dot(hs.wn, h.v));
    vec3 through = body * mix(vec3(1.0), gold, part < 0.5 ? 0.45 : 0.15) *
      (0.3 + 1.4 * ggx(hs.wn, h.v, h.l, 0.35) + 0.4 * sat(dot(hs.wn, h.l)));
    vec3 refl = fresnel(cosv, part < 0.5 ? 0.17 : 0.08) * studioEnv(reflect(-h.v, hs.wn)) + ggx(hs.wn, h.v, h.l, 0.05) * 3.0;
    col = mix(col, through + refl, stone);
  }
  return col + star * face;
}
`,
  },
  {
    key: "pietra-dura",
    label: "Pietra Dura",
    category: "india",
    relief: 0.0,
    light: 120,
    heroTime: 7.5,
    loop: "Moonlight on the marble turns to dawn and back",
    glsl: /* glsl */ `
// Pietra dura (parchin kari), as on the Taj Mahal: Makrana marble cut away and filled flush with
// hand-ground stone. Lapis lazuli with pyrite flecks on the rim, banded carnelian in the smile,
// malachite in the glyphs (its bands follow the outline, as a cutter would choose them), a border
// of carnelian flowers on a malachite vine and a black-stone edge ring. Moonlight turns to dawn.
float pdCycle() { return 0.5 - 0.5 * cos(uTime * TAU / 12.0); }
vec3 pdSky(vec3 d, float c) {
  float up = sat(d.y * 0.5 + 0.5);
  vec3 night = mix(vec3(0.004, 0.006, 0.02), vec3(0.01, 0.018, 0.06), up);
  night += vec3(0.5, 0.6, 0.9) * 2.5 * smoothstep(0.995, 0.999, dot(d, normalize(vec3(-0.5, 0.7, 0.5))));
  vec3 dawn = mix(vec3(0.9, 0.42, 0.2), vec3(0.18, 0.28, 0.6), smoothstep(0.35, 0.85, up));
  dawn += vec3(1.0, 0.7, 0.45) * 3.0 * smoothstep(0.96, 0.995, dot(d, normalize(vec3(0.9, -0.05, 0.4))));
  return mix(night, dawn * 0.8, c);
}
// Border flowers: twelve five-petal carnelian flowers with jasper eyes on a malachite vine, a
// leaf pair either side of each, laid in the band between the rim and the coin's edge.
float pdFlower(vec2 uv, out float leaf, out float eye) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float s = a * 12.0 / TAU;
  vec2 q = vec2((fract(s) - 0.5) * TAU * 1.06 / 12.0, r - 1.06);
  float qr = length(q), qa = atan(q.y, q.x);
  float petal = 1.0 - smoothstep(0.0, 0.003, qr - 0.04 * (0.3 + 0.7 * pow(abs(cos(qa * 2.5)), 1.4)));
  eye = 1.0 - smoothstep(0.0, 0.003, qr - 0.011);
  vec2 lq = vec2(abs(q.x) - 0.1, q.y);
  float l1 = length((rot2(0.45) * lq) / vec2(0.052, 0.015));
  float stem = (1.0 - smoothstep(0.002, 0.0035, abs(q.y - 0.006 * sin(q.x * 40.0)))) * step(0.04, abs(q.x));
  leaf = max(1.0 - smoothstep(0.92, 1.0, l1), stem);
  return petal;
}
vec3 shade(Hit h) {
  float c = pdCycle();
  setLight(h, normalize(mix(lightAt(2.0, 1.0), lightAt(0.15, 0.22), c)));
  vec3 lc = mix(vec3(0.42, 0.52, 0.85) * 0.9, vec3(1.0, 0.6, 0.38) * 2.2, c);
  vec3 amb = mix(vec3(0.015, 0.022, 0.05), vec3(0.16, 0.11, 0.1), c);
  vec2 uv = h.uv;
  float face = 1.0 - h.edge;
  // Makrana marble: warm white, faint grey veins and cloud.
  vec2 w = vec2(fbm(uv * 1.8), fbm(uv * 1.8 + 5.2));
  float vn = abs(snoise(uv * 1.1 + w * 1.6));
  vec3 alb = mix(vec3(0.86, 0.85, 0.81), vec3(0.79, 0.78, 0.75), w.x);
  alb = mix(alb, vec3(0.5, 0.51, 0.53), smoothstep(0.05, 0.0, vn) * 0.55 + smoothstep(0.25, 0.0, vn) * 0.12);
  float rough = 0.14, sparkle = 0.0;
  float inl = (1.0 - smoothstep(-0.003, 0.003, h.f.x)) * face;
  if (inl > 0.0) {
    vec3 st;
    if (h.f.y <= h.f.z && h.f.y <= h.f.w) {
      // Lapis: deep ultramarine, calcite clouds, pyrite flecks.
      st = mix(hex(0x13216a), hex(0x2b48b5), vnoise(uv * 22.0));
      st = mix(st, vec3(0.6, 0.62, 0.7), 0.35 * smoothstep(0.72, 0.9, vnoise(uv * 9.0 + 4.0)));
      sparkle = step(0.982, hash12(floor(uv * 320.0)));
    } else if (h.f.z <= h.f.w) {
      // Carnelian: translucent orange-red with soft banding.
      float b = 0.5 + 0.5 * sin(h.f.z * 230.0 + 4.0 * vnoise(uv * 7.0));
      st = mix(hex(0x8c2412), hex(0xd8622c), b);
    } else {
      // Malachite: bands parallel to the glyph outline.
      float b = 0.5 + 0.5 * sin(h.f.w * 300.0 + 3.0 * vnoise(uv * 10.0));
      st = mix(hex(0x07331c), hex(0x2a9d5c), smoothstep(0.15, 0.85, b));
      st *= 0.75 + 0.25 * smoothstep(0.0, 0.1, b);
    }
    alb = mix(alb, st, inl);
    rough = mix(rough, 0.08, inl);
  }
  float leaf, eye;
  float petal = pdFlower(uv, leaf, eye) * face;
  alb = mix(alb, hex(0x1f7a46), leaf * face);
  alb = mix(alb, hex(0xc4471d), petal);
  alb = mix(alb, hex(0xd8a020), eye * face);
  // The black-stone edge ring.
  float frame = (1.0 - smoothstep(0.004, 0.006, abs(length(uv) - 1.118))) * face;
  alb = mix(alb, vec3(0.012), frame);
  // Hairline seams where each piece meets the marble.
  alb *= 1.0 - 0.45 * smoothstep(0.0035, 0.0, abs(h.f.x)) * face;
  float nl = sat(dot(h.wn, h.l));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 col = alb * (lc * nl * sh + amb * h.ao * 2.0);
  // Marble glows a little from light scattered inside it.
  col += alb * lc * 0.07 * (1.0 - inl);
  vec3 r = reflect(-h.v, h.wn);
  col += fresnel(dot(h.wn, h.v), 0.045) * pdSky(r, c) * h.ao;
  col += ggx(h.wn, h.v, h.l, rough) * sh * lc * 1.2;
  col += sparkle * inl * vec3(1.0, 0.8, 0.4) * ggx(h.wn, h.v, h.l, 0.3) * sh * lc * 6.0;
  return col;
}
`,
  },
  {
    key: "chola-bronze",
    label: "Chola Bronze",
    category: "india",
    relief: 0.045,
    light: 210,
    heroTime: 2.2,
    loop: "An oil-lamp flame flickers across the bronze",
    glsl: /* glsl */ `
#define HAS_SDF
// Chola bronze, lost-wax cast, as a temple medallion: the mark stands in rounded, poured relief,
// the rim joined into a ring of flame tongues like a Nataraja's prabhavali. Near-black patina,
// rubbed back to gold-bronze on every high point by centuries of hands and cloths, with a dab of
// sandal paste and kumkum from the morning puja. Lit only by an oil lamp in the sanctum.
float cholaFlicker() {
  return 0.82 + 0.1 * sin(uTime * 11.0 + 2.0 * sin(uTime * 3.7)) + 0.08 * (vnoise(vec2(uTime * 7.0, 0.5)) * 2.0 - 1.0);
}
vec3 cholaLamp() { return normalize(vec3(-0.5 + 0.05 * sin(uTime * 5.3), -0.45, 0.75)); }
// The relief's outline: the mark, a ring along the rim's outer edge, and flame tongues off it.
float cholaShape(vec2 uv, vec4 f) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float d = min(f.x + 0.004, abs(r - 1.0) - 0.01);
  float s = a * 36.0 / TAU;
  float y = r - 1.0;
  float x = (fract(s) - 0.5) * TAU / 36.0 + 0.008 * sin(y * 90.0);
  return min(d, max(abs(x) - 0.022 * (1.0 - sat(y / 0.09)), max(-y, y - 0.09)));
}
// Rounded cast profile: 0 at the outline rising to 1 in the middle of the wider members.
float cholaProfile(vec2 uv, vec4 f) { return smoothstep(-0.01, 0.045, -cholaShape(uv, f)); }
float materialSDF(vec3 p) {
  float T = COIN_T, R = COIN_BEVEL;
  vec2 w = vec2(coin2D(p.xy) + R, abs(p.z) - T + R);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - R;
  vec2 uv = (p.z >= 0.0 ? p.xy : vec2(-p.x, p.y));
  vec4 f = field(uv);
  float onFace = smoothstep(T * 0.35, T, abs(p.z));
  // Relief plus the casting skin.
  float rel = uRelief * cholaProfile(uv, f) + 0.003 * (vnoise(uv * 24.0) - 0.5);
  return slab - rel * onFace;
}
vec3 shade(Hit h) {
  float fl = cholaFlicker();
  vec3 ld = cholaLamp();
  setLight(h, ld);
  vec3 flame = vec3(1.0, 0.56, 0.22) * 4.2 * fl;
  float prof = cholaProfile(h.uv, h.f) * (1.0 - h.edge);
  // High points: the crown of each rounded member, and the medallion's rim, worn by hands.
  float crown = smoothstep(0.45, 0.9, prof) * smoothstep(0.8, 0.97, abs(h.n.z));
  float lip = smoothstep(0.2, 0.5, h.edge) * (1.0 - smoothstep(0.7, 0.95, h.edge));
  float wear = sat((crown + lip * 0.6) * smoothstep(0.3, 0.62, fbm(h.uv * 7.0 + 1.0)) * 1.5);
  vec3 patina = mix(hex(0x221c12), hex(0x34402a), fbm(h.uv * 3.0 + 8.0)) * mix(0.6, 1.0, h.ao);
  vec3 bronze = vec3(0.93, 0.63, 0.36);
  vec3 r = reflect(-h.v, h.wn);
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 10.0);
  float nl = sat(dot(h.wn, h.l));
  // The sanctum is dark: the only thing to reflect is the lamp.
  vec3 env = flame * 1.4 * pow(sat(dot(r, ld)), 4.0) + flame * 0.06 + vec3(0.012, 0.009, 0.006);
  vec3 F = fresnel3(dot(h.wn, h.v), bronze);
  vec3 metal = F * (env * h.ao + ggx(h.wn, h.v, h.l, mix(0.5, 0.2, wear)) * sh * flame * 2.2);
  vec3 dull = patina * (nl * sh * flame * 0.8 + vec3(0.05, 0.035, 0.02) * h.ao) + 0.05 * ggx(h.wn, h.v, h.l, 0.55) * sh * flame;
  vec3 col = mix(dull, metal, wear);
  // Sandal paste with a kumkum dot on the crown dash.
  vec2 kq = h.uv - vec2(0.0, 0.957);
  float n = vnoise(h.uv * 60.0);
  float sandal = smoothstep(0.04, 0.03, length(kq * vec2(0.8, 1.6)) + 0.01 * n);
  float kum = smoothstep(0.016, 0.012, length(kq) + 0.004 * n);
  vec3 paste = mix(hex(0xc89a4a), hex(0xb0100c), kum);
  float dab = max(sandal, kum) * (1.0 - h.edge) * step(0.0, h.side);
  return mix(col, paste * (nl * sh * flame * 0.7 + 0.03), dab);
}
`,
  },
  {
    key: "block-print",
    label: "Block Print",
    category: "india",
    relief: 0.0,
    light: 120,
    heroTime: 8.4,
    loop: "The outline block, then the madder block, come down and lift; the ink soaks in, the cloth is washed, then printed again",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Hand block printing, as in Bagru and Sanganer, on a disc of unbleached cotton.
// A carved teak block comes down: its shadow first, sharpening as it falls, then contact. The
// printer thumps it, lifts it away, and the ink is left behind. The black outline block goes first
// (the mark's keyline and a zigzag border), then the madder-red fill block, never quite in register.
// The ink wicks into the cotton fibres, the cloth is washed (dark and wet, the print softening), it
// dries, and a fresh length is pulled under for the next print.
#define BP_LOOP 14.0
float bpP() { return fract(uTime / BP_LOOP); }
// Block height for a stamp starting at t0: 1 = up and away, 0 = on the cloth.
float bpLift(float p, float t0) { return 1.0 - smoothstep(t0, t0 + 0.045, p) + smoothstep(t0 + 0.09, t0 + 0.135, p); }
// Where the block is over the cloth: comes in from the upper left, leaves to the right.
vec2 bpOffset(float p, float t0, float hgt) { return p < t0 + 0.07 ? vec2(-2.2, 1.7) * hgt : vec2(2.4, 0.6) * hgt; }
float surface(vec2 uv, vec4 f) {
  // Cotton slubs in the weft.
  return 0.0015 * (vnoise(vec2(uv.x * 4.0, uv.y * 180.0)) - 0.5);
}
vec3 shade(Hit h) {
  float p = bpP();
  float k = floor(uTime / BP_LOOP);
  float face = 1.0 - h.edge;
  // The printed length slides away at the end and fresh cloth comes under.
  float slide = 3.2 * smoothstep(0.9, 1.0, p);
  vec2 uv = h.uv + vec2(slide, 0.0);
  float onCloth = step(abs(uv.x), 1.25) * face;
  float wAA = sat(1.0 - fwidth(h.uv.x * 520.0) / 2.5);
  float weave = 0.5 + 0.5 * sin(h.uv.x * 520.0) * sin(h.uv.y * 520.0) * wAA;
  float slub = vnoise(vec2(h.uv.x * 4.0, h.uv.y * 180.0));
  vec3 cloth = mix(hex(0xd9cdb3), hex(0xe9dfc8), slub) * (0.94 + 0.06 * weave);
  // Ink soaking along the fibres, then washing out softer.
  float soak = smoothstep(0.46, 0.62, p);
  float washing = smoothstep(0.66, 0.72, p) * (1.0 - smoothstep(0.8, 0.88, p));
  float washed = smoothstep(0.68, 0.8, p);
  float fibre = vnoise(vec2(uv.x * 220.0, uv.y * 9.0)) * 0.6 + vnoise(vec2(uv.x * 9.0, uv.y * 220.0)) * 0.4;
  float bleed = (0.004 + 0.008 * fibre) * soak + 0.008 * washed;
  float rough = 0.005 * (vnoise(uv * 45.0) - 0.5);
  // Block 1: keyline and border. Block 2: madder fill, off register by a different amount each print.
  float tK = 0.03, tF = 0.24;
  vec4 fK = field(uv);
  float rB = length(uv), aB = atan(uv.y, uv.x);
  float zig = abs(rB - 1.075 - 0.018 * (abs(fract(aB * 40.0 / TAU) - 0.5) * 4.0 - 1.0));
  float bd = min(min(abs(rB - 1.04), abs(rB - 1.11)), zig);
  float keyl = 1.0 - smoothstep(0.006 + bleed, 0.009 + bleed * 1.6, min(abs(fK.x + rough), bd));
  vec2 offF = (hash22(vec2(k, 3.0)) - 0.5) * 0.035;
  float fF = field(uv - offF).x + 0.006 + rough;
  float fill = 1.0 - smoothstep(-0.004 - bleed * 0.5, 0.001 + bleed * 1.6, fF);
  float inkK = (0.72 + 0.28 * vnoise(uv * 38.0 + k * 13.1)) * step(0.1, hash12(floor(uv * 260.0) + k * 7.0));
  float inkF = (0.72 + 0.28 * vnoise(uv * 33.0 + k * 5.3)) * step(0.1, hash12(floor(uv * 250.0) + k * 3.0));
  float onK = step(tK + 0.05, p), onF = step(tF + 0.05, p);
  float fresh = max(onK * exp(-max(p - tK - 0.05, 0.0) * 9.0) * keyl, onF * exp(-max(p - tF - 0.05, 0.0) * 9.0) * fill);
  float fade = 1.0 - 0.35 * washed;
  vec3 iron = mix(hex(0x231915), hex(0x5a4a40), 0.5 * washed);
  vec3 madder = mix(hex(0x9c2219), hex(0xb9524a), 0.6 * washed);
  vec3 col = cloth;
  col = mix(col, madder * (0.85 + 0.15 * weave), fill * onF * inkF * onCloth * fade);
  col = mix(col, iron * (0.85 + 0.15 * weave), keyl * onK * inkK * onCloth * fade);
  // Washing: the cloth darkens with water and the water runs across it.
  float ripple = 0.5 + 0.5 * sin(dot(h.uv, vec2(9.0, 4.0)) - p * 180.0 + 3.0 * vnoise(h.uv * 3.0));
  col *= 1.0 - washing * (0.35 + 0.1 * ripple);
  // The blocks: shadow while above, the teak block itself while close.
  float shadow = 0.0, wood = 0.0;
  vec2 wq = vec2(0.0);
  for (int b = 0; b < 2; b++) {
    float t0 = b == 0 ? tK : tF;
    if (p < t0 - 0.03 || p > t0 + 0.16) continue;
    float hgt = p < t0 ? 1.0 + (t0 - p) * 25.0 : bpLift(p, t0);
    vec2 off = bpOffset(p, t0, hgt);
    float sc = 1.0 + 0.4 * hgt;
    vec2 bq = (h.uv - off) / sc;
    float inB = 1.0 - smoothstep(-0.005, 0.005, sdBox2(bq, vec2(1.3), 0.08));
    if (hgt < 0.97 && inB > wood) { wood = inB; wq = bq; }
    float blur = 0.12 * hgt + 0.01;
    // Light from the upper left: the shadow lands ahead of the block, on the cloth.
    vec2 sq = h.uv - off - vec2(1.25, -1.0) * hgt;
    shadow = max(shadow, max(0.6 - 0.2 * hgt, 0.0) * (1.0 - smoothstep(-blur, blur, sdBox2(sq, vec2(1.3), 0.08))));
  }
  col *= 1.0 - shadow;
  vec3 alb = col;
  float rgh = mix(0.95, 0.4, max(fresh, washing));
  float spc = mix(0.12, 0.6, max(fresh, washing));
  if (wood > 0.0) {
    // The back of the block: teak with its grain, a turned handle knob in the middle.
    float grain = vnoise(vec2(wq.x * 3.0, wq.y * 70.0 + 4.0 * vnoise(wq * 2.0)));
    vec3 teak = mix(hex(0x5a3518), hex(0x8a5a2e), grain);
    float knob = length(wq);
    teak = mix(teak, hex(0x3e2410), (1.0 - smoothstep(0.24, 0.26, knob)) * 0.6);
    teak *= 1.0 + 0.5 * (1.0 - smoothstep(0.0, 0.22, length(wq + vec2(0.06, -0.06)))) * (1.0 - smoothstep(0.24, 0.26, knob));
    alb = mix(alb, teak * 1.3, wood);
    rgh = mix(rgh, 0.6, wood);
    spc = mix(spc, 0.2, wood);
  }
  return litDielectric(h, alb, rgh, spc);
}
`,
  },
  {
    key: "bandhani",
    label: "Bandhani",
    category: "india",
    relief: 0.0,
    light: 125,
    heroTime: 12.9,
    loop: "Knots are tied along the strokes, red dye floods in, then the cloth is pulled taut and the knots pop open",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Bandhani of Kutch and Jamnagar, the whole process on one disc of white cotton.
// The binder pinches the cloth along the strokes into tiny knots and binds each with thread; they
// rise one by one into a field of bumps, crinkling the cloth. Red dye floods in from the edge and
// soaks everything except the bound tips. The cloth is pulled taut, the crinkles flatten, and the
// knots pop open one by one, each leaving a white ring with a dyed speck at its centre: the mark,
// drawn in dots. Then a fresh white cloth is laid over and it starts again.
#define BH_LOOP 15.0
#define BH_CELL 0.032
float bhP() { return fract(uTime / BH_LOOP); }
// The loop time seen by this patch of cloth: a fresh cloth slides over from the right at the end.
float bhLocalP(vec2 uv) {
  float p = bhP();
  float x = 1.3 - 2.6 * smoothstep(0.9, 0.99, p);
  return uv.x + 0.1 * uv.y * uv.y > x ? 0.0 : p;
}
// The knot in this cell: x = height 0..1, y = open 0..1, z = distance to its centre, w = 1 if there is a knot.
vec4 bhKnot(vec2 uv, float p) {
  vec2 c = floor(uv / BH_CELL);
  vec2 ctr = (c + 0.5 + (hash22(c) - 0.5) * 0.25) * BH_CELL;
  if (field(ctr).x > -0.006) return vec4(0.0, 0.0, 1.0, 0.0);
  float o = 0.7 * aroundMark(ctr) + 0.3 * hash12(c + 4.1);
  float tied = smoothstep(0.02 + 0.22 * o, 0.04 + 0.22 * o, p);
  float pop = 0.57 + 0.26 * o;
  float open = smoothstep(pop, pop + 0.004, p);
  // A popped knot springs flat with a little bounce.
  float bounce = open * 0.35 * sin((p - pop) * 260.0) * exp(-max(p - pop, 0.0) * 140.0);
  return vec4(tied * (1.0 - open) + bounce, open, length(uv - ctr), 1.0);
}
float surface(vec2 uv, vec4 f) {
  float p = bhLocalP(uv);
  vec4 k = bhKnot(uv, p);
  float bump = k.w * k.x * pow(sat(1.0 - k.z * k.z / (0.014 * 0.014)), 2.0) * 0.009;
  // Pinching crinkles the cloth; pulling it taut flattens it.
  float tied = smoothstep(0.02, 0.26, p) * (1.0 - smoothstep(0.48, 0.56, p));
  return bump + tied * 0.006 * (vnoise(uv * 9.0) - 0.5) + 0.0015 * (vnoise(uv * 40.0) - 0.5);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float p = bhLocalP(uv);
  float face = 1.0 - h.edge;
  vec4 k = bhKnot(uv, p);
  // Dye floods in from the edge (0.27 - 0.4), wet and dark at first, drying brighter.
  float r = length(uv);
  float dyeT = 0.27 + 0.1 * (1.14 - r) / 1.14 + 0.03 * vnoise(uv * 5.0);
  float dyed = smoothstep(dyeT, dyeT + 0.015, p);
  float wet = dyed * (1.0 - smoothstep(dyeT + 0.02, 0.55, p));
  vec3 white = hex(0xf2eee4);
  vec3 red = mix(hex(0x8e0b16), hex(0xc4161f), vnoise(uv * 7.0)) * (1.0 - 0.35 * wet);
  // The bound tip resists the dye; open, it is a white ring round a dyed speck.
  float tip = k.w * (1.0 - k.y) * (1.0 - smoothstep(0.0055, 0.008, k.z));
  float ringR = mix(0.008, 0.0145, k.y);
  float ring = k.w * k.y * (1.0 - smoothstep(ringR * 0.8, ringR, k.z));
  float speck = k.w * k.y * (1.0 - smoothstep(0.0018, 0.0032, k.z));
  float resist = max(tip, ring) * (1.0 - speck);
  vec3 alb = mix(white, red, dyed * (1.0 - resist));
  // Thread wrapped round each bound knot.
  float thread = k.w * (1.0 - k.y) * step(0.5, k.x) * (1.0 - smoothstep(0.009, 0.011, k.z)) * step(0.5, fract(k.z * 520.0));
  alb = mix(alb, hex(0xe8e2d2), thread * 0.8);
  vec3 col = litDielectric(h, alb * face + alb * h.edge * 0.8, mix(0.9, 0.5, wet), mix(0.12, 0.6, wet));
  // Cotton sheen at grazing angles.
  return col + alb * 0.25 * pow(1.0 - sat(dot(h.wn, h.v)), 3.0);
}
`,
  },
  {
    key: "warli",
    label: "Warli",
    category: "india",
    relief: 0.0,
    light: 130,
    heroTime: 1.0,
    loop: "The tarpa circle dances: a wave of steps runs round the linked figures",
    glsl: /* glsl */ `
#define HAS_SURFACE
// Warli, from the Sahyadri villages: white rice paste on an ochre mud-and-dung disc. The mark in the middle;
// around it a tarpa dance, eighteen figures built from the Warli vocabulary (two triangles, a circle, stick
// limbs), hands linked. The only motion is the dance: a wave of steps runs round the circle, the figures hop
// and stamp, knees lift and the linked arms rise and fall with their neighbours.
#define WL_S 0.8
#define WL_N 18.0
#define WL_F 1.6
float wlSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * sat(dot(pa, ba) / dot(ba, ba))); }
float wlTri(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2;
  vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 pq0 = v0 - e0 * sat(dot(v0, e0) / dot(e0, e0));
  vec2 pq1 = v1 - e1 * sat(dot(v1, e1) / dot(e1, e1));
  vec2 pq2 = v2 - e2 * sat(dot(v2, e2) / dot(e2, e2));
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                   vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                   vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
// Hop height (figure units) of dancer i: a wave of steps running round the circle.
float wlHop(float i, float amp) { return amp * 0.034 * max(0.0, sin(uTime * TAU * 1.25 - i * 0.7)); }
// One dancer, feet on y = 0, head up. hw = half the spacing; hL/hR = the neighbours' hops.
float wlDancer(vec2 q, float i, float amp, float hw, float hL, float hR) {
  float ph = uTime * TAU * 1.25 - i * 0.7;
  float hop = wlHop(i, amp);
  float sway = amp * 0.005 * sin(ph * 0.5);
  vec2 o = vec2(sway, hop);
  float d = wlTri(q, o + vec2(-0.021, 0.1), o + vec2(0.021, 0.1), o + vec2(0.0, 0.068));
  d = min(d, wlTri(q, o + vec2(0.0, 0.068), o + vec2(-0.017, 0.042), o + vec2(0.017, 0.042)));
  d = min(d, length(q - o - vec2(0.0, 0.124)) - 0.013);
  float l = wlSeg(q, o + vec2(0.0, 0.1), o + vec2(0.0, 0.112));
  // Legs: one knee lifts while the other foot stamps, then they swap.
  float liftL = amp * max(0.0, sin(ph + 1.2)), liftR = amp * max(0.0, -sin(ph + 1.2));
  vec2 hipL = o + vec2(-0.01, 0.044), hipR = o + vec2(0.01, 0.044);
  vec2 footL = vec2(-0.024, 0.0) + vec2(0.006, 0.03) * liftL + vec2(0.0, hop * (1.0 - liftL));
  vec2 footR = vec2(0.024, 0.0) + vec2(-0.006, 0.03) * liftR + vec2(0.0, hop * (1.0 - liftR));
  vec2 kneeL = mix(hipL, footL, 0.5) + vec2(-0.016, 0.004) * liftL;
  vec2 kneeR = mix(hipR, footR, 0.5) + vec2(0.016, 0.004) * liftR;
  l = min(l, min(wlSeg(q, hipL, kneeL), wlSeg(q, kneeL, footL)));
  l = min(l, min(wlSeg(q, hipR, kneeR), wlSeg(q, kneeR, footR)));
  // Arms: linked, so each hand meets the neighbour's halfway between their shoulders.
  vec2 shL = o + vec2(-0.02, 0.099), shR = o + vec2(0.02, 0.099);
  vec2 handL = vec2(-hw, 0.088 + 0.5 * (hop + hL)), handR = vec2(hw, 0.088 + 0.5 * (hop + hR));
  vec2 elL = mix(shL, handL, 0.45) + vec2(0.0, -0.018 + 0.01 * amp * sin(ph));
  vec2 elR = mix(shR, handR, 0.45) + vec2(0.0, -0.018 + 0.01 * amp * sin(ph));
  l = min(l, min(wlSeg(q, shL, elL), wlSeg(q, elL, handL)));
  l = min(l, min(wlSeg(q, shR, elR), wlSeg(q, elR, handR)));
  return min(d, l - 0.0045);
}
float surface(vec2 uv, vec4 f) {
  // Hand-smoothed mud: broad undulation and grit.
  return 0.007 * (fbm(uv * 4.0) - 0.5) + 0.0025 * (vnoise(uv * 70.0) - 0.5);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float face = 1.0 - h.edge;
  float r = length(uv), a = atan(uv.y, uv.x);
  float n = vnoise(uv * 50.0);
  // The mark, fully drawn.
  vec2 mu = uv / WL_S;
  float markD = field(mu).x * WL_S + 0.005 * (n - 0.5);
  float m1 = 1.0 - smoothstep(-0.002, 0.002, markD);
  // The dancers, always dancing.
  float s = a * WL_N / TAU;
  float i = floor(s);
  float r0 = 0.83;
  float hw = PI * (r0 + 0.088 * WL_F) / WL_N / WL_F;
  vec2 q = vec2((fract(s) - 0.5) * TAU * r / WL_N, r - r0) / WL_F;
  float dd = wlDancer(q, i, 1.0, hw, wlHop(i - 1.0, 1.0), wlHop(i + 1.0, 1.0)) * WL_F;
  float m2 = 1.0 - smoothstep(-0.0015, 0.0015, dd + 0.002 * (n - 0.5));
  float cover = max(m1, m2);
  // Rice paste: chalky and uneven.
  cover *= (0.7 + 0.3 * n) * step(0.12, hash12(floor(uv * 420.0)));
  // Mud: ochre with dung-plaster swirls and straw.
  vec3 wall = mix(hex(0x7a3d20), hex(0xa4612f), fbm(uv * 2.5 + 1.0));
  wall *= 0.92 + 0.08 * sin(length(uv - vec2(1.3, -1.5)) * 55.0 + vnoise(uv * 4.0) * 3.0);
  float straw = smoothstep(0.82, 0.9, vnoise(rot2(0.6) * uv * vec2(8.0, 140.0)));
  wall = mix(wall, hex(0xc99a55), straw * 0.35);
  vec3 alb = mix(wall, vec3(0.93, 0.9, 0.84), cover * face);
  return litDielectric(h, alb, 0.95, 0.08);
}
`,
  },
  {
    key: "blue-pottery",
    label: "Studio Porcelain",
    category: "india",
    relief: 0.0,
    light: 135,
    heroTime: 11.8,
    loop: "One firing: raw glaze glows in the kiln, melts and flows to gloss, then crazes crack by crack as it cools",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A studio porcelain coin, the kind Kolkata's studio potters fire: a white porcelain body, the mark
// brushed in cobalt (the rim dashes in a celadon glaze) under a clear glaze.
// The loop is one firing. A matte, chalky raw-glaze coat, pocked with pinholes and holding the pale
// unfired pigment. The kiln heats and the coin glows red, then orange. The glaze melts and flows:
// ripples run down it, the pinholes heal, and gloss arrives. It cools, the cobalt comes up deep blue,
// and the glaze crazes, one crack "pinging" in at a time. Then the coin is dipped in raw glaze again.
#define CK_LOOP 14.0
float ckP() { return fract(uTime / CK_LOOP); }
float ckHeat(float p) { return smoothstep(0.1, 0.36, p) * (1.0 - smoothstep(0.46, 0.68, p)); }
float ckMelt(float p) { return smoothstep(0.26, 0.44, p); }
// The next dip: a front of raw glaze running down the coin.
float ckDip(vec2 uv, float p) {
  float front = 1.25 - 2.6 * smoothstep(0.86, 0.97, p);
  return smoothstep(front - 0.03, front + 0.03, uv.y + 0.04 * sin(uv.x * 9.0));
}
// 1 where the glaze is raw (unfired) powder, 0 where it has melted to glass.
float ckRaw(vec2 uv, float p) { return max(1.0 - ckMelt(p), ckDip(uv, p)); }
// Pinholes in the raw coat; they shrink and heal as the glaze melts.
float ckPinhole(vec2 uv, float raw) {
  vec2 c = floor(uv / 0.045);
  vec2 ctr = (c + 0.5 + (hash22(c) - 0.5) * 0.5) * 0.045;
  float rad = 0.0085 * step(0.55, hash12(c + 1.3)) * raw;
  return 1.0 - smoothstep(rad * 0.6, rad, length(uv - ctr));
}
float surface(vec2 uv, vec4 f) {
  float p = ckP();
  float raw = ckRaw(uv, p);
  // Raw glaze is a dry, lumpy powder coat; molten glaze levels itself flat.
  return raw * 0.004 * (vnoise(uv * 28.0) - 0.5) - 0.005 * ckPinhole(uv, raw);
}
// Voronoi edges with an id per edge (shared by the two cells it separates).
vec2 ckCraze(vec2 x, out float eid) {
  vec2 n = floor(x), fr = fract(x);
  float d1 = 8.0, d2 = 8.0;
  vec2 c1 = vec2(0.0), c2 = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    float d = length(g + hash22(n + g) - fr);
    if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = n + g; } else if (d < d2) { d2 = d; c2 = n + g; }
  }
  eid = hash12(c1 + c2 + 0.37 * abs(c1 - c2));
  return vec2(d1, d2 - d1);
}
vec3 shade(Hit h) {
  float p = ckP();
  vec2 uv = h.uv;
  float face = 1.0 - h.edge;
  float heat = ckHeat(p);
  float melt = ckMelt(p);
  float raw = ckRaw(uv, p);
  float pin = ckPinhole(uv, raw) * face;
  // The glaze flowing while molten: ripples running down the coin.
  float flowing = smoothstep(0.26, 0.34, p) * (1.0 - smoothstep(0.4, 0.5, p)) * (1.0 - raw);
  float w0 = vnoise(vec2(uv.x * 7.0, uv.y * 7.0 + p * 40.0));
  float wx = vnoise(vec2((uv.x + 0.02) * 7.0, uv.y * 7.0 + p * 40.0));
  float wy = vnoise(vec2(uv.x * 7.0, (uv.y + 0.02) * 7.0 + p * 40.0));
  h.wn = normalize(h.wn + uRot * vec3(wx - w0, wy - w0, 0.0) * 1.4 * flowing * face);
  // Pigment: cobalt in the glyphs and smile, celadon on the rim; pale and chalky until fired.
  float fx = h.f.x + 0.003 * (vnoise(uv * 35.0) - 0.5);
  float ink = (1.0 - smoothstep(-0.003, 0.003, fx)) * face;
  bool rim = h.f.y <= h.f.z && h.f.y <= h.f.w;
  vec3 cobalt = mix(hex(0x0f2a8c), hex(0x1f48c4), sat(-h.f.x / 0.04));
  cobalt = mix(cobalt, hex(0x08185a), smoothstep(-0.008, 0.0, fx));
  vec3 fired = mix(hex(0xf2f1ec), rim ? hex(0x7fb5a2) : cobalt, ink);
  vec3 unfired = mix(hex(0xdcd7ce), rim ? hex(0x86978f) : hex(0x6e7590), ink);
  unfired *= 1.0 - 0.35 * pin;
  vec3 alb = mix(fired, unfired, raw);
  // Crazing pings in once it has cooled, crack by crack, each with a glint as it opens.
  float eid;
  vec2 cz = ckCraze(uv * 6.5 + 1.7, eid);
  float crackP = sat((p - 0.66) / 0.22);
  float line = (1.0 - smoothstep(0.0, 0.035, cz.y)) * step(eid, crackP) * (1.0 - raw) * face;
  alb = mix(alb, alb * vec3(0.42, 0.4, 0.38), line * 0.8);
  vec3 col = litDielectric(h, alb, mix(0.04, 0.9, raw), mix(1.0, 0.08, raw));
  col += vec3(1.0, 0.98, 0.95) * line * exp(-max(crackP - eid, 0.0) * 70.0) * 4.0;
  // Incandescence in the kiln: the room goes dark, the coin glows on a blackbody ramp.
  col *= 1.0 - 0.9 * heat;
  // (The pigment glows a little less than the bare glaze, so the mark shows as a darker shape.)
  float ht = 0.8 * heat * (0.94 + 0.06 * vnoise(uv * 3.0 + p * 30.0)) * mix(1.0, 0.72, ink);
  col += vec3(pow(ht, 1.5), pow(ht, 3.0) * 0.55, pow(ht, 6.0) * 0.25) * 3.2;
  return col;
}
`,
  },
  {
    key: "truck-art",
    label: "Truck Art",
    category: "india",
    relief: 0.0,
    light: 110,
    heroTime: 4.9,
    loop: "The truck idles and hits two potholes, the tassels swing, then a following car flares the tape and dips its lights",
    glsl: /* glsl */ `
#define HAS_SDF
#define HAS_SURFACE
// The back of a truck: a hand-painted tailgate roundel in North Indian truck-art style. The mark is
// the centrepiece on a teal sunburst, in marigold and red with fat black keylines and white shine
// strokes; a red band carries the sign-painter's lettering, HORN OK PLEASE over the top and USE
// DIPPER AT NIGHT along the bottom, with a lotus and peacock feathers at each side; a ring of
// red-and-white reflector tape; a pressed chrome bezel with rivets. From each lotus hangs a bead
// chain with a wool tassel.
// The loop, at night under a sodium lamp: the engine idles (a fine shudder), the truck hits two
// potholes (the panel jolts and tilts, the tassels swing and slowly settle), then a following car
// closes in on high beam — the tape blazes — and dips its lights, as the panel asks, and drops back.
#define TA_S 0.74
#define TA_LOOP 6.5
float taT() { return mod(uTime, TA_LOOP); }
// A damped knock from a pothole at t0.
float taKick(float t, float t0, float w, float k) { float d = t - t0; return d > 0.0 ? exp(-k * d) * sin(w * d) : 0.0; }
// Object point -> panel point (the panel shudders and jolts on its mounts).
vec3 taLocal(vec3 p) {
  float t = taT();
  float k1 = taKick(t, 1.5, 17.0, 3.0), k2 = taKick(t, 2.7, 15.0, 3.5);
  float idle = 0.0012 * sin(t * TAU * 59.0 / TA_LOOP) + 0.0007 * sin(t * TAU * 86.0 / TA_LOOP);
  vec3 q = p - vec3(0.004 * k1 - 0.003 * k2, idle - 0.022 * k1 - 0.012 * k2, 0.0);
  q.yz = rot2(0.035 * k1 + 0.02 * k2) * q.yz;
  q.xy = rot2(0.012 * k1 - 0.008 * k2) * q.xy;
  return q;
}
// Pendulum angles of the two tassel chains: a lazy sway, kicked by each pothole.
vec2 taSwing() {
  float t = taT();
  float base = 0.05 * sin(t * TAU * 3.0 / TA_LOOP);
  float a = base + 0.5 * taKick(t, 1.52, 5.2, 0.75) + 0.3 * taKick(t, 2.72, 5.2, 0.75);
  float b = -0.8 * base - 0.45 * taKick(t, 1.55, 4.7, 0.75) - 0.32 * taKick(t, 2.75, 4.7, 0.75);
  return vec2(a, b);
}
// A bead chain hanging from the lotus, ending in a wool tassel. tt = 0 at the pivot .. 1 at the tassel tip.
float taPendant(vec3 q, float side, float th, out float tt) {
  vec3 piv = vec3(0.89 * side, -0.005, COIN_T + 0.028);
  vec2 dir = vec2(sin(th), -cos(th));
  vec3 d = q - piv;
  float L = 0.19;
  float along = clamp(dot(d.xy, dir), 0.0, L + 0.075);
  vec3 c = vec3(piv.xy + dir * along, piv.z);
  float rad = along < L ? 0.0075 + 0.0035 * cos(along * TAU / 0.019) : mix(0.011, 0.024, (along - L) / 0.075);
  tt = along / (L + 0.075);
  return (length(q - c) - rad) * 0.65;
}
float materialSDF(vec3 p) {
  vec3 q = taLocal(p);
  vec2 sw = taSwing();
  float tt;
  return min(defaultSDF(q), min(taPendant(q, 1.0, sw.x, tt), taPendant(q, -1.0, sw.y, tt)));
}
float surface(vec2 uv, vec4 f) {
  float r = length(uv), a = atan(uv.y, uv.x);
  float trim = smoothstep(1.075, 1.085, r);
  float s = 0.012 * trim + 0.002 * sin(r * 260.0) * trim;
  // Chrome rivets in the bezel.
  vec2 rq = vec2((fract(a * 12.0 / TAU + 0.5) - 0.5) * TAU * 1.112 / 12.0, r - 1.112);
  float rv = sat(1.0 - dot(rq, rq) / (0.017 * 0.017));
  s += 0.01 * rv * rv;
  // Tape and a thick, brushed coat of enamel on the lettering band and the mark.
  s += 0.0015 * step(1.035, r) * step(r, 1.075);
  s += 0.0015 * (1.0 - smoothstep(-0.004, 0.004, field(uv / TA_S).x * TA_S));
  return s;
}
// Sign-painter block capitals on a 19-segment grid (box 0..1).
const vec4 TA_SEG[19] = vec4[19](
  vec4(0.0, 1.0, 0.5, 1.0), vec4(0.5, 1.0, 1.0, 1.0), vec4(1.0, 1.0, 1.0, 0.5), vec4(1.0, 0.5, 1.0, 0.0),
  vec4(0.0, 0.0, 0.5, 0.0), vec4(0.5, 0.0, 1.0, 0.0), vec4(0.0, 0.5, 0.0, 0.0), vec4(0.0, 1.0, 0.0, 0.5),
  vec4(0.0, 0.5, 0.5, 0.5), vec4(0.5, 0.5, 1.0, 0.5), vec4(0.0, 1.0, 0.5, 0.5), vec4(0.5, 1.0, 0.5, 0.5),
  vec4(1.0, 1.0, 0.5, 0.5), vec4(0.5, 0.5, 0.0, 0.0), vec4(0.5, 0.5, 0.5, 0.0), vec4(0.5, 0.5, 1.0, 0.0),
  vec4(0.5, 1.0, 1.0, 0.65), vec4(1.0, 0.35, 0.5, 0.0), vec4(1.0, 0.65, 1.0, 0.35));
// Letters: 0 space, H O R N K P L E A S U D I T G.
const int TA_MASK[16] = int[16](0, 972, 255, 33735, 33996, 37312, 967, 240, 499, 975, 955, 252, 458961, 18483, 18435, 763);
const int TA_TOP[14] = int[14](1, 2, 3, 4, 0, 2, 5, 0, 6, 7, 8, 9, 10, 8);
const int TA_BOT[19] = int[19](11, 10, 8, 0, 12, 13, 6, 6, 8, 3, 0, 9, 14, 0, 4, 13, 15, 1, 14);
float taGlyph(int id, vec2 p, vec2 box) {
  if (id == 0) return 1.0;
  int m = TA_MASK[id];
  float d = 1.0;
  for (int i = 0; i < 19; i++) {
    if (((m >> i) & 1) == 0) continue;
    vec4 s = TA_SEG[i];
    vec2 pa = (p - s.xy) * box, ba = (s.zw - s.xy) * box;
    d = min(d, length(pa - ba * sat(dot(pa, ba) / dot(ba, ba))));
  }
  return d;
}
// Distance (logo units) to the lettering round the band.
float taText(vec2 uv) {
  float r = length(uv), a = atan(uv.y, uv.x);
  const float rT = 0.89, W = 0.056, Hh = 0.092, adv = 0.081;
  vec2 box = vec2(W, Hh);
  if (uv.y > 0.0) {
    float x = (PI * 0.5 - a) * rT / adv + 7.0;
    float ci = floor(x);
    if (ci < 0.0 || ci > 13.0) return 1.0;
    return taGlyph(TA_TOP[int(ci)], vec2((fract(x) - 0.5) * adv / W + 0.5, (r - rT) / Hh + 0.5), box);
  }
  float x = (a + PI * 0.5) * rT / adv + 9.5;
  float ci = floor(x);
  if (ci < 0.0 || ci > 18.0) return 1.0;
  return taGlyph(TA_BOT[int(ci)], vec2((fract(x) - 0.5) * adv / W + 0.5, (rT - r) / Hh + 0.5), box);
}
// Panel paint. tape = reflector, chrome = bezel.
vec3 taPaint(vec2 uv, out float tape, out float chrome) {
  float r = length(uv), a = atan(uv.y, uv.x);
  vec3 black = vec3(0.008), white = vec3(0.92);
  vec3 marigold = hex(0xffa800), red = hex(0xd0102a), teal = hex(0x00877a), pink = hex(0xff4f8f);
  chrome = smoothstep(1.078, 1.084, r);
  tape = step(1.035, r) * (1.0 - chrome);
  // Teal sunburst behind the mark.
  vec3 col = fract(a * 32.0 / TAU) < 0.5 ? teal : hex(0x00a596);
  // The lettering band.
  if (r > 0.765) col = red;
  if (abs(r - 0.765) < 0.007 || abs(r - 1.02) < 0.007) col = black;
  if (abs(r - 0.777) < 0.003 || abs(r - 1.008) < 0.003) col = white;
  float td = taText(uv);
  if (td < 0.019) col = black;
  if (td < 0.0105) col = marigold;
  // Lotus and peacock feathers at each side of the band.
  vec2 sq = vec2(abs(uv.x), uv.y);
  vec2 lc = vec2(0.89, -0.015);
  float lot = 1.0;
  for (int k = -2; k <= 2; k++) {
    float an = float(k) * 0.42;
    vec2 dir = vec2(-sin(an), cos(an));
    vec2 lq = sq - lc - dir * 0.05;
    lot = min(lot, length(vec2(dot(lq, vec2(dir.y, -dir.x)), dot(lq, dir)) / vec2(0.021, 0.054)) - 1.0);
  }
  if (lot < 0.3) col = black;
  if (lot < 0.0 && length(sq - lc) < 0.03) col = marigold;
  if (lot < 0.0 && length(sq - lc) >= 0.03) col = pink;
  // A peacock feather above each lotus.
  vec2 fc = 0.89 * vec2(cos(0.42), sin(0.42));
  vec2 ax = normalize(fc);
  vec2 fq = sq - fc;
  float e = length(vec2(dot(fq, vec2(-ax.y, ax.x)), dot(fq, ax)) / vec2(0.026, 0.04));
  if (e < 1.15) col = hex(0x2e7d32);
  if (e < 0.95) col = hex(0xd8a020);
  if (e < 0.7) col = hex(0x00a596);
  if (e < 0.42) col = hex(0x0a2a8a);
  if (abs(e - 1.15) < 0.12) col = black;
  // Reflector tape segments and chrome.
  float sg = a * 24.0 / TAU;
  if (tape > 0.5) col = mod(floor(sg), 2.0) < 0.5 ? hex(0xe0101a) : white;
  if (tape > 0.5 && abs(fract(sg) - 0.5) > 0.46) { col = black; tape = 0.0; }
  // The mark: drop shadow, colour, black keyline, a white shine on the upper-left edges.
  vec2 mu = uv / TA_S;
  if (field(mu - vec2(0.03, -0.03)).x < 0.0 && r < 0.765) col = mix(col, black, 0.85);
  vec4 f = field(mu) * TA_S;
  if (f.x < 0.0) {
    if (f.y <= f.z && f.y <= f.w) col = mod(floor(aroundMark(mu) * 8.0 + 0.5), 2.0) < 0.5 ? red : marigold;
    else if (f.z <= f.w) col = red;
    else col = marigold;
    vec2 g = fieldGrad(mu, 0);
    if (abs(f.x + 0.013) < 0.0024 && dot(g, vec2(-0.7, 0.7)) > 0.3) col = white;
    if (f.x > -0.0075) col = black;
  }
  // Brush strokes in the enamel.
  return col * (0.95 + 0.1 * vnoise(vec2(uv.x * 6.0, uv.y * 80.0)));
}
vec3 shade(Hit h) {
  float t = taT();
  vec3 q = taLocal(h.p);
  vec2 uv = q.z >= 0.0 ? q.xy : vec2(-q.x, q.y);
  vec2 sw = taSwing();
  float tt1, tt2;
  float d1 = taPendant(q, 1.0, sw.x, tt1), d2 = taPendant(q, -1.0, sw.y, tt2);
  float dp = min(d1, d2);
  float tt = d1 < d2 ? tt1 : tt2;
  bool pend = dp < 0.004;
  // A following car: high beams swing in from the left and blaze on the tape, then it dips and drops back.
  float I = smoothstep(3.3, 4.0, t) * (1.0 - 0.65 * smoothstep(4.5, 4.7, t)) * (1.0 - smoothstep(5.4, 6.3, t));
  vec2 bc = vec2(mix(-1.4, 0.3, smoothstep(3.3, 4.4, t)), mix(0.3, -0.9, smoothstep(4.5, 4.75, t)));
  vec2 bd = h.suv - bc;
  vec3 head = vec3(1.0, 0.95, 0.85) * 3.0 * I * (0.25 + exp(-dot(bd, bd) / 0.7));
  vec3 sod = vec3(1.0, 0.6, 0.26) * 0.8;
  setLight(h, normalize(vec3(-0.35, 0.85, 0.4)));
  float nl = sat(dot(h.wn, h.l));
  float nv = sat(dot(h.wn, h.v));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 r = reflect(-h.v, h.wn);
  vec3 env = vec3(0.006, 0.008, 0.014) + sod * 2.5 * pow(sat(dot(r, h.l)), 24.0) + head * 1.2 * pow(sat(r.z), 3.0);
  if (pend) {
    // Chrome bead chain, then a red-and-marigold wool tassel.
    if (tt < 0.72) return fresnel3(nv, vec3(0.9)) * env + ggx(h.wn, h.v, h.l, 0.1) * sh * sod * 2.0;
    vec3 wool = mod(floor(tt * 30.0), 2.0) < 0.5 ? hex(0xd0102a) : hex(0xffa800);
    return wool * (sod * (0.3 + 0.7 * nl * sh) + head * nv) * (0.8 + 0.2 * vnoise(q.xy * vec2(400.0, 20.0)));
  }
  float tape, chrome;
  vec3 alb = taPaint(uv, tape, chrome);
  chrome = max(chrome, h.edge);
  tape *= 1.0 - chrome;
  vec3 paint = alb * (sod * (0.25 + 0.75 * nl * sh) + head * nv);
  paint += ggx(h.wn, h.v, h.l, 0.2) * sh * sod * 0.6 + fresnel(nv, 0.04) * env * 0.5;
  // Retroreflective tape: microprisms send the headlights straight back to the camera.
  float prism = 0.75 + 0.25 * sin(uv.x * 700.0) * sin(uv.y * 700.0);
  vec3 retro = alb * (sod * 0.3 * (0.3 + 0.7 * nl) + head * 9.0 * prism * nv * nv);
  vec3 chr = fresnel3(nv, vec3(0.9, 0.9, 0.92)) * env + ggx(h.wn, h.v, h.l, 0.06) * sh * sod * 2.0;
  return mix(mix(paint, retro, tape), chr, chrome);
}
`,
  },
  {
    key: "rupee-mohur",
    label: "Rupee Mohur",
    category: "india",
    relief: 0.05,
    light: 135,
    heroTime: 1.4,
    loop: "A glint sweeps across the gold (it rides along when the coin spins)",
    glsl: /* glsl */ `
#define HAS_SDF
// A Mughal gold mohur, hand-struck: a slightly out-of-round flan that thins at the edge and split
// in three places under the hammer, the die struck off-centre so its beaded border runs off the
// flan, and the high points of the mark rubbed bright by circulation while dirt stays in the fields.
vec2 mohurOff() { return vec2(0.075, -0.05); }
float mohurCrack(vec2 p, float ang, float len, float R) {
  vec2 dir = vec2(cos(ang), sin(ang));
  float along = dot(p, dir);
  float across = abs(dot(p, vec2(-dir.y, dir.x)) + 0.012 * sin(along * 38.0));
  float open = sat((along - (R - len)) / len);
  return max(across - 0.016 * open, (R - len) - along);
}
float mohurFlan(vec2 p) {
  float r = length(p), a = atan(p.y, p.x);
  float R = 1.1 + 0.022 * sin(a * 3.0 + 0.7) + 0.012 * sin(a * 7.0 + 2.1);
  float d = r - R;
  d = max(d, -mohurCrack(p, 0.6, 0.16, 1.12));
  d = max(d, -mohurCrack(p, 2.9, 0.11, 1.1));
  d = max(d, -mohurCrack(p, 4.4, 0.19, 1.1));
  return d;
}
float materialSDF(vec3 p) {
  float d2 = mohurFlan(p.xy);
  float r = length(p.xy);
  float T = 0.085 - 0.022 * smoothstep(0.75, 1.12, r);
  float R = 0.03;
  vec2 w = vec2(d2 + R, abs(p.z) - T + R);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - R;
  vec2 uv = (p.z >= 0.0 ? p.xy : vec2(-p.x, p.y)) - mohurOff();
  vec4 f = field(uv);
  float onFace = smoothstep(T * 0.35, T, abs(p.z));
  float m = 1.0 - smoothstep(-0.022, 0.022, f.x);  // the scene's RELIEF_W
  float rr = length(uv), a = atan(uv.y, uv.x);
  // The die's beaded border, partly off the flan.
  vec2 bq = vec2((fract(a * 64.0 / TAU) - 0.5) * TAU * 1.05 / 64.0, rr - 1.05);
  float bead = sat(1.0 - dot(bq, bq) / (0.02 * 0.02));
  // Circulation wear flattens the highest points near the centre.
  float wear = 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.5, length(p.xy)));
  float rel = uRelief * m * wear + 0.014 * bead * bead + 0.0015 * (vnoise(uv * 30.0) - 0.5);
  return slab - rel * onFace;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv - mohurOff();
  vec4 f = field(uv);
  float face = 1.0 - h.edge;
  float mk = (1.0 - smoothstep(-0.022, 0.022, f.x)) * face;
  // Worn high points burnish to a mirror; the fields keep a matte, dirty skin.
  float hi = mk * smoothstep(0.75, 0.98, abs(h.n.z));
  float rough = mix(0.45, 0.12, hi) + 0.08 * vnoise(h.uv * 40.0);
  float scr = smoothstep(0.97, 1.0, vnoise(vec2(h.uv.x * 3.0 + h.uv.y * 7.0, h.uv.y * 260.0 - h.uv.x * 40.0)));
  rough = mix(rough, 0.35, scr * face * (1.0 - hi));
  vec3 gold = vec3(1.0, 0.77, 0.34);
  float dirt = (1.0 - h.ao) * 0.8 + smoothstep(0.0, 0.025, f.x) * (1.0 - smoothstep(0.025, 0.07, f.x)) * 0.35 * face;
  vec3 base = mix(gold, vec3(0.45, 0.28, 0.12), sat(dirt));
  // The flan's edge and the cracks are rough, unstruck metal.
  base *= mix(1.0, 0.75, h.edge);
  vec3 col = litMetal(h, base, mix(rough, 0.55, h.edge));
  // Glint: a soft band sweeping the reflections, so it travels with the coin when it spins.
  vec3 r = reflect(-h.v, h.wn);
  float s = fract(uTime * 0.2) * 3.4 - 1.7;
  float band = exp(-pow((r.x * 0.7 + r.y * 0.7 - s) / 0.12, 2.0));
  col += base * band * 5.0 * fresnel3(dot(h.wn, h.v), base) * (1.0 - 0.6 * rough);
  return col;
}
`,
  },
  {
    key: "kolam",
    label: "Kolam",
    category: "india",
    relief: 0.0,
    light: 120,
    heroTime: 10.0,
    loop: "Dots are set, the line is drawn in one stroke, then swept away",
    glsl: /* glsl */ `
// Kolam at a Tamil threshold, drawn at dawn on a disc of earth swept and sprinkled with dung-water: a grid of
// pulli (dots), and a sikku line that weaves diagonally between them and bends into loops around
// the dots wherever the field ends: around the letterforms and at the outer edge. The letters are
// filled with rice flour and edged in red kaavi. Dots go down, the line is drawn, the broom comes.
#define KL_S 0.115
float klPhase() { return fract(uTime / 12.0); }
// Distance to the sikku line. Its zero set is cos(πx) + cos(πy) + bias = 0: straight diagonals
// where bias is 0, closing into loops around the dots as bias rises towards the edges.
float klLine(vec2 uv, vec4 f, out float bias) {
  vec2 q = uv / KL_S;
  float F = cos(PI * q.x) + cos(PI * q.y);
  bias = 2.3 * (1.0 - smoothstep(0.035, 0.17, f.x)) + 2.3 * smoothstep(1.06, 1.13, length(uv));
  vec2 g = (PI / KL_S) * vec2(sin(PI * q.x), sin(PI * q.y));
  return abs(F + bias) / max(length(g), 0.6 * PI / KL_S);
}
// Distance to the nearest dot: the centres of the diamonds the line makes.
float klDot(vec2 uv) {
  vec2 q = uv / KL_S;
  vec2 w = vec2(q.x + q.y, q.x - q.y) * 0.5;
  vec2 fw = fract(w + 0.5) - 0.5;
  return length(vec2(fw.x + fw.y, fw.x - fw.y)) * KL_S;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float p = klPhase();
  float order = aroundMark(uv);
  float n = vnoise(uv * 70.0);
  float bias;
  float dl = klLine(uv, h.f, bias);
  float line = (1.0 - smoothstep(0.005, 0.009, dl + 0.002 * (n - 0.5))) * step(bias, 2.05);
  float dots = (1.0 - smoothstep(0.009, 0.012, klDot(uv))) * step(bias, 1.9);
  float fill = 1.0 - smoothstep(-0.003, 0.003, h.f.x + 0.004 * (n - 0.5));
  float kaavi = 1.0 - smoothstep(0.002, 0.004, abs(h.f.x - 0.011));
  // Timeline: dots (0-0.12), the line in one stroke (0.12-0.7), letters filled (0.7-0.8), hold, broom (0.9-1).
  float dotsOn = sat((p / 0.12 - order) / 0.05);
  float prog = (p - 0.12) / 0.58;
  float lineOn = sat((prog - order) / 0.004);
  float fillOn = sat(((p - 0.7) / 0.1 - order) / 0.02);
  float wipe = smoothstep(0.9, 1.0, p) * 4.0 - 1.7;
  float keep = smoothstep(wipe - 0.05, wipe + 0.05, uv.x + 0.1 * (n - 0.5));
  float tip = exp(-max(prog - order, 0.0) * 300.0) * step(order, prog) * step(prog, 1.0) * line;
  float flour = max(max(line * lineOn, dots * dotsOn), fill * fillOn) * keep;
  flour *= 0.7 + 0.45 * hash12(floor(uv * 500.0));
  // Swept earth: dark, damp with dung-water, broom arcs dragged through it.
  vec3 earth = mix(hex(0x2e251c), hex(0x4a3b2c), fbm(uv * 2.0 + 6.0));
  vec2 pv = uv - vec2(-1.8, 2.2);
  earth *= 0.85 + 0.15 * vnoise(vec2(length(pv) * 90.0, atan(pv.y, pv.x) * 3.0));
  earth *= 0.85 + 0.15 * smoothstep(0.3, 0.7, vnoise(uv * 3.0 + 9.0));
  vec3 alb = mix(earth, vec3(0.9, 0.88, 0.82) * (1.0 + 0.8 * tip), sat(flour) * (1.0 - h.edge));
  alb = mix(alb, hex(0x9c2a14), kaavi * fillOn * keep * 0.9 * (1.0 - h.edge));
  return litDielectric(h, alb, 0.9, 0.1);
}
`,
  },
];
