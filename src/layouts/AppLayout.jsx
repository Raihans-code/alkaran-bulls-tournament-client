import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SeasonSwitcher from '../components/SeasonSwitcher.jsx';
import { Badge } from '../components/ui.jsx';

const USER_NAV = [
  ['/dashboard', 'Dashboard'], ['/auction', 'Auction'], ['/players', 'Players'],
  ['/teams', 'Teams'], ['/matches', 'Matches'], ['/points-table', 'Points'], ['/seasons', 'Seasons'], ['/history', 'History'],
];
const ADMIN_NAV = [
  ['/admin', 'Overview'], ['/admin/seasons', 'Seasons'], ['/admin/teams', 'Teams'], ['/admin/players', 'Players'], ['/admin/auction', 'Auction'],
  ['/admin/matches', 'Matches'], ['/admin/scores', 'Scoring'], ['/points-table', 'Points'], ['/history', 'History'],
  ['/admin/settings', 'Settings'], ['/admin/users', 'Users'], ['/admin/audit', 'Audit'],
];
const PUBLIC_NAV = [['/auction', 'Auction'], ['/matches', 'Schedules']];

export default function AppLayout() {
  const { user, isAdmin, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const items = !user ? PUBLIC_NAV : isAdmin ? ADMIN_NAV : [...USER_NAV, ...(isOwner ? [['/my-team', 'My Team']] : []), ...(user.canScore ? [['/scoring', 'Scoring']] : [])];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex min-w-0 max-w-7xl flex-wrap items-center gap-3 px-3 py-2.5 sm:px-5">
          <img src="/bulls-logo.svg" alt="Alkaran Bulls" className="h-10 w-10 rounded-lg" />
          <div className="mr-auto min-w-0 leading-tight">
            <div className="truncate font-display text-xl font-bold">Alkaran Bulls</div>
            <div className="text-[11px] text-mist">Tournament Manager</div>
          </div>
          <SeasonSwitcher />
          <div className="flex items-center gap-2">
            {!user && <NavLink to="/login" className="btn-ghost btn-sm">Sign in</NavLink>}
            <div className="hidden text-right leading-tight sm:block">
              {user && <><div className="text-sm font-semibold">{user.name}</div><div className="text-[11px] text-mist">{isAdmin ? <Badge tone="gold">Admin</Badge> : isOwner ? 'Team owner' : 'Viewer'}</div></>}
            </div>
            {user && <button className="btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>Log out</button>}
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5" aria-label="Main">
          {items.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/dashboard'}
              className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-ink-600 text-white' : 'text-mist hover:text-white'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto min-w-0 max-w-7xl px-3 py-5 sm:px-5"><Outlet /></main>
    </div>
  );
}
