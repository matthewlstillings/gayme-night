import { getGames } from '@/lib/games';
import { GameList, type ListGame } from '@/components/GameList';

function letterOf(name: string): string {
  const c = name.replace(/^(the|a|an)\s+/i, '').normalize('NFD').charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

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
    letter: letterOf(g.name)
  }));
  return (
    <>
      <h1 className="sr-only">gayme night.</h1>
      <GameList games={games} />
    </>
  );
}
