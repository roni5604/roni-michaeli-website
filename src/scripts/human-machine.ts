/**
 * "Part engineer. Part machine." — the portrait scene between Work and Contact.
 *
 * A 3D portrait (photo on a depth-displaced plane that turns toward the pointer) with an aligned
 * machine version underneath. The pointer stirs a small stable-fluids sim whose ink is the reveal
 * mask, cut hard so the edge reads as liquid, with a rim typed in 0s and 1s. The machine's eye
 * lenses turn toward the pointer. Scrolling the pinned stage plays four beats:
 *   rise   — the machine climbs up the right half of the face and holds as a seam through the eyes
 *   sweep  — the seam crosses to the left until he is all machine
 *   hold   — fully machine; the eyes keep tracking
 *   burn   — the figure burns away into the contour field of 0s and 1s behind it
 * Behind everything, a field of contour lines typed in 0s and 1s swirls around the pointer.
 *
 * three.js is imported lazily (this module is only loaded when the section nears the viewport).
 */
import * as THREE from 'three';
import { portrait } from '../data/portrait';

type Cleanup = () => void;

// rise start, rise end/sweep start, sweep end, burn start, burn end. Contact is pulled up over the
// last stretch (see .hm's negative margin), so its headline rises while the machine is still burning.
const BEAT = [0.1, 0.33, 0.5, 0.57, 0.84] as const;
const PLANE_H = 2;
const STRENGTH = 0.3; // depth displacement, in plane units
const CELL = [7, 14] as const; // code grid cell, CSS px

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  v = clamp01(v);
  return v * v * (3 - 2 * v);
};

/* ---------------------------------------------------------------- shaders */

const COMMON = /* glsl */ `
  uniform vec2 uRes, uLens, uHoldC, uCellRes, uGlowC;
  uniform float uTime, uDpr, uHoldR, uSplit, uSeamX, uLineBoost, uTextL, uTextR, uHeadSeam, uCodeAmt, uGlowR, uWarm;
  uniform sampler2D uDye, uGlyph, uText, uCells;
  uniform vec3 uBgA, uBgB;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }

  // The site's accent colours in a loop: cyan, violet, pink, lime.
  vec3 pal(float t) {
    t = fract(t) * 4.0;
    vec3 c0 = vec3(0.133, 0.827, 0.933), c1 = vec3(0.655, 0.545, 0.980), c2 = vec3(0.957, 0.447, 0.714), c3 = vec3(0.64, 0.90, 0.21);
    float k = fract(t); k = k * k * (3.0 - 2.0 * k);
    if (t < 1.0) return mix(c0, c1, k);
    if (t < 2.0) return mix(c1, c2, k);
    if (t < 3.0) return mix(c2, c3, k);
    return mix(c3, c0, k);
  }
  vec3 lineHue(float n, vec2 cc) { return pal(n * 1.6 + uTime * 0.025 + cc.x / uDpr / 2400.0); }

  // Touch: a finger held down grows a wavy disc of ink around it.
  float holdInk() {
    if (uHoldR < 0.5) return 0.0;
    vec2 d = gl_FragCoord.xy - uHoldC; float l = length(d); vec2 n = d / max(l, 1.0);
    float R = uHoldR * (0.8 + 0.4 * (0.65 * vnoise(n * 2.6 + uTime * 0.25) + 0.35 * vnoise(n * 6.0 - uTime * 0.4)));
    return min(1.1, 0.18 * exp((R - l) * 0.058 / uDpr));
  }

  // 1 where the machine shows: the pointer's ink, or the scroll split (rising up the right of the seam).
  float gSplitM = 0.0;
  float revealMask() {
    vec2 s = gl_FragCoord.xy / uRes;
    float ink = max(texture2D(uDye, s).r, holdInk());
    float grain = vnoise(gl_FragCoord.xy / uDpr / 38.0 + uTime * 0.4) - 0.5;
    float fluidM = smoothstep(0.16, 0.19, ink + grain * 0.05);
    float wob = (vnoise(vec2(s.y * 5.0, uTime * 0.5)) - 0.5) * 22.0 * uDpr + sin(s.y * 13.0 + uTime * 1.2) * 4.0 * uDpr;
    float side = smoothstep(-1.5 * uDpr, 1.5 * uDpr, gl_FragCoord.x - (uSeamX + wob));
    float surf = uSplit * 1.3 - 0.04 - s.y + (vnoise(vec2(s.x * 7.0, uTime * 0.7)) - 0.5) * 0.05;
    gSplitM = side * smoothstep(-0.003, 0.003, surf);
    return max(fluidM, gSplitM);
  }

  // The rim of the ink, typed in fast-flickering 0s and 1s.
  float inkCode() {
    float ink = max(texture2D(uDye, gl_FragCoord.xy / uRes).r, holdInk());
    float rim = smoothstep(0.08, 0.12, ink) * (1.0 - smoothstep(0.15, 0.18, ink));
    if (rim < 0.01 || uCodeAmt < 0.01) return 0.0;
    vec2 cell = vec2(${CELL[0]}.0, ${CELL[1]}.0) * uDpr, ci = floor(gl_FragCoord.xy / cell), g = fract(gl_FragCoord.xy / cell);
    float bit = step(0.5, hash(ci + floor(uTime * 9.0 + hash(ci + 3.0) * 5.0)));
    return texture2D(uGlyph, vec2((bit + g.x) * 0.5, g.y)).a * rim * 0.95 * uCodeAmt;
  }
  vec3 codeInk() {
    vec2 cell = vec2(${CELL[0]}.0, ${CELL[1]}.0) * uDpr, ci = floor(gl_FragCoord.xy / cell);
    return mix(lineHue(texture2D(uCells, (ci + 0.5) / uCellRes).r, (ci + 0.5) * cell), vec3(1.0), 0.15);
  }

  // Contour field; it swirls around the pointer.
  float field(vec2 fc, out float sw) {
    vec2 toL = (fc - uLens) / uDpr; float dl = length(toL);
    sw = exp(-dl * dl / 40000.0);
    vec2 uv = fc / uDpr / 560.0 + vec2(-toL.y, toL.x) / max(dl, 1.0) * sw * 0.15;
    return fbm(uv + vec2(uTime * 0.018, -uTime * 0.012)) + 0.45 * fbm(uv * 1.8 - vec2(uTime * 0.01));
  }
  // Per code cell (drawn once a frame into uCells): field value, on-a-line amount, swirl.
  vec4 cellLines(vec2 ci, vec2 cell) {
    vec2 cc = (ci + 0.5) * cell;
    float sw, swx, swy;
    float n = field(cc, sw);
    float k = n * 13.0, kx = field(cc + vec2(cell.x, 0.0), swx) * 13.0, ky = field(cc + vec2(0.0, cell.y), swy) * 13.0;
    float d = abs(fract(k) - 0.5) / max(length(vec2(kx - k, ky - k)), 1e-4);
    return vec4(n, 1.0 - smoothstep(0.3, 0.6, d), sw, 1.0);
  }

  // Human side: the site's night blue with a warm backlight behind the head (as in the photo).
  // Machine side: near-black, a blueprint grid and brighter code lines.
  vec3 backdrop(float m) {
    vec2 cell = vec2(${CELL[0]}.0, ${CELL[1]}.0) * uDpr;
    vec2 ci = floor(gl_FragCoord.xy / cell), cc = (ci + 0.5) * cell;
    vec4 cl = texture2D(uCells, (ci + 0.5) / uCellRes);
    float bit = step(0.5, hash(ci + floor(uTime * 1.2 + hash(ci + 7.0) * 8.0)));
    vec2 g = fract(gl_FragCoord.xy / cell);
    float glyph = texture2D(uGlyph, vec2((bit + g.x) * 0.5, g.y)).a;
    float line = cl.g * glyph, sw = cl.b;
    vec3 hue = lineHue(cl.r, cc);
    vec2 gg = mod(gl_FragCoord.xy, 28.0 * uDpr);
    float grid = step(gg.x, uDpr) + step(gg.y, uDpr);
    float gr = length(gl_FragCoord.xy - uGlowC) / uGlowR;
    vec3 warm = vec3(0.42, 0.17, 0.05) * exp(-gr * gr * 2.2) * uWarm;
    vec3 human = uBgA + warm + hue * line * (0.20 + 0.25 * sw) + grid * 0.010;
    vec3 mach = uBgB + grid * vec3(0.035, 0.05, 0.065) + line * mix(hue, vec3(1.0), 0.12) * (0.45 + uLineBoost * 0.4)
      + vec3(0.0, 0.05, 0.07) * exp(-gr * gr * 1.4);
    vec3 col = mix(human, mach, m);
    float tm = texture2D(uText, gl_FragCoord.xy / uRes).a;
    // PART ENGINEER. (left of the seam) fades in; PART MACHINE. shows only where the machine has risen.
    float amt = mix(uTextL, uTextR * gSplitM, step(uHeadSeam, gl_FragCoord.x));
    return mix(col, mix(vec3(0.93, 0.95, 0.98), vec3(1.0), m), tm * amt);
  }
`;

const PORTRAIT_VS = /* glsl */ `
  uniform sampler2D uDepth; uniform float uStrength; varying vec2 vUv;
  void main() { vUv = uv; vec3 p = position; p.z += texture2D(uDepth, uv).r * uStrength;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;

const PORTRAIT_FS = COMMON + /* glsl */ `
  uniform sampler2D uPhoto, uMachine, uDepth;
  uniform float uWipe, uGhost, uDissolve, uImgAsp, uEyeBoost, uBottomFade;
  uniform vec2 uMTexel, uEye1, uEye2, uLook, uDTexel;
  uniform vec3 uLightDir;
  varying vec2 vUv;
  const float EYE_R = 0.03;
  float eyeDist(vec2 e) { return length((vUv - e) * vec2(1.0, uImgAsp)); }
  // The machine's structure as luminance edges, so it can sit faintly over the face.
  float machineLines() {
    vec2 o = uMTexel * 2.2;
    float l = dot(texture2D(uMachine, vUv - vec2(o.x, 0.0)).rgb, vec3(0.333)), r = dot(texture2D(uMachine, vUv + vec2(o.x, 0.0)).rgb, vec3(0.333));
    float d = dot(texture2D(uMachine, vUv - vec2(0.0, o.y)).rgb, vec3(0.333)), u = dot(texture2D(uMachine, vUv + vec2(0.0, o.y)).rgb, vec3(0.333));
    return smoothstep(0.05, 0.16, length(vec2(r - l, u - d))) * texture2D(uMachine, vUv).a;
  }
  // Surface normal from the depth map, so light can follow the pointer across the face's relief.
  vec3 depthNormal() {
    // Wide taps (the depth map is 8-bit: close taps turn its steps into speckle on the chrome).
    vec2 o = uDTexel * 7.0;
    float l = texture2D(uDepth, vUv - vec2(o.x, 0.0)).r + texture2D(uDepth, vUv - vec2(o.x * 2.0, 0.0)).r;
    float r = texture2D(uDepth, vUv + vec2(o.x, 0.0)).r + texture2D(uDepth, vUv + vec2(o.x * 2.0, 0.0)).r;
    float d = texture2D(uDepth, vUv - vec2(0.0, o.y)).r + texture2D(uDepth, vUv - vec2(0.0, o.y * 2.0)).r;
    float u = texture2D(uDepth, vUv + vec2(0.0, o.y)).r + texture2D(uDepth, vUv + vec2(0.0, o.y * 2.0)).r;
    return normalize(vec3((l - r) * 7.0, (d - u) * 7.0, 1.0));
  }
  void main() {
    // Eye lenses: inside each socket the machine image is pulled toward the pointer (most at the centre,
    // none at the rim, so the lens turns rather than slides), and a cyan glow follows the look.
    float d1 = eyeDist(uEye1), d2 = eyeDist(uEye2);
    float turn = (1.0 - smoothstep(0.0, EYE_R, d1)) + (1.0 - smoothstep(0.0, EYE_R, d2));
    vec4 ph = texture2D(uPhoto, vUv);
    vec4 mc = texture2D(uMachine, vUv - uLook * turn);
    vec2 lk = uLook * vec2(1.0, uImgAsp) * 0.9;
    float g1 = length((vUv - uEye1) * vec2(1.0, uImgAsp) - lk), g2 = length((vUv - uEye2) * vec2(1.0, uImgAsp) - lk);
    float eyeGlow = exp(-g1 * g1 / 0.00005) + exp(-g2 * g2 / 0.00005);
    float halo = exp(-d1 * d1 / 0.0012) + exp(-d2 * d2 / 0.0012);

    // The shoulders run off the sides of the photo: soften the side edges low down, and the very bottom.
    float sides = smoothstep(0.0, 0.08, vUv.x) * smoothstep(0.0, 0.08, 1.0 - vUv.x);
    float edgeP = ph.a * mix(1.0, sides, 1.0 - smoothstep(0.2, 0.34, vUv.y)) * smoothstep(0.0, uBottomFade, vUv.y);

    // Dissolve: noise plus a bottom-up bias, so the figure breaks up from the chest upward.
    float dn = fbm(vUv * 6.0 + 3.1) * 0.75 + vUv.y * 0.45;
    float thr = uDissolve * 1.35 - 0.12;
    float keep = smoothstep(thr, thr + 0.025, dn);
    float burn = (smoothstep(thr - 0.03, thr, dn) - smoothstep(thr + 0.01, thr + 0.045, dn)) * step(0.001, uDissolve);

    float m = revealMask();
    vec3 bg = backdrop(m);

    // Idle scan: a curved band sweeps down, lighting the machine's outline as it passes.
    vec2 s = gl_FragCoord.xy / uRes;
    float bd = 1.0 - s.y + sin(s.x * 3.14159) * 0.05 - mix(0.02, 1.08, uWipe);
    float live = smoothstep(0.0, 0.05, uWipe) * (1.0 - smoothstep(0.95, 1.0, uWipe));
    float band = exp(-bd * bd / 0.0045) * live;
    float trail = (1.0 - smoothstep(0.0, 0.5, -bd)) * step(bd, 0.0) * live;

    // Light from the pointer's side: a soft key that rakes across the relief, and a warm rim on the turning edges.
    vec3 N = depthNormal(), L = normalize(uLightDir);
    float ndl = dot(N, L);
    float rim = pow(1.0 - N.z, 2.2);
    vec3 lit = ph.rgb * (0.86 + 0.26 * ndl) + vec3(1.0, 0.62, 0.32) * rim * 0.22 * smoothstep(-0.2, 0.6, -N.x * sign(L.x) + 0.3);
    vec3 photoLayer = mix(bg, lit, edgeP);
    float scan = 0.6 + 0.4 * smoothstep(0.0, 0.08, 0.08 - abs(fract(-uTime * 0.07) - (1.0 - vUv.y)));
    photoLayer = mix(photoLayer, mc.rgb, band * 0.08 * mc.a * edgeP);
    float ghostL = machineLines() * (uGhost * scan + band * 0.4 + trail * 0.16) * edgeP;
    photoLayer = 1.0 - (1.0 - photoLayer) * (1.0 - vec3(0.75, 0.95, 1.0) * min(ghostL, 1.0));

    // The machine has its own outline (ear modules, armour): it is not cut to his silhouette.
    float mA = mc.a * mix(1.0, sides, 1.0 - smoothstep(0.2, 0.34, vUv.y)) * smoothstep(0.0, uBottomFade, vUv.y);
    float pulse = 0.8 + 0.2 * sin(uTime * 3.0);
    // Chrome: a hard specular glint that slides over the plates as the pointer (and the head) moves.
    vec3 Rf = reflect(vec3(0.0, 0.0, -1.0), N);
    float spec = pow(max(dot(Rf, L), 0.0), 28.0) * 0.55 + pow(max(dot(Rf, L), 0.0), 6.0) * 0.08;
    vec3 chrome = mc.rgb * (0.9 + 0.2 * ndl) + vec3(0.85, 0.95, 1.0) * spec * smoothstep(0.05, 0.35, dot(mc.rgb, vec3(0.333)) + 0.15);
    vec3 machLayer = mix(bg, chrome, clamp(mA, 0.0, 1.0))
      + vec3(0.35, 0.95, 1.0) * eyeGlow * (0.9 + 0.6 * uEyeBoost) * pulse * mc.a
      + vec3(0.05, 0.55, 0.75) * halo * (0.25 + 0.35 * uEyeBoost) * mc.a;
    vec3 figure = mix(photoLayer, machLayer, m);

    float hueT = fbm(vUv * 2.5 + uTime * 0.05) * 1.6 + uTime * 0.025 + vUv.x * 0.9;
    vec3 burnCol = mix(pal(hueT), vec3(1.0), 0.15);
    vec3 outCol = mix(bg, figure, keep) + burnCol * burn * max(edgeP, mA) * 1.3;
    gl_FragColor = vec4(mix(outCol, codeInk(), inkCode()), 1.0);
  }`;

const BACK_FS = COMMON + /* glsl */ `void main() { gl_FragColor = vec4(mix(backdrop(revealMask()), codeInk(), inkCode()), 1.0); }`;
const CELLS_FS = COMMON + /* glsl */ `void main() { gl_FragColor = cellLines(floor(gl_FragCoord.xy), vec2(${CELL[0]}.0, ${CELL[1]}.0) * uDpr); }`;
const SCREEN_VS = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* ---------------------------------------------------------- fluid (ink) */

const FLUID: Record<string, string> = {
  // Spreads the ink a little each frame: thin at the pointer, widening as the trail ages.
  blur: `varying vec2 vUv; uniform sampler2D uSource; uniform vec2 uTexel; uniform float uValue;
    void main() { vec4 c = texture2D(uSource, vUv);
      vec4 n = texture2D(uSource, vUv + vec2(0.0, uTexel.y)) + texture2D(uSource, vUv - vec2(0.0, uTexel.y)) + texture2D(uSource, vUv + vec2(uTexel.x, 0.0)) + texture2D(uSource, vUv - vec2(uTexel.x, 0.0));
      gl_FragColor = mix(c, n * 0.25, uValue); }`,
  splat: `varying vec2 vUv; uniform sampler2D uTarget; uniform float uAspect, uRadius, uSquash, uMaxBlend; uniform vec2 uPoint, uDir; uniform vec3 uColor;
    void main() { vec2 p = vUv - uPoint; p.x *= uAspect;
      float along = dot(p, uDir), across = dot(p, vec2(-uDir.y, uDir.x));
      vec3 s = exp(-(along * along / uSquash + across * across * uSquash) / uRadius) * uColor;
      vec3 base = texture2D(uTarget, vUv).xyz;
      // Velocity adds up; ink takes the max, so a slow pointer can't pool it into a puddle.
      gl_FragColor = vec4(mix(base + s, max(base, s), uMaxBlend), 1.0); }`,
  advect: `varying vec2 vUv; uniform sampler2D uVelocity, uSource; uniform vec2 uTexel; uniform float uDt, uDissipation;
    void main() { vec2 c = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel; gl_FragColor = uDissipation * texture2D(uSource, c); }`,
  curl: `varying vec2 vUv; uniform sampler2D uVelocity; uniform vec2 uTexel;
    void main() { float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y, R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
      float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x, B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0); }`,
  vorticity: `varying vec2 vUv; uniform sampler2D uVelocity, uCurl; uniform vec2 uTexel; uniform float uCurlAmt, uDt;
    void main() { float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x, R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
      float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x, B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x, C = texture2D(uCurl, vUv).x;
      vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 0.0001; f *= uCurlAmt * C; f.y *= -1.0;
      vec2 v = texture2D(uVelocity, vUv).xy + f * uDt; gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0); }`,
  divergence: `varying vec2 vUv; uniform sampler2D uVelocity; uniform vec2 uTexel;
    void main() { float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x, R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
      float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y, B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0); }`,
  scale: `varying vec2 vUv; uniform sampler2D uSource; uniform float uValue; void main() { gl_FragColor = uValue * texture2D(uSource, vUv); }`,
  pressure: `varying vec2 vUv; uniform sampler2D uPressure, uDivergence; uniform vec2 uTexel;
    void main() { float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x, R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x, B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
      gl_FragColor = vec4((L + R + B + T - texture2D(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0); }`,
  gradient: `varying vec2 vUv; uniform sampler2D uPressure, uVelocity; uniform vec2 uTexel;
    void main() { float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x, R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x, B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
      vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B); gl_FragColor = vec4(v, 0.0, 1.0); }`,
};

type Pair = { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget; swap(): void };
type Splat = [x: number, y: number, dx: number, dy: number, ink: number, size: number];

class Fluid {
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  private mat: Record<string, THREE.ShaderMaterial> = {};
  private splats: Splat[] = [];
  private vel!: Pair;
  private dye!: Pair;
  private prs!: Pair;
  private div!: THREE.WebGLRenderTarget;
  private crl!: THREE.WebGLRenderTarget;
  private simTexel = new THREE.Vector2();
  private dyeTexel = new THREE.Vector2();
  private aspect = 1;
  private idle = 0;
  private cleared = false;
  fade = 0.985; // how much ink survives each 60th of a second
  perFrame = false; // touch screens count frames (tap timing tuned per frame)

  constructor(private r: THREE.WebGLRenderer) {
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    for (const k in FLUID)
      this.mat[k] = new THREE.ShaderMaterial({
        vertexShader: SCREEN_VS,
        fragmentShader: FLUID[k],
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTarget: { value: null }, uAspect: { value: 1 }, uRadius: { value: 0.002 }, uSquash: { value: 1 },
          uDir: { value: new THREE.Vector2(1, 0) }, uPoint: { value: new THREE.Vector2() }, uColor: { value: new THREE.Vector3() },
          uVelocity: { value: null }, uSource: { value: null }, uTexel: { value: new THREE.Vector2() }, uDt: { value: 0.016 },
          uDissipation: { value: 1 }, uCurl: { value: null }, uCurlAmt: { value: 5 }, uPressure: { value: null },
          uDivergence: { value: null }, uValue: { value: 0.8 }, uMaxBlend: { value: 0 },
        },
      });
  }
  private rt(w: number, h: number) {
    return new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: false, stencilBuffer: false,
    });
  }
  private pair(w: number, h: number): Pair {
    return { read: this.rt(w, h), write: this.rt(w, h), swap() { [this.read, this.write] = [this.write, this.read]; } };
  }
  private clearTarget(t: THREE.WebGLRenderTarget) {
    this.r.setRenderTarget(t);
    this.r.setClearColor(0x000000, 0);
    this.r.clear();
  }
  private clearAll() {
    [this.vel, this.dye, this.prs].forEach((p) => { this.clearTarget(p.read); this.clearTarget(p.write); });
  }
  resize(w: number, h: number) {
    const sim = 128, dyeRes = 512, a = w / h;
    const sw = a > 1 ? Math.round(sim * a) : sim, sh = a > 1 ? sim : Math.round(sim / a);
    const dw = a > 1 ? Math.round(dyeRes * a) : dyeRes, dh = a > 1 ? dyeRes : Math.round(dyeRes / a);
    this.dispose();
    this.vel = this.pair(sw, sh); this.dye = this.pair(dw, dh); this.prs = this.pair(sw, sh);
    this.div = this.rt(sw, sh); this.crl = this.rt(sw, sh);
    this.simTexel.set(1 / sw, 1 / sh); this.dyeTexel.set(1 / dw, 1 / dh);
    this.aspect = a;
    this.clearAll();
  }
  dispose() {
    if (!this.vel) return;
    [this.vel, this.dye, this.prs].forEach((p) => { p.read.dispose(); p.write.dispose(); });
    this.div.dispose(); this.crl.dispose();
  }
  disposeMaterials() {
    Object.values(this.mat).forEach((m) => m.dispose());
    this.quad.geometry.dispose();
  }
  splat(x: number, y: number, dx: number, dy: number, ink: number, size = 1) {
    this.splats.push([x, y, dx, dy, ink, size]);
  }
  private pass(name: string, target: THREE.WebGLRenderTarget, set: (u: Record<string, THREE.IUniform>) => void) {
    const m = this.mat[name];
    set(m.uniforms);
    this.quad.material = m;
    this.r.setRenderTarget(target);
    this.r.render(this.scene, this.cam);
  }
  step(dt: number) {
    // Steps in 60ths of a second, so the trail looks the same at 60Hz and 120Hz.
    const f = this.perFrame ? 1 : Math.min(2, dt * 60);
    if (this.splats.length) { this.idle = 0; this.cleared = false; }
    else if ((this.idle += f) > 260) {
      // At rest nothing is visible any more: stop simulating until the next splat.
      if (!this.cleared) { this.clearAll(); this.r.setRenderTarget(null); this.cleared = true; }
      return;
    }
    const T = this.simTexel;
    for (const [x, y, dx, dy, ink, size] of this.splats) {
      const asp = Math.max(1, this.aspect), rad = 0.00026 * asp * size, push = 0.00038 * asp * size;
      const len = Math.hypot(dx * this.aspect, dy), moving = len > 1e-6;
      const dir: [number, number] = moving ? [(dx * this.aspect) / len, dy / len] : [1, 0];
      const squash = moving ? 2.6 : 1;
      this.pass('splat', this.vel.write, (u) => {
        u.uTarget.value = this.vel.read.texture; u.uAspect.value = this.aspect; u.uPoint.value.set(x, y);
        u.uColor.value.set(dx, dy, 0); u.uRadius.value = push; u.uSquash.value = 1; u.uDir.value.set(1, 0); u.uMaxBlend.value = 0;
      });
      this.vel.swap();
      this.pass('splat', this.dye.write, (u) => {
        u.uTarget.value = this.dye.read.texture; u.uAspect.value = this.aspect; u.uPoint.value.set(x, y);
        u.uColor.value.set(ink, ink, ink); u.uRadius.value = rad; u.uSquash.value = squash; u.uDir.value.set(dir[0], dir[1]); u.uMaxBlend.value = 1;
      });
      this.dye.swap();
    }
    this.splats.length = 0;
    this.pass('curl', this.crl, (u) => { u.uVelocity.value = this.vel.read.texture; u.uTexel.value.copy(T); });
    this.pass('vorticity', this.vel.write, (u) => {
      u.uVelocity.value = this.vel.read.texture; u.uCurl.value = this.crl.texture; u.uTexel.value.copy(T); u.uDt.value = dt;
    });
    this.vel.swap();
    this.pass('divergence', this.div, (u) => { u.uVelocity.value = this.vel.read.texture; u.uTexel.value.copy(T); });
    this.pass('scale', this.prs.write, (u) => { u.uSource.value = this.prs.read.texture; u.uValue.value = 0.8; });
    this.prs.swap();
    for (let i = 0; i < 18; i++) {
      this.pass('pressure', this.prs.write, (u) => {
        u.uPressure.value = this.prs.read.texture; u.uDivergence.value = this.div.texture; u.uTexel.value.copy(T);
      });
      this.prs.swap();
    }
    this.pass('gradient', this.vel.write, (u) => {
      u.uPressure.value = this.prs.read.texture; u.uVelocity.value = this.vel.read.texture; u.uTexel.value.copy(T);
    });
    this.vel.swap();
    this.pass('advect', this.vel.write, (u) => {
      u.uVelocity.value = this.vel.read.texture; u.uSource.value = this.vel.read.texture; u.uTexel.value.copy(T);
      u.uDt.value = dt; u.uDissipation.value = Math.pow(0.985, f);
    });
    this.vel.swap();
    this.pass('advect', this.dye.write, (u) => {
      u.uVelocity.value = this.vel.read.texture; u.uSource.value = this.dye.read.texture; u.uTexel.value.copy(T);
      u.uDt.value = dt; u.uDissipation.value = Math.pow(this.fade, f);
    });
    this.dye.swap();
    for (let i = 0; i < 3; i++) {
      this.pass('blur', this.dye.write, (u) => { u.uSource.value = this.dye.read.texture; u.uTexel.value.copy(this.dyeTexel); u.uValue.value = Math.min(1, f); });
      this.dye.swap();
    }
    this.r.setRenderTarget(null);
  }
  get texture() {
    return this.dye.read.texture;
  }
}

/* ---------------------------------------------------------------- helpers */

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

// Two glyphs, 0 and 1, side by side; each half is one code cell.
function makeGlyphs(font: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const draw = () => {
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, 128, 128);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `500 100px ${font}`;
    x.fillText('0', 32, 66); x.fillText('1', 96, 66);
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  document.fonts?.ready.then(() => { draw(); tex.needsUpdate = true; });
  return tex;
}

/* ------------------------------------------------------------------ mount */

export function mountHumanMachine(root: HTMLElement, opts: { reduced: boolean }): Cleanup {
  const stage = root.querySelector<HTMLElement>('[data-hm-stage]')!;
  const gl = root.querySelector<HTMLCanvasElement>('[data-hm-gl]')!;
  const hud = root.querySelector<HTMLCanvasElement>('[data-hm-hud]')!;
  const readout = root.querySelector<HTMLElement>('[data-hm-readout]');
  const hint = root.querySelector<HTMLElement>('[data-hm-hint]');
  const hctx = hud.getContext('2d')!;
  const [leftA, leftB] = (root.dataset.left ?? 'PART|ENGINEER.').split('|');
  const [rightA, rightB] = (root.dataset.right ?? 'PART|MACHINE.').split('|');
  const headFont = root.dataset.font ?? '"Space Grotesk Variable", "Inter Variable", sans-serif';
  const monoFont = '"JetBrains Mono Variable", ui-monospace, Menlo, monospace';
  const rtl = root.dir === 'rtl' || document.documentElement.dir === 'rtl';
  const reduce = opts.reduced;
  const TOUCH = matchMedia('(hover: none)').matches;
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)');

  let disposed = false;
  let raf = 0;
  let running = false;
  let inView = false;
  const offs: Cleanup[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window | HTMLElement | Document, type: K | string, fn: (e: any) => void, o: AddEventListenerOptions = { passive: true }) => {
    t.addEventListener(type, fn, o);
    offs.push(() => t.removeEventListener(type, fn, o));
  };

  let W = 0, H = 0, dpr = 1, PLANE_W = 2;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene, cellScene: THREE.Scene, camera: THREE.PerspectiveCamera, mesh: THREE.Mesh, fluid: Fluid;
  let cellRT: THREE.WebGLRenderTarget | null = null;
  let uniforms: Record<string, THREE.IUniform>;
  let depthData: Uint8ClampedArray, imgW = 1, imgH = 1;
  let textTex: THREE.CanvasTexture;
  const textCanvas = document.createElement('canvas');
  const camBase = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  let headSeam = 0;

  const ptr = { x: -1, y: -1, px: -1, py: -1, inside: false, moved: false, lastMove: -1e9, speed: 0 };
  const rot = { x: 0, y: 0, tx: 0, ty: 0 };
  const steer = { on: false, until: 0 };
  const hold = { on: false, x: 0, y: 0, t0: 0, r: 0, rel: 0 };
  const wipe = { v: 0, start: -1, next: 3 };
  let tapAge = 1e9, lastT = 0, hudLive = true, readoutHTML = '', P = 0;

  const depthAt = (u: number, v: number) => {
    const x = Math.min(imgW - 1, Math.max(0, Math.round(u * (imgW - 1))));
    const y = Math.min(imgH - 1, Math.max(0, Math.round(v * (imgH - 1))));
    return depthData[(y * imgW + x) * 4] / 255;
  };
  // Image point (u, v from the top) -> stage CSS px, through the current head turn.
  const project = (p: [number, number]): [number, number] => {
    v3.set((p[0] - 0.5) * PLANE_W, (0.5 - p[1]) * PLANE_H, depthAt(p[0], p[1]) * STRENGTH);
    v3.applyMatrix4(mesh.matrixWorld).project(camera);
    return [((v3.x + 1) / 2) * W, ((1 - v3.y) / 2) * H];
  };

  function drawHeadline() {
    const c = textCanvas;
    const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(H * dpr));
    if (c.width !== cw || c.height !== ch) {
      c.width = cw; c.height = ch;
      // three keeps a texture's GPU storage at its first size: a resized canvas needs a new texture.
      textTex.dispose();
      textTex = new THREE.CanvasTexture(c);
      textTex.minFilter = THREE.LinearFilter;
      uniforms.uText.value = textTex;
    }
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, c.width, c.height);
    if (!mesh) return;
    mesh.rotation.set(0, 0, 0); mesh.updateMatrixWorld(); camera.updateMatrixWorld();
    const e1 = project(portrait.eyeL), e2 = project(portrait.eyeR);
    // The machine's head (ear modules) is wider than his: clear that, not just his face.
    const faceL = project([portrait.eyeL[0] - 0.17, portrait.eyeL[1]]), faceR = project([portrait.eyeR[0] + 0.17, portrait.eyeR[1]]);
    const seam = (e1[0] + e2[0]) / 2;
    const half = (faceR[0] - faceL[0]) / 2 + Math.max(28, W * 0.032);
    headSeam = seam;
    x.fillStyle = '#fff';
    x.textBaseline = 'alphabetic';
    x.direction = rtl ? 'rtl' : 'ltr';
    const fontAt = (s: number) => `700 ${s}px ${headFont}`;
    if (W <= 760) {
      // Phones: no room beside the head, so each half's two lines sit in the band above the hair.
      const hairTop = project([0.5, 0.05])[1];
      const gap = 10, band = Math.max(40, hairTop - 70);
      let s = 100 * dpr;
      x.font = fontAt(s);
      const w = Math.max(x.measureText(leftB).width, x.measureText(rightB).width);
      s = Math.min((s * ((seam - gap - 16) * dpr)) / w, (band / 1.9) * dpr, 46 * dpr);
      x.font = fontAt(s);
      const base = hairTop * dpr - s * 0.25;
      x.textAlign = 'right';
      x.fillText(leftA, (seam - gap) * dpr, base - s * 0.92); x.fillText(leftB, (seam - gap) * dpr, base);
      x.textAlign = 'left';
      x.fillText(rightA, (seam + gap) * dpr, base - s * 0.92); x.fillText(rightB, (seam + gap) * dpr, base);
    } else {
      const avail = Math.max(60, Math.min(seam - half, W - seam - half) - Math.max(20, W * 0.03));
      let size = H * 0.15 * dpr;
      x.font = fontAt(size);
      const widest = Math.max(x.measureText(leftB).width, x.measureText(rightB).width);
      size *= Math.min(1, (avail * dpr) / widest);
      x.font = fontAt(size);
      const top = ((e1[1] + e2[1]) / 2) * dpr - size * 0.3;
      x.textAlign = 'right';
      x.fillText(leftA, (seam - half) * dpr, top); x.fillText(leftB, (seam - half) * dpr, top + size * 0.92);
      x.textAlign = 'left';
      x.fillText(rightA, (seam + half) * dpr, top); x.fillText(rightB, (seam + half) * dpr, top + size * 0.92);
    }
    textTex.needsUpdate = true;
  }

  function resize() {
    if (!renderer) return;
    dpr = Math.min(devicePixelRatio || 1, innerWidth <= 760 ? 1.5 : 2);
    W = stage.clientWidth; H = stage.clientHeight;
    if (!W || !H) return;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    hud.width = Math.round(W * dpr); hud.height = Math.round(H * dpr);
    camera.aspect = W / H;
    // Framing, as fractions of the image height from the top: from just above the hair to the chest.
    let CROP_TOP = 0.0, CROP_BOTTOM = 0.84;
    if (W <= 760) {
      // Phones: the head is sized to the width, hair top a fifth of the way down (room for the headline above).
      const perPx = 0.46 / W;
      CROP_TOP = 0.05 - Math.max(0.24 * H, 150) * perPx;
      CROP_BOTTOM = CROP_TOP + H * perPx;
    } else if (W / H < 1.2) {
      // Narrow tablets: a little closer, so the headline fits beside the head.
      CROP_TOP = 0.0; CROP_BOTTOM = 0.74;
    }
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visibleH = PLANE_H * (CROP_BOTTOM - CROP_TOP);
    camBase.set(0, (0.5 - (CROP_TOP + CROP_BOTTOM) / 2) * PLANE_H, visibleH / (2 * tanHalf));
    camera.position.copy(camBase);
    camera.updateProjectionMatrix();
    uniforms.uDpr.value = dpr;
    uniforms.uRes.value.set(W * dpr, H * dpr);
    uniforms.uBottomFade.value = W <= 760 ? 0.12 : 0.04;
    const cw = Math.ceil(W / CELL[0]) + 1, ch = Math.ceil(H / CELL[1]) + 1;
    if (!cellRT || cellRT.width !== cw || cellRT.height !== ch) {
      cellRT?.dispose();
      cellRT = new THREE.WebGLRenderTarget(cw, ch, {
        type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
        depthBuffer: false, stencilBuffer: false,
      });
      uniforms.uCells.value = cellRT.texture;
      uniforms.uCellRes.value.set(cw, ch);
    }
    fluid.resize(W, H);
    drawHeadline();
  }

  /* -------- pointer -------- */
  function point(clientX: number, clientY: number) {
    if (!W || !H) return;
    const r = stage.getBoundingClientRect();
    const nx = clientX - r.left, ny = clientY - r.top;
    if (ny < 0 || ny > H) { ptr.inside = false; return; }
    if (!ptr.inside || ptr.x < 0) { ptr.px = nx; ptr.py = ny; } else { ptr.px = ptr.x; ptr.py = ptr.y; }
    ptr.x = nx; ptr.y = ny; ptr.inside = true; ptr.moved = true; ptr.lastMove = performance.now() / 1000;
    rot.ty = (nx / W - 0.5) * 0.36; rot.tx = (ny / H - 0.5) * 0.14; // up to ~10° sideways, 4° up/down
  }
  // A ring of small outward splats: the machine opens like a flower where you tap or click.
  function burst(clientX: number, clientY: number, touch: boolean) {
    if (!fluid || !W || !H || reduce || P > 0.3) return;
    const r = stage.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    if (y < 0 || y > H) return;
    if (touch) { tapAge = 0; Object.assign(hold, { on: true, x, y, t0: performance.now() / 1000, r: 0 }); }
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2, vx = Math.cos(a), vy = Math.sin(a);
      fluid.splat((x + vx * 10) / W, 1 - (y + vy * 10) / H, vx * 220, -vy * 220, 1.1, touch ? 3 : 2.2);
    }
  }
  const steerTo = (e: TouchEvent) => {
    const f = e.touches[0], r = stage.getBoundingClientRect();
    if (!f || !W || !H) return;
    rot.ty = ((f.clientX - r.left) / W - 0.5) * 0.36; rot.tx = ((f.clientY - r.top) / H - 0.5) * 0.14;
  };
  on(stage, 'pointermove', (e: PointerEvent) => { if (e.pointerType !== 'touch') point(e.clientX, e.clientY); });
  on(stage, 'pointerdown', (e: PointerEvent) => {
    if (e.pointerType === 'touch') burst(e.clientX, e.clientY, true);
    else { point(e.clientX, e.clientY); burst(e.clientX, e.clientY, false); }
  });
  on(stage, 'pointerleave', () => { ptr.inside = false; });
  on(stage, 'touchstart', (e: TouchEvent) => { steer.on = true; steerTo(e); });
  on(stage, 'touchmove', (e: TouchEvent) => {
    steerTo(e);
    const f = e.touches[0];
    // A finger that moves is scrolling: stop growing.
    if (hold.on && f) {
      const r = stage.getBoundingClientRect();
      if (Math.hypot(f.clientX - r.left - hold.x, f.clientY - r.top - hold.y) > 24) hold.on = false;
    }
  });
  const unsteer = (e: TouchEvent) => { if (!e.touches.length) { steer.on = false; steer.until = performance.now() / 1000 + 1.2; hold.on = false; } };
  on(stage, 'touchend', unsteer);
  on(stage, 'touchcancel', unsteer);
  on(window, 'pointerup', () => { hold.on = false; });
  on(window, 'pointercancel', () => { hold.on = false; });
  on(window, 'blur', () => { hold.on = false; });
  // Scrolling moves the stage under a still mouse: keep the pointer's stage position honest.
  let lastClient: [number, number] | null = null;
  on(window, 'pointermove', (e: PointerEvent) => { if (e.pointerType !== 'touch') lastClient = [e.clientX, e.clientY]; });

  /* -------- frame -------- */
  const TRACKED: [[number, number], string][] = [
    [portrait.eyeR, 'R EYE'], [portrait.eyeL, 'L EYE'], [portrait.nose, 'NOSE'],
    [portrait.mouthL, ''], [portrait.mouthR, ''], [portrait.chin, 'CHIN'],
  ];

  function frame(now: number) {
    if (!running || disposed || !renderer) return;
    raf = requestAnimationFrame(frame); // booked first: an error below must not freeze the scene
    const t = now / 1000, dt = Math.min(0.033, Math.max(0.001, t - (lastT || t)));
    lastT = t;
    if (W !== stage.clientWidth || H !== stage.clientHeight) resize();
    if (!W || !H) return;

    // Scroll progress through the pinned section, 0..1.
    const rr = root.getBoundingClientRect();
    const span = rr.height - H;
    P = span > 0 ? clamp01(-rr.top / span) : 0;
    const lin = (a: number, b: number) => clamp01((P - a) / (b - a));
    const easeIn = (x: number) => (x < 0.4 ? (x * x) / 0.64 : (2 * x - 0.4) / 1.6);
    const rise = easeIn(lin(BEAT[0], BEAT[1]));
    const sweep = lin(BEAT[1], BEAT[2]);
    const burn = 1 - easeIn(1 - lin(BEAT[3], BEAT[4]));

    if (lastClient && HOVER.matches) {
      const sr = stage.getBoundingClientRect();
      const inside = lastClient[1] >= sr.top && lastClient[1] <= sr.bottom && lastClient[0] >= sr.left && lastClient[0] <= sr.right;
      if (!inside) ptr.inside = false;
    }

    // Head turns toward the pointer; drifts gently when it's away.
    const idle = t - ptr.lastMove;
    if (reduce) { rot.tx = rot.ty = 0; }
    else if (steer.on || t < steer.until) { /* the finger's target holds */ }
    else if (!ptr.inside || idle > 4) { rot.ty = Math.sin(t * 0.45) * (TOUCH ? 0.13 : 0.05); rot.tx = Math.sin(t * 0.31) * (TOUCH ? 0.05 : 0.02); }
    if (P > BEAT[1]) { rot.ty *= 0.5; rot.tx *= 0.5; }
    rot.x += (rot.tx - rot.x) * 0.05; rot.y += (rot.ty - rot.y) * 0.05;
    mesh.rotation.set(rot.x, rot.y, 0);
    mesh.updateMatrixWorld();
    camera.position.set(camBase.x, camBase.y, camBase.z * (1 + 0.06 * burn));
    camera.updateMatrixWorld();

    // Pointer -> fluid splats, interpolated so fast moves leave a continuous trail.
    if (ptr.moved && !reduce) {
      const dx = ptr.x - ptr.px, dy = ptr.y - ptr.py, dist = Math.hypot(dx, dy);
      const steps = Math.min(12, Math.max(1, Math.ceil(dist / 14)));
      const width = 0.45 + 0.55 * clamp01(dist / Math.min(2, dt * 60) / 24);
      for (let k = 1; k <= steps && dist >= 0.5; k++) {
        const f = k / steps, x = ptr.px + dx * f, y = ptr.py + dy * f;
        fluid.splat(x / W, 1 - y / H, ((dx / W) * 4200) / steps, ((-dy / H) * 4200) / steps, 1.8, width);
      }
      ptr.speed = Math.min(1, ptr.speed * 0.6 + dist / 60);
      ptr.moved = false;
    }
    ptr.speed *= 0.92;
    fluid.step(dt);
    uniforms.uDye.value = fluid.texture;

    // Idle scan: every few seconds a band sweeps down the face, tracing the machine's outline.
    if (!reduce && P < BEAT[0]) {
      if (wipe.start < 0 && t > wipe.next) wipe.start = t;
      if (wipe.start >= 0) {
        const p = t - wipe.start, SWEEP = 2.7;
        wipe.v = p < SWEEP ? p / SWEEP : 0;
        if (p >= SWEEP) { wipe.start = -1; wipe.v = 0; wipe.next = t + 5.5; }
      }
    } else wipe.v = 0;
    uniforms.uWipe.value = wipe.v;

    const eyes = [project(portrait.eyeL), project(portrait.eyeR)];
    const cx = (eyes[0][0] + eyes[1][0]) / 2, cy = (eyes[0][1] + eyes[1][1]) / 2;
    // The machine's eyes turn toward the pointer (texture units; v is up and squashed by the image aspect).
    {
      const has = ptr.inside || steer.on || t < steer.until || hold.on;
      const tx = ptr.inside ? ptr.x : hold.x, ty = ptr.inside ? ptr.y : hold.y;
      const dx = has ? tx - cx : 0, dy = has ? ty - cy : 0, len = Math.hypot(dx, dy) || 1;
      const mag = Math.min(1, len / 320) * 0.012;
      const L = uniforms.uLook.value as THREE.Vector2;
      L.x += ((dx / len) * mag - L.x) * 0.15;
      L.y += ((-dy / len) * mag / uniforms.uImgAsp.value - L.y) * 0.15;
    }
    {
      // Key light comes from the pointer's side of the head (or drifts slowly when there's no pointer).
      const lx = ptr.inside ? (ptr.x - cx) / (W * 0.35) : Math.sin(t * 0.3) * 0.6;
      const ly = ptr.inside ? -(ptr.y - cy) / (H * 0.45) : 0.45 + Math.sin(t * 0.21) * 0.15;
      const Ld = uniforms.uLightDir.value as THREE.Vector3;
      Ld.x += (Math.max(-1.2, Math.min(1.2, lx)) - Ld.x) * 0.08;
      Ld.y += (Math.max(-0.8, Math.min(1.0, ly)) - Ld.y) * 0.08;
      Ld.z = 0.75;
    }
    uniforms.uEyeBoost.value = smooth((P - BEAT[1]) / (BEAT[2] - BEAT[1])) * (1 - smooth((P - BEAT[3]) / (BEAT[4] - BEAT[3])));

    // Beat 1: the split rises up the right of the seam. Beat 2: the seam sweeps left past the edge.
    uniforms.uSplit.value = 0.01 + 0.81 * rise;
    uniforms.uSeamX.value = (cx + (-18 - cx) * sweep) * dpr;
    // Beat 3: the burn, over the stretch of uDissolve that shows on screen.
    uniforms.uDissolve.value = burn > 0 ? 0.23 + 0.545 * burn : 0;
    uniforms.uLineBoost.value = smooth((P - BEAT[3]) / (BEAT[4] - BEAT[3])) * (1 - smooth((P - 0.92) / 0.08));
    uniforms.uWarm.value = 1 - smooth((P - BEAT[3]) / (BEAT[4] - BEAT[3]));
    mesh.visible = P < 0.995;
    const cur = P < BEAT[1] && HOVER.matches ? 'none' : '';
    if (stage.style.cursor !== cur) stage.style.cursor = cur;

    const lens = ptr.inside ? [ptr.x, ptr.y] : [cx, cy];
    uniforms.uLens.value.set(lens[0] * dpr, (H - lens[1]) * dpr);
    const head = project([0.5, 0.3]);
    uniforms.uGlowC.value.set(head[0] * dpr, (H - head[1]) * dpr);
    uniforms.uGlowR.value = H * 0.55 * dpr;
    uniforms.uTime.value = reduce ? 4.0 : t;

    const textOut = 1 - smooth((sweep - 0.35) / 0.65);
    uniforms.uTextL.value = clamp01((P - 0.01) / 0.1) * textOut;
    uniforms.uTextR.value = textOut;
    uniforms.uHeadSeam.value = headSeam * dpr;

    // Touch hold: past a quarter second the reveal grows around the finger; after release it shrinks away.
    let hr = 0;
    if (hold.on) {
      const held = t - hold.t0 - 0.25;
      if (held > 0) { hr = hold.r = 62 + 60 * held; hold.rel = t; }
      tapAge = 0;
    } else if (hold.r) {
      hr = hold.r * Math.sqrt(Math.max(0, 1 - (t - hold.rel) / 1.3));
      if (!hr) hold.r = 0;
    }
    uniforms.uHoldR.value = hr * dpr;
    uniforms.uHoldC.value.set(hold.x * dpr, (H - hold.y) * dpr);
    tapAge++;
    uniforms.uCodeAmt.value = TOUCH ? clamp01((78 - tapAge) / 24) : 1;

    renderer.setRenderTarget(cellRT);
    renderer.render(cellScene, camera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // HUD: tracking boxes near the pointer, mesh points under the scan, and the crosshair cursor.
    if (P < BEAT[1] || hudLive) {
      hudLive = P < BEAT[1];
      hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hctx.clearRect(0, 0, W, H);
      hctx.font = `500 10px ${monoFont}`;
      hctx.lineWidth = 1;
      const hudA = 1 - clamp01((rise - 0.75) / 0.25);
      if (wipe.v > 0) {
        // Under the scan band, the face mesh lights up point by point.
        const bandY = (wipe.v * 1.06 - 0.02) * H;
        hctx.fillStyle = '#67e8f9';
        for (const p of portrait.mesh) {
          const [x, y] = project(p);
          const a = Math.exp(-((y - bandY) ** 2) / 900) * hudA;
          if (a < 0.03) continue;
          hctx.globalAlpha = a * 0.9;
          hctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
      for (const [p, label] of TRACKED) {
        let [x, y] = project(p);
        const near = ptr.inside ? Math.max(0, 1 - Math.hypot(x - ptr.x, y - ptr.y) / 190) : 0;
        const a = near * Math.min(1, ptr.speed * 3 + 0.25) * hudA;
        if (a < 0.02) continue;
        if (!reduce) { x += Math.sin(t * 11 + x) * 0.6; y += Math.cos(t * 9 + y) * 0.6; }
        hctx.globalAlpha = a;
        hctx.strokeStyle = hctx.fillStyle = '#a3e635';
        hctx.strokeRect(x - 9, y - 9, 18, 18);
        hctx.beginPath(); hctx.moveTo(x - 3, y); hctx.lineTo(x + 3, y); hctx.moveTo(x, y - 3); hctx.lineTo(x, y + 3); hctx.stroke();
        if (label && wipe.v < 0.05) hctx.fillText(`${label}  ${Math.round(x)},${Math.round(y)}`, x + 14, y + 3);
      }
      hctx.globalAlpha = 1;
      if (ptr.inside && P < BEAT[1] && HOVER.matches) {
        const r = 7 + ptr.speed * 10;
        hctx.strokeStyle = 'rgba(231,237,247,0.9)';
        hctx.beginPath(); hctx.arc(ptr.x, ptr.y, r, 0, Math.PI * 2); hctx.stroke();
        hctx.beginPath();
        hctx.moveTo(ptr.x - r - 6, ptr.y); hctx.lineTo(ptr.x - r + 2, ptr.y); hctx.moveTo(ptr.x + r - 2, ptr.y); hctx.lineTo(ptr.x + r + 6, ptr.y);
        hctx.moveTo(ptr.x, ptr.y - r - 6); hctx.lineTo(ptr.x, ptr.y - r + 2); hctx.moveTo(ptr.x, ptr.y + r - 2); hctx.lineTo(ptr.x, ptr.y + r + 6);
        hctx.stroke();
      }
    }
    if (readout) {
      const yaw = (rot.y * 57.3).toFixed(1), pitch = (rot.x * 57.3).toFixed(1);
      const state = P < BEAT[0] ? (wipe.v > 0 ? 'Scanning' : 'Tracking') : P < BEAT[1] ? 'Split' : P < BEAT[2] ? 'Converting' : P < BEAT[3] ? 'Online' : P < BEAT[4] ? 'Dissolving' : 'Offline';
      const html = `Face mesh · ${portrait.mesh.length} pts<br>Yaw ${yaw}° · Pitch ${pitch}° · ${state}`;
      if (html !== readoutHTML) readout.innerHTML = readoutHTML = html;
      readout.style.opacity = String(1 - smooth((P - BEAT[3]) / (BEAT[4] - BEAT[3])));
    }
    if (hint) hint.style.opacity = P > 0.04 ? '0' : '1';
  }

  function start() {
    if (running || disposed || !renderer) return;
    running = true;
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  async function init() {
    const base = root.dataset.assets ?? '/human-machine';
    const [photo, depth, machine] = await Promise.all([
      loadImage(`${base}/face.webp`), loadImage(`${base}/depth.webp`), loadImage(`${base}/machine.webp`),
    ]);
    try { await document.fonts.load(`700 100px ${headFont}`); } catch { /* fallback font is fine */ }
    if (disposed) return;
    imgW = photo.naturalWidth; imgH = photo.naturalHeight; PLANE_W = (PLANE_H * imgW) / imgH;
    const dc = document.createElement('canvas');
    dc.width = imgW; dc.height = imgH;
    const dcx = dc.getContext('2d', { willReadFrequently: true })!;
    dcx.drawImage(depth, 0, 0, imgW, imgH);
    depthData = dcx.getImageData(0, 0, imgW, imgH).data;

    try {
      renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch {
      root.classList.add('hm-nogl');
      return;
    }
    renderer.autoClear = true;
    scene = new THREE.Scene();
    cellScene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    fluid = new Fluid(renderer);
    if (TOUCH) { fluid.fade = 0.9785; fluid.perFrame = true; }
    const tex = (img: HTMLImageElement) => {
      const t = new THREE.Texture(img);
      t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
      return t;
    };
    textTex = new THREE.CanvasTexture(textCanvas);
    textTex.minFilter = THREE.LinearFilter;
    uniforms = {
      uPhoto: { value: tex(photo) }, uMachine: { value: tex(machine) }, uDepth: { value: tex(depth) },
      uStrength: { value: STRENGTH }, uLens: { value: new THREE.Vector2() }, uTime: { value: 0 }, uDpr: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) }, uText: { value: textTex }, uGlyph: { value: makeGlyphs(monoFont) },
      uTextL: { value: 0 }, uTextR: { value: 0 }, uCodeAmt: { value: 1 }, uHeadSeam: { value: 0 },
      uDye: { value: null }, uHoldC: { value: new THREE.Vector2() }, uHoldR: { value: 0 }, uSplit: { value: 0 }, uSeamX: { value: 0 },
      uDissolve: { value: 0 }, uLineBoost: { value: 0 }, uWipe: { value: 0 }, uGhost: { value: 0.07 }, uEyeBoost: { value: 0 },
      uEye1: { value: new THREE.Vector2(portrait.machineEyeL[0], 1 - portrait.machineEyeL[1]) },
      uEye2: { value: new THREE.Vector2(portrait.machineEyeR[0], 1 - portrait.machineEyeR[1]) },
      uDTexel: { value: new THREE.Vector2(1 / depth.naturalWidth, 1 / depth.naturalHeight) }, uLightDir: { value: new THREE.Vector3(-0.4, 0.5, 0.8) },
      uLook: { value: new THREE.Vector2() }, uImgAsp: { value: imgH / imgW },
      uMTexel: { value: new THREE.Vector2(1 / machine.naturalWidth, 1 / machine.naturalHeight) },
      uCells: { value: null }, uCellRes: { value: new THREE.Vector2(1, 1) },
      uGlowC: { value: new THREE.Vector2() }, uGlowR: { value: 1 }, uWarm: { value: 1 }, uBottomFade: { value: 0.04 },
      // Raw sRGB values (no THREE.Color: it would convert them to linear).
      uBgA: { value: new THREE.Vector3(0.02, 0.027, 0.051) }, uBgB: { value: new THREE.Vector3(0.004, 0.006, 0.01) },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: PORTRAIT_VS, fragmentShader: PORTRAIT_FS });
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H, 256, 320), mat);
    // Full-screen backdrop drawn first, so the portrait has no edges and the ink runs everywhere.
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms, depthTest: false, depthWrite: false,
        vertexShader: `void main() { gl_Position = vec4(position.xy, 0.999, 1.0); }`,
        fragmentShader: BACK_FS,
      }),
    );
    back.frustumCulled = false;
    back.renderOrder = -1;
    scene.add(back, mesh);
    const cells = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms, depthTest: false, depthWrite: false,
        vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: CELLS_FS,
      }),
    );
    cells.frustumCulled = false;
    cellScene.add(cells);
    resize();
    root.classList.add('hm-ready');
    document.fonts?.ready.then(() => { if (!disposed && renderer) drawHeadline(); });
    if (inView) start();
  }

  // Only render while the section is on screen and the tab is visible.
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !document.hidden) start();
    else stop();
  });
  io.observe(root);
  on(document, 'visibilitychange', () => { if (document.hidden) stop(); else if (inView) start(); });
  on(window, 'resize', () => { if (renderer) resize(); });

  init().catch(() => root.classList.add('hm-nogl'));

  return () => {
    disposed = true;
    stop();
    io.disconnect();
    offs.forEach((f) => f());
    if (renderer) {
      fluid.dispose();
      fluid.disposeMaterials();
      cellRT?.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
      });
      cellScene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
      });
      Object.values(uniforms).forEach((u) => { if (u.value instanceof THREE.Texture) u.value.dispose(); });
      renderer.dispose();
      renderer = null;
    }
  };
}
