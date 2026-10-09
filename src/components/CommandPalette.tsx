import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type Item = { group: string; label: string; href: string; hint?: string; external?: boolean };

/**
 * ⌘K / Ctrl+K command palette. An accessible modal combobox: focus is
 * trapped, arrows move the active option, Enter opens it, Esc closes.
 */
export default function CommandPalette({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion() || (typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion'));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items
      .map((it) => {
        const hay = `${it.label} ${it.group} ${it.hint ?? ''}`.toLowerCase();
        let score = hay.indexOf(q);
        if (score === -1) {
          // loose subsequence match: "dro" -> "Autonomous Drone Navigation"
          let i = 0;
          for (const ch of hay) if (ch === q[i]) i++;
          score = i === q.length ? 100 : -1;
        }
        return { it, score };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.it);
  }, [items, query]);

  const show = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement;
    setQuery('');
    setActive(0);
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => returnFocus.current?.focus?.());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? hide() : show();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest('[data-palette-open]');
      if (t) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open, show, hide]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const go = (it: Item) => {
    setOpen(false);
    if (it.external) {
      window.open(it.href, '_blank', 'noopener');
      return;
    }
    const url = new URL(it.href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      document.querySelector(url.hash)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(history.state, '', url);
      return;
    }
    // Let Astro's router run the page transition.
    const a = document.createElement('a');
    a.href = it.href;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('input, button, [href]');
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  useEffect(() => {
    document.getElementById(`cmd-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) hide();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            onKeyDown={onKeyDown}
            className="glass w-full max-w-xl overflow-hidden rounded-3xl shadow-[0_30px_120px_-20px_rgb(34_211_238/0.35)]"
            initial={reduce ? false : { opacity: 0, y: -16, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a project, section or link…"
                className="h-14 w-full bg-transparent text-base text-ink placeholder:text-faint focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={results[active] ? `cmd-opt-${active}` : undefined}
                aria-autocomplete="list"
                aria-label="Search the site"
              />
              <button type="button" onClick={hide} className="rounded-md border border-line px-2 py-1 font-mono text-[10px] text-muted hover:text-ink">
                ESC
              </button>
            </div>
            <ul id="cmd-list" role="listbox" aria-label="Results" className="max-h-[55vh] overflow-y-auto p-2" data-lenis-prevent>
              {results.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted">Nothing matches “{query}”.</li>}
              {results.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <li key={`${it.group}-${it.label}`} role="presentation">
                    {header && (
                      <div className="px-3 pt-3 pb-1 font-mono text-[10px] tracking-[0.2em] text-faint uppercase" aria-hidden="true">
                        {header}
                      </div>
                    )}
                    <div
                      id={`cmd-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(it)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        i === active ? 'bg-cyan/10 text-ink' : 'text-muted'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`h-1.5 w-1.5 rounded-full ${i === active ? 'bg-cyan' : 'bg-line-strong'}`} aria-hidden="true" />
                        {it.label}
                      </span>
                      <span className="font-mono text-[10px] tracking-wider text-faint uppercase">
                        {it.hint}
                        {it.external ? ' ↗' : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-4 border-t border-line px-5 py-3 font-mono text-[10px] text-faint">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
