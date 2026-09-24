import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-12">
        <div className="mb-8 flex items-center gap-3">
          <img src="/bulls-logo.svg" alt="Alkaran Bulls" className="h-12 w-12 rounded-xl" />
          <span className="font-display text-2xl font-bold">Alkaran Bulls</span>
        </div>
        <p className="num text-[clamp(4rem,16vw,9rem)] font-extrabold leading-[0.9] text-gold">LIVE</p>
        <p className="mt-2 text-sm text-mist">Every run. Every wicket. Every result.</p>
        <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Follow the tournament as it unfolds.</h1>
        <p className="mt-4 max-w-xl text-mist">
          Watch live scores, check the points table, and revisit the matches and players shaping the Alkaran Bulls season.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/matches" className="btn-primary px-6 py-3 text-base">View matches</Link>
          <Link to="/login" className="btn-ghost px-6 py-3 text-base">Log in</Link>
          <Link to="/register" className="btn-ghost px-6 py-3 text-base">Create account</Link>
        </div>
      </div>
    </div>
  );
}
