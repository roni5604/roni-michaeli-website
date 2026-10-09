/**
 * Site-wide interaction layer. Loaded once; re-initialises on every
 * Astro page load (View Transitions) and cleans up before each swap.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startNeuralField } from './neural-field';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const MOTION_KEY = 'rm-motion';
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

function storedMotion(): string | null {
  try {
    return localStorage.getItem(MOTION_KEY);
  } catch {
    return null;
  }
}
function prefersReduced(): boolean {
  const p = storedMotion();
  if (p) return p === 'reduce';
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function applyHtmlClasses() {
  root.classList.add('js');
  root.classList.toggle('reduce-motion', prefersReduced());
}
const reduced = () => root.classList.contains('reduce-motion');

/* ---------------- Smooth scrolling (Lenis + GSAP) ---------------- */
let lenis: Lenis | null = null;
const tick = (t: number) => lenis?.raf(t * 1000);

function startLenis() {
  if (lenis || reduced()) return;
  lenis = new Lenis({ duration: 1.1, anchors: { offset: -80 }, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}
function stopLenis() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
}

/* ---------------- Per-page setup ---------------- */
type Cleanup = () => void;
let cleanups: Cleanup[] = [];
const onCleanup = (fn: Cleanup) => cleanups.push(fn);

function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Window | Document,
  type: K | string,
  fn: (e: any) => void,
  opts?: AddEventListenerOptions,
) {
  el.addEventListener(type, fn, opts);
  onCleanup(() => el.removeEventListener(type, fn, opts));
}

const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel) as unknown as T[]);

function setupReveal() {
  const targets = $$('[data-reveal], [data-split]');
  if (reduced()) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  targets.forEach((t) => io.observe(t));
  onCleanup(() => io.disconnect());
}

function setupSplit() {
  for (const el of $$('[data-split]')) {
    if (el.dataset.splitDone) continue;
    const text = el.textContent?.trim() ?? '';
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach((word, i, arr) => {
      const outer = document.createElement('span');
      outer.className = 'split-word';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', String(i));
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.dataset.splitDone = '1';
  }
}

function setupScramble() {
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]#$%&*+=';
  for (const el of $$('[data-scramble]')) {
    const final = el.dataset.scramble || el.textContent || '';
    if (reduced()) {
      el.textContent = final;
      continue;
    }
    const start = performance.now() + Number(el.dataset.delay || 0);
    const dur = 1400;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / dur));
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        const revealAt = i / final.length;
        if (ch === ' ' || p >= revealAt + 0.15) out += ch;
        else if (p >= revealAt * 0.6) out += glyphs[(Math.random() * glyphs.length) | 0];
        else out += ' ';
      }
      el.textContent = out;
      if (p < 1) raf = requestAnimationFrame(step);
      else el.textContent = final;
    };
    raf = requestAnimationFrame(step);
    onCleanup(() => cancelAnimationFrame(raf));
  }
}

function setupTypewriter() {
  for (const el of $$('[data-typewriter]')) {
    let items: string[] = [];
    try {
      items = JSON.parse(el.dataset.typewriter || '[]');
    } catch {
      /* ignore */
    }
    if (!items.length) continue;
    if (reduced()) {
      el.textContent = items[0];
      continue;
    }
    let i = 0;
    let n = 0;
    let deleting = false;
    let timer = 0;
    const loop = () => {
      const word = items[i % items.length];
      n += deleting ? -1 : 1;
      el.textContent = word.slice(0, n);
      let wait = deleting ? 28 : 55;
      if (!deleting && n === word.length) {
        deleting = true;
        wait = 1900;
      } else if (deleting && n === 0) {
        deleting = false;
        i++;
        wait = 350;
      }
      timer = window.setTimeout(loop, wait);
    };
    timer = window.setTimeout(loop, 900);
    onCleanup(() => clearTimeout(timer));
  }
}

function setupCountUp() {
  const els = $$('[data-count]');
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduced()) {
      el.textContent = target.toLocaleString('en-US') + suffix;
      return;
    }
    const t0 = performance.now();
    const dur = 1600;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        run(e.target as HTMLElement);
        io.unobserve(e.target);
      }
    }
  });
  els.forEach((el) => io.observe(el));
  onCleanup(() => io.disconnect());
}

function setupTilt() {
  for (const card of $$('.spot-card')) {
    const tilt = card.dataset.tilt !== 'off' && finePointer() && !reduced();
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      if (tilt) {
        card.style.setProperty('--ry', `${((x / r.width) - 0.5) * 7}deg`);
        card.style.setProperty('--rx', `${(0.5 - y / r.height) * 7}deg`);
      }
    };
    const leave = () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    };
    on(card, 'pointermove', move, { passive: true });
    on(card, 'pointerleave', leave);
  }
}

function setupMagnetic() {
  if (!finePointer() || reduced()) return;
  for (const el of $$('[data-magnetic]')) {
    const strength = Number(el.dataset.magnetic) || 0.3;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' });
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    on(el, 'pointermove', move, { passive: true });
    on(el, 'pointerleave', leave);
  }
}

function setupHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  on(window, 'scroll', update, { passive: true });

  // Mark the current section in the nav.
  const links = $$<HTMLAnchorElement>('[data-nav-link]');
  const sections = links
    .map((a) => document.getElementById(a.hash.slice(1)))
    .filter((s): s is HTMLElement => !!s);
  if (!sections.length) {
    links.forEach((a) => a.removeAttribute('aria-current'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) =>
          a.hash === `#${e.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'),
        );
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
  onCleanup(() => io.disconnect());
}

function setupMobileMenu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.getElementById('mobile-menu');
  if (!btn || !panel) return;
  const set = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) panel.querySelector<HTMLElement>('a')?.focus();
  };
  set(false);
  on(btn, 'click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  for (const a of $$('a', panel)) on(a, 'click', () => set(false));
  on(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      set(false);
      btn.focus();
    }
  });
  onCleanup(() => (document.body.style.overflow = ''));
}

function setupHero() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-neural]');
  if (!canvas || reduced()) return;
  const lowPower = (navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency <= 2;
  if (lowPower) return;
  let stop: Cleanup | null = null;
  const begin = () => (stop = startNeuralField(canvas));
  // Start after first paint so the content is never blocked.
  const id = 'requestIdleCallback' in window ? (window as any).requestIdleCallback(begin, { timeout: 600 }) : setTimeout(begin, 200);
  onCleanup(() => {
    if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(id);
    else clearTimeout(id);
    stop?.();
  });

  // Parallax on the portrait.
  const portrait = document.querySelector<HTMLElement>('[data-parallax]');
  if (portrait) {
    const tween = gsap.to(portrait, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: portrait, start: 'top top', end: 'bottom top', scrub: true },
    });
    onCleanup(() => tween.scrollTrigger?.kill());
  }
}

function setupHorizontalGallery() {
  const section = document.querySelector<HTMLElement>('[data-hscroll]');
  const track = section?.querySelector<HTMLElement>('[data-hscroll-track]');
  if (!section || !track) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (hover: hover)', () => {
    if (reduced()) return;
    section.classList.add('is-pinned');
    const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    const progress = section.querySelector<HTMLElement>('[data-hscroll-progress]');
    if (progress) {
      gsap.to(progress, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true },
      });
    }
    // Keyboard users: bring a focused card into view by scrolling the page.
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-hscroll-item]');
      const st = tween.scrollTrigger;
      if (!card || !st) return;
      const max = distance() || 1;
      const ratio = Math.min(1, Math.max(0, (card.offsetLeft - 32) / max));
      const y = st.start + (st.end - st.start) * ratio;
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo({ top: y });
    };
    track.addEventListener('focusin', onFocus);
    return () => {
      track.removeEventListener('focusin', onFocus);
      section.classList.remove('is-pinned');
    };
  });
  onCleanup(() => mm.revert());
}

function setupTimeline() {
  const tl = document.querySelector<HTMLElement>('[data-timeline]');
  const fill = tl?.querySelector<HTMLElement>('[data-timeline-fill]');
  if (!tl || !fill) return;
  if (reduced()) {
    fill.style.transform = 'scaleY(1)';
    return;
  }
  const tween = gsap.fromTo(
    fill,
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 60%', scrub: true } },
  );
  onCleanup(() => tween.scrollTrigger?.kill());
}

function setupFilters() {
  const bar = document.querySelector<HTMLElement>('[data-filters]');
  if (!bar) return;
  const buttons = $$<HTMLButtonElement>('[data-filter]', bar);
  const items = $$('[data-cat]');
  const status = document.querySelector<HTMLElement>('[data-filter-status]');
  const apply = (cat: string) => {
    let shown = 0;
    for (const it of items) {
      const show = cat === 'all' || it.dataset.cat === cat;
      it.hidden = !show;
      if (show) shown++;
    }
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
    if (status) status.textContent = `Showing ${shown} project${shown === 1 ? '' : 's'}`;
    ScrollTrigger.refresh();
  };
  for (const b of buttons) {
    on(b, 'click', () => {
      const cat = b.dataset.filter || 'all';
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };
      if (doc.startViewTransition && !reduced()) {
        // Give each card its own name only for this in-page transition so
        // the grid re-flows smoothly; remove them afterwards.
        items.forEach((it, i) => (it.style.viewTransitionName = `pf-${i}`));
        const vt = doc.startViewTransition(() => apply(cat));
        vt.finished.finally(() => items.forEach((it) => (it.style.viewTransitionName = '')));
      } else apply(cat);
      const url = new URL(location.href);
      cat === 'all' ? url.searchParams.delete('filter') : url.searchParams.set('filter', cat);
      history.replaceState(history.state, '', url);
    });
  }
  const initial = new URL(location.href).searchParams.get('filter');
  if (initial && buttons.some((b) => b.dataset.filter === initial)) apply(initial);
}

function setupLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  if (!dialog) return;
  const img = dialog.querySelector<HTMLImageElement>('img')!;
  const cap = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const triggers = $$<HTMLButtonElement>('[data-lightbox]');
  let index = 0;
  const show = (i: number) => {
    index = (i + triggers.length) % triggers.length;
    const t = triggers[index];
    img.src = t.dataset.lightbox || '';
    img.alt = t.dataset.alt || '';
    cap.textContent = t.dataset.caption || t.dataset.alt || '';
  };
  triggers.forEach((t, i) =>
    on(t, 'click', () => {
      show(i);
      dialog.showModal();
      lenis?.stop();
    }),
  );
  on(dialog, 'close', () => lenis?.start());
  on(dialog, 'click', (e: MouseEvent) => {
    if (e.target === dialog) dialog.close();
  });
  for (const b of $$<HTMLButtonElement>('[data-lightbox-nav]', dialog)) {
    on(b, 'click', () => show(index + Number(b.dataset.lightboxNav)));
  }
  for (const b of $$<HTMLButtonElement>('[data-lightbox-close]', dialog)) on(b, 'click', () => dialog.close());
  on(dialog, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
}

function setupEmail() {
  for (const a of $$<HTMLAnchorElement>('[data-email]')) {
    const [user, domain] = (a.dataset.email || '').split('|');
    if (!user || !domain) continue;
    const addr = `${user}@${domain}`;
    a.href = `mailto:${addr}`;
    const label = a.querySelector<HTMLElement>('[data-email-text]');
    if (label) label.textContent = addr;
  }
}

function setupMotionToggle() {
  for (const btn of $$<HTMLButtonElement>('[data-motion-toggle]')) {
    btn.setAttribute('aria-pressed', String(reduced()));
    on(btn, 'click', () => {
      const next = !reduced();
      try {
        localStorage.setItem(MOTION_KEY, next ? 'reduce' : 'full');
      } catch {
        /* storage blocked — still apply for this page */
      }
      root.classList.toggle('reduce-motion', next);
      teardown();
      if (next) stopLenis();
      else startLenis();
      init();
    });
  }
}

function setupCursorGlow() {
  const glow = document.querySelector<HTMLElement>('.cursor-glow');
  if (!glow || !finePointer() || reduced()) {
    if (glow) glow.style.opacity = '0';
    return;
  }
  glow.style.opacity = '1';
  let raf = 0;
  let x = 0;
  let y = 0;
  const move = (e: PointerEvent) => {
    x = e.clientX;
    y = e.clientY;
    if (!raf)
      raf = requestAnimationFrame(() => {
        glow.style.setProperty('--cx', `${x}px`);
        glow.style.setProperty('--cy', `${y}px`);
        raf = 0;
      });
  };
  on(window, 'pointermove', move, { passive: true });
}

function setupSectionParallax() {
  if (reduced()) return;
  for (const el of $$('[data-float]')) {
    const amt = Number(el.dataset.float) || 40;
    const tween = gsap.fromTo(
      el,
      { y: amt },
      { y: -amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
    onCleanup(() => tween.scrollTrigger?.kill());
  }
}

/* ---------------- Lifecycle ---------------- */
function init() {
  applyHtmlClasses();
  if (reduced()) stopLenis();
  else startLenis();
  lenis?.resize();
  setupSplit();
  setupReveal();
  setupScramble();
  setupTypewriter();
  setupCountUp();
  setupTilt();
  setupMagnetic();
  setupHeader();
  setupMobileMenu();
  setupHero();
  setupHorizontalGallery();
  setupTimeline();
  setupFilters();
  setupLightbox();
  setupEmail();
  setupMotionToggle();
  setupCursorGlow();
  setupSectionParallax();
  requestAnimationFrame(() => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function teardown() {
  cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
      /* keep tearing down */
    }
  });
  cleanups = [];
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  teardown();
  // Recreated on the next page so it starts from that page's scroll position.
  stopLenis();
});
// The swap replaces <html> attributes, so restore our classes straight away
// (before paint) to avoid a flash of hidden reveal content.
document.addEventListener('astro:after-swap', applyHtmlClasses);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
  if (storedMotion()) return;
  teardown();
  init();
});
