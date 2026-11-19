'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GuideSection } from '@/lib/types';
import { UpIcon } from './Icons';

/**
 * The quick guide's section list. Numbered like the bands and named by their headings.
 * Desktop (1000px and up): a sticky list beside the guide, like the rulebook's contents.
 * Phone: a button at the bottom of the screen, in thumb reach, that names the section you're in and opens the list.
 */
export function GuideNav({ sections }: { sections: GuideSection[] }) {
  const [current, setCurrent] = useState(sections[0]?.id ?? '');
  const [open, setOpen] = useState(false);
  const lockUntil = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Follow along as you scroll, and keep deep links clear of the sticky header.
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const header = document.querySelector<HTMLElement>('header.bar');
    let raf = 0;
    const update = () => {
      if (Date.now() < lockUntil.current || !els.length) return;
      const top = (header?.getBoundingClientRect().bottom ?? 0) + 24;
      let cur = els[0];
      for (const s of els) {
        if (s.getBoundingClientRect().top <= top) cur = s;
        else break;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = els[els.length - 1];
      setCurrent(cur.id);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
    const measure = () => {
      if (header) document.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    };
    const ro = header && 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    if (header) ro?.observe(header);
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      ro?.disconnect();
      document.documentElement.style.removeProperty('--header-h');
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, [sections]);

  // The phone list closes on Escape or a tap anywhere else.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    navRef.current?.querySelector<HTMLAnchorElement>('a.here')?.scrollIntoView({ block: 'nearest' });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const jump = useCallback((id: string) => {
    setCurrent(id);
    setOpen(false);
    lockUntil.current = Date.now() + 900;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }, []);

  if (!sections.length) return null;
  const idx = Math.max(0, sections.findIndex((s) => s.id === current));

  return (
    <>
      <nav id="gnav" ref={navRef} className={`toc gnav${open ? ' open' : ''}`} aria-label="Sections">
        <h2>Sections</h2>
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={s.id === current ? 'here' : undefined}
                aria-current={s.id === current ? 'location' : undefined}
                onClick={(e) => { e.preventDefault(); jump(s.id); }}
              >
                <span className="pg">{i + 1}</span>
                <span className="tt">{s.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <button
        ref={btnRef}
        type="button"
        className="gfab"
        aria-expanded={open}
        aria-controls="gnav"
        aria-label={`Sections. Now on ${idx + 1} of ${sections.length}: ${sections[idx].label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="pg">{idx + 1}</span>
        <span className="tt">{sections[idx].label}</span>
        <span className="of">of {sections.length}</span>
        <UpIcon />
      </button>
    </>
  );
}
