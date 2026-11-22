import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Game, GameSummary, Guide, Rulebook } from './types';
import { renderPage } from './markdown';
import { prepareGuide } from './guide';
import { webpSize } from './webp';
import { attachCitations, citedIds, type CitationMap } from './citations';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const CONTENT = path.join(process.cwd(), 'content', 'games');
const PUBLIC = path.join(process.cwd(), 'public', 'games');

function fail(file: string, msg: string): never {
  throw new Error(`content/games/${file}: ${msg}`);
}

function check(dir: string, g: Game) {
  const file = `${dir}/game.json`;
  const need = (ok: unknown, msg: string) => { if (!ok) fail(file, msg); };
  need(typeof g.slug === 'string' && SLUG.test(g.slug), 'slug must be lowercase words joined by hyphens');
  need(g.slug === dir, `folder name must match slug "${g.slug}"`);
  need(typeof g.name === 'string' && g.name.trim(), 'name is required');
  need(g.aliases === undefined || (Array.isArray(g.aliases) && g.aliases.every((a) => typeof a === 'string')), 'aliases must be a list of names');
  need(g.publisher === undefined || typeof g.publisher === 'string', 'publisher must be text');
  need(g.year === undefined || Number.isInteger(g.year), 'year must be a whole number');
  need(typeof g.description === 'string' && g.description.trim(), 'description is required');
  need((g.description ?? '').length <= 140, 'description should be one short line (140 characters max)');
  need(g.accent === undefined || HEX.test(g.accent), 'accent must be a color like #f5a32f');
  const range = (v: unknown) => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && n > 0) && v[0] <= v[1];
  need(g.players === undefined || range(g.players), 'players must be [min, max], like [1, 5]');
  need(g.minutes === undefined || range(g.minutes), 'minutes must be [min, max], like [40, 70]');
  need(g.added === undefined || !Number.isNaN(Date.parse(g.added)), 'added must be a date like 2026-11-17T19:30:00Z');
  need(g.rulebook && typeof g.rulebook === 'object', 'rulebook is required (it can be {})');
  need(g.rulebook.intro === undefined || (Array.isArray(g.rulebook.intro) && g.rulebook.intro.every((l) => typeof l === 'string')), 'rulebook.intro must be a list of lines');
}

function pageFiles(dir: string): number[] {
  const rules = path.join(CONTENT, dir, 'rules');
  if (!fs.existsSync(rules)) fail(dir, 'needs a rules folder with one file per page, like rules/02.md');
  const nums = fs.readdirSync(rules).filter((f) => f.endsWith('.md')).map((f) => {
    if (!/^\d{2,3}\.md$/.test(f)) fail(`${dir}/rules/${f}`, 'page files are named by page number, like 07.md');
    return Number(f.slice(0, -3));
  });
  if (!nums.length) fail(`${dir}/rules`, 'has no pages');
  return nums.sort((a, b) => a - b);
}

let cache: Map<string, { game: Game; pages: number[]; hasGuide: boolean }> | null = null;

function load() {
  if (cache) return cache;
  cache = new Map();
  const dirs = fs.existsSync(CONTENT) ? fs.readdirSync(CONTENT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];
  for (const dir of dirs) {
    const file = path.join(CONTENT, dir, 'game.json');
    if (!fs.existsSync(file)) fail(dir, 'is missing game.json');
    let game: Game;
    try { game = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { fail(`${dir}/game.json`, `is not valid JSON (${(e as Error).message})`); }
    check(dir, game);
    cache.set(dir, { game, pages: pageFiles(dir), hasGuide: fs.existsSync(path.join(CONTENT, dir, 'guide.html')) });
  }
  return cache;
}

const sortKey = (name: string) => name.replace(/^(the|a|an)\s+/i, '');

/** All games, alphabetized (a leading "The", "A" or "An" is ignored). */
export function getGames(): GameSummary[] {
  return [...load().values()]
    .map(({ game, pages, hasGuide }) => ({ ...game, hasGuide, pageCount: pages.length }))
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), 'en', { sensitivity: 'base' }));
}

export function getGame(slug: string): GameSummary | undefined {
  return getGames().find((g) => g.slug === slug);
}

const pad = (n: number) => String(n).padStart(2, '0');

export function getRulebook(slug: string): Rulebook {
  const entry = load().get(slug);
  if (!entry) throw new Error(`No game "${slug}"`);
  const pageSet = new Set(entry.pages);
  const usedIds = new Set<string>();
  const images: number[] = [];
  const toc: Rulebook['toc'] = [];
  const citeFile = path.join(CONTENT, slug, 'citations.json');
  const cites: CitationMap | null = fs.existsSync(citeFile) ? JSON.parse(fs.readFileSync(citeFile, 'utf8')) : null;
  const pages = entry.pages.map((n) => {
    const md = fs.readFileSync(path.join(CONTENT, slug, 'rules', `${pad(n)}.md`), 'utf8');
    const imgFile = path.join(PUBLIC, slug, 'pages', `p${pad(n)}.webp`);
    let image: { src: string; width: number; height: number } | null = null;
    if (fs.existsSync(imgFile)) {
      const size = webpSize(fs.readFileSync(imgFile));
      if (!size) fail(`${slug}`, `public/games/${slug}/pages/p${pad(n)}.webp is not a readable WebP image`);
      image = { src: `/games/${slug}/pages/p${pad(n)}.webp`, ...size };
      images.push(n);
    }
    const fig = (name: string) => {
      const f = path.join(PUBLIC, slug, 'figs', `${name}.webp`);
      if (!fs.existsSync(f)) return null;
      const size = webpSize(fs.readFileSync(f));
      return size ? { src: `/games/${slug}/figs/${name}.webp`, ...size } : null;
    };
    const icon = (name: string) => {
      const f = path.join(PUBLIC, slug, 'icons', `${name}.svg`);
      if (!fs.existsSync(f)) return null;
      const label = fs.readFileSync(f, 'utf8').match(/<title>([^<]+)<\/title>/)?.[1] ?? name;
      return { src: `/games/${slug}/icons/${name}.svg`, label };
    };
    const { html, headings } = renderPage(md, { page: n, pages: pageSet, image, usedIds, fig, icon });
    for (const h of headings) if (h.level === 2) toc.push({ id: h.id, title: h.title, page: n });
    if (!cites) return { n, html };
    try {
      return { n, html: attachCitations(html, n, cites[String(n)]) };
    } catch (e) {
      fail(`${slug}/citations.json`, (e as Error).message);
    }
  });
  if (cites) {
    const missing = citedIds(cites).filter((id) => !usedIds.has(id));
    if (missing.length) fail(`${slug}/citations.json`, `no heading with id ${missing.join(', ')}`);
    const extra = Object.keys(cites).filter((k) => !pageSet.has(Number(k)));
    if (extra.length) fail(`${slug}/citations.json`, `lists pages the rulebook doesn't have: ${extra.join(', ')}`);
  }
  return { pages, toc, images };
}

export function getGuide(slug: string): Guide | null {
  const entry = load().get(slug);
  if (!entry || !entry.hasGuide) return null;
  const fragment = fs.readFileSync(path.join(CONTENT, slug, 'guide.html'), 'utf8');
  return prepareGuide(fragment, slug, new Set(entry.pages));
}
