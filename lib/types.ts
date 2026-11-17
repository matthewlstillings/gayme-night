export type Game = {
  slug: string;
  name: string;
  /** Other names people search for, e.g. "Lockdown". */
  aliases?: string[];
  publisher?: string;
  year?: number;
  /** One short line for the home page, 140 characters max. */
  description: string;
  /** A light, saturated color that reads on a near-black page. Tints the game's pages. */
  accent?: string;
  /** When the game was added, as an ISO date and time. */
  added?: string;
  rulebook: {
    /** Lines shown above the rulebook. Supports **bold**, [links](https://…) and a %Badge%. */
    intro?: string[];
  };
};

export type TocEntry = { id: string; title: string; page: number };

export type RulebookPage = { n: number; html: string };

export type Rulebook = {
  pages: RulebookPage[];
  toc: TocEntry[];
  /** Page numbers that have a page image. */
  images: number[];
};

export type GuideSection = { id: string; label: string };

export type Guide = { html: string; sections: GuideSection[] };

export type GameSummary = Game & { hasGuide: boolean; pageCount: number };
