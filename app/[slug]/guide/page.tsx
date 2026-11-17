import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGame, getGames, getGuide } from '@/lib/games';
import { BackLink } from '@/components/BackLink';
import { GuideJump } from '@/components/GuideJump';

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
  const accent = game.accent ? ({ '--accent': game.accent } as React.CSSProperties) : undefined;

  return (
    <div className="guide" data-accent={accent ? '' : undefined} style={accent}>
      <header className="bar">
        <div className="wrap narrow">
          <div className="titlerow">
            <BackLink />
            <h1>{game.name} <span>Quick guide</span></h1>
            <Link className="btn" href={`/${slug}`}>Full rulebook</Link>
          </div>
          <GuideJump sections={guide.sections} />
        </div>
      </header>
      <main id="main" className="wrap narrow" dangerouslySetInnerHTML={{ __html: guide.html }} />
    </div>
  );
}
