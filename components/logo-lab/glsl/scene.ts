/**
 * The scene pass, pasted after a material's GLSL. It builds the object (coin
 * + logo relief + the material's surface), raymarches it from a camera on +z,
 * fills a Hit and asks the material to shade it.
 *
 * Output: rgb = display colour (tone mapped, gamma); alpha packs two things:
 * whether the pixel is the coin, and a dissolve key used when transmuting (the
 * stroke-distance of the mark plus noise, so a morph spreads out from the
 * letterforms): background a = 0, coin a = 0.5 + key * 0.5. Filters and the
 * morph use the coin bit so they leave the background alone.
 */

export const SCENE = /* glsl */ `
#define CAM_Z 4.4
#define VIEW_HALF 1.62
#define SURF_EXTENT 1.2

uniform sampler2D uSurf;  // surface() baked for this frame, over |uv| < SURF_EXTENT
uniform float uSurfOn;    // 1 when uSurf holds this frame's bake
uniform int uPass;        // 0 = scene, 1 = bake surface() into uSurf
uniform int uKeyMode;     // dissolve key: 0 = stroke distance, 1 = part of the mark (Part by part)

/**
 * A material's surface() is the expensive part of the SDF, and the march
 * calls it on every step. The march, AO and shadows read the bake instead;
 * gExact switches back to the real function for the hit point and its normal,
 * so the detail stays crisp.
 */
bool gExact = false;

float userSurface(vec2 uv, vec4 f) {
#ifdef HAS_SURFACE
  if (!gExact && uSurfOn > 0.5 && abs(uv.x) < SURF_EXTENT && abs(uv.y) < SURF_EXTENT)
    return textureLod(uSurf, uv / (2.0 * SURF_EXTENT) + 0.5, 0.0).r;
  return surface(uv, f);
#else
  return 0.0;
#endif
}


float reliefHeight(vec2 uv, vec4 f) {
  float m = 1.0 - smoothstep(-RELIEF_W, RELIEF_W, f.x);
  return uRelief * m + userSurface(uv, f);
}

/** The coin: a bevelled disc with the logo relief (and the material's surface) on both faces. */
float defaultSDF(vec3 p) {
  vec2 w = vec2(coin2D(p.xy) + COIN_BEVEL, abs(p.z) - COIN_T + COIN_BEVEL);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - COIN_BEVEL;
  vec2 uv = faceUV(p);
  vec4 f = field(uv);
  float onFace = smoothstep(COIN_T * 0.35, COIN_T, abs(p.z));
  float m = 1.0 - smoothstep(-RELIEF_W, RELIEF_W, f.x);
  return slab - (uRelief * m + userSurface(uv, f)) * onFace;
}

/** Every material is a coin: custom shapes are kept inside the coin's volume. */
float coinBound(vec3 p) { return max(length(p.xy) - 1.16, abs(p.z) - 0.3); }

/** Where a ray (object space) is inside the cylinder |xy| <= R, |z| <= T: (near, far); near > far on a miss. */
vec2 coinSpan(vec3 o, vec3 d, float R, float T) {
  const vec2 MISS = vec2(1.0, -1.0);
  float tz0 = -1e9, tz1 = 1e9;
  if (abs(d.z) > 1e-6) {
    float a = (-T - o.z) / d.z, b = (T - o.z) / d.z;
    tz0 = min(a, b); tz1 = max(a, b);
  } else if (abs(o.z) > T) return MISS;
  float qa = dot(d.xy, d.xy), qb = dot(o.xy, d.xy), qc = dot(o.xy, o.xy) - R * R;
  float tc0 = -1e9, tc1 = 1e9;
  if (qa > 1e-8) {
    float disc = qb * qb - qa * qc;
    if (disc < 0.0) return MISS;
    float sq = sqrt(disc);
    tc0 = (-qb - sq) / qa; tc1 = (-qb + sq) / qa;
  } else if (qc > 0.0) return MISS;
  return vec2(max(tz0, tc0), min(tz1, tc1));
}

/** The span of a ray inside everything the object's SDF can reach. */
vec2 objectSpan(vec3 o, vec3 d) {
#ifdef HAS_SDF
  return coinSpan(o, d, 1.2, 0.32);
#else
  return coinSpan(o, d, 1.2, 0.2 + abs(uRelief));
#endif
}

float sceneSDF(vec3 p) {
#ifdef HAS_SDF
  return max(materialSDF(p), coinBound(p));
#else
  return defaultSDF(p);
#endif
}

vec3 calcNormal(vec3 p) {
  const vec2 k = vec2(1, -1);
  const float e = 0.0012;
  return normalize(k.xyy * sceneSDF(p + k.xyy * e) + k.yyx * sceneSDF(p + k.yyx * e) +
                   k.yxy * sceneSDF(p + k.yxy * e) + k.xxx * sceneSDF(p + k.xxx * e));
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float hh = 0.01 + 0.05 * float(i);
    occ += (hh - sceneSDF(p + n * hh)) * sca;
    sca *= 0.85;
  }
  return sat(1.0 - 2.2 * occ);
}

float softShadow(vec3 ro, vec3 rd, float k) {
  // Nothing can shadow once the ray leaves the object's bounds.
  float tmax = min(2.0, objectSpan(ro, rd).y);
  float res = 1.0, t = 0.01;
  for (int i = 0; i < 28; i++) {
    if (t > tmax) break;
    float d = sceneSDF(ro + rd * t);
    res = min(res, k * d / t);
    t += clamp(d, 0.008, 0.12);
    if (res < 0.002) break;
  }
  return sat(res);
}

/** The backdrop: always plain black, so nothing a material does reaches past the coin. */
vec3 defaultBackground(vec2 suv) { return vec3(0.0); }

/** March a world-space ray against the object; fills h on a hit. */
bool trace(vec3 ro, vec3 rd, out Hit h) {
  mat3 inv = transpose(uRot);
  vec3 oro = inv * ro, ord = inv * rd;
  h.rd = rd; h.v = -rd; h.l = uLight; h.lo = inv * uLight;
  vec2 span = objectSpan(oro, ord);
  if (span.x > span.y || span.y < 0.0) return false;
  float t = max(span.x, 0.0), tmax = span.y + 0.01;
  bool hit = false;
  for (int i = 0; i < 140; i++) {
    float d = sceneSDF(oro + ord * t);
    if (d < 0.0006 * t) { hit = true; break; }
    t += d * 0.72;
    if (t > tmax) break;
  }
  if (!hit) return false;
  // The march read the baked surface: settle onto the exact one and take the normal there.
  gExact = true;
#ifdef HAS_SURFACE
  for (int i = 0; i < 3; i++) t += sceneSDF(oro + ord * t) * 0.9;
#endif
  h.t = t;
  h.p = oro + ord * t;
  h.n = calcNormal(h.p);
  gExact = false;
  h.wp = uRot * h.p;
  h.wn = normalize(uRot * h.n);
  h.uv = faceUV(h.p);
  h.f = field(h.uv);
  h.h = 1.0 - smoothstep(-RELIEF_W, RELIEF_W, h.f.x);
  h.side = h.p.z >= 0.0 ? 1.0 : -1.0;
  h.edge = 1.0 - smoothstep(0.35, 0.75, abs(h.n.z));
  h.ao = calcAO(h.p, h.n);
  return true;
}

/**
 * Does a world ray hit the coin (a cylinder of the coin's radius and
 * thickness)? Analytic, for materials that draw the whole pixel themselves:
 * their picture is shown only through the coin's silhouette. uv = logo
 * coordinates where the ray enters.
 */
bool coinHit(vec3 ro, vec3 rd, out vec2 uv) {
  mat3 inv = transpose(uRot);
  vec3 o = inv * ro, d = inv * rd;
  vec2 span = coinSpan(o, d, 1.14, 0.1);
  if (span.x > span.y || span.y < 0.0) return false;
  uv = faceUV(o + d * max(span.x, 0.0));
  return true;
}

/** The dissolve key for a point on the face: how far into a transmute it changes (0..1). */
float dissolveKey(vec2 uv, vec4 f) {
  if (uKeyMode == 1) {
    // Part by part: the dashed rim, the smile, ঋ, ভ, then the plain face; each sweeps left to right.
    float sweep = clamp(uv.x * 0.5 + 0.5, 0.0, 1.0) * 0.14;
    if (f.x > 0.02) return 0.84 + sweep;
    if (f.y <= min(f.z, f.w)) return 0.04 + sweep;
    if (f.z <= f.w) return 0.24 + sweep;
    return (uv.x < 0.04 ? 0.44 : 0.64) + sweep;
  }
  return sat(0.45 + f.x * 0.9 + 0.22 * (fbm(uv * 3.0 + uSeed) - 0.5));
}

vec3 aces(vec3 x) { return sat3(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14)); }

void main() {
#ifdef HAS_SURFACE
  if (uPass == 1) {
    vec2 buv = (gl_FragCoord.xy / uRes * 2.0 - 1.0) * SURF_EXTENT;
    gExact = true;
    fragColor = vec4(surface(buv, field(buv)), 0.0, 0.0, 1.0);
    return;
  }
#endif
  vec2 px = gl_FragCoord.xy;
  vec2 suv = (2.0 * px - uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, CAM_Z);
  vec3 rd = normalize(vec3(suv * (VIEW_HALF / CAM_Z), -1.0));
  vec3 col;
  float key;
  float subject = 1.0;
#ifdef HAS_RENDER
  vec2 cuv;
  if (coinHit(ro, rd, cuv)) {
    col = render(ro, rd, suv);
    key = dissolveKey(cuv, field(cuv));
  } else {
    col = defaultBackground(suv);
    subject = 0.0;
    key = 0.0;
  }
#else
  Hit h;
  h.suv = suv;
  if (trace(ro, rd, h)) {
    h.suv = suv;
    col = shade(h);
    key = dissolveKey(h.uv, h.f);
  } else {
    col = defaultBackground(suv);
    subject = 0.0;
    key = 0.0;
  }
#endif
  col = pow(aces(max(col, 0.0)), vec3(1.0 / 2.2));
#ifdef HAS_POST
  if (subject > 0.5) col = post(col, suv, px);
#endif
  // A whisper of grain on the coin so dark gradients never band; the backdrop stays exactly black.
  col += subject * (hash12(px + fract(uTime) * 91.0) - 0.5) / 255.0;
  // Background is alpha 0; the coin is 0.5..0.995 (0.5 + key/2). Nothing in between, so the
  // passes after this can tell the two apart exactly.
  fragColor = vec4(col, subject > 0.5 ? 0.5 + clamp(key, 0.0, 0.99) * 0.5 : 0.0);
}
`;
