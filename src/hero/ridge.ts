import { ridgeHeight } from "./support";

// A particle Himalaya in raw WebGL 1 (no library): every point is a vertex, all motion happens in the vertex shader.
const VS = `
attribute vec3 aPos;
attribute float aSeed;
uniform float uTime, uAspect, uScroll, uAmp, uDpr;
uniform vec2 uMouse;
varying float vH, vA, vLift;
const float EYE = 2.6;
const float CAM = 0.8;
const float F = 2.25;
vec2 proj(vec3 p) {
  float d = p.z + EYE;
  return vec2((p.x + uMouse.x * 0.12 * (1.0 - p.z * 0.2)) / d * F / uAspect, (p.y - CAM - uScroll * 0.25) / d * F);
}
void main() {
  vec3 p = aPos;
  p.y *= 1.8;
  float zn = p.z / 4.0;
  p.y += sin(uTime * 0.5 + aSeed * 6.2831 + p.x * 1.5) * 0.012;
  p.y -= uScroll * 0.6 * (1.0 - zn);
  vec2 q = proj(p);
  vec2 m = (q - uMouse) * vec2(uAspect, 1.0);
  float d2 = dot(m, m);
  float lift = uAmp * exp(-d2 * 16.0);
  float ripple = uAmp * sin(sqrt(d2) * 28.0 - uTime * 5.0) * exp(-d2 * 6.0) * 0.025;
  p.y += lift * 0.32 + ripple;
  q = proj(p);
  gl_Position = vec4(q, 0.0, 1.0);
  float depth = p.z + EYE;
  gl_PointSize = (2.4 + lift * 5.0) * uDpr * (3.4 / depth);
  vH = clamp(aPos.y / 1.25, 0.0, 1.0);
  vLift = lift;
  float edge = 1.0 - smoothstep(0.82, 1.0, abs(aPos.x) / (2.6 + 4.2 * zn));
  vA = mix(1.0, 0.45, zn) * edge * (0.78 + 0.22 * sin(uTime * 1.4 + aSeed * 40.0)) * (1.0 - uScroll * 0.85);
}`;

const FS = `
precision mediump float;
uniform float uLight;
varying float vH, vA, vLift;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  vec3 lo = mix(vec3(0.49, 0.23, 0.93), vec3(0.43, 0.16, 0.85), uLight);
  vec3 mid = mix(vec3(0.13, 0.83, 0.93), vec3(0.02, 0.52, 0.66), uLight);
  vec3 hi = mix(vec3(0.96, 0.97, 1.0), vec3(0.08, 0.1, 0.2), uLight);
  vec3 c = vH < 0.45 ? mix(lo, mid, vH / 0.45) : mix(mid, hi, (vH - 0.45) / 0.55);
  c = mix(c, hi, vLift * 0.6);
  float a = clamp((1.0 - smoothstep(0.18, 0.5, r)) * vA * (0.85 + vLift), 0.0, 1.0);
  gl_FragColor = vec4(c * a, a);
}`;

export type RidgeHandle = { count: number; setPaused(paused: boolean): void; destroy(): void };

export function startRidge(canvas: HTMLCanvasElement): RidgeHandle | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "low-power" });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const small = canvas.clientWidth < 700;
  const cols = small ? 100 : 170;
  const rows = small ? 34 : 54;
  const data = new Float32Array(cols * rows * 4);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const z = r / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const seed = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
      const ux = (c + (seed - 0.5) * 0.6) / (cols - 1) * 2 - 1;
      data.set([ux * (2.6 + 4.2 * z), ridgeHeight(ux, z), z * 4, seed], i);
      i += 4;
    }
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  const aSeed = gl.getAttribLocation(prog, "aSeed");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aSeed);
  gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 16, 12);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uTime = u("uTime"), uAspect = u("uAspect"), uScroll = u("uScroll"), uAmp = u("uAmp"), uDpr = u("uDpr"), uMouse = u("uMouse"), uLight = u("uLight");
  gl.enable(gl.BLEND);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const mouse = { x: 0.3, y: -0.2, tx: 0.3, ty: -0.2, amp: 0, tamp: 0.7, last: -1e4 };
  let raf = 0;
  let visible = true;
  const t0 = performance.now();

  const resize = () => {
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const theme = () => {
    const light = document.documentElement.getAttribute("data-theme") === "light";
    gl.uniform1f(uLight, light ? 1 : 0);
    // Premultiplied output: additive glow on dark, normal "over" on light.
    gl.blendFunc(gl.ONE, light ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
  };
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom) return;
    mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
    mouse.tamp = 1;
    mouse.last = performance.now();
  };
  let paused = false;
  const frame = (now: number) => {
    raf = 0;
    if (paused || !visible || document.hidden) return;
    const t = (now - t0) / 1000;
    if (now - mouse.last > 2500) {
      // Idle: the "wind" wanders across the range so the scene stays alive on touch screens too.
      mouse.tx = Math.sin(t * 0.27) * 0.7;
      mouse.ty = -0.15 + Math.sin(t * 0.41) * 0.22;
      mouse.tamp = 0.7;
    }
    const k = 0.08;
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    mouse.amp += (mouse.tamp - mouse.amp) * 0.05;
    const h = canvas.parentElement?.clientHeight || canvas.clientHeight || 1;
    gl.uniform1f(uTime, t);
    // Clamp on tall phones so more of the range fits across the screen.
    gl.uniform1f(uAspect, Math.max(0.8, canvas.width / canvas.height || 1));
    gl.uniform1f(uScroll, Math.min(1, Math.max(0, window.scrollY / h)));
    gl.uniform1f(uAmp, mouse.amp);
    gl.uniform1f(uDpr, dpr);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, cols * rows);
    canvas.classList.add("is-ready");
    raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf && !paused && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  resize();
  theme();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    kick();
  });
  io.observe(canvas);
  const mo = new MutationObserver(theme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });
  document.addEventListener("visibilitychange", kick);
  kick();

  return {
    count: cols * rows,
    setPaused(p) {
      paused = p;
      if (p) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else kick();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", kick);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
