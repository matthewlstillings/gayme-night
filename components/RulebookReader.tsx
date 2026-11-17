'use client';

import { useEffect } from 'react';

/**
 * Wires up the rulebook page that the server rendered: search with highlights,
 * "only matching paragraphs", contents drawer and current section, and the page image viewer.
 * It works on the DOM directly because the rulebook text is static HTML.
 */
export function RulebookReader({ slug, images }: { slug: string; images: number[] }) {
  useEffect(() => {
    const ac = new AbortController();
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window | null, type: K | string, fn: (e: any) => void) =>
      el?.addEventListener(type, fn, { signal: ac.signal });
    const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

    const main = $('main');
    const q = $<HTMLInputElement>('q');
    const clearB = $<HTMLButtonElement>('clear');
    const prevB = $<HTMLButtonElement>('prev');
    const nextB = $<HTMLButtonElement>('next');
    const countEl = $('count');
    const only = $<HTMLInputElement>('only');
    const empty = $('empty');
    if (!main || !q || !clearB || !prevB || !nextB || !countEl || !only || !empty) return;
    const idleText = countEl.dataset.idle ?? '';

    const sections = [...main.querySelectorAll<HTMLElement>('section.page')];
    const blocks: HTMLElement[] = [];
    sections.forEach((s) => s.querySelectorAll<HTMLElement>(':scope > .pbody > *').forEach((el) => blocks.push(el)));

    const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('#toc a')];
    const tocIds = new Set(tocLinks.map((a) => a.getAttribute('href')!.slice(1)));
    const blockToc = new Map<HTMLElement, string | null>();
    const blockHead = new Map<HTMLElement, HTMLElement | null>();
    let curToc: string | null = null;
    let lastHead: HTMLElement | null = null;
    blocks.forEach((b) => {
      if (lastHead && b.parentElement !== lastHead.parentElement) lastHead = null;
      if (/^H[2-4]$/.test(b.tagName)) {
        if (tocIds.has(b.id)) curToc = b.id;
        lastHead = b;
      }
      blockToc.set(b, curToc);
      blockHead.set(b, lastHead);
    });
    const textOf = new Map(blocks.map((b) => [b, (b.textContent ?? '').toLowerCase()]));
    const firstTocOfPage = (b: HTMLElement) => {
      const s = b.closest('section.page');
      const h = s && [...s.querySelectorAll<HTMLElement>('h2,h3,h4')].find((x) => tocIds.has(x.id));
      return h ? h.id : null;
    };

    let marks: HTMLElement[] = [];
    let idx = -1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;

    const unmark = () => {
      main.querySelectorAll('mark').forEach((m) => {
        const p = m.parentNode!;
        p.replaceChild(document.createTextNode(m.textContent ?? ''), m);
        p.normalize();
      });
    };
    const markIn = (el: HTMLElement, term: string) => {
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => ((n.nodeValue ?? '').toLowerCase().includes(term) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
      });
      const nodes: Text[] = [];
      while (tw.nextNode()) nodes.push(tw.currentNode as Text);
      nodes.forEach((n) => {
        const v = n.nodeValue ?? '';
        const lv = v.toLowerCase();
        let i = 0;
        let pos: number;
        const frag = document.createDocumentFragment();
        while ((pos = lv.indexOf(term, i)) !== -1) {
          if (pos > i) frag.appendChild(document.createTextNode(v.slice(i, pos)));
          const m = document.createElement('mark');
          m.textContent = v.slice(pos, pos + term.length);
          frag.appendChild(m);
          marks.push(m);
          i = pos + term.length;
        }
        if (i < v.length) frag.appendChild(document.createTextNode(v.slice(i)));
        n.parentNode!.replaceChild(frag, n);
      });
    };
    const go = (i: number) => {
      if (!marks.length) return;
      if (idx >= 0 && marks[idx]) marks[idx].classList.remove('cur');
      idx = (i + marks.length) % marks.length;
      const m = marks[idx];
      m.classList.add('cur');
      countEl.textContent = `${idx + 1} of ${marks.length}`;
      m.scrollIntoView({ block: 'center' });
    };
    const run = () => {
      const term = q.value.trim().toLowerCase();
      unmark();
      marks = [];
      idx = -1;
      clearB.hidden = !q.value;
      const filtering = only.checked && term.length > 0;
      main.classList.toggle('filtering', filtering);
      blocks.forEach((b) => b.classList.remove('hide'));
      sections.forEach((s) => s.classList.remove('hide'));
      const hitsByToc = new Map<string, number>();
      if (term) {
        const keep = new Set<HTMLElement>();
        blocks.forEach((b) => {
          if (b.tagName === 'FIGURE') return;
          if (!textOf.get(b)!.includes(term)) return;
          keep.add(b);
          const h = blockHead.get(b);
          if (h) keep.add(h);
          const before = marks.length;
          markIn(b, term);
          const t = blockToc.get(b) || firstTocOfPage(b);
          if (t) hitsByToc.set(t, (hitsByToc.get(t) ?? 0) + marks.length - before);
        });
        if (filtering) {
          blocks.forEach((b) => { if (!keep.has(b)) b.classList.add('hide'); });
          sections.forEach((s) => { if (![...s.querySelectorAll(':scope > .pbody > *')].some((c) => keep.has(c as HTMLElement))) s.classList.add('hide'); });
        }
      }
      tocLinks.forEach((a) => {
        const n = hitsByToc.get(a.getAttribute('href')!.slice(1)) ?? 0;
        const h = a.querySelector<HTMLElement>('.hits')!;
        h.hidden = !n;
        h.textContent = String(n);
        a.parentElement!.hidden = filtering && !n;
      });
      const n = marks.length;
      empty.classList.toggle('show', term.length > 0 && n === 0);
      countEl.textContent = term ? (n ? `${n} ${n === 1 ? 'match' : 'matches'}` : 'No matches') : idleText;
      prevB.disabled = nextB.disabled = !n;
      if (n) go(0);
    };

    on(q, 'input', () => {
      pending = true;
      clearTimeout(timer);
      timer = setTimeout(() => { pending = false; run(); }, 160);
    });
    on(q, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pending) { clearTimeout(timer); pending = false; run(); } else go(idx + (e.shiftKey ? -1 : 1));
      }
      if (e.key === 'Escape') { q.value = ''; run(); }
    });
    on(only, 'change', () => { const keepIdx = idx; run(); if (keepIdx > 0) go(keepIdx); });
    on(prevB, 'click', () => go(idx - 1));
    on(nextB, 'click', () => go(idx + 1));
    on(clearB, 'click', () => { q.value = ''; run(); q.focus(); });

    // Contents drawer on small screens, and the current section highlight.
    const toc = $('toc');
    const tocBtn = $('tocBtn');
    const closeToc = () => { toc?.classList.remove('open'); tocBtn?.setAttribute('aria-expanded', 'false'); if (tocBtn) tocBtn.textContent = 'Contents'; };
    on(tocBtn, 'click', () => {
      const open = toc!.classList.toggle('open');
      tocBtn!.setAttribute('aria-expanded', String(open));
      tocBtn!.textContent = open ? 'Close' : 'Contents';
    });
    on(toc, 'click', (e: MouseEvent) => { if ((e.target as HTMLElement).closest('a') && toc!.classList.contains('open')) closeToc(); });
    on(window, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Escape' && toc?.classList.contains('open')) closeToc(); });
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) tocLinks.forEach((a) => a.classList.toggle('here', a.getAttribute('href') === `#${en.target.id}`));
        }),
        { rootMargin: '-140px 0px -70% 0px' }
      );
      tocLinks.forEach((a) => { const h = document.getElementById(a.getAttribute('href')!.slice(1)); if (h) io!.observe(h); });
    }

    // Page image viewer.
    const lb = $<HTMLDialogElement>('lb');
    const lbImg = $<HTMLImageElement>('lbImg');
    const lbTitle = $('lbTitle');
    const lbIn = $('lbIn');
    let at = 0;
    const pad = (n: number) => String(n).padStart(2, '0');
    const show = (i: number) => {
      if (!images.length || !lbImg || !lbTitle || !lbIn) return;
      at = Math.min(images.length - 1, Math.max(0, i));
      const n = images[at];
      lbImg.src = `/games/${slug}/pages/p${pad(n)}.webp`;
      lbImg.alt = `Rulebook page ${n}`;
      lbTitle.textContent = `Page ${n}`;
      lbIn.scrollTop = 0;
    };
    on(main, 'click', (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('.thumb');
      if (!t || !lb) return;
      show(images.indexOf(Number(t.dataset.page)));
      lb.showModal();
    });
    on($('lbClose'), 'click', () => lb?.close());
    on($('lbPrev'), 'click', () => show(at - 1));
    on($('lbNext'), 'click', () => show(at + 1));
    on(lb, 'keydown', (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
    on(lb, 'click', (e: MouseEvent) => { if (e.target === lbIn) lb?.close(); });

    return () => {
      ac.abort();
      io?.disconnect();
      clearTimeout(timer);
      unmark();
    };
  }, [slug, images]);

  return null;
}
