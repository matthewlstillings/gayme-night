import type { Guide, GuideSection } from './types';

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const strip = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** One page number or range, e.g. "5" or "9–10". */
const ITEM = String.raw`\d{1,3}(?:\s*[–-]\s*\d{1,3})?`;
/** "p. 5", "p. 9–10", or a list such as "p. 1, 5" and "p. 4, 6–9". */
const PAGE_REF = new RegExp(String.raw`\bp\. (${ITEM}(?:, ${ITEM})*)`, 'g');

/** Turns every page number in a reference into a link to that page of the rulebook. Pages that don't exist stay plain. */
export function linkPages(text: string, slug: string, pages: Set<number>): string {
  return text.replace(PAGE_REF, (_whole, list: string) =>
    list
      .split(', ')
      .map((item, i) => {
        const n = Number(item.match(/^\d+/)![0]);
        const label = i === 0 ? `p. ${item}` : item;
        if (!pages.has(n)) return label;
        return `<a class="xref" href="/${slug}#p${String(n).padStart(2, '0')}">${label}</a>`;
      })
      .join(', ')
  );
}

/**
 * The guide files open each section with a small label line and then the heading:
 *   <div class="kicker"><span>Option A</span><span class="ref">Rulebook p. 4–5</span></div><h2>Play a fish</h2>
 * This sets them as one band instead: the heading first, then the label and the rulebook pages on a line under it.
 */
function toBand(fragment: string): string {
  return fragment.replace(
    /<div class="kicker"><span>([^<]*)<\/span><span class="ref">([^<]*)<\/span><\/div>\s*<h2>([\s\S]*?)<\/h2>/g,
    (_m, label: string, ref: string, heading: string) =>
      `<header class="band"><h2>${heading}</h2><p class="sub"><span>${label}</span>${SR(', ')}<span class="ref">${ref}</span></p></header>`
  );
}

const SR = (text: string) => `<span class="sr-only">${text}</span>`;

/** Punctuation a screen reader should hear after a label, unless the label already ends with some. */
const after = (label: string, mark: string) => (/[?!.:]\s*$/.test(strip(label)) ? ' ' : mark);

/**
 * The guides set a label and the text it introduces as separate pieces with no space between them, for example
 * <b class="t">Tiebreak</b>Most unused food or <b>Keep up to 5 birds</b><span class="d">For each bird...</span>.
 * They look separate on screen, but a screen reader runs them into one word ("TiebreakMost"). This adds a pause
 * that only screen readers hear. What sighted readers see doesn't change.
 */
export function separateLabels(html: string): string {
  return (
    html
      // Step numbers: "1" then the step.
      .replace(/(<span class="n">[^<]*<\/span>)(?=<span>)/g, `$1${SR('. ')}`)
      // A step's title then its description.
      .replace(/<b>([^<]*)<\/b>(?=<span class="d">)/g, (_m, t: string) => `<b>${t}</b>${SR(after(t, '. '))}`)
      // A table cell's name then its small note.
      .replace(/<\/b>(?=<span class="when">)/g, `</b>${SR(', ')}`)
      // Callout and summary labels running straight into text.
      .replace(/<b( class="t")?>([^<]*)<\/b>(?=[^\s<])/g, (_m, cls: string | undefined, t: string) => `<b${cls ?? ''}>${t}</b>${SR(after(t, ': '))}`)
  );
}

/**
 * Prepares a quick guide fragment: lists its sections (named by their headings) for the section menu, sets each
 * section's opening as a band, and turns "p. 12", "p. 10–12" and "p. 1, 5" into links to the game's rulebook.
 */
export function prepareGuide(fragment: string, slug: string, pages: Set<number>): Guide {
  const sections: GuideSection[] = [];
  const re = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  for (const m of fragment.matchAll(re)) {
    const heading = m[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
    sections.push({ id: m[1], label: heading ? strip(heading) : m[1] });
  }
  // Only touch text between tags, never attributes.
  const linked = toBand(fragment).replace(/>([^<]+)</g, (_m, text: string) => '>' + linkPages(text, slug, pages) + '<');
  const html = separateLabels(linked);
  return { html, sections };
}

/**
 * Sections that several games share keep the same order wherever a game has them: How to win first, Setup straight
 * after it, and the reference sections (variants, FAQ, tips) at the very end. Every other section is the game's own.
 * Returns the problems found; empty when the order is fine.
 */
export function checkSectionOrder(ids: string[]): string[] {
  const problems: string[] = [];
  if (ids[0] !== 'win') problems.push(`"win" should be the first section, found "${ids[0]}"`);
  const setup = ids.indexOf('setup');
  if (setup !== -1 && setup !== 1) problems.push(`"setup" should come straight after "win", found at position ${setup + 1}`);
  const tail = new Set(['variant', 'variants', 'faq', 'tips']);
  const firstTail = ids.findIndex((id) => tail.has(id));
  if (firstTail !== -1 && ids.slice(firstTail).some((id) => !tail.has(id))) {
    problems.push(`variants, FAQ and tips should be the last sections, found: ${ids.slice(firstTail).join(', ')}`);
  }
  return problems;
}
