'use client';

import { useEffect } from 'react';

/**
 * Wires up the rulebook page that the server rendered: search with highlights (showing only
 * matching paragraphs while a search is active), the small-screen search and contents toggles,
 * the current section, and the page image viewer.
 * It works on the DOM directly because the rulebook text is static HTML.
 */
/** Query words: lowercase, punctuation dropped, a plural ending trimmed so "eggs" also finds "egg". */
function toWords(raw: string): string[] {
  return raw
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) =>
      w.length > 4 && /ies$/.test(w) ? w.slice(0, -3)
      : w.length > 4 && /(s|x|z|ch|sh)es$/.test(w) ? w.slice(0, -2)
      : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1)
      : w
    );
}

/** One query word as a pattern that ignores case and any space or hyphen inside it, so "bird feeder" and "birdfeeder" meet. */
function wordRe(w: string): RegExp {
  return new RegExp(
    [...w].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-\u2010-\u2013]?'),
    'gi'
  );
}

/** The book word closest to w, within two edits, or null. */
function closest(w: string, vocab: string[]): string | null {
  let best: string | null = null;
  let bestD = w.length > 5 ? 3 : 2;
  for (const v of vocab) {
    if (Math.abs(v.length - w.length) >= bestD) continue;
    const d = edits(w, v, bestD);
    if (d < bestD) { bestD = d; best = v; }
  }
  return best;
}
function edits(a: string, b: string, cap: number): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin >= cap) return cap;
    prev = cur;
  }
  return prev[b.length];
}

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
    const empty = $('empty');
    if (!main || !q || !clearB || !prevB || !nextB || !countEl || !empty) return;
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
    const textOf = new Map(blocks.map((b) => [b, b.textContent ?? '']));
    const bookText = blocks.map((b) => textOf.get(b)).join(' ');
    // Every word of the book (4+ letters), for "did you mean" suggestions.
    const vocab = [...new Set((bookText.toLowerCase().match(/[a-z][a-z'’]{3,}/g) ?? []).map((w) => w.replace(/['’]s?$/, '')))];
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
    const markIn = (el: HTMLElement, re: RegExp) => {
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          if ((n.parentNode as HTMLElement)?.tagName === 'MARK') return NodeFilter.FILTER_REJECT;
          re.lastIndex = 0;
          return re.test(n.nodeValue ?? '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      const nodes: Text[] = [];
      while (tw.nextNode()) nodes.push(tw.currentNode as Text);
      nodes.forEach((n) => {
        const v = n.nodeValue ?? '';
        let i = 0;
        let m: RegExpExecArray | null;
        const frag = document.createDocumentFragment();
        re.lastIndex = 0;
        while ((m = re.exec(v))) {
          if (!m[0]) { re.lastIndex++; continue; }
          if (m.index > i) frag.appendChild(document.createTextNode(v.slice(i, m.index)));
          const mk = document.createElement('mark');
          mk.textContent = m[0];
          frag.appendChild(mk);
          marks.push(mk);
          i = m.index + m[0].length;
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
      const words = toWords(q.value);
      const term = words.join(' ');
      // Leaving search keeps your place: remember the paragraph with the current match.
      const spot = !term && idx >= 0 && marks[idx] ? blocks.find((b) => b.contains(marks[idx])) ?? null : null;
      unmark();
      marks = [];
      idx = -1;
      clearB.hidden = !q.value;
      const filtering = term.length > 0;
      main.classList.toggle('filtering', filtering);
      blocks.forEach((b) => b.classList.remove('hide'));
      sections.forEach((s) => s.classList.remove('hide'));
      const hitsByToc = new Map<string, number>();
      if (term) {
        const res = words.map(wordRe);
        const keep = new Set<HTMLElement>();
        blocks.forEach((b) => {
          if (b.tagName === 'FIGURE' && !b.classList.contains('crop')) return;
          const txt = textOf.get(b)!;
          if (!res.every((re) => { re.lastIndex = 0; return re.test(txt); })) return;
          keep.add(b);
          const h = blockHead.get(b);
          if (h) keep.add(h);
          const before = marks.length;
          res.forEach((re) => markIn(b, re));
          const t = blockToc.get(b) || firstTocOfPage(b);
          if (t) hitsByToc.set(t, (hitsByToc.get(t) ?? 0) + marks.length - before);
        });
        // A cropped diagram stays visible next to the matching text it illustrates.
        blocks.forEach((b, j) => { if (b.classList.contains('crop') && j > 0 && keep.has(blocks[j - 1])) keep.add(b); });
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
      // Several words mark in several passes, so put the matches back in reading order.
      marks.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      const n = marks.length;
      empty.classList.toggle('show', term.length > 0 && n === 0);
      if (tocHead) tocHead.hidden = filtering && n === 0;
      if (term && !n) showEmpty(words);
      countEl.textContent = term ? (n ? `${n} ${n === 1 ? 'match' : 'matches'}` : 'No matches') : idleText;
      prevB.disabled = nextB.disabled = !n;
      if (n) go(0);
      if (spot) {
        spot.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        spot.classList.remove('flash');
        void spot.offsetWidth;
        spot.classList.add('flash');
        setTimeout(() => spot.classList.remove('flash'), 1700);
      }
    };

    // The empty message says what was searched and, where a word isn't in the book, offers the closest one.
    const emptyQ = $('emptyQ');
    const emptyTry = $('emptyTry');
    const emptyBtn = $<HTMLButtonElement>('emptyBtn');
    const tocHead = document.querySelector<HTMLElement>('#toc > h2');
    let suggestion = '';
    const showEmpty = (ws: string[]) => {
      if (emptyQ) emptyQ.textContent = q.value.trim();
      suggestion = '';
      const missing = ws.filter((w) => { const re = wordRe(w); return !re.test(bookText); });
      if (missing.length === 1 && missing[0].length >= 3) {
        const best = closest(missing[0], vocab);
        if (best) suggestion = ws.map((w) => (w === missing[0] ? best : w)).join(' ');
      } else if (!missing.length && ws.length > 1) {
        suggestion = ws.reduce((a, b) => (b.length > a.length ? b : a));
      }
      if (emptyTry) emptyTry.hidden = !suggestion;
      if (emptyBtn) emptyBtn.textContent = suggestion;
    };
    on(emptyBtn, 'click', () => { if (!suggestion) return; q.value = suggestion; run(); q.focus(); });

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
    on(prevB, 'click', () => go(idx - 1));
    on(nextB, 'click', () => go(idx + 1));
    on(clearB, 'click', () => { q.value = ''; run(); q.focus(); });

    // Small screens: the search panel and the contents drawer each open from an icon button.
    const header = document.querySelector<HTMLElement>('header.bar');
    const searchBtn = $('searchBtn');
    const toc = $('toc');
    const tocBtn = $('tocBtn');
    const setSearch = (open: boolean) => {
      header?.classList.toggle('searching', open);
      searchBtn?.setAttribute('aria-expanded', String(open));
      searchBtn?.setAttribute('aria-label', open ? 'Close search' : 'Search the rules');
      if (open) q.focus();
      else if (q.value) { q.value = ''; run(); }
    };
    const setToc = (open: boolean) => {
      toc?.classList.toggle('open', open);
      tocBtn?.setAttribute('aria-expanded', String(open));
      tocBtn?.setAttribute('aria-label', open ? 'Close contents' : 'Contents');
    };
    on(searchBtn, 'click', () => { setToc(false); setSearch(!header?.classList.contains('searching')); });
    on(tocBtn, 'click', () => setToc(!toc?.classList.contains('open')));
    on(toc, 'click', (e: MouseEvent) => { if ((e.target as HTMLElement).closest('a') && toc!.classList.contains('open')) setToc(false); });
    on(window, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Escape' && toc?.classList.contains('open')) setToc(false); });
    on(document as unknown as HTMLElement, 'click', (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (toc?.classList.contains('open') && !toc.contains(t) && !tocBtn?.contains(t)) setToc(false);
    });

    // Keep jump targets and the contents drawer just below the header, whatever its height.
    let ro: ResizeObserver | null = null;
    if (header && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => document.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`));
      ro.observe(header);
    }
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) tocLinks.forEach((a) => a.classList.toggle('here', a.getAttribute('href') === `#${en.target.id}`));
        }),
        { rootMargin: `-${Math.round((header?.getBoundingClientRect().height ?? 130) + 10)}px 0px -70% 0px` }
      );
      tocLinks.forEach((a) => { const h = document.getElementById(a.getAttribute('href')!.slice(1)); if (h) io!.observe(h); });
    }

    // Page image viewer.
    const lb = $<HTMLDialogElement>('lb');
    const lbImg = $<HTMLImageElement>('lbImg');
    const lbTitle = $('lbTitle');
    const lbIn = $('lbIn');
    const lbPrev = $<HTMLButtonElement>('lbPrev');
    const lbNext = $<HTMLButtonElement>('lbNext');
    const lbZoom = $<HTMLButtonElement>('lbZoom');
    let at = 0;
    const setZoom = (z: boolean) => {
      lbIn?.classList.toggle('zoom', z);
      lbZoom?.setAttribute('aria-pressed', String(z));
      if (lbZoom) lbZoom.textContent = z ? 'Fit' : 'Zoom';
    };
    const setNav = (on: boolean) => {
      if (lbPrev) { lbPrev.hidden = !on; lbPrev.disabled = at <= 0; }
      if (lbNext) { lbNext.hidden = !on; lbNext.disabled = at >= images.length - 1; }
    };
    const pad = (n: number) => String(n).padStart(2, '0');
    const show = (i: number) => {
      if (!images.length || !lbImg || !lbTitle || !lbIn) return;
      at = Math.min(images.length - 1, Math.max(0, i));
      const n = images[at];
      lbImg.src = `/games/${slug}/pages/p${pad(n)}.webp`;
      lbImg.alt = `Rulebook page ${n}`;
      lbTitle.textContent = `Page ${n}`;
      lbIn.scrollTop = 0;
      setNav(true);
    };
    on(main, 'click', (e: MouseEvent) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>('.cropbtn');
      if (c && lb && lbImg && lbTitle && lbIn) {
        at = Math.max(0, images.indexOf(Number(c.dataset.page)));
        lbImg.src = c.dataset.src || '';
        lbImg.alt = c.dataset.cap || '';
        lbTitle.textContent = c.dataset.cap || '';
        lbIn.scrollTop = 0;
        setZoom(false);
        setNav(false);
        lb.showModal();
        return;
      }
      const t = (e.target as HTMLElement).closest<HTMLElement>('.thumb');
      if (!t || !lb) return;
      setZoom(false);
      show(images.indexOf(Number(t.dataset.page)));
      lb.showModal();
    });
    on($('lbClose'), 'click', () => lb?.close());
    on(lbPrev, 'click', () => show(at - 1));
    on(lbNext, 'click', () => show(at + 1));
    on(lbZoom, 'click', () => setZoom(!lbIn?.classList.contains('zoom')));
    on(lb, 'keydown', (e: KeyboardEvent) => {
      if (lbPrev?.hidden) return;
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
    on(lb, 'click', (e: MouseEvent) => { if (e.target === lbIn) lb?.close(); });

    return () => {
      ac.abort();
      io?.disconnect();
      ro?.disconnect();
      document.documentElement.style.removeProperty('--header-h');
      clearTimeout(timer);
      unmark();
    };
  }, [slug, images]);

  return null;
}
