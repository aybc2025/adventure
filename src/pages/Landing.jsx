import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ROUTES } from '../config/routes.js';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

export default function Landing() {
  const { user, loading, signIn, authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.isGM ? ROUTES.GM_DASHBOARD : ROUTES.PLAY_HOME, { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 text-8xl opacity-5 rotate-12">⚔️</div>
        <div className="absolute bottom-20 left-10 text-8xl opacity-5 -rotate-12">🛡️</div>
        <div className="absolute top-1/2 right-1/4 text-6xl opacity-5">🐉</div>
        <div className="absolute bottom-1/3 right-2/3 text-6xl opacity-5">🏰</div>
      </div>

      <div className="card-fantasy card-fantasy-gold w-full max-w-md text-center relative z-10 animate-fade-in">
        <div className="text-6xl mb-2">🏰</div>
        <h1 className="text-4xl text-gold font-display mb-2 heading-glow">
          Hero Kids
        </h1>
        <p className="text-text/80 text-lg mb-1 font-display">הרפתקאות פנטזיה</p>
        <p className="text-muted text-sm mb-6">משחק תפקידים למשפחה בעברית</p>

        <button
          onClick={signIn}
          className="btn-gold w-full text-lg py-3 flex items-center justify-center gap-2"
        >
          <span className="text-xl">🎲</span>
          <span>היכנס עם Google</span>
        </button>

        {authError && (
          <p className="mt-4 text-danger text-sm" role="alert">
            {authError}
          </p>
        )}

        <p className="mt-6 text-muted text-xs">
          מבוסס על Hero Kids Fantasy RPG מאת Justin Halliday
        </p>
      </div>
    </div>
  );
}
