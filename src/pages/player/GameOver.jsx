import { useNavigate, useParams } from 'react-router-dom';
import { useSession, useSessionOps } from '../../hooks/useSession.js';
import { useAdventure } from '../../hooks/useAdventures.js';
import { ROUTES } from '../../config/routes.js';
import { SESSION_STATUS } from '../../config/constants.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';

export default function GameOver() {
  const { sessionId } = useParams();
  const { session, loading } = useSession(sessionId);
  const { adventure } = useAdventure(session?.adventure_id);
  const { deleteSession } = useSessionOps();
  const navigate = useNavigate();

  async function handleClose() {
    if (session) {
      try {
        await deleteSession(sessionId);
      } catch (err) {
        console.error('Delete session error:', err);
      }
    }
    navigate(ROUTES.PLAY_HOME);
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  const victorious = session.status === SESSION_STATUS.COMPLETED;

  return (
    <div className="min-h-screen">
      <PageHeader title={victorious ? 'ניצחון!' : 'הפסד'} showSignOut={false} />
      <main className="max-w-md mx-auto p-4">
        <Card gold className="text-center animate-fade-in">
          <div className="text-7xl mb-4 animate-pulse-gold inline-block">
            {victorious ? '🏆' : '💀'}
          </div>
          <h2 className="text-3xl text-gold font-display heading-glow mb-2">
            {victorious ? 'ניצחת!' : 'הובסת...'}
          </h2>
          <p className="text-text/80 mb-4">
            {victorious
              ? `סיימת את "${adventure?.title || 'ההרפתקה'}" בהצלחה!`
              : 'אל ייאוש! לכל גיבור יש יום קשה.'}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-bg/50 rounded p-2">
              <div className="text-gold text-2xl font-display">
                {session.completed_rooms?.length || 0}
              </div>
              <div className="text-muted text-xs">חדרים</div>
            </div>
            <div className="bg-bg/50 rounded p-2">
              <div className="text-gold text-2xl font-display">
                {session.monsters_defeated || 0}
              </div>
              <div className="text-muted text-xs">מפלצות</div>
            </div>
            <div className="bg-bg/50 rounded p-2">
              <div className="text-gold text-2xl font-display">
                {victorious ? adventure?.xp_reward || 0 : 0}
              </div>
              <div className="text-muted text-xs">XP</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={handleClose} className="btn-gold">
              חזור לבית
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
