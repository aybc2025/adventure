import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROUTES } from '../../config/routes.js';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function ProtectedRoute({ variant = 'player' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LANDING} state={{ from: location }} replace />;
  }

  if (variant === 'gm' && !user.isGM) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-fantasy max-w-md text-center">
          <h2 className="text-2xl text-danger mb-2">🚫 אין הרשאה</h2>
          <p className="text-text/80 mb-4">החשבון שלך אינו מורשה לגשת לממשק הניהול.</p>
          <a href={`${import.meta.env.BASE_URL}play`} className="btn-gold inline-block">
            חזור למסך המשחק
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
