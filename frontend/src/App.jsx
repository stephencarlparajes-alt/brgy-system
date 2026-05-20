import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

// ── Pages ─────────────────────────────────────────────────────────────────────
import Login        from './pages/Login';
import Register     from './pages/Register';
import ForgotPass   from './pages/ForgotPassword';
import Landing      from './pages/Landing';

// Admin Pages
import AdminLayout      from './components/layout/AdminLayout';
import Dashboard        from './pages/admin/Dashboard';
import Residents        from './pages/admin/Residents';
import Officials        from './pages/admin/Officials';
import Blotter          from './pages/admin/Blotter';
import Clearance        from './pages/admin/Clearance';
import Indigency        from './pages/admin/Indigency';
import Residency        from './pages/admin/Residency';
import Permit           from './pages/admin/Permit';
import History          from './pages/admin/History';
import VerifyAccounts   from './pages/admin/VerifyAccounts';
import Payments        from './pages/admin/Payments';

// Resident Pages
import ResidentLayout   from './components/layout/ResidentLayout';
import ResidentHome     from './pages/resident/ResidentHome';
import MyRequests       from './pages/resident/MyRequests';
import RequestClearance from './pages/resident/RequestClearance';
import RequestIndigency from './pages/resident/RequestIndigency';
import RequestResidency from './pages/resident/RequestResidency';
import RequestPermit    from './pages/resident/RequestPermit';
import MyPayments      from './pages/resident/MyPayments';
import Profile         from './pages/resident/Profile';

// ── Route Guards ──────────────────────────────────────────────────────────────
const RequireAuth = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/portal'} replace />;
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/portal'} replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px' } }} />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />
          <Route path="/forgot-password" element={<ForgotPass />} />
          <Route path="/" element={<RedirectIfAuth><Landing /></RedirectIfAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
            <Route index             element={<Dashboard />} />
            <Route path="residents"  element={<Residents />} />
            <Route path="officials"  element={<Officials />} />
            <Route path="blotter"    element={<Blotter />} />
            <Route path="clearance"  element={<Clearance />} />
            <Route path="indigency"  element={<Indigency />} />
            <Route path="residency"  element={<Residency />} />
            <Route path="permits"    element={<Permit />} />
            <Route path="history"    element={<History />} />
            <Route path="verify"     element={<VerifyAccounts />} />
            <Route path="payments"   element={<Payments />} />
          </Route>

          {/* Resident Portal */}
          <Route path="/portal" element={<RequireAuth role="resident"><ResidentLayout /></RequireAuth>}>
            <Route index             element={<ResidentHome />} />
            <Route path="requests"   element={<MyRequests />} />
            <Route path="clearance"  element={<RequestClearance />} />
            <Route path="indigency"  element={<RequestIndigency />} />
            <Route path="residency"  element={<RequestResidency />} />
            <Route path="permit"     element={<RequestPermit />} />
            <Route path="payments"   element={<MyPayments />} />
            <Route path="profile"    element={<Profile />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
