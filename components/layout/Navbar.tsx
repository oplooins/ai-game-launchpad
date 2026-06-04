import Link from "next/link";

export function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/">AI Game LaunchPad</Link>
        <div className="nav-links">
          <Link href="/studio">Studio</Link>
          <Link href="/games">Games</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/games">My Games</Link>
          <Link href="/dashboard/review">Review Queue</Link>
          <Link href="/pricing">Pricing</Link>
          <Link className="btn btn-primary" href="/studio">Run Workflow</Link>
        </div>
      </div>
    </nav>
  );
}
