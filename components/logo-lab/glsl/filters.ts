/**
 * Full-screen passes after the scene: stackable filters (any material can be
 * seen "through" them), the transmute dissolve between two materials, and the
 * final blit to the canvas.
 */

export const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const COMMON = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uTime;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 src(vec2 uv) { return texture(uSrc, uv).rgb; }
/** The scene's alpha: 0 for background, 0.5 + key/2 on the coin (see glsl/scene.ts). */
float subjectOf(float a) { return step(0.25, a); }
float keyOf(float a) { return subjectOf(a) * clamp((a - 0.5) * 2.0, 0.0, 1.0); }
float packAlpha(float subject, float key) { return subject > 0.5 ? 0.5 + clamp(key, 0.0, 0.99) * 0.5 : 0.0; }
/** Thermal-camera palette: black, indigo, magenta, red, orange, yellow, white. */
vec3 ironbow(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.0, 0.0, 0.02), c1 = vec3(0.18, 0.0, 0.42), c2 = vec3(0.62, 0.0, 0.55), c3 = vec3(0.92, 0.25, 0.08), c4 = vec3(1.0, 0.72, 0.0), c5 = vec3(1.0, 1.0, 0.85);
  if (t < 0.2) return mix(c0, c1, t / 0.2);
  if (t < 0.4) return mix(c1, c2, (t - 0.2) / 0.2);
  if (t < 0.6) return mix(c2, c3, (t - 0.4) / 0.2);
  if (t < 0.8) return mix(c3, c4, (t - 0.6) / 0.2);
  return mix(c4, c5, (t - 0.8) / 0.2);
}
/** Bayer 8x8 ordered-dither index 0..63. */
int bayer8(ivec2 p) {
  int x = p.x & 7, y = p.y & 7;
  int v = 0;
  int xy = x ^ y;
  v |= ((xy & 1) << 5) | ((x & 1) << 4) | ((xy & 2) << 2) | ((x & 2) << 1) | ((xy & 4) >> 1) | ((x & 4) >> 2);
  return v;
}
`;

export const FILTER_FRAG = COMMON + /* glsl */ `
uniform int uFilter;
uniform float uAmount;


vec3 apply(int f, vec2 uv) {
  vec2 px = uv * uRes;
  vec3 base = src(uv);
  if (f == 1) { // lens: chromatic, barrel, vignette, soft edges
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    vec2 duv = c * (1.0 + 0.18 * r2);
    vec3 col;
    col.r = src(0.5 + duv * 1.012).r;
    col.g = src(0.5 + duv).g;
    col.b = src(0.5 + duv * 0.988).b;
    vec3 blur = vec3(0.0);
    for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; blur += src(0.5 + duv + vec2(cos(a), sin(a)) * 0.006 * r2 * 8.0); }
    col = mix(col, blur / 8.0, smoothstep(0.05, 0.25, r2));
    return col * (1.0 - 0.9 * r2);
  }
  if (f == 2) { // thermal camera
    vec3 b = vec3(0.0);
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) b += src(uv + vec2(i, j) * 2.0 / uRes);
    float heat = luma(b / 25.0);
    heat = pow(heat, 0.8) + 0.03 * (vnoise(px * 0.5 + uTime * 40.0) - 0.5);
    return ironbow(heat * 1.15);
  }
  if (f == 3) { // 1-bit ordered dither
    ivec2 cell = ivec2(px / 2.0);
    float th = (float(bayer8(cell)) + 0.5) / 64.0;
    float l = pow(luma(src((vec2(cell) * 2.0 + 1.0) / uRes)), 0.8);
    return l > th ? vec3(0.96, 0.94, 0.9) : vec3(0.03);
  }
  if (f == 4) { // CRT
    vec2 c = uv * 2.0 - 1.0;
    c *= 1.0 + 0.08 * dot(c.yx, c.yx);
    vec2 cuv = c * 0.5 + 0.5;
    if (any(lessThan(cuv, vec2(0.0))) || any(greaterThan(cuv, vec2(1.0)))) return vec3(0.0);
    float roll = sin(uTime * 0.6) * 0.002;
    vec3 col = src(cuv + vec2(roll, 0.0));
    vec3 glow = (src(cuv + vec2(3, 0) / uRes) + src(cuv - vec2(3, 0) / uRes) + src(cuv + vec2(0, 3) / uRes) + src(cuv - vec2(0, 3) / uRes)) * 0.25;
    col = col + glow * 0.35;
    float scan = 0.65 + 0.35 * sin(cuv.y * uRes.y * 1.5708);
    int m = int(px.x) % 3;
    vec3 mask = m == 0 ? vec3(1.0, 0.35, 0.35) : m == 1 ? vec3(0.35, 1.0, 0.35) : vec3(0.35, 0.35, 1.0);
    float vig = 1.0 - 0.6 * dot(c * 0.5, c * 0.5);
    return col * scan * mask * 1.6 * vig;
  }
  if (f == 5) { // VHS
    float line = floor(px.y / 2.0);
    float jitter = (vnoise(vec2(line * 0.05, uTime * 3.0)) - 0.5) * 0.006 + step(0.985, vnoise(vec2(line * 0.3, uTime * 7.0))) * 0.02;
    float head = smoothstep(0.06, 0.0, uv.y) * 0.03 * sin(uTime * 30.0 + uv.y * 200.0);
    vec2 u = uv + vec2(jitter + head, 0.0);
    vec3 col = vec3(src(u + vec2(0.004, 0.0)).r, src(u).g, src(u - vec2(0.004, 0.0)).b);
    col = mix(col, vec3(luma(col)), 0.25);
    col += (hash12(px + uTime * 100.0) - 0.5) * 0.08;
    col *= 0.92 + 0.08 * sin(uv.y * 600.0 + uTime * 10.0);
    return col;
  }
  if (f == 6) { // halftone
    float cell = 6.0;
    mat2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071);
    vec2 q = r * px / cell;
    vec2 centre = (floor(q) + 0.5);
    vec2 sp = transpose(r) * centre * cell;
    float l = luma(src(sp / uRes));
    float radius = sqrt(1.0 - l) * 0.62;
    float d = length(fract(q) - 0.5);
    float ink = smoothstep(radius + 0.06, radius - 0.06, d);
    return mix(vec3(0.93, 0.9, 0.84), vec3(0.06, 0.06, 0.09), ink);
  }
  if (f == 7) { // risograph: two inks, misregistered, grainy
    vec2 off = vec2(0.006, -0.004) * (0.6 + 0.4 * sin(uTime * 2.0));
    float a = luma(src(uv));
    float b = luma(src(uv + off));
    float g = hash12(floor(px / 1.5));
    float inkPink = step(g, smoothstep(0.08, 0.9, a) * 0.95);
    float inkBlue = step(hash12(floor(px / 1.5) + 7.0), smoothstep(0.35, 1.0, b) * 0.8);
    vec3 paper = vec3(0.95, 0.93, 0.88);
    vec3 col = paper;
    col *= mix(vec3(1.0), vec3(1.0, 0.28, 0.62), inkPink);
    col *= mix(vec3(1.0), vec3(0.0, 0.47, 0.75), inkBlue);
    return col;
  }
  if (f == 8) { // anamorphic flare
    vec3 streak = vec3(0.0);
    for (int i = -12; i <= 12; i++) {
      vec3 s = src(uv + vec2(float(i) * 0.018, 0.0));
      streak += max(s - 0.65, 0.0) * (1.0 - abs(float(i)) / 13.0);
    }
    vec3 col = base + streak * vec3(0.25, 0.45, 1.0) * 0.5;
    vec2 c = (uv - 0.5) * vec2(1.0, 1.6);
    return col * (1.0 - 0.7 * dot(c, c));
  }
  if (f == 9) { // film grain + gate weave + flicker
    float t = floor(uTime * 24.0);
    vec2 weave = vec2(vnoise(vec2(t * 0.37, 1.0)) - 0.5, vnoise(vec2(t * 0.29, 5.0)) - 0.5) * 0.004;
    vec3 col = src(uv + weave);
    float grain = hash12(floor(px) + t * 13.0) - 0.5;
    col += grain * 0.11 * (0.4 + luma(col));
    col *= 0.94 + 0.06 * hash12(vec2(t, 3.0));
    col = mix(col, col * vec3(1.04, 0.98, 0.9), 0.6);
    return col;
  }
  if (f == 10) { // lateral chromatic aberration
    vec2 c = uv - 0.5;
    return vec3(src(uv + c * 0.025).r, src(uv).g, src(uv - c * 0.025).b);
  }
  return base;
}

void main() {
  vec4 raw = texture(uSrc, vUv);
  // Only the subject is filtered; the background stays as the material drew it.
  float amount = clamp(uAmount, 0.0, 1.0) * subjectOf(raw.a);
  vec3 col = amount > 0.0 ? mix(raw.rgb, apply(uFilter, vUv), amount) : raw.rgb;
  fragColor = vec4(col, raw.a);
}
`;

/**
 * Transmute: A gives way to B, clipped to the coin. Only pixels that are coin
 * on at least one side are touched; the background stays plain black for the
 * whole sequence. A style may sample A/B anywhere (blocks, tears, warps) but
 * the result is always masked by this pixel's coin bit, so it never spills.
 *
 * uStyle is the TRANSITIONS index in types.ts (append only). Every style is
 * exactly A at uMix 0 and exactly B at uMix 1: the morph pass also runs while a
 * step holds. Coin flip (18) moves the real coin instead and never gets here.
 */
export const MORPH_FRAG = COMMON + /* glsl */ `
uniform sampler2D uB;
uniform float uMix;
uniform int uStyle;

const float PI = 3.14159265;
/** One side's colour at uv (black where that side is background). */
vec3 side(vec2 uv, float useB) { return mix(texture(uSrc, uv).rgb, texture(uB, uv).rgb, useB); }
/** 0 at both ends, 1 in the middle. */
float bump(float p) { return sin(PI * clamp(p, 0.0, 1.0)); }
float sat1(float x) { return clamp(x, 0.0, 1.0); }

/** Dissolve along a key with an edge glow (Stroke dissolve, Part by part). */
vec3 keyDissolve(vec3 a, vec3 b, float key, float p, float w, float lead, vec3 glow, float both) {
  float th = p * (1.0 + 2.0 * lead) - lead;
  float t = smoothstep(th - w, th + w, key);
  vec3 col = mix(b, a, t);
  float seam = 1.0 - smoothstep(0.0, w * 1.6, abs(key - th));
  return col + seam * step(0.001, p) * step(p, 0.999) * both * glow;
}

void main() {
  vec4 a = texture(uSrc, vUv);
  vec4 b = texture(uB, vUv);
  float sa = subjectOf(a.a), sb = subjectOf(b.a);
  float subject = max(sa, sb);
  // The key only ever comes from a side that is coin.
  float ka = keyOf(a.a), kb = keyOf(b.a);
  float key = sa * sb > 0.5 ? mix(ka, kb, 0.5) : (sa > 0.5 ? ka : kb);
  float p = clamp(uMix, 0.0, 1.0);
  float live = step(0.001, p) * step(p, 0.999);
  float k = bump(p);
  vec2 px = vUv * uRes;
  float S = min(uRes.x, uRes.y);
  vec2 c = (px - 0.5 * uRes) / S;
  float f24 = floor(uTime * 24.0);
  vec3 col;

  if (uStyle == 1) { // dither dissolve
    float cellPx = max(2.0, floor(uRes.y / 240.0 + 0.5));
    ivec2 cell = ivec2(floor(px / cellPx));
    float order = mix((float(bayer8(cell)) + 0.5) / 64.0, key, 0.35);
    col = mix(a.rgb, b.rgb, step(order, p * 1.02));
    float flash = sat1(1.0 - abs(p - 0.5) / 0.2) * live;
    vec3 bit = luma(col) > (float(bayer8(cell + 3)) + 0.5) / 64.0 ? vec3(0.96, 0.94, 0.9) : vec3(0.03);
    col = mix(col, bit, flash * 0.85);
  } else if (uStyle == 2) { // none: a straight cut
    col = p < 0.5 ? a.rgb : b.rgb;
  } else if (uStyle == 3) { // crossfade
    col = mix(a.rgb, b.rgb, p);
  } else if (uStyle == 4) { // part by part: rim, smile, then each letter, then the face (part keys from the scene)
    col = keyDissolve(a.rgb, b.rgb, key, p, 0.012, 0.04, vec3(1.0, 0.98, 0.94) * 1.6, sa * sb);
  } else if (uStyle == 5) { // pixelate
    float bs = floor(1.0 + k * k * S / 22.0);
    vec2 cell = (floor(px / bs) + 0.5) * bs / uRes;
    col = side(cell, smoothstep(0.45, 0.55, p));
  } else if (uStyle == 6) { // glitch
    float rowH = mix(6.0, 40.0, hash12(vec2(floor(px.y / 24.0), f24)));
    float row = floor(px.y / rowH);
    float tear = step(1.0 - k * 0.7, hash12(vec2(row * 1.7 + 3.0, f24 + 11.0)));
    vec2 uv = vUv + vec2((hash12(vec2(row, f24)) - 0.5) * 0.12 * k * tear, 0.0);
    float useB = step(hash12(vec2(row * 3.1, floor(f24 / 3.0))), p);
    float ca = 0.008 * k;
    col = vec3(side(uv + vec2(ca, 0.0), useB).r, side(uv, useB).g, side(uv - vec2(ca, 0.0), useB).b);
    vec2 blk = floor(px / vec2(32.0, 8.0));
    float noisy = step(1.0 - 0.18 * k, hash12(blk + f24));
    col = mix(col, vec3(hash12(blk + f24 + 5.0), hash12(blk + f24 + 7.0), hash12(blk + f24 + 9.0)), noisy * 0.7);
  } else if (uStyle == 7) { // halftone: A's dots shrink away, B's grow back
    mat2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071);
    float cellPx = max(4.0, S / 60.0);
    vec2 q = r * px / cellPx;
    vec2 dotPx = transpose(r) * (floor(q) + 0.5) * cellPx;
    float useB = step(0.5, p);
    vec3 dotCol = side(dotPx / uRes, useB);
    // Dots shrink to their smallest (never nothing) at the swap, then grow back as B.
    float rad = (0.2 + 0.5 * sqrt(luma(dotCol))) * (0.3 + 0.7 * abs(p - 0.5) * 2.0);
    float ink = smoothstep(rad + 0.05, rad - 0.05, length(fract(q) - 0.5));
    float h = smoothstep(0.0, 0.3, p) * (1.0 - smoothstep(0.7, 1.0, p));
    col = mix(side(vUv, useB), dotCol * ink, h);
  } else if (uStyle == 8) { // blinds
    float N = 10.0;
    float y = vUv.y * N;
    float i = floor(y);
    float q = sat1((p - (N - 1.0 - i) / N * 0.5) / 0.5);
    float sc = abs(cos(PI * q));
    float ly = (fract(y) - 0.5) / max(sc, 1e-3) + 0.5;
    col = (ly < 0.0 || ly > 1.0) ? vec3(0.0) : side(vec2(vUv.x, (i + ly) / N), step(0.5, q)) * mix(0.35, 1.0, sc);
  } else if (uStyle == 9) { // tile flip
    float tp = S / 14.0;
    vec2 t = floor(px / tp);
    vec2 tc = (t + 0.5) * tp;
    float delay = 0.55 * (0.6 * hash12(t + 17.0) + 0.4 * sat1(length((tc - 0.5 * uRes) / S) * 1.4));
    float q = sat1((p - delay) / 0.45);
    float sc = abs(cos(PI * q));
    float lx = (px.x - tc.x) / max(sc, 1e-3);
    col = abs(lx) > tp * 0.5 ? vec3(0.0) : side(vec2(tc.x + lx, px.y) / uRes, step(0.5, q)) * mix(0.4, 1.0, sc);
  } else if (uStyle == 10) { // TV roll: B rolls down from the top behind the frame bar
    float jitter = (vnoise(vec2(vUv.y * 40.0, f24)) - 0.5) * 0.012 * k;
    float bnd = 1.0 - p;
    vec3 img = vUv.y >= bnd ? side(vec2(vUv.x + jitter, vUv.y - bnd), 1.0) : side(vec2(vUv.x + jitter, vUv.y + p), 0.0);
    float bar = (1.0 - smoothstep(0.0, 0.035, abs(vUv.y - bnd))) * live;
    float scan = (1.0 - smoothstep(0.0, 0.004, abs(vUv.y - bnd - 0.03))) * live;
    img *= mix(1.0, 0.8 + 0.2 * sin(px.y * PI), k);
    col = mix(img, vec3(0.0), bar) + scan * vec3(0.9, 0.95, 1.0) * 0.35;
  } else if (uStyle == 11) { // liquid
    vec2 w = vec2(vnoise(c * 4.0 + vec2(0.0, uTime * 0.5)), vnoise(c * 4.0 + vec2(5.2, 1.3 - uTime * 0.5))) - 0.5;
    vec2 uv = vUv + w * 0.08 * k * S / uRes;
    float n = vnoise(c * 3.0 + 9.0) * 0.6 + key * 0.4;
    col = side(uv, smoothstep(n - 0.08, n + 0.08, p * 1.16 - 0.08));
  } else if (uStyle == 12) { // channel shift
    vec2 duv = c * 0.08 * k * S / uRes;
    col = vec3(side(vUv + duv, smoothstep(0.15, 0.4, p)).r, side(vUv, smoothstep(0.38, 0.62, p)).g, side(vUv - duv, smoothstep(0.6, 0.85, p)).b);
  } else if (uStyle == 13) { // heat
    vec3 img = side(vUv, smoothstep(0.42, 0.58, p));
    float heat = smoothstep(0.0, 0.35, p) * (1.0 - smoothstep(0.65, 1.0, p));
    vec3 hot = ironbow(pow(luma(img), 0.8) * 1.1 + 0.08 * (vnoise(px * 0.5 + uTime * 40.0) - 0.5));
    col = mix(img, hot, heat);
  } else if (uStyle == 14) { // posterize
    vec3 img = side(vUv, step(0.5, p));
    float levels = floor(mix(24.0, 2.0, k));
    col = mix(img, floor(img * (levels - 1.0) + 0.5) / (levels - 1.0), smoothstep(0.0, 0.15, k));
  } else if (uStyle == 15) { // static
    vec3 img = side(vUv, step(0.5, p));
    float sn = hash12(floor(px / max(1.0, S / 360.0)) + f24 * 13.1);
    float band = 0.5 + 0.5 * sin(vUv.y * 18.0 - uTime * 20.0);
    col = mix(img, vec3(sn) * (0.75 + 0.35 * band), sat1(pow(k, 0.7) * 1.05));
  } else if (uStyle == 16) { // flash: overexpose to white and come down on B
    vec3 img = side(vUv, smoothstep(0.45, 0.55, p));
    vec3 hot = 1.0 - exp(-img * (1.0 + 10.0 * k * k) * 1.4);
    col = mix(mix(img, hot, smoothstep(0.0, 0.2, k)), vec3(1.0, 0.97, 0.9), smoothstep(0.6, 1.0, k));
  } else if (uStyle == 17) { // motion smear
    float useB = step(0.5, p);
    float len = 0.18 * k * k;
    float drift = (useB > 0.5 ? -1.0 : 1.0) * k * k * 0.06;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 12; i++) acc += side(vUv + vec2((float(i) / 11.0 - 0.5) * len + drift, 0.0), useB);
    col = acc / 12.0;
  } else if (uStyle == 18) { // coin flip is done by turning the coin; a cut if it ever lands here
    col = p < 0.5 ? a.rgb : b.rgb;
  } else { // 0 stroke dissolve: spreads out from the letterforms with a glowing seam
    col = keyDissolve(a.rgb, b.rgb, key, p, 0.035, 0.12, vec3(1.0, 0.55, 0.18) * 1.2, sa * sb);
  }
  col = mix(vec3(0.0), col, subject);
  fragColor = vec4(col, packAlpha(subject, key));
}
`;

export const BLIT_FRAG = COMMON + /* glsl */ `
// uKey: key the black background out (alpha from brightness, colour left premultiplied),
// so the coin composites over whatever is behind a transparent canvas.
uniform int uKey;
void main() {
  vec3 c = clamp(texture(uSrc, vUv).rgb, 0.0, 1.0);
  fragColor = uKey == 1 ? vec4(c, max(c.r, max(c.g, c.b))) : vec4(c, 1.0);
}
`;
