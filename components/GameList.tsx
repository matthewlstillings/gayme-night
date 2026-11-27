'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SearchIcon } from './Icons';
import { Facts } from './Facts';
import type { VideoGuide } from '@/lib/videoGuides';

export type ListGame = {
  slug: string;
  name: string;
  aliases: string[];
  publisher?: string;
  year?: number;
  description: string;
  accent?: string;
  hasGuide: boolean;
  pageCount: number;
  players?: string;
  time?: string;
};

/** Lowercase, no accents, no punctuation, so "nemesis lockdown" finds "Nemesis: Lockdown". */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function GameList({ games, guides = [] }: { games: ListGame[]; guides?: VideoGuide[] }) {
  const [q, setQ] = useState('');
  const index = useMemo(
    () => games.map((g) => ({ g, text: norm([g.name, ...g.aliases, g.publisher ?? '', String(g.year ?? ''), g.description].join(' ')) })),
    [games]
  );
  const terms = norm(q).split(' ').filter(Boolean);
  const shown = terms.length ? index.filter(({ text }) => terms.every((t) => text.includes(t))).map(({ g }) => g) : games;
  const guideIndex = useMemo(
    () => guides.map((v) => ({ v, text: norm([v.name, ...v.aliases, 'video game', v.description].join(' ')) })),
    [guides]
  );
  const shownGuides = terms.length ? guideIndex.filter(({ text }) => terms.every((t) => text.includes(t))).map(({ v }) => v) : guides;


  const total = games.length;
  return (
    <>
      <div className="home-search">
        <div className="wrap">
          <div className="sbox">
            <SearchIcon />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }}
              placeholder="Search games"
              aria-label="Search games"
              autoComplete="off"
              spellCheck={false}
            />
            {q && (
              <button className="clear" type="button" aria-label="Clear search" onClick={() => setQ('')}>
                ×
              </button>
            )}
          </div>
          <div className="meta" aria-live="polite">
            {terms.length ? (
              <>
                <b>{shown.length}</b> of {total} {total === 1 ? 'game' : 'games'}
                {shownGuides.length > 0 && <> · <b>{shownGuides.length}</b> video game {shownGuides.length === 1 ? 'guide' : 'guides'}</>}
              </>
            ) : (
              <><b>{total}</b> {total === 1 ? 'game' : 'games'}, A to Z</>
            )}
          </div>
        </div>
      </div>

      <main id="main" className="wrap hub">
        {shown.length > 0 && (
          <ul className="games">
            {shown.map((g) => (
              <li className="game" key={g.slug} data-accent={g.accent ? '' : undefined} style={g.accent ? ({ '--accent': g.accent } as React.CSSProperties) : undefined}>
                <span className="tab" aria-hidden="true">{g.name.replace(/^the\s+/i, '').charAt(0)}</span>
                <h2><Link href={`/${g.slug}`}>{g.name}</Link></h2>
                <div className="by">{[g.publisher, g.year, `${g.pageCount} rulebook pages`].filter(Boolean).join(' · ')}</div>
                <Facts players={g.players} time={g.time} />
                <p>{g.description}</p>
                <div className="links">
                  <Link className="btn" href={`/${g.slug}`} tabIndex={-1} aria-hidden="true">Rulebook</Link>
                  {g.hasGuide && <Link className="btn aid" href={`/${g.slug}/guide`}>Quick guide</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {shownGuides.length > 0 && (
          <section className="shelf" aria-labelledby="video-guides">
            <h2 id="video-guides" className="shelf-title">Video game tips and guides</h2>
            <ul className="games">
              {shownGuides.map((v) => (
                <li className="game" key={v.slug} data-accent="" style={{ '--accent': v.accent } as React.CSSProperties}>
                  <span className="tab" aria-hidden="true">{v.name.charAt(0)}</span>
                  <h3><a href={v.href}>{v.name}</a></h3>
                  <div className="by">Video game guide</div>
                  <p>{v.description}</p>
                  <div className="links">
                    <a className="btn aid" href={v.href} tabIndex={-1} aria-hidden="true">Open guide</a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!shown.length && !shownGuides.length && (
          <p className="empty">
            {total ? <>No game names or descriptions match <b>{q.trim()}</b>. To look up a rule, open a game and search its rulebook.</> : 'No games yet.'}
          </p>
        )}
      </main>
    </>
  );
}
