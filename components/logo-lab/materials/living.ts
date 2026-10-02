import type { LogoMaterial } from "../types";

/** Living things and the elements. */
export const LIVING: LogoMaterial[] = [
  {
    key: "moss",
    label: "Moss",
    category: "living",
    relief: 0.035,
    light: 120,
    heroTime: 2.0,
    loop: "A gust combs through the moss",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A dark slate coin with cushion moss growing only in the mark: the strokes are a raised green pile that just
// creeps past their edges; the bare slate stays plain. A gust travels across, combing the fronds into a bright sheen.
float mossCover(vec2 uv, float fx) {
  return 1.0 - smoothstep(-0.01, 0.012, fx - 0.03 * (vnoise(uv * 9.0) - 0.5));
}
float surface(vec2 uv, vec4 f) {
  float m = mossCover(uv, f.x);
  float stone = 0.003 * (vnoise(uv * 6.0 + 5.0) - 0.5);
  float pile = 0.008 + 0.006 * vnoise(uv * 60.0);
  return mix(stone, pile, m);
}
// The gust: a slow travelling wave of lean across the stone.
float mossGust(vec2 uv) {
  return sin(dot(uv, vec2(0.93, 0.36)) * 3.0 - uTime * 1.6 + 1.4 * vnoise(uv * 1.6 + 2.0));
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float m = mossCover(uv, h.f.x) * (1.0 - 0.7 * h.edge);
  float g = mossGust(uv);
  vec2 windDir = vec2(0.93, 0.36);
  vec2 perp = vec2(-windDir.y, windDir.x);
  // The coin: plain dark slate, a little damp darkening right where the moss meets it.
  vec3 stone = mix(hex(0x1c1e20), hex(0x26282a), vnoise(uv * 5.0 + 9.0));
  stone *= 1.0 - 0.35 * exp(-max(h.f.x, 0.0) * 50.0);
  // One shadow probe shared by the rock and the moss.
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 8.0);
  vec3 keyL = vec3(1.0, 0.96, 0.88);
  vec3 rock = stone * (sat(dot(h.wn, h.l)) * sh * keyL * 1.6 + studioDiffuse(h.wn) * h.ao);
  rock += ggx(h.wn, h.v, h.l, 0.6) * sh * keyL * 0.3;
  // Moss pile: fronds stretched along the wind and shifted by the lean of the gust.
  float a = dot(uv, windDir), b = dot(uv, perp);
  float fronds = vnoise(vec2(a * 70.0 - g * 1.2, b * 190.0));
  float capsules = smoothstep(0.86, 0.95, vnoise(uv * 48.0 + 11.0));
  float tufts = vnoise(uv * 12.0 + 3.0) * 0.65 + vnoise(uv * 27.0) * 0.35;
  vec3 alb = mix(hex(0x1c360b), hex(0x4f7d18), tufts);
  alb = mix(alb, hex(0xa8c83c), 0.65 * smoothstep(0.5, 0.95, fronds));
  alb = mix(alb, hex(0x8a3d16), capsules * 0.5);
  // Fur normal: the fronds tilt with the wind.
  vec2 tilt = windDir * g * 0.35 + (vec2(fronds, vnoise(uv * 120.0 + 7.0)) - 0.5) * 0.6;
  vec3 n = normalize(h.wn + uRot * vec3(tilt * m, 0.0));
  float nl = dot(n, h.l);
  float wrap = sat((nl + 0.45) / 1.45);
  vec3 mossCol = alb * (wrap * sh * keyL * 1.7 + studioDiffuse(n) * h.ao * 1.2);
  // Sub-surface: light glows through the thin leaflets, yellow-green.
  mossCol += hex(0x6f9e1a) * 0.25 * pow(sat(dot(h.v, -h.l) * 0.5 + 0.5), 2.0) * h.ao;
  // Fuzz: tips catch light at grazing angles, brightest where the gust has combed them flat.
  float fuzz = pow(1.0 - sat(dot(n, h.v)), 2.5);
  mossCol += hex(0xc8e070) * fuzz * (0.25 + 0.35 * sat(g)) * h.ao;
  return mix(rock, mossCol, m);
}
`,
  },
  {
    key: "flower-bed",
    label: "Flower Bed",
    category: "living",
    relief: 0.025,
    light: 125,
    heroTime: 8.5,
    loop: "Flowers bloom in a wave along the strokes, then close to buds",
    glsl: /* glsl */ `
#define HAS_SURFACE
// A Bengal winter bed in a round terracotta pot: marigold (gaanda), rose and white jasmine packed into the letterforms
// over leaves, dark loam all around. Each flower is a jittered cell; they open in a wave along the mark, then fold to buds.
// Nearest flower in a jittered grid: xy = offset from its centre (cell units), z = id, w = distance.
vec4 fbedCell(vec2 p) {
  vec2 n = floor(p), fr = fract(p);
  vec4 best = vec4(0.0, 0.0, 0.0, 8.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = 0.2 + 0.6 * hash22(n + g);
    vec2 r = g + o - fr;
    float d = length(r);
    if (d < best.w) best = vec4(-r, hash12(n + g + 3.7), d);
  }
  return best;
}
float surface(vec2 uv, vec4 f) {
  float onMark = 1.0 - smoothstep(-0.01, 0.02, f.x);
  return 0.004 * (vnoise(uv * 38.0) - 0.5) + onMark * 0.008 * vnoise(uv * 24.0 + 3.0);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  // Soil: dark loam, crumbs, a few pale grit flecks.
  vec3 soil = mix(hex(0x1e120a), hex(0x3d2818), fbm(uv * 7.0 + 2.0));
  soil = mix(soil, hex(0x5a4030), 0.5 * smoothstep(0.7, 0.85, vnoise(uv * 70.0)));
  soil = mix(soil, hex(0x9a8c78), 0.6 * smoothstep(0.9, 0.97, vnoise(uv * 140.0 + 5.0)));
  float onMark = 1.0 - smoothstep(-0.006, 0.014, h.f.x);
  vec3 leaf = mix(hex(0x16380f), hex(0x3c6a1c), vnoise(uv * 60.0 + 9.0));
  // Flowers, planted only where a cell's centre falls in the strokes.
  const float S = 34.0;
  vec4 c = fbedCell(uv * S);
  vec2 centre = (uv * S - c.xy) / S;
  float planted = step(field(centre).x, 0.004);
  float id = c.z;
  float cyc = fract(uTime / 12.0);
  float open = sat((cyc * 1.4 - aroundMark(centre) - 0.05 * id) * 5.0) * (1.0 - smoothstep(0.86, 1.0, cyc));
  float r = length(c.xy);
  float a = atan(c.y, c.x) + id * TAU;
  float R = mix(0.16, 0.5, open) * (0.85 + 0.3 * fract(id * 7.3));
  vec3 petalCol; vec3 eyeCol; float lobes; float ruffle;
  if (id < 0.45) { petalCol = hex(0xff8a00); eyeCol = hex(0xc24a00); lobes = 14.0; ruffle = 0.12; }
  else if (id < 0.72) { petalCol = hex(0xd42a5c); eyeCol = hex(0x6e0c26); lobes = 5.0; ruffle = 0.3; }
  else { petalCol = hex(0xf2eee0); eyeCol = hex(0xe0a818); lobes = 8.0; ruffle = 0.35; }
  float edgeR = R * (1.0 - ruffle + ruffle * abs(cos(a * lobes * 0.5)));
  float petal = smoothstep(edgeR, edgeR - 0.06, r) * planted;
  float tone = 0.62 + 0.38 * smoothstep(0.0, edgeR, r);
  if (id < 0.45) tone *= 0.85 + 0.15 * sin(r * 60.0 + a * 3.0);   // marigold: layered ruffles
  vec3 flower = mix(eyeCol, petalCol, smoothstep(0.04, 0.16 * (0.5 + open), r)) * tone;
  vec3 bud = mix(hex(0x3c6a1c), petalCol * 0.6, 0.35);
  flower = mix(bud, flower, open);
  vec3 alb = mix(soil, leaf, onMark);
  alb = mix(alb, flower, petal);
  // Petals cup upward: tilt the normal out from each flower's centre.
  vec2 rad = c.xy / max(r, 1e-3);
  h.wn = normalize(h.wn + uRot * vec3(rad * petal * 0.5 * smoothstep(0.0, edgeR, r), 0.0));
  // The pot's rim: fired terracotta, a lip of it showing round the soil.
  float lip = max(h.edge, smoothstep(1.06, 1.08, length(uv)));
  vec3 pot = mix(hex(0x8f3e26), hex(0xb35a3a), vnoise(uv * 18.0 + h.p.z * 9.0));
  alb = mix(alb, pot, lip);
  return litDielectric(h, alb, mix(0.9, 0.55, petal), mix(0.15, 0.35, petal));
}
`,
  },
  {
    key: "bioluminescence",
    label: "Bioluminescence",
    category: "living",
    relief: 0.0,
    heroTime: 1.2,
    loop: "A touch sends a ring of glow through the plankton",
    glsl: /* glsl */ `
// Night-sea bioluminescence, the blue tide on a dark beach: dinoflagellates glow cyan in black water and crowd thickest
// in the mark, so it burns brightest. Every few seconds something touches the water and a ring of flashes runs outward.
// One jittered plankton per cell; density is the chance a cell is occupied.
float bioSpeck(vec2 p, float seed, float density) {
  vec2 n = floor(p), fr = fract(p);
  vec2 o = 0.2 + 0.6 * hash22(n + seed);
  float on = step(hash12(n + seed * 1.7 + 0.3), density);
  float d = length(fr - o);
  float tw = 0.6 + 0.4 * sin(uTime * (1.5 + 2.0 * hash12(n + seed)) + hash12(n - seed) * TAU);
  return on * tw * exp(-d * d * 60.0);
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float fx = h.f.x;
  float mark = 1.0 - smoothstep(-0.01, 0.03, fx);
  float halo = exp(-max(fx, 0.0) * 18.0);
  // The touch: a new spot each cycle, and the ring of excitation it sends out.
  float P = 5.0;
  float k = floor(uTime / P), ph = fract(uTime / P);
  vec2 c = (hash22(vec2(k, 3.1)) - 0.5) * 1.6;
  float dist = length(uv - c), r = ph * 2.8;
  float fade = 1.0 - smoothstep(0.65, 1.0, ph);
  float ring = exp(-pow((dist - r) / 0.07, 2.0));
  float wake = step(dist, r) * exp(-(r - dist) * 2.5);
  float excite = (ring * 1.2 + wake * 0.6) * fade;
  // Plankton drift a little with the swell.
  vec2 dq = uv + vec2(0.03 * sin(uTime * 0.2), 0.02 * cos(uTime * 0.17));
  float s1 = bioSpeck(dq * 70.0, 1.0, mix(0.06, 0.85, mark));
  float s2 = bioSpeck(dq * 31.0 + 5.0, 7.0, mix(0.03, 0.6, mark));
  float s3 = bioSpeck(dq * 140.0, 13.0, mix(0.1, 0.9, mark));
  float specks = s1 + s2 * 1.4 + s3 * 0.6;
  vec3 cyan = hex(0x22e8ff), core = hex(0xb8fbff);
  float glow = mark * (0.55 + 0.45 * fbm(uv * 6.0 + uTime * 0.1)) * 1.2 + halo * 0.12;
  float bright = (0.3 + 0.7 * mark) + excite * 2.5;
  vec3 col = vec3(0.001, 0.004, 0.01);
  col += cyan * (glow + specks * bright) * (0.6 + excite);
  col += core * specks * mark * 0.8;
  // The water's surface: the touch's ripples and a slow swell catch a faint moon sheen.
  float wave = sin((dist - r) * 55.0) * exp(-pow((dist - r) / 0.12, 2.0)) * fade;
  vec2 grad = normalize(uv - c + 1e-4) * wave * 0.25;
  grad += 0.04 * vec2(snoise(uv * 3.0 + uTime * 0.2), snoise(uv * 3.0 - uTime * 0.2 + 7.0));
  vec3 n = normalize(h.wn + uRot * vec3(grad, 0.0));
  float fr = fresnel(dot(n, h.v), 0.02);
  col += fr * studioEnv(reflect(-h.v, n)) * 0.15;
  return col * (h.side > 0.0 ? 1.0 : 0.2);
}
`,
  },
  {
    key: "ice",
    label: "Ice",
    category: "living",
    relief: 0.0,
    light: 60,
    heroTime: 5.0,
    loop: "Frost creeps over the disc, then melts off",
    glsl: /* glsl */ `
#define HAS_SDF
// A clear disc of ice with the mark frozen inside as white frost, feathery crystals spiking off its strokes and a
// fracture plane behind it. Refraction shifts the mark and the cold room as the disc turns. Through the loop fern
// frost creeps in from the disc's edge, then melts into a wet, beaded sheen.
float icePhase() { return fract(uTime / 14.0); }
float iceFrost() { float t = icePhase(); return smoothstep(0.02, 0.45, t) * (1.0 - smoothstep(0.55, 0.8, t)); }
float iceWet() { float t = icePhase(); return smoothstep(0.5, 0.7, t) * (1.0 - smoothstep(0.88, 1.0, t)); }
float materialSDF(vec3 p) {
  vec2 w = vec2(length(p.xy) - 1.12, abs(p.z) - 0.22) + 0.07;
  float d = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.07;
  return d - 0.006 * iceWet() * vnoise(p.xy * 4.0 + p.z * 3.0);
}
vec3 shade(Hit h) {
  mat3 inv = transpose(uRot);
  vec3 ord = inv * h.rd;
  vec3 n = h.n;
  float frostS = iceFrost(), wet = iceWet();
  // Surface frost creeping inward from the disc's rim.
  float fromEdge = 1.12 - length(h.uv);
  float fern = ridged(h.uv * 5.0 + 2.0);
  float F = frostS * 1.1;
  float cover = smoothstep(F, F - 0.15, fromEdge + 0.35 * (fern - 0.5)) * step(0.001, frostS);
  float crystal = smoothstep(0.62, 0.8, fern) * cover;
  // Melt-water beads.
  vec4 bv = voronoi(h.uv * 14.0);
  float bead = smoothstep(0.25, 0.12, bv.x) * step(0.45, bv.z) * wet;
  // Refract into the block and find where the ray crosses the mark's plane (z = 0).
  float cosI = sat(dot(-ord, n));
  float fr = fresnel(cosI, 0.02);
  vec3 refr = refract(ord, n, 1.0 / 1.31);
  if (dot(refr, refr) < 1e-4) refr = ord;
  float frostMark = 0.0;
  float path = 0.6;
  float crack = 0.0;
  if (abs(refr.z) > 0.04) {
    float tz = -h.p.z / refr.z;
    if (tz > 0.0) {
      vec3 q = h.p + refr * tz;
      float fx = field(q.xy).x;
      float core = 1.0 - smoothstep(-0.008, 0.01, fx);
      float spikes = smoothstep(0.07, 0.0, fx) * smoothstep(0.6, 0.85, ridged(q.xy * 11.0 + 5.0));
      frostMark = max(core * (0.75 + 0.25 * vnoise(q.xy * 60.0)), spikes * 0.6);
      path = tz;
    }
    // A fracture plane just behind the mark.
    float tc = (-0.14 * h.side - h.p.z) / refr.z;
    if (tc > 0.0) {
      vec2 cq = (h.p + refr * tc).xy;
      vec4 vc = voronoi(cq * 2.2 + 3.0);
      crack = smoothstep(0.035, 0.0, vc.w) * step(0.55, vc.z);
    }
  }
  vec3 behind = defaultBackground(h.suv + refr.xy * 0.18);
  vec3 absorb = exp(-vec3(0.55, 0.2, 0.08) * (path * 2.0 + 0.4));
  vec3 body = behind * absorb + hex(0x0c2a48) * 0.12;
  vec3 frostCol = hex(0xeef6ff) * (studioDiffuse(h.wn) * 1.6 + 0.6 * sat(dot(h.wn, h.l))) + hex(0x7ab8ff) * 0.08;
  vec3 col = mix(body, frostCol, frostMark * (1.0 - fr));
  col += crack * hex(0xcfe6ff) * 0.35 * absorb;
  col += h.edge * hex(0x4a7ab0) * 0.1;   // internal reflections light the walls
  // The surface: reflections, a key glint that sharpens when wet, the creeping frost and melt beads.
  float rough = mix(0.12, 0.03, wet);
  col = col * (1.0 - fr) + fr * studioEnv(reflect(-h.v, h.wn));
  col += ggx(h.wn, h.v, h.l, rough) * vec3(0.9, 0.95, 1.0) * 2.0;
  col = mix(col, frostCol * 1.1, cover * 0.55 + crystal * 0.35);
  col += bead * hex(0xdfeeff) * 0.3 * smoothstep(0.18, 0.08, bv.x);
  return col;
}
`,
  },
  {
    key: "cloud",
    label: "Cloud",
    category: "living",
    relief: 0.0,
    light: 140,
    heroTime: 3.0,
    loop: "The puffs billow and churn along the strokes",
    glsl: /* glsl */ `
#define HAS_SDF
// The mark built of cumulus: soft cloud puffs heap up along every stroke and sit on a plain dusk-blue coin, lit by a
// low warm sun so the tops glow gold-pink, the undersides go lavender and the edges catch a silver lining. The puffs
// billow and churn slowly. They cast soft shadows on the coin.
float cldPuff(vec3 p) {
  float fx = field(p.xy).x;
  vec3 q = p * 13.0 + vec3(0.0, -uTime * 0.25, uTime * 0.18);
  float n = vnoise3(q) * 0.7 + vnoise3(q * 2.3 + 5.0) * 0.3;
  float r = 0.03 + 0.042 * n;
  return length(vec2(max(fx + 0.022, 0.0), abs(p.z) - 0.112)) - r;
}
float materialSDF(vec3 p) { return min(defaultSDF(p), cldPuff(p) * 0.8); }
vec3 shade(Hit h) {
  float puff = step(cldPuff(h.p), defaultSDF(h.p) + 0.002);
  float sh = softShadow(h.p + h.n * 0.006, h.lo, 8.0);
  vec3 sun = vec3(1.0, 0.72, 0.5);
  float nl = dot(h.wn, h.l);
  // The coin: plain dusk-slate.
  vec3 coin = hex(0x12151f) * (sat(nl) * sh * sun * 1.3 + studioDiffuse(h.wn) * h.ao);
  coin += ggx(h.wn, h.v, h.l, 0.45) * sh * sun * 0.5;
  // Cloud: wrapped soft light, sky-blue fill from above, lavender from below, a silver lining at grazing angles.
  float wrap = sat((nl + 0.6) / 1.6);
  vec3 sky = mix(hex(0x6a5a8a), hex(0x8ab0e0), sat(h.wn.y * 0.5 + 0.5));
  vec3 cloud = vec3(1.0, 0.97, 0.95) * (wrap * sh * sun * 1.5 + sky * 0.55 * (0.4 + 0.6 * h.ao));
  float rim = pow(1.0 - sat(dot(h.wn, h.v)), 3.0);
  cloud += sun * rim * 0.7 * (0.4 + 0.6 * sh);
  cloud += hex(0xffc8a0) * 0.12 * pow(sat(dot(h.v, -h.l) * 0.5 + 0.5), 3.0);   // light through the thin puffs
  return mix(coin, cloud, puff);
}
`,
  },
  {
    key: "fire",
    label: "Fire",
    category: "living",
    relief: 0.01,
    light: 120,
    heroTime: 1.4,
    loop: "Flames flicker and lick up off the strokes",
    glsl: /* glsl */ `
// The mark on fire: every stroke is a burning wick with glowing cracks, short flames lick up off it in a turbulent
// flow, coloured by temperature from yellow-white at the root to red at the tips, and die out within a finger's
// width. The rest of the coin is plain sooty iron, warmed only by the flames' glow close by. It flickers.
vec3 fireBody(float k) {
  k = max(k, 0.0);
  return vec3(1.0, 0.28, 0.04) * k * 2.2 + vec3(1.0, 0.62, 0.18) * k * k * 1.8 + vec3(0.9, 0.9, 1.0) * pow(k, 5.0) * 1.2;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float fx = h.f.x;
  float t = uTime;
  vec3 iron = mix(hex(0x110f0e), hex(0x1a1714), vnoise(uv * 20.0));
  vec3 col = litDielectric(h, iron, 0.75, 0.2);
  float flick = 0.86 + 0.1 * snoise(vec2(t * 6.0, 1.3)) + 0.04 * sin(t * 21.0);
  // Heat gathered from the strokes just below, displaced by a rising turbulence; nothing reaches past ~0.09.
  vec2 turb = vec2(snoise(vec2(uv.x * 9.0, uv.y * 7.0 - t * 3.0)), snoise(vec2(uv.x * 9.0 + 7.0, uv.y * 7.0 - t * 3.0 + 3.0)));
  float heat = 0.0;
  for (int i = 0; i < 9; i++) {
    float s = float(i) * 0.01;
    vec2 q = uv - vec2(0.0, s) + turb * s * 0.4;
    float fuel = 1.0 - smoothstep(-0.006, 0.008, field(q).x);
    heat += fuel * (1.0 - s / 0.09);
  }
  heat /= 5.0;
  float tongues = 0.35 + 1.3 * smoothstep(0.25, 0.85, vnoise(vec2(uv.x * 30.0 + turb.x * 1.5, uv.y * 12.0 - t * 6.5)));
  float k = heat * tongues * flick * 1.25;
  // The wick: charred strokes with live cracks.
  float wick = 1.0 - smoothstep(-0.004, 0.006, fx);
  vec4 cv = voronoi(uv * 45.0);
  float crack = smoothstep(0.08, 0.0, cv.w);
  col = mix(col, hex(0x120302) + hex(0xff4a08) * (crack * 2.5 + 0.4) * flick, wick * 0.85);
  col += fireBody(smoothstep(0.06, 1.0, k) * 1.15);
  // The flames' glow on the iron close by.
  col += hex(0xff5010) * 0.12 * exp(-max(fx, 0.0) * 35.0) * flick * (1.0 - wick);
  return col;
}
`,
  },
  {
    key: "lightning",
    label: "Lightning",
    category: "living",
    relief: 0.01,
    light: 135,
    heroTime: 1.33,
    loop: "Plasma crawls along the strokes; arcs strike and jump between them",
    glsl: /* glsl */ `
// The mark as plasma tubes on a dark gunmetal coin: violet-white plasma fills every stroke with filaments crawling
// inside, like a plasma globe, and every second or so short arcs crack across from one stroke to the next, with a
// flash and a return stroke. Away from the strokes the coin stays dark.
// Pull a point onto the mark (just inside a stroke) by stepping down the distance field.
vec2 lzSnap(vec2 p) {
  for (int i = 0; i < 2; i++) p -= fieldGrad(p, 0) * (field(p).x + 0.015);
  return p;
}
float lzJag(float s, float seed) { return snoise(vec2(s * 4.0, seed)) * 0.7 + snoise(vec2(s * 13.0, seed + 4.1)) * 0.3; }
// Distance to a jagged arc from a to b; amp is its sideways wander as a fraction of its length.
float lzBolt(vec2 p, vec2 a, vec2 b, float seed, float amp) {
  vec2 ab = b - a;
  float L = max(length(ab), 1e-3);
  vec2 dir = ab / L, nrm = vec2(-dir.y, dir.x);
  vec2 ap = p - a;
  float s = dot(ap, dir) / L;
  float sc = clamp(s, 0.0, 1.0);
  float off = lzJag(sc, seed) * amp * L * sin(PI * sc);
  return length(vec2(dot(ap, nrm) - off, (s - sc) * L));
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float fx = h.f.x;
  float t = uTime;
  vec3 violet = hex(0x7a4cff), white = hex(0xf2eeff);
  vec3 col = litMetal(h, vec3(0.05, 0.05, 0.06), 0.45);
  float hum = 0.88 + 0.12 * hash11(floor(t * 30.0));
  float tube = 1.0 - smoothstep(-0.004, 0.006, fx);
  float core = 1.0 - smoothstep(-0.024, -0.008, fx);
  float halo = exp(-max(fx, 0.0) * 45.0) * (1.0 - tube);
  // Filaments crawling inside each stroke.
  float fil = smoothstep(0.12, 0.0, abs(snoise(uv * 6.0 + vec2(t * 1.6, -t * 1.1))));
  float fil2 = smoothstep(0.1, 0.0, abs(snoise(uv * 10.0 - vec2(t * 1.0, t * 2.0) + 5.0)));
  float crawl = max(fil, fil2 * 0.7) * tube;
  // Three arcs on staggered clocks, each jumping from a point on the mark to another point on the mark nearby.
  float arcs = 0.0, boost = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float P = 1.3 + 0.4 * fi;
    float tt = t / P + fi * 0.37;
    float k = floor(tt), ph = fract(tt) * P;
    float flash = exp(-ph * 9.0) + 0.6 * step(0.1, ph) * exp(-(ph - 0.1) * 14.0);
    if (flash < 0.01) continue;
    vec2 r1 = hash22(vec2(k, fi * 3.7 + 1.0));
    vec2 A = lzSnap(vec2(cos(r1.x * TAU), sin(r1.x * TAU)) * mix(0.15, 0.9, r1.y));
    vec2 r2 = hash22(vec2(k + 5.1, fi));
    vec2 B = lzSnap(A + vec2(cos(r2.x * TAU), sin(r2.x * TAU)) * mix(0.2, 0.4, r2.y));
    float d = lzBolt(uv, A, B, k + fi * 13.0, 0.25);
    arcs += (exp(-pow(d / 0.008, 2.0)) * 3.0 + exp(-d * 45.0) * 0.6) * flash;
    boost += flash * (exp(-dot(uv - A, uv - A) * 40.0) + exp(-dot(uv - B, uv - B) * 40.0));
  }
  col += violet * (tube * 0.9 + halo * 0.5) * hum * (1.0 + boost);
  col += white * (core * 0.45 + crawl * 2.4) * hum;
  col += (white * 1.2 + violet * 0.4) * min(arcs, 4.0);
  return col;
}
`,
  },
  {
    key: "aurora",
    label: "Aurora",
    category: "living",
    relief: 0.008,
    light: 120,
    heroTime: 4.0,
    loop: "Aurora curtains ripple and drift through the strokes",
    glsl: /* glsl */ `
// The mark as aurora: inside every stroke, curtains of oxygen-green light with vertical ray striations, a bright
// mint hem along the strokes' lower edges, shifting to violet and rose higher up the mark. The folds ripple sideways
// and drift through the strokes. The coin is plain night-black enamel with only a faint green halo near the mark.
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float fx = h.f.x;
  float t = uTime;
  vec3 col = litDielectric(h, hex(0x0a0d14), 0.4, 0.4);
  float m = 1.0 - smoothstep(-0.004, 0.006, fx);
  float sway = 0.05 * sin(uv.y * 3.0 + t * 0.8 + uv.x * 1.5) + 0.03 * snoise(vec2(uv.x * 1.2 + t * 0.15, t * 0.2));
  float rays = 0.35 + 0.65 * vnoise(vec2((uv.x + sway) * 55.0, t * 0.6));
  float folds = 0.55 + 0.45 * sin((uv.x + sway * 2.0) * 9.0 - t * 1.1);
  // The hem: brightest where a stroke's lower edge is.
  vec2 g = fieldGrad(uv, 0);
  float hem = smoothstep(-0.022, 0.0, fx) * sat(-g.y);
  float hue = sat(0.5 + 0.5 * sin(uv.y * 2.2 - uv.x * 1.3 + t * 0.4 + sway * 6.0));
  vec3 cur = mix(hex(0x2dff8a), hex(0xb03cff), smoothstep(0.55, 0.95, hue));
  cur = mix(cur, hex(0xff4a9a), smoothstep(0.85, 1.0, hue) * 0.4);
  col += cur * m * rays * folds * 1.5;
  col += hex(0xb8ffd8) * hem * m * 0.9 * (0.7 + 0.3 * folds);
  col += hex(0x2dff8a) * 0.12 * exp(-max(fx, 0.0) * 45.0) * (1.0 - m);
  return col;
}
`,
  },
  {
    key: "water",
    label: "Water",
    category: "living",
    relief: -0.03,
    light: 125,
    heroTime: 1.0,
    loop: "Water flows along the channels; drops fall in and ring outward",
    glsl: /* glsl */ `
#define HAS_SURFACE
// The mark as water: its strokes are channels cut into a dark slate coin and brimming with clear water that flows
// along them. Caustics swim on the teal channel floors; every so often a drop falls into a channel and its rings run
// along it. Only the stone right at the brim is wet; the rest of the coin stays plain and dry.
float surface(vec2 uv, vec4 f) { return 0.002 * (vnoise(uv * 30.0) - 0.5); }
vec2 wtrSnap(vec2 p) {
  for (int i = 0; i < 2; i++) p -= fieldGrad(p, 0) * (field(p).x + 0.02);
  return p;
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float fx = h.f.x;
  float t = uTime;
  float chan = 1.0 - smoothstep(-0.008, 0.004, fx);
  float wet = exp(-max(fx, 0.0) * 60.0) * (1.0 - chan);
  vec3 stone = mix(hex(0x111315), hex(0x191b1d), vnoise(uv * 14.0)) * (1.0 - 0.45 * wet);
  // Flow along the strokes (a two-phase flow map so it never smears).
  vec2 dir = strokeDir(uv);
  float p0 = fract(t * 0.3), p1 = fract(t * 0.3 + 0.5);
  float w0 = 1.0 - abs(2.0 * p0 - 1.0);
  float n0 = snoise((uv - dir * p0 * 0.12) * 13.0);
  float n1 = snoise((uv - dir * p1 * 0.12) * 13.0 + 3.7);
  float flow = n0 * w0 + n1 * (1.0 - w0);
  // Drops landing on the mark and their rings.
  vec2 ringG = vec2(0.0);
  float ringH = 0.0, splash = 0.0;
  for (int i = 0; i < 3; i++) {
    float tt = t / 2.4 + float(i) / 3.0;
    float k = floor(tt), age = fract(tt) * 2.4;
    vec2 c = wtrSnap((hash22(vec2(k * 1.3, float(i) * 7.3 + 1.0)) - 0.5) * 1.8);
    vec2 dc = uv - c;
    float r = length(dc), front = 0.02 + age * 0.18;
    float env = exp(-age * 1.5) * exp(-pow((r - front) * 30.0, 2.0));
    ringH += env * sin((r - front) * 90.0);
    ringG += dc / max(r, 1e-3) * env * cos((r - front) * 90.0);
    splash += exp(-age * 14.0) * exp(-r * r * 3000.0);
  }
  // The channel floor, seen through the water: teal, with caustic lines and the rings' light.
  float caus = pow(1.0 - abs(flow), 10.0) + sat(ringH) * 0.6;
  vec3 floorAlb = hex(0x0f5560) * (0.45 + 1.4 * caus);
  vec3 col = litDielectric(h, mix(stone, floorAlb, chan), mix(mix(0.8, 0.35, wet), 0.6, chan), mix(0.1 + 0.6 * wet, 0.2, chan));
  // The water's surface.
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 tilt = (perp * flow * 0.12 + ringG * 0.35) * chan;
  vec3 n = normalize(h.wn + uRot * vec3(tilt, 0.0));
  float fr = fresnel(dot(n, h.v), 0.02);
  vec3 surf = (fr + 0.04) * studioEnv(reflect(-h.v, n)) * 1.4 + ggx(n, h.v, h.l, 0.03) * vec3(1.0, 0.97, 0.9) * 3.0;
  col = col * (1.0 - fr * chan) + surf * chan;
  // Meniscus: a thin bright line where the water meets the stone.
  col += vec3(0.6, 0.8, 0.85) * 0.12 * chan * smoothstep(-0.012, -0.002, fx);
  col += vec3(1.0) * splash * 2.0 * chan;
  return col;
}
`,
  },
];
