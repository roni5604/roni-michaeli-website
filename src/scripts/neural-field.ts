/**
 * Animated "neural network" background for the hero.
 * Canvas 2D, DPR-aware, pauses when off-screen or when the tab is hidden,
 * and reacts gently to the pointer. Returns a cleanup function.
 */
type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: number };

const COLORS = [
  [34, 211, 238], // cyan
  [167, 139, 250], // violet
  [244, 114, 182], // pink
];

export function startNeuralField(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  let w = 0;
  let h = 0;
  let dpr = 1;
  let nodes: Node[] = [];
  let raf = 0;
  let running = false;
  let visible = true;
  const pointer = { x: -9999, y: -9999, active: false };
  const pulses: { a: number; b: number; t: number }[] = [];

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(Math.min(110, Math.max(36, (w * h) / 14000)));
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.6 + 0.8,
      hue: Math.floor(Math.random() * COLORS.length),
    }));
  };

  const link = 140;
  const link2 = link * link;

  const frame = () => {
    raf = 0;
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      if (pointer.active) {
        const dx = pointer.x - n.x;
        const dy = pointer.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 200 * 200 && d2 > 1) {
          const f = 0.012 * (1 - Math.sqrt(d2) / 200);
          n.vx += dx * f * 0.02;
          n.vy += dy * f * 0.02;
        }
      }
      n.vx *= 0.995;
      n.vy *= 0.995;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp < 0.08) {
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;
      } else if (sp > 1.2) {
        n.vx *= 0.9;
        n.vy *= 0.9;
      }
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < link2) {
          const alpha = (1 - d2 / link2) * 0.32;
          const c = COLORS[a.hue];
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          if (pulses.length < 14 && Math.random() < 0.0006) pulses.push({ a: i, b: j, t: 0 });
        }
      }
    }

    // signals travelling along edges — "thoughts" moving through the network
    for (let k = pulses.length - 1; k >= 0; k--) {
      const p = pulses[k];
      const a = nodes[p.a];
      const b = nodes[p.b];
      p.t += 0.018;
      if (!a || !b || p.t >= 1) {
        pulses.splice(k, 1);
        continue;
      }
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.3, 'rgba(34,211,238,0.6)');
      g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const n of nodes) {
      const c = COLORS[n.hue];
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  };
  const onLeave = () => {
    pointer.active = false;
  };
  const onVis = () => (document.hidden ? stop() : start());

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  });

  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  io.observe(canvas);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);
  canvas.style.opacity = '1';
  start();

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
  };
}
