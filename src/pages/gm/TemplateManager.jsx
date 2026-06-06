import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHeroTemplates } from '../../hooks/useHeroTemplates.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function TemplateManager() {
  const { templates, loading, deleteTemplate } = useHeroTemplates();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteTemplate(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete template error:', err);
    } finally {
      setDeleting(false);
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
      <PageHeader title="כיתות גיבורים" backTo={ROUTES.GM_DASHBOARD} />
      <main className="max-w-4xl mx-auto p-4">
        <div className="flex justify-end mb-4">
          <Link to={ROUTES.GM_TEMPLATE_NEW} className="btn-gold">
            + כיתה חדשה
          </Link>
        </div>

        {templates.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80 mb-3">אין עדיין כיתות גיבורים.</p>
            <Link to={ROUTES.GM_TEMPLATE_NEW} className="btn-gold inline-block">
              צור כיתה ראשונה
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <Card key={t.id} className="animate-fade-in flex items-start gap-3">
                <span className="text-4xl no-rtl">{t.emoji || '⚔️'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg text-gold font-display">{t.name}</h3>
                  <p className="text-muted text-xs mb-1">
                    HP {t.hp_max} • תקיפה {t.attack_dice} • הגנה {t.defense_dice}
                  </p>
                  {t.special_name && (
                    <p className="text-text/80 text-sm">⭐ {t.special_name}</p>
                  )}
                  <p className="text-muted text-xs mt-1">
                    {t.level_up_options?.length || 0} אפשרויות שדרוג
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    to={buildRoute.gmTemplateEdit(t.id)}
                    className="btn-primary text-xs"
                  >
                    ערוך
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(t)}
                    className="btn-danger text-xs"
                  >
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
          title="מחיקת כיתה"
          footer={
            <>
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost" disabled={deleting}>
                ביטול
              </button>
              <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
                {deleting ? 'מוחק...' : 'מחק'}
              </button>
            </>
          }
        >
          <p className="text-text/80">
            למחוק את <strong className="text-gold">{confirmDelete?.name}</strong>?
          </p>
          <p className="text-muted text-sm mt-2">
            שחקנים שכבר יצרו גיבור מכיתה זו לא יושפעו.
          </p>
        </Modal>
      </main>
    </div>
  );
}
