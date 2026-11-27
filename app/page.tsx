import { getGames } from '@/lib/games';
import { GameList, type ListGame } from '@/components/GameList';
import { gameFacts } from '@/lib/facts';
import { videoGuides } from '@/lib/videoGuides';

export default function Home() {
  const games: ListGame[] = getGames().map((g) => ({
    slug: g.slug,
    name: g.name,
    aliases: g.aliases ?? [],
    publisher: g.publisher,
    year: g.year,
    description: g.description,
    accent: g.accent,
    hasGuide: g.hasGuide,
    pageCount: g.pageCount,
    ...gameFacts(g)
  }));
  return (
    <>
      <h1 className="sr-only">gayme night.</h1>
      <GameList games={games} guides={videoGuides} />
    </>
  );
}
