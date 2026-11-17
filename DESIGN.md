# gayme night design system

Meridian Base, dark only. The tone is a late game night: neon pink on deep plum. Each game can bring its own accent color, which tints its card on the home page, its rulebook and its quick guide.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0e0b14` | Page background |
| `--panel` | `#17121f` | Cards, header bar |
| `--surface` | `#1f1929` | Buttons |
| `--surface-alt` | `#130f1a` | Search fields, inset boxes |
| `--line` | `#2e2640` | Card borders, rules |
| `--line-strong` | `#6b6080` | Button and field borders |
| `--ink` / `--ink2` / `--muted` | `#f3eff8` / `#cdc5da` / `#a69db6` | Text, secondary text, labels |
| `--accent` | `#ef7fc0` (site), game's `accent` on game pages | Highlights, page labels, primary buttons |
| `--accent-soft`, `--xref`, `--mark`, `--focus` | mixed from `--accent` | Tinted boxes, links, search matches, focus ring |
| `--note` / `--note-line` | `#161f27` / `#67b3d9` | Note callouts, Event phase |
| `--warn` / `--warn-line` | `#2c240e` / `#f2d94a` | Warning callouts |
| `--ok` | `#69bca1` | Player tips |

Tokens mixed from the accent are declared on `:root` and again on `[data-accent]`, so setting `--accent` on a wrapper with `data-accent` recolors everything inside it.

## Type

- **Inter** only. Labels are 11 to 12px uppercase with 0.12 to 0.14em tracking.
- Home wordmark `clamp(40px, 9vw, 72px)`, weight 700. Page headings 24 to 26px, weight 600. Body 16px, line-height 1.6.

## Shape

- Radii: 8px cards, 6px buttons, fields and callouts, 4px small chips. No colored side stripes.
- Buttons are at least 38px tall (44px for search fields).
- Grids: `auto-fill, minmax(min(100%, 340px), 1fr)` for game cards.
