import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ToastContext';
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import MarketplacePage from './pages/MarketplacePage';
import AcademyPage from './pages/AcademyPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import InfoPage from './pages/InfoPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, message: 'Log in to open your Bowan workspace.' }} />;
  return children;
}

function PublicShell({ children }) {
  return <><TopNav />{children}<Footer /></>;
}

export default function App() {
  return <ToastProvider><Routes>
    <Route path="/" element={<PublicShell><MarketplacePage /></PublicShell>} />
    <Route path="/academies" element={<PublicShell><MarketplacePage /></PublicShell>} />
    <Route path="/academy/:slug" element={<PublicShell><AcademyPage /></PublicShell>} />
    <Route path="/for-academies" element={<PublicShell><InfoPage /></PublicShell>} />
    <Route path="/contact" element={<PublicShell><InfoPage /></PublicShell>} />
    <Route path="/privacy" element={<PublicShell><InfoPage /></PublicShell>} />
    <Route path="/terms" element={<PublicShell><InfoPage /></PublicShell>} />
    <Route path="/login" element={<><TopNav /><AuthPage mode="login" /></>} />
    <Route path="/register" element={<><TopNav /><AuthPage mode="register" /></>} />
    <Route path="/dashboard/*" element={<RequireAuth><><TopNav /><DashboardPage /></></RequireAuth>} />
    <Route path="*" element={<PublicShell><div className="not-found content-width"><span className="not-found-mark">✳</span><h1>Not all who wander are lost.</h1><p>But this page might be. Let’s find you a new direction.</p><a className="button button-primary" href="/">Back to Bowan</a></div></PublicShell>} />
  </Routes></ToastProvider>;
}
