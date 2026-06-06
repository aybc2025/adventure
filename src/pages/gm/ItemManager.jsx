import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../../hooks/useItems.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import { ITEM_EFFECT_LABELS } from '../../config/constants.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function ItemManager() {
  const { items, loading, deleteItem } = useItems();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteItem(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete item error:', err);
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
      <PageHeader title="פריטים" backTo={ROUTES.GM_DASHBOARD} />
      <main className="max-w-4xl mx-auto p-4">
        <div className="flex justify-end mb-4">
          <Link to={ROUTES.GM_ITEM_NEW} className="btn-gold">
            + פריט חדש
          </Link>
        </div>

        {items.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80 mb-3">אין עדיין פריטים בקטלוג.</p>
            <Link to={ROUTES.GM_ITEM_NEW} className="btn-gold inline-block">
              צור פריט ראשון
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <Card key={item.id} className="animate-fade-in">
                <div className="flex items-start gap-3">
                  <span className="text-4xl no-rtl">{item.emoji || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg text-gold font-display">{item.name}</h3>
                    {item.description && (
                      <p className="text-text/80 text-sm">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.effect?.type && (
                        <Badge variant="gold">
                          {ITEM_EFFECT_LABELS[item.effect.type]}
                          {item.effect.amount ? ` ${item.effect.amount}` : ''}
                        </Badge>
                      )}
                      {item.consumable === false ? (
                        <Badge variant="muted">קבוע</Badge>
                      ) : (
                        <Badge variant="muted">חד-פעמי</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Link to={buildRoute.gmItemEdit(item.id)} className="btn-primary text-xs">
                    ערוך
                  </Link>
                  <button onClick={() => setConfirmDelete(item)} className="btn-danger text-xs">
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
          title="מחיקת פריט"
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
          <p className="text-text/80">למחוק את {confirmDelete?.name}?</p>
        </Modal>
      </main>
    </div>
  );
}
