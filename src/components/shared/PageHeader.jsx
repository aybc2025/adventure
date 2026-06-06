import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROUTES } from '../../config/routes.js';

export default function PageHeader({ title, backTo = null, showSignOut = true }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.LANDING);
  }

  return (
    <header className="bg-surface border-b-2 border-gold/30 p-4 mb-4 sticky top-0 z-30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {backTo && (
            <Link to={backTo} className="text-gold hover:text-gold-bright text-2xl" aria-label="חזור">
              ←
            </Link>
          )}
          <h1 className="text-xl sm:text-2xl text-gold font-display truncate heading-glow">
            {title}
          </h1>
        </div>
        {user && showSignOut && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-muted text-sm hidden sm:inline">{user.displayName}</span>
            <button onClick={handleSignOut} className="btn-ghost text-sm">
              יציאה
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
