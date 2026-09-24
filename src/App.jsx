import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import ViewerHome from './pages/ViewerHome.jsx';
import Seasons from './pages/Seasons.jsx';
import SeasonDetail from './pages/SeasonDetail.jsx';
import MyTeam from './pages/MyTeam.jsx';
import Auction from './pages/Auction.jsx';
import Players from './pages/Players.jsx';
import Teams from './pages/Teams.jsx';
import TeamDetail from './pages/TeamDetail.jsx';
import Matches from './pages/Matches.jsx';
import MatchDetail from './pages/MatchDetail.jsx';
import Scoreboard from './pages/Scoreboard.jsx';
import PointsTable from './pages/PointsTable.jsx';
import History from './pages/History.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminSeasons from './pages/admin/AdminSeasons.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminScores from './pages/admin/AdminScores.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminAudit from './pages/admin/AdminAudit.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace /> : <Landing />;
}

function DashboardHome() {
  const { user } = useAuth();
  return user?.role === 'USER' ? <ViewerHome /> : <UserDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<AppLayout />}>
        <Route path="/auction" element={<Auction />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:matchId" element={<MatchDetail />} />
        <Route path="/scoreboard/:matchId" element={<Scoreboard />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/seasons" element={<Seasons />} />
          <Route path="/seasons/:seasonId" element={<SeasonDetail />} />
          <Route element={<ProtectedRoute role="OWNER" /> }>
            <Route path="/my-team" element={<MyTeam />} />
          </Route>
          <Route path="/players" element={<Players />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          <Route path="/points-table" element={<PointsTable />} />
          <Route path="/history" element={<History />} />
          <Route path="/scoring" element={<AdminScores />} />

          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/seasons" element={<AdminSeasons />} />
            <Route path="/admin/seasons/:seasonId" element={<SeasonDetail admin />} />
            <Route path="/admin/teams" element={<Teams admin />} />
            <Route path="/admin/players" element={<Players admin />} />
            <Route path="/admin/auction" element={<Auction admin />} />
            <Route path="/admin/matches" element={<Matches admin />} />
            <Route path="/admin/scores" element={<AdminScores />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit" element={<AdminAudit />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
