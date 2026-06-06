import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdventures } from '../../hooks/useAdventures.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function AdventureManager() {
  const { adventures, loading, deleteAdventure, updateAdventure } = useAdventures(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteAdventure(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete adventure error:', err);
    } finally {
      setDeleting(false);
    }
  }

  async function togglePublished(adv) {
    try {
      await updateAdventure(adv.id, { published: !adv.published });
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="הרפתקאות" backTo={ROUTES.GM_DASHBOARD} />
      <main className="max-w-4xl mx-auto p-4">
        <div className="flex justify-end mb-4">
          <Link to={ROUTES.GM_ADVENTURE_NEW} className="btn-gold">
            + הרפתקה חדשה
          </Link>
        </div>

        {adventures.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80 mb-3">אין עדיין הרפתקאות.</p>
            <Link to={ROUTES.GM_ADVENTURE_NEW} className="btn-gold inline-block">
              צור הרפתקה ראשונה
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {adventures.map((adv) => (
              <Card key={adv.id} className="animate-fade-in">
                <div className="flex items-start gap-3">
                  <span className="text-4xl no-rtl">{adv.emoji || '🗺️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg text-gold font-display">{adv.title}</h3>
                      {adv.published ? (
                        <Badge variant="gold">פורסם</Badge>
                      ) : (
                        <Badge variant="muted">טיוטה</Badge>
                      )}
                    </div>
                    <p className="text-muted text-xs mt-1">
                      קושי {'★'.repeat(adv.difficulty || 1)} • +{adv.xp_reward || 0} XP
                    </p>
                    {adv.description && (
                      <p className="text-text/70 text-sm mt-1 line-clamp-2">{adv.description}</p>
                    )}
                    <p className="text-muted text-xs mt-1">
                      {adv.room_order?.length || 0} חדרים
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end flex-wrap">
                  <button onClick={() => togglePublished(adv)} className="btn-primary text-xs">
                    {adv.published ? 'הסר פרסום' : 'פרסם'}
                  </button>
                  <Link
                    to={buildRoute.gmAdventureEdit(adv.id)}
                    className="btn-primary text-xs"
                  >
                    ערוך
                  </Link>
                  <button onClick={() => setConfirmDelete(adv)} className="btn-danger text-xs">
                    מחק
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="מחיקת הרפתקה"
          footer={
            <>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost"
                disabled={deleting}
              >
                ביטול
              </button>
              <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
                {deleting ? 'מוחק...' : 'מחק'}
              </button>
            </>
          }
        >
          <p className="text-text/80">
            למחוק את <strong className="text-gold">{confirmDelete?.title}</strong>?
          </p>
          <p className="text-muted text-sm mt-2">כל החדרים והמפלצות בהרפתקה זו יימחקו לצמיתות.</p>
        </Modal>
      </main>
    </div>
  );
}
