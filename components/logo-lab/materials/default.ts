import type { LogoMaterial } from "../types";

/** The plain mark: no material, only a solid coin with enough body to read as an object from any angle. */
export const DEFAULT: LogoMaterial[] = [
  {
    key: "default",
    label: "Default",
    category: "default",
    relief: 0.05,
    heroTime: 1,
    light: 130,
    loop: "No material, just the white mark on a black coin that holds up as it turns",
    glsl: /* glsl */ `
#define HAS_SDF
// The default icon as an object: a pure black face with the white mark raised, on a thick
// bevelled body with a dark satin edge, so a spin or flip shows depth and a side instead of a flat disc.
#define DF_R 1.12
#define DF_T 0.2
#define DF_B 0.06
float materialSDF(vec3 p) {
  vec2 w = vec2(length(p.xy) - DF_R + DF_B, abs(p.z) - DF_T + DF_B);
  float slab = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - DF_B;
  vec2 uv = faceUV(p);
  float m = 1.0 - smoothstep(-RELIEF_W, RELIEF_W, field(uv).x);
  float onFace = smoothstep(DF_T * 0.35, DF_T, abs(p.z));
  return slab - uRelief * m * onFace;
}
vec3 shade(Hit h) {
  float sh = softShadow(h.p + h.n * 0.004, h.lo, 12.0);
  float nl = sat(dot(h.wn, h.l));
  vec3 r = reflect(-h.v, h.wn);
  // Face: pure black ground and a plain white mark. No glow, no tint.
  // Only the outer rim of the coin counts as wall; the mark's own bevels stay part of the mark.
  float wallK = h.edge * smoothstep(DF_R - 0.1, DF_R - 0.03, length(h.p.xy));
  // The mark's edge, anti-aliased to one screen pixel (not softened across the relief's bevel,
  // which blurs it at large sizes). A pixel spans about 2 * 1.62 / min(uRes) of the face,
  // more as the face turns away; the field is a distance in face units.
  float px = 3.24 / min(uRes.x, uRes.y) / max(abs(h.wn.z), 0.15);
  float crisp = 1.0 - smoothstep(-px, px, h.f.x);
  float m = crisp * (1.0 - wallK);
  vec3 mark = vec3(1.55, 1.55, 1.6) * (0.86 + 0.14 * nl);
  vec3 face = mix(vec3(0.0), mark, m);
  // Edge: dark satin graphite, lit just enough to give the thickness a rim.
  vec3 base = vec3(0.1, 0.105, 0.115);
  vec3 env = mix(studioDiffuse(r) * 2.0, studioEnv(r), 0.49);
  vec3 wall = fresnel3(dot(h.wn, h.v), base) * env * h.ao + base * ggx(h.wn, h.v, h.l, 0.3) * sh * 2.5;
  return mix(face, wall, wallK);
}
`,
  },
];
