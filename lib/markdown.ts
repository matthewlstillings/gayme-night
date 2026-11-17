// Renders the rulebook page dialect (see README "Rulebook pages") to HTML.
// Pure and dependency-free so it can be unit tested.

export type RenderOptions = {
  /** Page number being rendered. */
  page: number;
  /** Pages that exist, so "page 12" only links when page 12 is there. */
  pages: Set<number>;
  /** Image info for this page, or null when the page has no image. */
  image: { src: string; width: number; height: number } | null;
  /** Shared across pages so heading ids stay unique. */
  usedIds: Set<string>;
  /** Looks up a cropped figure by name for [[fig name | caption]] lines. */
  fig?: (name: string) => { src: string; width: number; height: number } | null;
};

const FIG_LINE = /^\[\[fig ([a-z0-9-]+)(?:\s*\|\s*(.*?))?\]\]$/;

export type Heading = { id: string; title: string; level: number };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;');

const pad = (n: number) => String(n).padStart(2, '0');

export function slug(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
}

function safeHref(url: string): string | null {
  if (/^https:\/\//i.test(url) || /^\/[^/]/.test(url) || url.startsWith('#')) return url;
  return null;
}

/** Inline markup: **bold**, *italic*, [link](url), %Badge%, and "page N" cross references. */
export function inline(src: string, pages?: Set<number>): string {
  // Pull links out first so their text and URL are not touched by the other rules.
  const links: string[] = [];
  let s = src.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text: string, url: string) => {
    const href = safeHref(url);
    if (!href) return m;
    const external = href.startsWith('https://');
    links.push(`<a href="${escAttr(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a>`);
    return `\u0000${links.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, '<em>$1</em>');
  s = s.replace(/%([A-Za-z][\w ]{0,24})%/g, '<span class="badge">$1</span>');
  if (pages) {
    s = s.replace(/\b(pages? )(\d{1,3}(?:\s*(?:–|-|,|and)\s*\d{1,3})*)/g, (_m, word: string, rest: string) =>
      word + rest.replace(/\b(\d{1,3})\b/g, (d: string) => {
        const n = Number(d);
        return pages.has(n) ? `<a class="xref" href="#p${pad(n)}">${d}</a>` : d;
      })
    );
  }
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => links[Number(i)]);
}

function uid(base: string, used: Set<string>): string {
  let id = base;
  for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
  used.add(id);
  return id;
}

const LIST_ITEM = /^(- |\d+\. )(.*)$/;

function renderList(lines: string[], pages: Set<number>): string {
  type Item = { num: string | null; head: string; cont: string[] };
  const items: Item[] = [];
  for (const ln of lines) {
    const m = ln.match(LIST_ITEM);
    if (m) items.push({ num: m[1] === '- ' ? null : m[1].trim(), head: m[2], cont: [] });
    else items[items.length - 1]?.cont.push(ln.trim());
  }
  const ordered = items[0].num !== null;
  const tag = ordered ? 'ol' : 'ul';
  const start = ordered && parseInt(items[0].num!, 10) !== 1 ? ` start="${parseInt(items[0].num!, 10)}"` : '';
  const out = [`<${tag}${start}>`];
  for (const it of items) {
    let h = inline(it.head, pages);
    let buf: string[] = [];
    const flush = () => {
      if (buf.length) h += '<ul>' + buf.map((b) => `<li>${inline(b, pages)}</li>`).join('') + '</ul>';
      buf = [];
    };
    for (const c of it.cont) {
      if (c.startsWith('- ')) buf.push(c.slice(2));
      else {
        flush();
        h += `<span class="cont">${inline(c, pages)}</span>`;
      }
    }
    flush();
    out.push(`<li>${h}</li>`);
  }
  out.push(`</${tag}>`);
  return out.join('');
}

function figure(n: number, img: NonNullable<RenderOptions['image']>): string {
  return (
    `<figure class="pimg"><button type="button" class="thumb" data-page="${n}" aria-label="Enlarge page ${n} of the rulebook">` +
    `<img src="${escAttr(img.src)}" alt="Rulebook page ${n}" loading="lazy" decoding="async" width="${img.width}" height="${img.height}">` +
    `<span>Page ${n} as printed<small>Tap to enlarge</small></span></button></figure>`
  );
}

function cropFigure(n: number, name: string, caption: string, img: { src: string; width: number; height: number }): string {
  // Crops come from a page rendered about twice print size, so show them at half their pixel width,
  // but never smaller than 200px (or their own width) so small tiles and icons stay readable.
  const w = Math.round(Math.max(img.width / 2, Math.min(img.width, 200)));
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : '';
  return (
    `<figure class="crop" style="--w:${w}px"><button type="button" class="cropbtn" data-page="${n}" data-src="${escAttr(img.src)}" data-cap="${escAttr(caption || `Page ${n}`)}" aria-label="Enlarge ${escAttr(caption || 'diagram')}">` +
    `<img src="${escAttr(img.src)}" alt="${escAttr(caption || `Diagram from page ${n}`)}" loading="lazy" decoding="async" width="${img.width}" height="${img.height}"></button>${cap}</figure>`
  );
}

export function renderPage(md: string, opts: RenderOptions): { html: string; headings: Heading[] } {
  const { page: n, pages, image, usedIds } = opts;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const headings: Heading[] = [];
  let placedImg = !image || md.includes('[[page]]');
  let i = 0;
  let firstHeading = true;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    const hm = ln.match(/^(#{2,4}) (.*)$/);
    if (hm) {
      const level = hm[1].length;
      const text = hm[2].trim();
      const id = uid(`p${pad(n)}-${slug(text)}`, usedIds);
      out.push(`<h${level} id="${id}">${inline(text, pages)}</h${level}>`);
      headings.push({ id, title: text, level });
      if (firstHeading && !placedImg && image) { out.push(figure(n, image)); placedImg = true; }
      firstHeading = false;
      i++;
      continue;
    }
    const fm = ln.trim().match(FIG_LINE);
    if (fm) {
      const img = opts.fig?.(fm[1]);
      if (!img) throw new Error(`Page ${n}: no figure named "${fm[1]}"`);
      out.push(cropFigure(n, fm[1], (fm[2] || '').trim(), img));
      i++;
      continue;
    }
    if (ln.trim() === '[[page]]') {
      if (image) out.push(figure(n, image));
      i++;
      continue;
    }
    if (ln.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].slice(1).trim());
      let text = buf.join(' ');
      let cls = 'flavor';
      let label = '';
      const mm = text.match(/^(CHANGE|NOTE):\s*(.*)$/);
      if (mm) {
        cls = mm[1].toLowerCase();
        label = `<b class="tag">${mm[1][0]}${mm[1].slice(1).toLowerCase()}</b> `;
        text = mm[2];
      } else if (text.startsWith('**')) cls = 'remember';
      out.push(`<blockquote class="${cls}">${label}${inline(text, pages)}</blockquote>`);
      continue;
    }
    if (LIST_ITEM.test(ln)) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() && (LIST_ITEM.test(lines[i]) || lines[i].startsWith(' '))) buf.push(lines[i++]);
      out.push(renderList(buf, pages));
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4} |>|- |\d+\. |\[\[(page\]\]|fig ))/.test(lines[i])) buf.push(lines[i++].trim());
    if (buf.length) {
      const aside = buf.every((b) => b.startsWith('*') && b.endsWith('*'));
      out.push(`<p${aside ? ' class="aside"' : ''}>` + buf.map((b) => inline(b, pages)).join('<br>') + '</p>');
    } else {
      i++; // a line that matched none of the rules above, e.g. "###" with no text
    }
  }
  if (!placedImg && image) out.unshift(figure(n, image));
  return { html: out.join('\n'), headings };
}
