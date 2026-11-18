import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inline, renderPage } from './markdown.ts';
import { prepareGuide } from './guide.ts';

const pages = new Set([2, 3, 12]);

test('page references link only to pages that exist', () => {
  assert.equal(inline('see page 12', pages), 'see page <a class="xref" href="#p12">12</a>');
  assert.equal(inline('see page 40', pages), 'see page 40');
  assert.match(inline('pages 2 and 3', pages), /href="#p02">2<\/a> and <a class="xref" href="#p03">3/);
});

test('links, bold, italics, badges, and escaping', () => {
  assert.equal(inline('**Bold** and *it*'), '<strong>Bold</strong> and <em>it</em>');
  assert.equal(inline('[PDF](https://example.com/a.pdf)'), '<a href="https://example.com/a.pdf" target="_blank" rel="noopener">PDF</a>');
  assert.equal(inline('[bad](javascript:alert(1))'), '[bad](javascript:alert(1))');
  assert.equal(inline('%Unofficial% x'), '<span class="badge">Unofficial</span> x');
  assert.equal(inline('<script>'), '&lt;script&gt;');
});

test('renders headings, notes, lists and the page image', () => {
  const { html, headings } = renderPage('## Setup\n\nText.\n\n> NOTE: Careful.\n\n1. One\n2. Two\n   - sub', {
    page: 3, pages, image: { src: '/x.webp', width: 10, height: 20 }, usedIds: new Set()
  });
  assert.deepEqual(headings, [{ id: 'p03-setup', title: 'Setup', level: 2 }]);
  assert.match(html, /<h2 id="p03-setup">Setup<\/h2>\n<figure class="pimg">/);
  assert.match(html, /<blockquote class="note"><b class="tag">Note<\/b> Careful\.<\/blockquote>/);
  assert.match(html, /<ol><li>One<\/li><li>Two<ul><li>sub<\/li><\/ul><\/li><\/ol>/);
});

test('heading ids stay unique across pages', () => {
  const used = new Set<string>();
  renderPage('## Same', { page: 2, pages, image: null, usedIds: used });
  const { headings } = renderPage('## Same', { page: 2, pages, image: null, usedIds: used });
  assert.equal(headings[0].id, 'p02-same-2');
});

test('guide sections and rulebook page links', () => {
  const g = prepareGuide('<section class="card" id="win" data-label="How to win"><span class="ref">Rulebook p. 12–13</span><h2>Win</h2></section><section id="b"><h2>B &amp; C</h2></section>', 'demo', pages);
  assert.deepEqual(g.sections, [{ id: 'win', label: 'How to win' }, { id: 'b', label: 'B & C' }]);
  assert.match(g.html, /<a class="xref" href="\/demo#p12">p\. 12–13<\/a>/);
});

test('renders a cropped figure line', () => {
  const { html } = renderPage('## Board\n\nText.\n\n[[fig p05-board | The board]]\n\nMore.', {
    page: 5, pages, image: null, usedIds: new Set(),
    fig: (n) => (n === 'p05-board' ? { src: '/f.webp', width: 600, height: 300 } : null)
  });
  assert.match(html, /<figure class="crop" style="--w:300px">/);
  assert.match(html, /<figcaption>The board<\/figcaption>/);
  assert.match(html, /<p>More\.<\/p>/);
});

test('renders inline icon tokens and rejects unknown ones', () => {
  const opts = {
    page: 15, pages: new Set([15]), image: null, usedIds: new Set<string>(),
    icon: (n: string) => (n === 'tag-space' ? { src: '/i/tag-space.svg', label: 'Space tag' } : null)
  };
  const { html } = renderPage('- [[icon tag-space]] **Space:** uses titanium.', opts);
  assert.match(html, /<li><img class="ico" src="\/i\/tag-space.svg" alt="Space tag" title="Space tag" width="20" height="20"> <strong>Space:<\/strong>/);
  assert.throws(() => renderPage('Text [[icon tag-nope]] here.', { ...opts, usedIds: new Set<string>() }), /no icon named "tag-nope"/);
});
