'use client';

import { useEffect, useRef, useState } from 'react';
import type { GuideSection } from '@/lib/types';
import { DownIcon } from './Icons';

/** Section picker that jumps to a section and follows along as you scroll. */
export function GuideJump({ sections }: { sections: GuideSection[] }) {
  const [current, setCurrent] = useState(sections[0]?.id ?? '');
  const lockUntil = useRef(0);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    let raf = 0;
    const update = () => {
      if (Date.now() < lockUntil.current || !els.length) return;
      const top = (document.querySelector('header.bar')?.getBoundingClientRect().bottom ?? 0) + 24;
      let cur = els[0];
      for (const s of els) {
        if (s.getBoundingClientRect().top <= top) cur = s;
        else break;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = els[els.length - 1];
      setCurrent(cur.id);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, [sections]);

  if (!sections.length) return null;
  return (
    <div className="jumpsel">
      <select
        aria-label="Jump to section"
        value={current}
        onChange={(e) => {
          const id = e.target.value;
          setCurrent(id);
          lockUntil.current = Date.now() + 900;
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          history.replaceState(null, '', `#${id}`);
          e.target.blur();
        }}
      >
        {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <DownIcon />
    </div>
  );
}
