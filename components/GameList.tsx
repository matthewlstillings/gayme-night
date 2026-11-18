'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SearchIcon } from './Icons';
import { Facts } from './Facts';

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

export function GameList({ games }: { games: ListGame[] }) {
  const [q, setQ] = useState('');
  const index = useMemo(
    () => games.map((g) => ({ g, text: norm([g.name, ...g.aliases, g.publisher ?? '', String(g.year ?? ''), g.description].join(' ')) })),
    [games]
  );
  const terms = norm(q).split(' ').filter(Boolean);
  const shown = terms.length ? index.filter(({ text }) => terms.every((t) => text.includes(t))).map(({ g }) => g) : games;


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
              <><b>{shown.length}</b> of {total} {total === 1 ? 'game' : 'games'}</>
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
        {!shown.length && (
          <p className="empty">
            {total ? <>No game names or descriptions match <b>{q.trim()}</b>. To look up a rule, open a game and search its rulebook.</> : 'No games yet.'}
          </p>
        )}
      </main>
    </>
  );
}
