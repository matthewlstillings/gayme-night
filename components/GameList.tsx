'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SearchIcon } from './Icons';

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
  letter: string;
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

  const groups: { letter: string; games: ListGame[] }[] = [];
  for (const g of shown) {
    const last = groups[groups.length - 1];
    if (last && last.letter === g.letter) last.games.push(g);
    else groups.push({ letter: g.letter, games: [g] });
  }

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

      <main id="main" className="wrap letters">
        {groups.map((grp) => (
          <section key={grp.letter} aria-labelledby={`l-${grp.letter}`}>
            <h2 className="letter" id={`l-${grp.letter}`}>{grp.letter}</h2>
            <ul className="games">
              {grp.games.map((g) => (
                <li className="game" key={g.slug} data-accent={g.accent ? '' : undefined} style={g.accent ? ({ '--accent': g.accent } as React.CSSProperties) : undefined}>
                  <div className="mono" aria-hidden="true">{g.letter}</div>
                  <div>
                    <h3><Link href={`/${g.slug}`}>{g.name}</Link></h3>
                    <div className="by">{[g.publisher, g.year, `${g.pageCount} rulebook pages`].filter(Boolean).join(' · ')}</div>
                    <p>{g.description}</p>
                    <div className="links">
                      <Link className="btn" href={`/${g.slug}`} tabIndex={-1} aria-hidden="true">Rulebook</Link>
                      {g.hasGuide && <Link className="btn" href={`/${g.slug}/guide`}>Quick guide</Link>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!shown.length && (
          <p className="empty">
            {total ? <>No games match <b>{q.trim()}</b>.</> : 'No games yet.'}
          </p>
        )}
      </main>
    </>
  );
}
