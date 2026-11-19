# gayme night.

A public, read-only hub of board game rulebooks and quick guides. There are no logins and no forms. Games are added by committing files to this repo, and Vercel redeploys on every push to `main`.

- **Stack:** Next.js (App Router, fully static pages), no database, no environment variables.
- **Hosting:** Vercel. Search engines are told not to index it.
- **Design:** see [DESIGN.md](DESIGN.md).

## Pages

- **`/`** lists every game A to Z in one grid, with a search box (name, other names, publisher, year, description).
- **`/<slug>`** is the game's rulebook: full text you can search, a contents list, and the printed page images.
- **`/<slug>/guide`** is the quick guide, when the game has one. The rulebook links to it.

## Adding a game

Each game is one folder, `content/games/<slug>/`. The folder name must match `slug`. The build checks every game and fails with a plain message if something is off.

```
content/games/<slug>/
  game.json          required
  rules/02.md        one file per rulebook page, named by page number
  rules/03.md
  guide.html         optional quick guide
public/games/<slug>/pages/p02.webp   optional page images, same numbers
```

### game.json

```json
{
  "slug": "nemesis-lockdown",
  "name": "Nemesis: Lockdown",
  "aliases": ["Nemesis Lockdown", "Lockdown"],
  "publisher": "Awaken Realms",
  "year": 2022,
  "players": [1, 5],
  "minutes": [90, 180],
  "description": "Semi-co-op survival horror in a Martian lab overrun by Night Stalkers, with the power failing.",
  "accent": "#f5a32f",
  "added": "2026-11-17T19:30:00Z",
  "rulebook": {
    "intro": [
      "**Built from the official rulebook PDF**: [Rules.pdf](https://example.com/rules.pdf).",
      "%Unofficial% Fan summary: [summary.pdf](https://example.com/summary.pdf)."
    ]
  }
}
```

- **description:** one short line, 140 characters max, in our own words.
- **players** and **minutes:** `[min, max]` from the publisher's box or game page. They show as chips on the game's tile and at the top of its rulebook. Use the same number twice for one figure, like `[90, 90]`.
- **aliases:** other names people might search for.
- **accent:** a light, saturated color that reads on a near-black page. It tints the game's card, rulebook and guide. Leave it out to use the site pink.
- **rulebook.intro:** lines shown above the rulebook. They support `**bold**`, `[links](https://…)` and a `%Badge%`.

### Rulebook pages (`rules/NN.md`)

One file per printed page, so page numbers in the site match the book. Leave out pages with nothing useful (cover, credits). The syntax:

- `## Heading` starts a section and adds it to the contents list. `###` and `####` are smaller headings.
- `> NOTE: …` and `> CHANGE: …` are callouts. `> **Remember:** …` is a highlighted box. Any other `>` line is flavor text.
- `- item` and `1. item` are lists. Indent a line to continue the item; indent `- ` for a sub-list.
- `*text*` is italic, and a paragraph that is all italic is shown as an aside (picture captions, examples).
- `[[page]]` places the page image. Without it, the image goes after the page's first heading.
- `[[fig name | caption]]` on its own line shows `public/games/<slug>/figs/<name>.webp` as a diagram beside the text.
- `[[icon name]]` inside any text shows `public/games/<slug>/icons/<name>.svg` inline at text size. The SVG's `<title>` becomes its alt text.
- "page 12" and "pages 10 and 12" link to those pages automatically.
- Describe icons in words (dice faces, symbols), since the text is what gets searched.

### Page images

`public/games/<slug>/pages/pNN.webp`, about 1200px wide. Each one shows as a "tap to enlarge" thumbnail on its page.

### Quick guide (`guide.html`)

An HTML fragment that uses the site's guide classes. Each `<section class="card" id="…">` becomes a numbered entry in the section list, named by its `<h2>`. Start every section with a `.kicker` (a short label and a `.ref` with the rulebook pages) followed by the `<h2>`; the site turns the pair into the section's band. Text like `p. 12`, `p. 10–12` or `p. 4, 6–9` links each page to the rulebook automatically.

Keep shared sections in order: `win` first, `setup` straight after it if the game has setup steps, and `variants`, `faq` and `tips` last. `npm test` checks this for every guide.

Building blocks: `.intro`, `.kicker` (with `.ref` for the rulebook pages), `.tldr`, `.win`, `.phase` / `.phase.ev` with `ol.steps`, `.table-scroll > table` (with `td.c` and `.when`), `.call.warn`, `.call.cool`, `ul.tips` / `.tips.faq` / `.tips.comm`, `.badge`, `.src` and `footer`. See `content/games/nemesis-lockdown/guide.html` for a full example.

`.phase.ev` (blue) is only for steps the game runs by itself between turns, like round end, production or the event phase. A player's turn or role uses plain `.phase`. Write labels like `<b class="t">Tiebreak</b>Most food wins` with no space: the build adds a pause there that only screen readers hear.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # fails if any game file is invalid
npm test         # rulebook and guide rendering
```
