import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerHero } from '../../hooks/usePlayerHero.js';
import { useInventory } from '../../hooks/useInventory.js';
import { useItems } from '../../hooks/useItems.js';
import { ROUTES } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import HPBar from '../../components/ui/HPBar.jsx';
import XPBar from '../../components/ui/XPBar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function HeroProfile() {
  const { hero, loading, deleteHero } = usePlayerHero();
  const { inventory, loading: invLoading } = useInventory(hero?.id);
  const { items, loading: itemsLoading } = useItems();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!hero) return;
    setDeleting(true);
    try {
      await deleteHero(hero.id);
      navigate(ROUTES.PLAY_HOME);
    } catch (err) {
      console.error('Delete hero error:', err);
      setDeleting(false);
    }
  }

  if (loading || invLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען..." />
      </div>
    );
  }

  if (!hero) {
    return (
      <div className="min-h-screen">
        <PageHeader title="פרופיל גיבור" backTo={ROUTES.PLAY_HOME} />
        <main className="max-w-3xl mx-auto p-4">
          <Card className="text-center">
            <p className="text-text/80">אין לך עדיין גיבור.</p>
            <button onClick={() => navigate(ROUTES.HERO_CREATE)} className="btn-gold mt-3">
              צור גיבור
            </button>
          </Card>
        </main>
      </div>
    );
  }

  const inventoryItems = Object.values(inventory)
    .map((inv) => ({ ...inv, item: items.find((i) => i.id === inv.item_id) }))
    .filter((x) => x.item);

  return (
    <div className="min-h-screen">
      <PageHeader title="פרופיל גיבור" backTo={ROUTES.PLAY_HOME} />

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card gold>
          <div className="flex items-start gap-4">
            <div className="text-7xl no-rtl">{hero.emoji || '⚔️'}</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl text-gold font-display heading-glow">{hero.custom_name}</h2>
              <p className="text-muted mb-3">
                {hero.class} • רמה {hero.level}
              </p>
              <div className="space-y-2">
                <HPBar current={hero.hp_max} max={hero.hp_max} />
                <XPBar xp={hero.xp || 0} level={hero.level || 1} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl text-gold font-display mb-3">סטטיסטיקות</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-bg/50 rounded p-2">
              <div className="text-muted text-xs">HP מקס׳</div>
              <div className="text-gold font-display text-xl">{hero.hp_max}</div>
            </div>
            <div className="bg-bg/50 rounded p-2">
              <div className="text-muted text-xs">תקיפה</div>
              <div className="text-gold font-display text-lg">{hero.attack_dice}</div>
            </div>
            <div className="bg-bg/50 rounded p-2">
              <div className="text-muted text-xs">הגנה</div>
              <div className="text-gold font-display text-lg">{hero.defense_dice}</div>
            </div>
            <div className="bg-bg/50 rounded p-2">
              <div className="text-muted text-xs">XP</div>
              <div className="text-gold font-display text-lg">{hero.xp || 0}</div>
            </div>
          </div>
        </Card>

        {hero.special_name && (
          <Card>
            <h3 className="text-xl text-gold font-display mb-2">⭐ יכולת מיוחדת</h3>
            <div className="text-text font-display text-lg">{hero.special_name}</div>
            {hero.special_description && (
              <p className="text-muted text-sm mt-1">{hero.special_description}</p>
            )}
          </Card>
        )}

        <Card>
          <h3 className="text-xl text-gold font-display mb-3">🎒 פריטים ({inventoryItems.length})</h3>
          {inventoryItems.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">אין פריטים</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {inventoryItems.map(({ item, quantity }) => (
                <div key={item.id} className="bg-bg/50 border border-primary/30 rounded p-2 flex items-center gap-2">
                  <span className="text-2xl no-rtl">{item.emoji || '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-text text-sm truncate">{item.name}</div>
                    <div className="text-muted text-xs">× {quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {hero.applied_upgrades?.length > 0 && (
          <Card>
            <h3 className="text-xl text-gold font-display mb-2">🌟 שדרוגים</h3>
            <div className="flex flex-wrap gap-2">
              {hero.applied_upgrades.map((id) => (
                <Badge key={id} variant="gold">
                  {id}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          <button onClick={() => setConfirmDelete(true)} className="btn-danger text-sm">
            מחק גיבור
          </button>
        </div>

        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="מחיקת גיבור"
          footer={
            <>
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost" disabled={deleting}>
                ביטול
              </button>
              <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
                {deleting ? 'מוחק...' : 'מחק'}
              </button>
            </>
          }
        >
          <p className="text-text/80">
            האם אתה בטוח שתרצה למחוק את <strong className="text-gold">{hero.custom_name}</strong>?
          </p>
          <p className="text-muted text-sm mt-2">פעולה זו אינה הפיכה. כל ההתקדמות תאבד.</p>
        </Modal>
      </main>
    </div>
  );
}
