import { ClockIcon, PlayersIcon } from './Icons';

/** Player count and game length, side by side. Renders nothing if neither is known. */
export function Facts({ players, time, className = 'facts' }: { players?: string; time?: string; className?: string }) {
  if (!players && !time) return null;
  return (
    <div className={className}>
      {players && <span><PlayersIcon />{players}</span>}
      {time && <span><ClockIcon />{time}</span>}
    </div>
  );
}
