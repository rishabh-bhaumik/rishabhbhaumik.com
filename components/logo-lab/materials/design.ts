import type { LogoMaterial } from "../types";

/**
 * Shared by the print materials (prepended to their GLSL). Printed flats must
 * keep their exact colour through ACES, so `dkFlat` returns the linear HDR
 * value the tone mapper turns back into a given linear display colour.
 */
const KIT = /* glsl */ `
vec3 dkFlat(vec3 lin) {
  vec3 x = clamp(lin, 0.0, 0.97);
  return (sqrt(-10127.0 * x * x + 13702.0 * x + 9.0) + 59.0 * x - 3.0) / (502.0 - 486.0 * x);
}
/** The same, from a display (sRGB-ish, gamma 2.2) colour. */
vec3 dkDisplay(vec3 srgb) { return dkFlat(pow(max(srgb, 0.0), vec3(2.2))); }
/** One screen pixel in logo units at ray distance t, on a face looking at the camera. */
float dkPx(float t) { return 0.7364 * t / min(uRes.x, uRes.y); }
/** Coverage of a line of half-width w at distance d; never thinner than a pixel (it fades instead). */
float dkLine(float d, float w, float px) {
  float ww = max(w, px * 0.5);
  return sat((ww + px * 0.5 - abs(d)) / px) * min(1.0, w / (px * 0.5));
}
/** Coverage of a filled shape from its signed distance. */
float dkFill(float d, float px) { return sat(0.5 - d / px); }
/** Light on a printed disc: about 1 when it faces the light, a little sheen, the relief's own occlusion. */
vec3 dkPaper(Hit h, vec3 flatCol, float sheen) {
  float nl = sat(dot(h.wn, h.l));
  float lit = (0.82 + 0.22 * nl) * mix(1.0, h.ao, 0.6);
  return flatCol * lit + vec3(ggx(h.wn, h.v, h.l, 0.45) * sheen);
}
`;

/** Design: the tools and print processes of the trade, each made into a disc. */
export const DESIGN: LogoMaterial[] = [
  {
    key: "vector-outline",
    label: "Vector Outline",
    category: "design",
    relief: 0.0,
    heroTime: 9.0,
    loop: "Path by path, an anchor is dragged and its bezier handles swing",
    glsl:
      KIT +
      /* glsl */ `
// A disc of Figma canvas in outline mode: every path as a 1 px outline, the selected path in selection blue with
// square anchors, the anchor being tugged with its bezier handles, the bounding box with its size pill, the cursor.
// Loop: one path at a time is selected (rim, smile, letters) and an anchor on it is pulled out and back.
#define VO_BLUE vec3(0.051, 0.6, 1.0)
#define VO_S 0.88
float voSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * sat(dot(pa, ba) / max(dot(ba, ba), 1e-8)));
}
/** Signed distance to a triangle (iq), negative inside. */
float voTri(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
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
/** Snap a point onto one channel's outline (the field is a true distance, so a step or two is exact). */
vec2 voProject(vec2 s, int ch) {
  for (int i = 0; i < 2; i++) {
    vec4 f = field(s);
    s -= f[ch] * fieldGrad(s, ch);
  }
  return s;
}
/** A Figma handle square, sizes in pixels. */
vec3 voSquare(vec3 col, vec2 o, float hs, vec3 fillCol, vec3 strokeCol) {
  float sq = max(abs(o.x), abs(o.y));
  col = mix(col, strokeCol, sat(hs + 1.5 - sq));
  return mix(col, fillCol, sat(hs + 0.5 - sq));
}
vec3 shade(Hit h) {
  if (h.edge > 0.5) return dkPaper(h, dkDisplay(vec3(0.17)), 0.25);
  vec2 uv = h.uv / VO_S;
  float px = dkPx(h.t) / VO_S;
  vec3 col = vec3(0.118);                          // the canvas, #1e1e1e
  // The disc's own frame, like a frame outline on the canvas.
  col = mix(col, vec3(0.22), dkLine(length(h.uv) - 1.05, 0.0015, px * VO_S));

  float seg = floor(uTime / 4.0), ph = fract(uTime / 4.0);
  int ch = 1 + int(mod(seg, 3.0));
  vec2 seed = ch == 1 ? 1.3 * vec2(cos(seg * 2.4 + 0.6), sin(seg * 2.4 + 0.6))
            : ch == 2 ? vec2(0.3 * sin(seg * 1.7), -0.85)
            : vec2(sin(seg * 1.3) > 0.0 ? 0.36 : -0.3, 0.95);
  vec2 q = voProject(seed, ch);
  vec2 n = fieldGrad(q, ch);
  vec2 tg = vec2(-n.y, n.x);
  // The tug goes out and back inside the segment, so the selection hops while the path is at rest.
  float env = smoothstep(0.0, 0.12, ph) * (1.0 - smoothstep(0.88, 1.0, ph));
  float off = 0.075 * sin(ph * TAU) * env;
  vec2 qa = q + n * off;
  vec2 hd = rot2(0.55 * sin(ph * TAU + 0.9) * env) * tg;
  float hl = 0.19 + 0.07 * (1.0 - cos(ph * TAU)) * env;
  vec2 h1 = qa + hd * hl, h2 = qa - hd * hl * 0.72;

  // Outlines: the other paths in light grey, the selected one in blue, bent around the dragged anchor.
  float bend = exp(-dot(uv - q, uv - q) / 0.035);
  vec4 f = field(uv);
  vec4 fd = field(uv - n * off * bend);
  float other = 1e3;
  for (int c = 1; c < 4; c++) if (c != ch) other = min(other, abs(f[c]));
  col = mix(col, vec3(0.78), sat(1.0 - other / px) * 0.85);
  col = mix(col, VO_BLUE, sat(1.3 - abs(fd[ch]) / px));

  // Anchors: a regular sample of the outline, one per grid cell it crosses.
  float G = 0.17;
  vec2 cell = floor(uv / G);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cc = cell + vec2(float(i), float(j));
    vec2 s = (cc + 0.5) * G;
    vec4 fs = field(s);
    float d = fs[ch];
    if (abs(d) > G) continue;
    vec2 a = s - d * fieldGrad(s, ch);
    vec2 rel = a / G - cc;
    if (min(rel.x, rel.y) < 0.0 || max(rel.x, rel.y) >= 1.0) continue;
    if (length(a - q) < G * 0.6) continue;
    a += n * off * exp(-dot(a - q, a - q) / 0.035);
    col = voSquare(col, (uv - a) / px, 2.5, vec3(1.0), VO_BLUE);
  }

  // The dragged anchor's bezier handles, then the anchor itself (selected: filled blue).
  col = mix(col, VO_BLUE, sat(1.1 - min(voSeg(uv, qa, h1), voSeg(uv, qa, h2)) / px));
  float rr = min(length(uv - h1), length(uv - h2)) / px;
  col = mix(col, VO_BLUE, sat(4.3 - rr));
  col = mix(col, vec3(1.0), sat(2.9 - rr));
  col = voSquare(col, (uv - qa) / px, 3.0, VO_BLUE, vec3(1.0));

  // Selection box of the path, corner handles, and the blue size pill under it.
  vec4 bb = ch == 1 ? vec4(-0.972, -1.0, 0.972, 1.0)
          : ch == 2 ? vec4(-0.432, -0.599, 0.398, -0.118)
          : vec4(-0.625, -0.231, 0.622, 0.625);
  vec2 bc = 0.5 * (bb.xy + bb.zw), be = 0.5 * (bb.zw - bb.xy);
  col = mix(col, VO_BLUE, sat(1.0 - abs(sdBox2(uv - bc, be, 0.0)) / px) * 0.9);
  // A corner handle that would fall off the disc is left out.
  vec2 corner = bc + be * sign(uv - bc);
  if (length(corner * VO_S) < 1.08) col = voSquare(col, (uv - corner) / px, 2.5, vec3(1.0), VO_BLUE);
  vec2 lp = (uv - vec2(bc.x, bb.y)) / px + vec2(0.0, 17.0);
  col = mix(col, VO_BLUE, sat(0.5 - sdBox2(lp, vec2(25.0, 8.5), 3.0)));
  float txt = step(abs(lp.y), 2.6) * step(abs(lp.x), 18.0) * step(2.5, abs(lp.x)) * step(0.32, fract(lp.x / 4.2 + 0.1));
  col = mix(col, vec3(1.0), txt * 0.95);

  // The cursor, holding the handle.
  float arrow = voTri((uv - h1) / px - vec2(1.5, -1.5), vec2(0.0), vec2(0.0, -17.0), vec2(12.0, -12.0));
  col = mix(col, vec3(1.0), sat(2.0 - arrow));
  col = mix(col, vec3(0.05), sat(0.3 - arrow));
  return dkPaper(h, dkDisplay(col), 0.12);
}
`,
  },
  {
    key: "blueprint",
    label: "Blueprint",
    category: "design",
    relief: 0.0,
    heroTime: 10.2,
    loop: "The drawing is drafted line by line, then the disc is wiped for the next print",
    glsl:
      KIT +
      /* glsl */ `
// A disc of cyanotype blueprint: chalky white lines in the Prussian-blue ground, inside a degree-ticked border.
// Drafted in order: construction lines and circles, the outline part by part, section hatching stroke by stroke,
// then the dimensions (width, height, a radius leader). The printed drafting grid is there throughout.
#define BP_S 0.8
float bpArrow(vec2 p, vec2 tip, vec2 dir, float px) {
  vec2 q = p - tip;
  float back = -dot(q, dir);
  float across = abs(dot(q, vec2(-dir.y, dir.x)));
  return dkFill(max(across - back * 0.28, max(-back, back - 0.065)), px);
}
float bpReveal(float s, float prog) { return sat((prog - s) / 0.015); }
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float px = dkPx(h.t);
  float tt = mod(uTime, 12.0);
  float wipe = 1.0 - smoothstep(10.8, 11.8, tt);

  // Paper: Prussian blue, mottled where the wash pooled, a fibre, darker toward the edge.
  float m = fbm(uv * 2.2 + 3.0);
  vec3 paper = mix(vec3(0.05, 0.19, 0.4), vec3(0.09, 0.28, 0.53), m);
  paper *= 0.93 + 0.07 * vnoise(uv * vec2(150.0, 16.0));
  paper *= 1.0 - 0.22 * smoothstep(0.85, 1.14, length(uv));
  if (h.side < 0.0 || h.edge > 0.5) return dkPaper(h, dkDisplay(paper * 0.8), 0.1);

  // Printed: drafting grid, a double border with degree ticks.
  vec2 g = abs(fract(uv / 0.08 + 0.5) - 0.5) * 0.08;
  vec2 g5 = abs(fract(uv / 0.4 + 0.5) - 0.5) * 0.4;
  float r = length(uv);
  float inside = step(r, 1.04);
  float printed = max(dkLine(min(g.x, g.y), 0.0008, px) * 0.16, dkLine(min(g5.x, g5.y), 0.0015, px) * 0.3) * inside;
  printed = max(printed, max(dkLine(r - 1.075, 0.004, px), dkLine(r - 1.04, 0.0014, px)));
  float deg = fract(aroundMark(uv) * 72.0);
  float tick = dkLine((deg - 0.5) * TAU * r / 72.0, 0.0012, px);
  float major = step(abs(fract(aroundMark(uv) * 12.0 + 0.5) - 0.5), 0.01);
  printed = max(printed, tick * step(r, 1.04) * step(mix(1.015, 0.985, major), r));

  // The drawing, at a reduced scale.
  vec2 u = uv / BP_S;
  float upx = px / BP_S;
  vec4 f = field(u);
  float ang = aroundMark(u);
  float wob = 0.0022 * (vnoise(u * 28.0) - 0.5);
  float drawn = 0.0;
  // 1. Construction: dash-dot centre lines, circles, 45 degree rays.
  float p1 = sat((tt - 0.2) / 1.6);
  float cl = max(dkLine(u.y, 0.0012, upx) * step(abs(u.x), 1.32 * p1), dkLine(u.x, 0.0012, upx) * step(abs(u.y), 1.32 * p1));
  float dd = fract(max(abs(u.x), abs(u.y)) * 7.0);
  cl *= step(dd, 0.62) + step(0.74, dd) * step(dd, 0.82);
  float circ = dkLine(length(u) - 0.972, 0.0012, upx) + dkLine(length(u) - 0.5, 0.0012, upx);
  circ += dkLine(length(u - vec2(-0.27, 0.2)) - 0.47, 0.0011, upx) + dkLine(length(u - vec2(0.32, 0.3)) - 0.33, 0.0011, upx);
  circ *= step(0.22, fract(ang * 36.0)) * bpReveal(ang, p1);
  float diag = dkLine(abs(u.x) - abs(u.y), 0.0011, upx) * step(length(u), 1.25 * p1) * step(0.5, fract(length(u) * 9.0));
  drawn = max(drawn, max(cl, max(circ, diag)) * 0.55);

  // 2. Outline: the rim around the circle, then letters and smile left to right.
  float isRim = step(abs(f.y), min(abs(f.z), abs(f.w)));
  float p2 = sat((tt - 1.8) / 2.0), p3 = sat((tt - 3.8) / 2.0);
  float rev = mix(bpReveal((u.x + 0.7) / 1.4, p3), bpReveal(ang, p2), isRim);
  drawn = max(drawn, dkLine(f.x + wob, 0.0034, upx) * rev);

  // 3. Section hatching inside the strokes, one stroke at a time.
  float p4 = sat((tt - 5.8) / 1.8);
  float hk = (u.x + u.y) / 0.042;
  float hatch = dkLine((fract(hk) - 0.5) * 0.042, 0.0013, upx) * dkFill(f.x + 0.008, upx);
  drawn = max(drawn, hatch * step(floor(hk) / 76.0 + 0.5, p4) * 0.85);

  // 4. Dimensions: width under the mark, height at the right, extension lines, arrows, figure bars; a radius leader.
  float p5 = sat((tt - 7.6) / 1.6);
  float dimW = dkLine(u.y + 0.86, 0.0015, upx) * step(abs(u.x), 0.972) * step(0.07, abs(u.x));
  dimW = max(dimW, dkLine(abs(u.x) - 0.972, 0.0012, upx) * step(abs(u.y + 0.55), 0.31));
  dimW = max(dimW, max(bpArrow(u, vec2(-0.972, -0.86), vec2(-1.0, 0.0), upx), bpArrow(u, vec2(0.972, -0.86), vec2(1.0, 0.0), upx)));
  dimW = max(dimW, step(abs(u.y + 0.86), 0.014) * step(abs(u.x), 0.055) * step(0.3, fract(u.x * 30.0 + 0.5)));
  float dimH = dkLine(u.x - 0.86, 0.0015, upx) * step(abs(u.y), 1.0) * step(0.07, abs(u.y));
  dimH = max(dimH, dkLine(abs(u.y) - 1.0, 0.0012, upx) * step(abs(u.x - 0.55), 0.31));
  dimH = max(dimH, max(bpArrow(u, vec2(0.86, -1.0), vec2(0.0, -1.0), upx), bpArrow(u, vec2(0.86, 1.0), vec2(0.0, 1.0), upx)));
  dimH = max(dimH, step(abs(u.x - 0.86), 0.014) * step(abs(u.y), 0.055) * step(0.3, fract(u.y * 30.0 + 0.5)));
  vec2 rdir = vec2(0.7071, -0.7071);
  float along = dot(u, rdir);
  float lead = dkLine(dot(u, vec2(0.7071, 0.7071)), 0.0012, upx) * step(0.0, along) * step(along, 0.972);
  lead = max(lead, bpArrow(u, rdir * 0.972, rdir, upx));
  drawn = max(drawn, max(dimW * bpReveal((u.x + 1.0) / 2.0, p5), max(dimH * bpReveal((u.y + 1.0) / 2.0, p5), lead * bpReveal(along, p5))));

  float ink = sat(max(printed, drawn * wipe));
  ink *= 0.82 + 0.18 * vnoise(uv * 220.0);
  vec3 col = mix(paper, vec3(0.9, 0.95, 1.0), ink);
  return dkPaper(h, dkDisplay(col), 0.15);
}
`,
  },
  {
    key: "risograph",
    label: "Risograph",
    category: "design",
    relief: 0.0,
    heroTime: 0.5,
    loop: "Each pass the two drums land a hair off register",
    glsl:
      KIT +
      /* glsl */ `
// Two-colour riso on an off-white disc of stock: the fluorescent pink drum (a halftone sun, the smile, an offset
// shadow of the letters, a border ring) under the blue drum (rim and letters). Inks multiply into purple where they
// overlap; coverage is grainy and uneven, edges a little ragged. Every print the drums land somewhere slightly new.
float rgDots(vec2 uv, float v, float px) {
  float cell = 0.045;
  vec2 q = rot2(0.7854) * uv / cell;
  float s = 0.5 - 0.25 * (cos(TAU * q.x) + cos(TAU * q.y));
  return mix(sat((v - s) / max(2.2 * px / cell, 0.02)), v, sat(px / cell * 3.0 - 1.0));
}
vec3 shade(Hit h) {
  vec2 uv = h.uv;
  float px = dkPx(h.t);
  float n = floor(uTime * 2.5);
  vec3 paper = vec3(0.95, 0.93, 0.88) * (0.96 + 0.04 * vnoise(uv * vec2(90.0, 30.0)) + 0.02 * (fbm(uv * 4.0) - 0.5));
  if (h.side < 0.0 || h.edge > 0.5) return dkPaper(h, dkDisplay(paper * 0.92), 0.05);
  // Drum offsets and a whisper of skew for this print.
  vec2 uP = rot2((hash11(n * 1.7) - 0.5) * 0.014) * uv + (hash22(vec2(n, 3.1)) - 0.5) * 0.036;
  vec2 uB = uv + (hash22(vec2(n, 7.7)) - 0.5) * 0.022;
  float rough = 0.005 * (vnoise(uv * 95.0) - 0.5);

  // Pink: halftone sun (dense at the lower left), the smile solid, the letters' offset shadow, the border ring.
  vec4 fP = field(uP);
  float shadowL = dkFill(field(uP - vec2(0.045, -0.045)).w + rough, px);
  float tone = sat(0.78 - 0.33 * (uP.x + uP.y + 1.0) * 0.5);
  float sun = rgDots(uP, tone, px) * dkFill(length(uP) - 0.84, px);
  float cP = max(max(sun, dkFill(fP.z + rough, px)), max(shadowL, dkLine(length(uP) - 1.07, 0.012, px)));
  // Blue: rim and letters.
  vec4 fB = field(uB);
  float cB = max(dkFill(fB.y + rough, px), dkFill(fB.w + rough, px));

  // Riso grain: speckled coverage, little voids, roller banding; different every print.
  float voids = smoothstep(0.72, 0.86, vnoise(uv * 70.0 + n * 5.3));
  cP *= (0.8 + 0.2 * vnoise(uv * 260.0 + n * 13.1)) * (1.0 - 0.5 * voids) * (0.92 + 0.08 * sin(uv.y * 2.3 + n));
  cB *= (0.8 + 0.2 * vnoise(uv * 240.0 + n * 7.3 + 40.0)) * (1.0 - 0.4 * voids) * (1.0 - 0.06 * sin(uv.x * 3.1 + n * 2.0));

  vec3 lin = pow(paper, vec3(2.2));
  lin *= mix(vec3(1.0), hex(0xff48b0), sat(cP));
  lin *= mix(vec3(1.0), hex(0x0078bf), sat(cB));
  return dkPaper(h, dkFlat(lin), 0.04);
}
`,
  },
];
