/**
 * Interactive binary rain/field: a grid of 0s and 1s that slowly flickers
 * and lights up around the pointer or finger. Taps send out a ripple.
 * Canvas 2D with pre-rendered glyph sprites so thousands of cells stay cheap.
 * Pauses off-screen / in background tabs. Returns a cleanup function.
 */

const CELL_W = 15;
const CELL_H = 20;
const RADIUS = 170;
const FPS = 40;

type Ripple = { x: number; y: number; t: number };

export function startBinaryField(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let dpr = 1;
  let glyph: Uint8Array = new Uint8Array(0); // 0 or 1
  let heat: Float32Array = new Float32Array(0); // 0..1, decays
  let phase: Float32Array = new Float32Array(0); // per-cell flicker offset
  let sprites: HTMLCanvasElement[] = [];
  let raf = 0;
  let last = 0;
  let running = false;
  let visible = true;
  const pointer = { x: -1e4, y: -1e4, active: false };
  const ripples: Ripple[] = [];

  // Sprites: [0..1] × colour band (cool → warm) at full alpha; alpha applied at draw time.
  const BANDS: [number, number, number][] = [
    [120, 140, 170], // idle slate
    [34, 211, 238], // cyan
    [125, 175, 250], // blue-violet
    [167, 139, 250], // violet
    [244, 114, 182], // pink
    [255, 255, 255], // white-hot
  ];

  const buildSprites = () => {
    sprites = [];
    for (const [r, g, b] of BANDS) {
      for (const ch of ['0', '1']) {
        const c = document.createElement('canvas');
        c.width = Math.ceil(CELL_W * dpr);
        c.height = Math.ceil(CELL_H * dpr);
        const x = c.getContext('2d')!;
        x.scale(dpr, dpr);
        x.font = `500 13px "JetBrains Mono Variable", ui-monospace, monospace`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = `rgb(${r},${g},${b})`;
        x.fillText(ch, CELL_W / 2, CELL_H / 2 + 1);
        sprites.push(c);
      }
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / CELL_W) + 1;
    rows = Math.ceil(h / CELL_H) + 1;
    const n = cols * rows;
    glyph = new Uint8Array(n);
    heat = new Float32Array(n);
    phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      glyph[i] = Math.random() < 0.5 ? 0 : 1;
      phase[i] = Math.random() * Math.PI * 2;
    }
    buildSprites();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    if (now - last < 1000 / FPS) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Expand ripples
    for (let k = ripples.length - 1; k >= 0; k--) {
      ripples[k].t += dt;
      if (ripples[k].t > 1.6) ripples.splice(k, 1);
    }

    const r2 = RADIUS * RADIUS;
    const cw = CELL_W * dpr;
    const chh = CELL_H * dpr;
    for (let row = 0; row < rows; row++) {
      const cy = row * CELL_H + CELL_H / 2;
      // soft vertical fade so the field melts into the page
      const fadeY = Math.min(1, cy / (h * 0.25), (h - cy) / (h * 0.35));
      if (fadeY <= 0) continue;
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const cx = col * CELL_W + CELL_W / 2;

        // pointer influence
        let target = 0;
        if (pointer.active) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) target = 1 - Math.sqrt(d2) / RADIUS;
        }
        // ripples: a bright ring travelling outwards
        for (const rp of ripples) {
          const radius = rp.t * 520;
          const d = Math.hypot(cx - rp.x, cy - rp.y);
          const band = 1 - Math.abs(d - radius) / 46;
          if (band > 0) target = Math.max(target, band * (1 - rp.t / 1.6));
        }
        const hNow = heat[i];
        heat[i] = target > hNow ? hNow + (target - hNow) * 0.35 : hNow * 0.93;
        const hv = heat[i];

        // flicker: hot cells change faster
        if (Math.random() < 0.004 + hv * 0.25) glyph[i] ^= 1;

        const idle = 0.07 + 0.05 * Math.sin(t * 0.9 + phase[i]);
        const alpha = Math.min(1, (idle + hv * 0.95) * fadeY);
        if (alpha < 0.03) continue;
        const band = hv < 0.08 ? 0 : Math.min(BANDS.length - 1, 1 + Math.floor(hv * (BANDS.length - 1.01)));
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprites[band * 2 + glyph[i]], col * cw, row * chh);
      }
    }
    ctx.globalAlpha = 1;
  };

  const setPointer = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = pointer.y > -RADIUS && pointer.y < rect.height + RADIUS;
  };
  const onDown = (e: PointerEvent) => {
    setPointer(e);
    if (pointer.active) ripples.push({ x: pointer.x, y: pointer.y, t: 0 });
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') pointer.active = false;
  };
  const onLeave = () => (pointer.active = false);

  const start = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVis = () => (document.hidden ? stop() : start());

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? start() : stop();
  });
  io.observe(canvas);
  window.addEventListener('pointermove', setPointer, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);
  // fonts may arrive after the first sprites were drawn
  document.fonts?.ready.then(buildSprites);
  canvas.style.opacity = '1';
  start();

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', setPointer);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
  };
}

/** Static frame for reduced motion: a faint, still field of digits. */
export function drawStaticBinary(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.scale(dpr, dpr);
  ctx.font = `500 13px "JetBrains Mono Variable", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(120,140,170,0.09)';
  for (let y = CELL_H / 2; y < rect.height; y += CELL_H) {
    for (let x = CELL_W / 2; x < rect.width; x += CELL_W) {
      ctx.fillText(Math.random() < 0.5 ? '0' : '1', x, y);
    }
  }
  canvas.style.opacity = '1';
}
