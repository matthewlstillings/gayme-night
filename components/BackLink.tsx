import Link from 'next/link';
import { BackIcon } from './Icons';

export function BackLink() {
  return (
    <Link className="btn icon" href="/" aria-label="All games" title="All games">
      <BackIcon />
    </Link>
  );
}
