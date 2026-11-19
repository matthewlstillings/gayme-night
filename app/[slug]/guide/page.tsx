import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGame, getGames, getGuide } from '@/lib/games';
import { bandColor } from '@/lib/color';
import { BackLink } from '@/components/BackLink';
import { GuideNav } from '@/components/GuideNav';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getGames().filter((g) => g.hasGuide).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGame((await params).slug);
  return { title: game ? `${game.name} quick guide` : 'Not found' };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const game = getGame(slug);
  const guide = game && getGuide(slug);
  if (!game || !guide) notFound();
  // Bands use a calmer version of the game's colour, the same lightness for every game.
  const colours = game.accent
    ? ({ '--accent': game.accent, '--band': bandColor(game.accent) } as React.CSSProperties)
    : undefined;

  return (
    <div className="guide" data-accent={colours ? '' : undefined} style={colours}>
      <header className="bar">
        <div className="wrap">
          <div className="titlerow">
            <BackLink />
            <h1>{game.name} <span>Quick guide</span></h1>
            <Link className="btn" href={`/${slug}`}>Full rulebook</Link>
          </div>
        </div>
      </header>
      <div className="wrap glayout">
        <GuideNav sections={guide.sections} />
        <main id="main" dangerouslySetInnerHTML={{ __html: guide.html }} />
      </div>
    </div>
  );
}
