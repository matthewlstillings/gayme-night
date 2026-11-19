# gayme night design system

Dark only. Two faces on one base:

- **Field Guide** for rulebooks and the hub: a pocket field guide read by flashlight. Ink-navy pages, numbered plates beside the text, a thumb index down the right edge.
- **Player Aid** for quick guides: the card you keep beside the board. Open sections on the page, each headed by a flat band in a calmer version of the game's colour.

Each game brings its own colour through `--accent` (set in `content/games/*/game.json`). It fills tabs, bands, plate labels and primary buttons, always with dark ink on top.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0f1420` | Page ground |
| `--panel` | `#151c2b` | Hub entries, plate mounts, quick guide cards, open contents panel |
| `--surface` | `#1b2436` | Buttons, idle thumb tabs |
| `--surface-alt` | `#0b101a` | Search fields, inset boxes |
| `--line` / `--line-strong` | `#253049` / `#4a577a` | Hairlines and borders / control borders |
| `--ink` / `--ink2` / `--muted` | `#eef0f5` / `#c6ccd9` / `#959fb4` | Text, secondary text, labels |
| `--accent` | `#e9b44c` site default, game's colour on game pages | Tabs, bands, plate labels, primary buttons |
| `--accent-ink` | `#0b0e14` | Text set on the accent |
| `--accent-soft`, `--xref`, `--mark`, `--focus` | mixed from `--accent` | Tinted boxes, links, search matches, focus ring |
| `--note-line` / `--warn-line` / `--ok` | `#6fb7d6` / `#e8c650` / `#6cc0a2` | Notes and Event phase / warnings / player tips |

Tokens mixed from the accent are declared on `:root` and again on `[data-accent]`, so setting `--accent` on a wrapper recolours everything inside it.

## Type

- **Literata** (`--serif`): rulebook reading text 17px / 1.68 in a 42rem column, headings, game names, hub descriptions.
- **Atkinson Hyperlegible** (`--ui`): controls, callouts, quick guide body (17px).
- **Barlow Condensed** (`--cond`): page tabs, plate labels, band headings, numerals. Uppercase with 0.08 to 0.16em tracking.

## Field Guide parts

- **Running head**: each rulebook page opens with a filled "PAGE n" tab and a hairline across the column. Pages flow on the ground, no boxes.
- **Plates**: every cropped diagram is numbered through the book ("PLATE 12") and sits on a raised mount. Images are dimmed to 0.82 until hovered or focused.
- **Thumb index** (`nav.edge`, 1000px and up): one tab per page fixed to the right edge; the page you are reading is filled with the accent; pages with no search hits fade.
- **Hub entry**: panel with a hanging index tab in the game's colour (first letter), serif name, small-caps publisher line, player and time chips, Rulebook and Quick guide buttons. Quick guide is filled with the accent. One grid, no title, no letter groups, no logos.

## Player Aid parts

- **Sections**: open on the ground, no panel around them. The only boxes are `.win`, `.phase` and `.call`, never nested in another box.
- **Band**: heading first (28px condensed caps), then a small line with the section's label and its rulebook pages. Edge to edge on phones, a 4px-radius strip from 700px. A small dark square (19px numeral) holds the section number from a CSS counter, so the heading stays the biggest thing.
- **Band colour** (`--band`): the game's accent at one fixed lightness (OKLCH L 0.70, `lib/color.ts`), set on the page by the guide route. Bright accents stop glaring in a dim room and every band carries dark ink at 6.5:1 or better. Small accents (steps, tags, chips) keep `--accent`.
- **Summary** (`.tldr`): bold 18px lead text, not a box.
- **Section list**: numbered like the bands and named by their headings. 1000px and up: a sticky column left of the guide, styled like the rulebook contents. Phones: a button fixed at the bottom of the screen naming the current section ("3 · Your turn · of 9"); it opens the list as a sheet above it.
- **Section order**: How to win first, Setup straight after it where a game has one, variants, FAQ and tips last. Everything in between is the game's own. A test checks every guide.
- **Steps**: solid accent squares with condensed numerals. Event phases use `--note-line`.

## Shape and touch

- Radii: 4px controls, hub entries and plates; 4px quick guide bands; 3 to 6px chips. No coloured side stripes.
- Buttons 38px tall, 44px on touch screens. Search fields 44px.
- Mobile: contents behind the hamburger, search hidden until its icon is tapped.
