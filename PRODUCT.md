# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Matthew and the friends he plays with on game nights. In his words: "We play fairly complex board games that don't always have a clear answer to things in the rule books." The main job is looking up a rule mid-game, usually on a phone at the table. The second job is a new player learning a game before or at the start of a session (the quick guides).

## Product Purpose

A hub of official rulebooks for the games the group owns, each turned into a searchable web page with its diagrams placed beside the text, plus a short quick guide per game. Success is finding the exact rule fast enough that the game doesn't stall.

## Positioning

Every book is the publisher's official rulebook, rebuilt so it can be searched and read on a phone, with the original pages one tap away. No other site gathers this group's shelf in one place.

## Operating Context

- Used at the game table, often on phones, often in a dim room (inferred from use, not stated).
- Matthew adds games himself by asking for them ("I will have you add new games myself").
- Live at gayme-night.junk-drawer.dev, Next.js on Vercel.

## Capabilities and Constraints

- Hub: one alphabetized, searchable grid of games. No big title, subtitle or hub icon. No letter groups. Each tile shows players and average play time and links to the rulebook and quick guide.
- Rulebook page: full transcribed rules, page images and cropped diagrams beside their text, search with next/previous matches, contents. On mobile, contents sit behind a hamburger and search stays hidden until tapped.
- Every game has a quick guide. Players and play time also sit at the top of each rulebook.
- Rulebooks come only from the creators' official sources; if none can be found, tell Matthew.
- Betrayal at House on the Hill: haunt and hidden-role books stay off the site, so players stay ignorant of the villain's goal.
- No game logos or box icons for now ("No dont do that").
- No credits or author's notes from the books; a short art credit per game is the exception.
- Dark mode by default (his standing preference for every build).

## Brand Commitments

- The name is "gayme night." (lowercase, with the period).

## Evidence on Hand

- Official rulebooks and page images for 9 games under content/ and public/.
- Hand-drawn SVG tag icons for Terraforming Mars; cropped diagrams for Nemesis: Lockdown and Wingspan.
- No game logos, box art or photos of the group may be added without asking.

## Product Principles

1. The rule comes first: anything between the reader and the answer is a cost.
2. Official text, faithfully: rebuild the publisher's words, never paraphrase them in the rulebook.
3. Built for the table: one hand, a phone, low light, a game waiting.
4. Spoilers stay hidden where the game depends on secrecy.
