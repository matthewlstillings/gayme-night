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
