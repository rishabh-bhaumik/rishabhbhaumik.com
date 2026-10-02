/**
 * Shared GLSL for every logo material: uniforms, noise, the logo field, the
 * coin, lighting. A material's GLSL is pasted between PRELUDE and the scene
 * main (glsl/scene.ts), so it can use everything here.
 *
 * ── Material contract ──────────────────────────────────────────────────────
 * Required:
 *   vec3 shade(Hit h)                      linear HDR colour of a hit
 * Optional hooks (define the macro, then the function):
 *   #define HAS_SURFACE  float surface(vec2 uv, vec4 f)
 *       extra height (logo units, keep within ±0.03) on both faces: grain,
 *       tool marks, weave. Added to the logo relief. Baked into a texture
 *       each frame, so it may only depend on (uv, f) and uniforms.
 *   #define HAS_SDF      float materialSDF(vec3 p)
 *       reshape the object (object space); it is clipped to the coin's
 *       volume. `defaultSDF(p)`, coin2D and COIN_* are there to build on.
 *   #define HAS_RENDER   vec3 render(vec3 ro, vec3 rd, vec2 suv)
 *       take over the whole pixel (volumes, beams, scopes), seen only through
 *       the coin's silhouette. Can still call trace(ro, rd, h) and shade-style
 *       helpers.
 *   #define HAS_POST     vec3 post(vec3 col, vec2 suv, vec2 px)
 *       display-space touch on this pixel only (after tone mapping).
 *
 * The backdrop is always plain black: draw nothing outside the coin.
 *
 * Budget: one softShadow per shade() (litDielectric/litMetal already cast
 * one) and about 8 ms a frame at 1024 px (`__logoLab.bench` in dev).
 *
 * Conventions: object space has the logo on the +z face, logo radius 1, y up.
 * World space: camera on +z looking down -z. `uTime` is the loop clock in s.
 */

export const PRELUDE = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform vec2  uRes;
uniform float uTime;
uniform mat3  uRot;        // object -> world
uniform float uRelief;     // logo units, negative engraves
uniform vec3  uLight;      // world-space direction towards the key light
uniform vec2  uPointer;    // -1..1
uniform float uSeed;
uniform sampler2D uField;  // RGBA signed distances (see logoField.ts)
uniform sampler2D uGlyphs; // 16 x 2 glyph atlas
uniform float uFieldExtent;

out vec4 fragColor;

#define PI  3.14159265359
#define TAU 6.28318530718
// The object: every material is a coin of radius COIN_R and half thickness COIN_T (logo units).
#define COIN_R 1.14
#define COIN_T 0.1
#define COIN_BEVEL 0.035

// ── Hashes and noise ─────────────────────────────────────────────────────────
float hash11(float p) { p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2  hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float hash13(vec3 p3) { p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3  hash33(vec3 p3) { p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y),
    u.z);
}
/** Gradient (simplex) noise, -1..1. */
vec3 _perm(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = _perm(_perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise3(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
float ridged(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * (1.0 - abs(snoise(p))); p = p * 2.07 + 9.3; a *= 0.5; } return s; }
/** Voronoi: x = distance to nearest point, y = to second nearest, z = cell id 0..1, w = edge distance (F2 - F1). */
vec4 voronoi(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0; float id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(i, j);
    vec2 o = hash22(n + g);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; id = hash12(n + g); } else if (d < d2) { d2 = d; }
  }
  return vec4(d1, d2, id, d2 - d1);
}
/** Divergence-free flow for smoke and liquid. */
vec2 curl(vec2 p) {
  float e = 0.01;
  float n1 = snoise(p + vec2(0, e)), n2 = snoise(p - vec2(0, e));
  float n3 = snoise(p + vec2(e, 0)), n4 = snoise(p - vec2(e, 0));
  return vec2(n1 - n2, n4 - n3) / (2.0 * e);
}
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sat(float x) { return clamp(x, 0.0, 1.0); }
vec3 sat3(vec3 x) { return clamp(x, 0.0, 1.0); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 hex(int h) { return pow(vec3(float((h >> 16) & 255), float((h >> 8) & 255), float(h & 255)) / 255.0, vec3(2.2)); }
/** Cosine palette (iq). */
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(TAU * (c * t + d)); }

// ── The logo field ───────────────────────────────────────────────────────────
/** Signed distances at p (logo units): x = mark, y = rim, z = smile, w = glyphs ঋভ. Negative inside. */
vec4 field(vec2 p) {
  vec2 uv = vec2(p.x / (2.0 * uFieldExtent) + 0.5, 0.5 - p.y / (2.0 * uFieldExtent));
  vec4 f = textureLod(uField, uv, 0.0);
  vec2 q = abs(p) - vec2(uFieldExtent * 0.985);
  return f + length(max(q, 0.0));
}
float logoD(vec2 p) { return field(p).x; }
/** Half-width of the soft edge where the logo relief rises (logo units). */
#define RELIEF_W 0.022
/** The face coordinates for an object-space point: the back face is mirrored so the mark reads from behind. */
vec2 faceUV(vec3 p) { return p.z >= 0.0 ? p.xy : vec2(-p.x, p.y); }
/** 1 on the mark, 0 off it, softened over w. */
float logoMask(vec2 p, float w) { return 1.0 - smoothstep(-w, w, logoD(p)); }
/** Unit gradient of a field channel: points away from the shape. Its perpendicular runs along the strokes. */
vec2 fieldGrad(vec2 p, int ch) {
  vec2 e = vec2(0.004, 0.0);
  vec4 a = field(p + e.xy) - field(p - e.xy);
  vec4 b = field(p + e.yx) - field(p - e.yx);
  vec2 g = vec2(a[ch], b[ch]);
  return g / max(length(g), 1e-5);
}
/** Direction along the strokes at p. */
vec2 strokeDir(vec2 p) { vec2 g = fieldGrad(p, 0); return vec2(-g.y, g.x); }
/** Rough position along the mark (0..1) for "drawn on" reveals: angle around the centre. */
float aroundMark(vec2 p) { return fract(atan(p.y, p.x) / TAU + 0.25); }

// ── Glyph atlas ──────────────────────────────────────────────────────────────
/** Coverage of glyph (col 0..15, row 0 = density ramp, 1 = Bengali) at cell-local uv 0..1 (y up). */
float glyph(int col, int row, vec2 cuv) {
  vec2 uv = (vec2(float(col), float(row)) + vec2(cuv.x, 1.0 - cuv.y)) / vec2(16.0, 2.0);
  return texture(uGlyphs, uv).r;
}

// ── Shapes ───────────────────────────────────────────────────────────────────
float sdBox2(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float sdEllipse2(vec2 p, vec2 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }
float sdCircle(vec2 p, float r) { return length(p) - r; }
float smin(float a, float b, float k) { float h = sat(0.5 + 0.5 * (b - a) / k); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }

/** The coin's silhouette: signed distance in the face plane (logo units). */
float coin2D(vec2 p) { return sdCircle(p, COIN_R); }

// ── Lighting ─────────────────────────────────────────────────────────────────
/** A photo studio: one big key softbox upper left, a cool strip right, warm floor bounce. Linear HDR. */
vec3 studioEnv(vec3 d) {
  vec3 c = vec3(0.006);
  c += vec3(1.0, 0.96, 0.9) * 5.0 * smoothstep(0.72, 0.95, dot(d, normalize(vec3(-0.55, 0.65, 0.55))));
  vec2 xz = d.xz; float lx = length(xz);
  float strip = lx > 1e-4 ? smoothstep(0.9, 0.985, dot(xz / lx, normalize(vec2(1.0, 0.25)))) : 0.0;
  c += vec3(0.75, 0.82, 1.0) * 1.6 * strip * smoothstep(-0.35, 0.0, d.y) * (1.0 - smoothstep(0.35, 0.7, d.y));
  c += vec3(0.07, 0.05, 0.04) * smoothstep(0.0, -0.7, d.y);
  c += vec3(0.03) * smoothstep(0.2, 1.0, d.y);
  return c;
}
/** Blurry version of the studio for rough surfaces. */
vec3 studioDiffuse(vec3 n) {
  return vec3(0.02) + vec3(0.42, 0.4, 0.37) * sat(dot(n, normalize(vec3(-0.55, 0.65, 0.55))) * 0.5 + 0.5) * 0.5 + vec3(0.05, 0.04, 0.03) * sat(-n.y);
}
float fresnel(float cosT, float f0) { return f0 + (1.0 - f0) * pow(1.0 - sat(cosT), 5.0); }
vec3 fresnel3(float cosT, vec3 f0) { return f0 + (1.0 - f0) * pow(1.0 - sat(cosT), 5.0); }
/** GGX specular lobe (D * vis), roughness 0..1. */
float ggx(vec3 n, vec3 v, vec3 l, float rough) {
  vec3 hv = normalize(v + l);
  float a = max(rough * rough, 0.002), a2 = a * a;
  float nh = sat(dot(n, hv)), nl = sat(dot(n, l)), nv = sat(dot(n, v));
  float d = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
  float k = a * 0.5;
  float vis = 1.0 / ((nl * (1.0 - k) + k) * (nv * (1.0 - k) + k));
  return d * vis * nl * 0.25;
}
/** Thin-film interference colour for a film of thickness t (nm-ish 0..1) at angle cosT. */
vec3 thinFilm(float t, float cosT) {
  float d = t * 1200.0 * cosT;
  return 0.5 + 0.5 * cos(TAU * (d / vec3(650.0, 530.0, 440.0)));
}

// ── Hits ─────────────────────────────────────────────────────────────────────
struct Hit {
  vec3 p;     // object-space position
  vec3 n;     // object-space normal
  vec3 wp;    // world position
  vec3 wn;    // world normal
  vec3 v;     // world direction to the camera
  vec3 rd;    // world ray direction
  vec3 l;     // world direction to the key light
  vec3 lo;    // object-space direction to the key light
  vec2 uv;    // logo coordinates on this face (the back face is mirrored so the mark reads)
  vec4 f;     // field(uv)
  float h;    // 1 on the mark (raised or sunk), 0 on the ground
  float side; // +1 front, -1 back
  float edge; // 0 on a face .. 1 on the side wall
  float ao;   // 0 occluded .. 1 open
  float t;    // ray distance
  vec2 suv;   // screen position, -1..1 on the short side
};

/** Point a hit's key light somewhere else (world direction), e.g. for a light that sweeps in the loop. */
void setLight(inout Hit h, vec3 worldDir) { h.l = normalize(worldDir); h.lo = transpose(uRot) * h.l; }
/** World direction for a light at azimuth a (radians, 0 = right, PI/2 = above) and elevation e (0 = grazing, PI/2 = head-on). */
vec3 lightAt(float a, float e) { return normalize(vec3(cos(a) * cos(e), sin(a) * cos(e), sin(e))); }

float sceneSDF(vec3 p);
float defaultSDF(vec3 p);
bool trace(vec3 ro, vec3 rd, out Hit h);
float softShadow(vec3 ro, vec3 rd, float k);
float calcAO(vec3 p, vec3 n);
vec3 defaultBackground(vec2 suv);

/** A plain lit dielectric: albedo, roughness, specular strength. */
vec3 litDielectric(Hit h, vec3 albedo, float rough, float spec) {
  float nl = sat(dot(h.wn, h.l));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 diff = albedo * (nl * sh * vec3(1.0, 0.96, 0.9) * 1.6 + studioDiffuse(h.wn) * h.ao);
  float fr = fresnel(dot(h.wn, h.v), 0.04);
  vec3 refl = mix(studioDiffuse(reflect(-h.v, h.wn)), studioEnv(reflect(-h.v, h.wn)), (1.0 - rough) * (1.0 - rough));
  return diff + spec * (fr * refl * h.ao + ggx(h.wn, h.v, h.l, rough) * sh * vec3(1.0, 0.96, 0.9) * 2.0);
}
/** A lit metal: base colour (F0), roughness. */
vec3 litMetal(Hit h, vec3 base, float rough) {
  vec3 r = reflect(-h.v, h.wn);
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), (1.0 - rough) * (1.0 - rough));
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  vec3 f = fresnel3(dot(h.wn, h.v), base);
  return f * env * h.ao + base * ggx(h.wn, h.v, h.l, rough) * sh * 2.5;
}
`;
