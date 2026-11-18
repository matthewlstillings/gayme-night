# gayme night design system

Dark only. Two faces on one base:

- **Field Guide** for rulebooks and the hub: a pocket field guide read by flashlight. Ink-navy pages, numbered plates beside the text, a thumb index down the right edge.
- **Player Aid** for quick guides: the card you keep beside the board. Full bands in the game's colour with big condensed numerals.

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

- **Band**: each section's kicker and heading sit on a full-width accent band; a dark square holds the section number from a CSS counter.
- **Steps**: solid accent squares with condensed numerals. Event phases use `--note-line`.

## Shape and touch

- Radii: 4px controls, hub entries and plates; 10px quick guide cards; 3 to 6px chips. No coloured side stripes.
- Buttons 38px tall, 44px on touch screens. Search fields 44px.
- Mobile: contents behind the hamburger, search hidden until its icon is tapped.
