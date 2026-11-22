import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGame, getGames, getRulebook } from '@/lib/games';
import { inline } from '@/lib/markdown';
import { BackLink } from '@/components/BackLink';
import { BackIcon, CloseIcon, DownIcon, ForwardIcon, MenuIcon, SearchIcon, UpIcon } from '@/components/Icons';
import { RulebookReader } from '@/components/RulebookReader';
import { Facts } from '@/components/Facts';
import { gameFacts } from '@/lib/facts';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGame((await params).slug);
  return { title: game ? `${game.name} rulebook` : 'Not found' };
}

export default async function RulebookPage({ params }: Props) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  const book = getRulebook(slug);
  const pageCount = `${book.pages.length} ${book.pages.length === 1 ? 'page' : 'pages'}`;
  const accent = game.accent ? ({ '--accent': game.accent } as React.CSSProperties) : undefined;
  // Number every cropped diagram through the book, like the plates in a field guide.
  let plate = 0;
  const pages = book.pages.map((p) => ({
    ...p,
    html: p.html.replace(/<figure class="crop"([^>]*)>([\s\S]*?)<\/figure>/g, (_m, attrs: string, inner: string) => {
      const label = `<span class="plate">Plate ${++plate}</span>`;
      const body = inner.includes('<figcaption>') ? inner.replace('<figcaption>', `<figcaption>${label} `) : `${inner}<figcaption>${label}</figcaption>`;
      return `<figure class="crop"${attrs}>${body}</figure>`;
    })
  }));

  return (
    <div data-accent={accent ? '' : undefined} style={accent}>
      <header className="bar">
        <div className="wrap">
          <div className="titlerow">
            <BackLink />
            <h1>{game.name} <span>Rulebook</span></h1>
            {game.hasGuide && <Link className="btn" href={`/${slug}/guide`}>Quick guide</Link>}
            <button className="btn icon swap search-btn" id="searchBtn" type="button" aria-expanded="false" aria-controls="searchArea" aria-label="Search the rules">
              <SearchIcon />
            </button>
            <button className="btn icon swap toc-btn" id="tocBtn" type="button" aria-expanded="false" aria-controls="toc" aria-label="Contents">
              <span className="when-closed"><MenuIcon /></span><span className="when-open"><CloseIcon /></span>
            </button>
          </div>
          <Facts {...gameFacts(game)} className="facts head" />
          <div className="searcharea" id="searchArea">
          <div className="searchrow">
            <div className="sbox">
              <SearchIcon />
              <input id="q" type="search" placeholder="Search the rules" autoComplete="off" spellCheck={false} aria-label={`Search the ${game.name} rulebook`} />
              <button className="clear" id="clear" type="button" aria-label="Clear search" hidden>×</button>
            </div>
            <button className="btn icon" id="prev" type="button" aria-label="Previous match" disabled><UpIcon /></button>
            <button className="btn icon" id="next" type="button" aria-label="Next match" disabled><DownIcon /></button>
          </div>
          <div className="meta">
            <span className="count" id="count" aria-live="polite" data-idle={pageCount}>{pageCount}</span>
          </div>
          </div>
        </div>
      </header>

      <div className="wrap layout">
        <nav className="toc" id="toc" aria-label="Contents">
          <h2>Contents</h2>
          <ul>
            {book.toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>
                  <span className="tt">{t.title}</span>
                  <span className="pg">{t.page}</span>
                  <span className="hits" hidden />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="book" id="main">
          {game.hasGuide && (
            <p className="intro">
              <strong>New to the game?</strong> Start with the <Link href={`/${slug}/guide`}>quick guide</Link>.
            </p>
          )}
          {pages.map((p) => (
            <section key={p.n} className="page" id={`p${String(p.n).padStart(2, '0')}`} data-page={p.n}>
              <div className="pno"><span>Page {p.n}</span></div>
              <div className="pbody" dangerouslySetInnerHTML={{ __html: p.html }} />
            </section>
          ))}
          <div className="empty" id="empty" role="status">
            <p>Nothing in this rulebook matches <b id="emptyQ" />.</p>
            <p id="emptyTry" hidden>Try <button className="btn" id="emptyBtn" type="button" /></p>
            <p className="hint">Single words work best, like a card or action name.</p>
          </div>
          {game.rulebook.intro?.length ? (
            <footer className="about" aria-label="About this rulebook">
              <h2>About this rulebook</h2>
              {game.rulebook.intro.map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: inline(line) }} />)}
            </footer>
          ) : null}
        </main>
      </div>

      <nav className="edge" id="edge" aria-label="Pages">
        {book.pages.map((p) => {
          const id = `p${String(p.n).padStart(2, '0')}`;
          const title = book.toc.find((t) => t.page === p.n)?.title;
          return <a key={id} href={`#${id}`} title={title ? `Page ${p.n}: ${title}` : `Page ${p.n}`}>{p.n}</a>;
        })}
      </nav>

      <dialog className="lb" id="lb" aria-label="Rulebook page">
        <div className="lbbar">
          <button className="btn" id="lbPrev" type="button" aria-label="Previous page"><BackIcon /></button>
          <button className="btn" id="lbNext" type="button" aria-label="Next page"><ForwardIcon /></button>
          <span id="lbTitle" />
          <button className="btn" id="lbZoom" type="button" aria-pressed="false">Zoom</button>
          <button className="btn" id="lbClose" type="button">Close</button>
        </div>
        <div className="lbin" id="lbIn">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img id="lbImg" alt="" />
        </div>
      </dialog>

      <dialog className="cite" id="cite" aria-labelledby="citeTitle">
        <div className="sheet" id="citeSheet">
          <div className="citebar" id="citeBar">
            <span className="grab" aria-hidden="true" />
            <button className="btn icon" id="citeBack" type="button" aria-label="Back" hidden><BackIcon /></button>
            <span className="ctab" id="citePage" />
            <a className="btn" id="citeGo" href="#">Go to page</a>
            <button className="btn icon" id="citeClose" type="button" aria-label="Close"><CloseIcon /></button>
          </div>
          <div className="citebody" id="citeBody" />
        </div>
      </dialog>

      <RulebookReader slug={slug} images={book.images} />
    </div>
  );
}
