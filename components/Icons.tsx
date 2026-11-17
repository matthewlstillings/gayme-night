const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const SearchIcon = () => (
  <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const BackIcon = () => (
  <svg {...base}><path d="M15 18l-6-6 6-6" /></svg>
);
export const UpIcon = () => (
  <svg {...base}><path d="M18 15l-6-6-6 6" /></svg>
);
export const DownIcon = () => (
  <svg {...base}><path d="M6 9l6 6 6-6" /></svg>
);
export const ForwardIcon = () => (
  <svg {...base}><path d="M9 18l6-6-6-6" /></svg>
);
export const PlayersIcon = () => (
  <svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" /><path d="M18 14.8c2 .6 3.2 2.4 3.5 5.2" /></svg>
);
export const ClockIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const MenuIcon = () => (
  <svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = () => (
  <svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
