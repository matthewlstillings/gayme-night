import type { Game } from './types';

const span = ([a, b]: [number, number]) => (a === b ? String(a) : `${a}–${b}`);

/** "1–5 players" and "40–70 min", for the hub tiles and the top of each rulebook. */
export function gameFacts(g: Pick<Game, 'players' | 'minutes'>): { players?: string; time?: string } {
  return {
    players: g.players ? `${span(g.players)} ${g.players[1] === 1 ? 'player' : 'players'}` : undefined,
    time: g.minutes ? `${span(g.minutes)} min` : undefined
  };
}
