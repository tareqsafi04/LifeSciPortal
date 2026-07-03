import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SplashPage from '@/pages/SplashPage';
import AuthPage from '@/pages/AuthPage';
import SignUpPage from '@/pages/SignUpPage';
import SignInPage from '@/pages/SignInPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';

function Loader() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-5xl mb-4">🧬</div>
        <div className="text-lg font-medium animate-pulse">جاري التحميل...</div>
      </div>
    </div>
  );
}

/** Only verified + logged-in users can enter */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <>{children}</> : <Navigate to="/signin" replace />;
}

/** Redirect already-logged-in users away from auth pages */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Splash */}
      <Route path="/" element={<SplashPage />} />

      {/* Legacy auth hub page */}
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Auth pages */}
      <Route path="/signup"          element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/signin"          element={<PublicRoute><SignInPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Reset password: must NOT be behind PublicRoute — user arrives via email link */}
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
