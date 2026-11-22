/**
 * Page citations ("see page 21") that open the cited section in a drawer.
 *
 * A game can list every citation in its rulebook in citations.json: for each page, one entry per
 * page link in reading order, naming the heading id of the section it cites. The build fails when
 * the list and the rulebook disagree, so no citation is left without its section.
 */
export type Citation = {
  /** The page number the book prints. */
  to: number;
  /** Heading id of the cited section. A trailing "!" keeps only the text up to the next heading. */
  target: string;
  /** Further sections on the cited page that belong with it. */
  also?: string[];
  /** Shown in the drawer, for a citation whose printed page is wrong. */
  note?: string;
};
export type CitationMap = Record<string, Citation[]>;

const XREF = /<a class="xref" href="#p(\d{2,3})">/g;

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Every page link on a rendered page, in reading order, as the page numbers they point to. */
export function pageLinks(html: string): number[] {
  return [...html.matchAll(XREF)].map((m) => Number(m[1]));
}

/**
 * Adds the cited section to each page link on one rendered page. Throws if the page has a link
 * with no entry, an entry with no link, or an entry whose page differs from the link's.
 */
export function attachCitations(html: string, page: number, list: Citation[] = []): string {
  const links = pageLinks(html);
  if (links.length !== list.length) {
    throw new Error(`Page ${page}: ${links.length} page links but ${list.length} citations listed`);
  }
  let k = 0;
  return html.replace(XREF, (m, to: string) => {
    const c = list[k];
    if (c.to !== Number(to)) throw new Error(`Page ${page}, citation ${k + 1}: links to page ${Number(to)} but is listed as page ${c.to}`);
    k++;
    const also = c.also?.length ? ` data-also="${attr(c.also.join(' '))}"` : '';
    const note = c.note ? ` data-note="${attr(c.note)}"` : '';
    return `${m.slice(0, -1)} data-cite="${attr(c.target)}"${also}${note}>`;
  });
}

/** Every heading id a citation map names, without the "!" marker. */
export function citedIds(map: CitationMap): string[] {
  return Object.values(map).flatMap((l) => l.flatMap((c) => [c.target, ...(c.also ?? [])])).map((id) => id.replace(/!$/, ''));
}
