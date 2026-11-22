import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { renderPage } from './markdown.ts';
import { attachCitations, pageLinks, type CitationMap } from './citations.ts';

test('each page link gets the section it cites', () => {
  const html = 'see <a class="xref" href="#p12">12</a> and <a class="xref" href="#p03">3</a>';
  const out = attachCitations(html, 5, [{ to: 12, target: 'p12-combat', also: ['p12-wounds'] }, { to: 3, target: 'p03-setup', note: 'Say "hi"' }]);
  assert.match(out, /href="#p12" data-cite="p12-combat" data-also="p12-wounds">12</);
  assert.match(out, /href="#p03" data-cite="p03-setup" data-note="Say &quot;hi&quot;">3</);
});

test('a page link with no listed citation fails the build', () => {
  assert.throws(() => attachCitations('<a class="xref" href="#p12">12</a>', 5, []), /1 page links but 0 citations/);
  assert.throws(() => attachCitations('<a class="xref" href="#p12">12</a>', 5, [{ to: 13, target: 'x' }]), /links to page 12 but is listed as page 13/);
});

// The whole Nemesis: Lockdown rulebook: every page link has its citation and every cited section has text.
const SLUG = 'nemesis-lockdown';
const dir = path.join('content', 'games', SLUG);
test(`every citation in ${SLUG} opens a section with content`, () => {
  const map: CitationMap = JSON.parse(fs.readFileSync(path.join(dir, 'citations.json'), 'utf8'));
  const files = fs.readdirSync(path.join(dir, 'rules')).filter((f) => /^\d+\.md$/.test(f)).sort();
  const pages = new Set(files.map((f) => Number(f.slice(0, -3))));
  const used = new Set<string>();
  const icon = (n: string) => (fs.existsSync(path.join('public', 'games', SLUG, 'icons', `${n}.svg`)) ? { src: 'x', label: n } : null);
  let book = '';
  let links = 0;
  for (const f of files) {
    const n = Number(f.slice(0, -3));
    const md = fs.readFileSync(path.join(dir, 'rules', f), 'utf8');
    const { html } = renderPage(md, { page: n, pages, image: null, usedIds: used, fig: () => ({ src: 'x', width: 2, height: 2 }), icon });
    links += pageLinks(html).length;
    book += attachCitations(html, n, map[String(n)]);
  }
  const listed = Object.values(map).reduce((a, l) => a + l.length, 0);
  assert.equal(listed, links, 'every page link is listed once');
  assert.equal(links, 169);
  for (const m of book.matchAll(/data-cite="([^"]+)"(?: data-also="([^"]+)")?/g)) {
    for (const raw of [m[1], ...(m[2]?.split(' ') ?? [])]) {
      const id = raw.replace(/!$/, '');
      const h = book.match(new RegExp(`<h([2-4]) id="${id}">`));
      assert.ok(h, `no heading ${id}`);
      const rest = book.slice(h.index! + h[0].length).replace(/^[\s\S]*?<\/h\d>/, '');
      const stop = raw.endsWith('!') ? /<h[2-4] /.exec(rest) : new RegExp(`<h[2-${h[1]}] `).exec(rest);
      const body = (stop ? rest.slice(0, stop.index) : rest).replace(/<[^>]+>/g, '').trim();
      assert.ok(body.length > 20, `section ${raw} is empty`);
    }
  }
});
