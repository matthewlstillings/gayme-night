import type { Guide, GuideSection } from './types';

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/**
 * Prepares a quick guide fragment: lists its sections for the jump menu, and turns
 * "p. 12" and "p. 10–12" in the text into links to that page of the game's rulebook.
 */
export function prepareGuide(fragment: string, slug: string, pages: Set<number>): Guide {
  const sections: GuideSection[] = [];
  const re = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  for (const m of fragment.matchAll(re)) {
    const open = m[0].slice(0, m[0].indexOf('>') + 1);
    const label = open.match(/\bdata-label="([^"]*)"/)?.[1] ?? m[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]?.replace(/<[^>]+>/g, '') ?? m[1];
    sections.push({ id: m[1], label: decode(label).trim() });
  }
  // Only touch text between tags, never attributes.
  const html = fragment.replace(/>([^<]+)</g, (_m, text: string) =>
    '>' +
    text.replace(/\bp\. (\d{1,3})((?:\s*[–-]\s*\d{1,3})?)/g, (whole, a: string, rest: string) => {
      const n = Number(a);
      if (!pages.has(n)) return whole;
      return `<a class="xref" href="/${slug}#p${String(n).padStart(2, '0')}">${whole}</a>`;
    }) +
    '<'
  );
  return { html, sections };
}
