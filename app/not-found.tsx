import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="wrap lost">
      <h1>That game isn&apos;t on the shelf.</h1>
      <p>It may not have been added yet.</p>
      <p><Link className="btn" href="/">See all games</Link></p>
    </main>
  );
}
