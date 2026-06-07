import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdventures } from '../../hooks/useAdventures.js';
import { useRooms } from '../../hooks/useRooms.js';
import { usePlayerHero } from '../../hooks/usePlayerHero.js';
import { useInventory } from '../../hooks/useInventory.js';
import { useSessionOps } from '../../hooks/useSession.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdventureSelect() {
  const { adventures, loading } = useAdventures(true); // published only
  const { hero } = usePlayerHero();
  const { inventory } = useInventory(hero?.id);
  const { createSession } = useSessionOps();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען הרפתקאות..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="בחר הרפתקה" backTo={ROUTES.PLAY_HOME} />
      <main className="max-w-5xl mx-auto p-4">
        {adventures.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80">אין עדיין הרפתקאות זמינות.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adventures.map((adv) => (
              <button
                key={adv.id}
                onClick={() => setSelected(adv)}
                className="card-fantasy text-right hover:card-fantasy-gold hover:scale-[1.02] transition-all animate-fade-in"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-5xl no-rtl">{adv.emoji || '🗺️'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg text-gold font-display truncate">{adv.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < (adv.difficulty || 1) ? 'text-gold' : 'text-muted/30'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-text/80 text-sm line-clamp-3">{adv.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {adv.xp_reward > 0 && <Badge variant="gold">+{adv.xp_reward} XP</Badge>}
                  <Badge variant="muted">
                    {adv.min_players}-{adv.max_players} שחקנים
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        <AdventureStartModal
          adventure={selected}
          hero={hero}
          inventory={inventory}
          onClose={() => {
            setSelected(null);
            setError('');
          }}
          onStart={async (adv) => {
            if (!hero) return;
            setStarting(true);
            setError('');
            try {
              const sessionId = await startAdventure(adv, hero, inventory, createSession);
              navigate(buildRoute.roomView(sessionId));
            } catch (err) {
              console.error('Start adventure error:', err);
              setError(err.message || 'שגיאה בהתחלת ההרפתקה');
              setStarting(false);
            }
          }}
          starting={starting}
          error={error}
        />
      </main>
    </div>
  );
}

function AdventureStartModal({ adventure, hero, inventory, onClose, onStart, starting, error }) {
  const { rooms, loading: roomsLoading } = useRooms(adventure?.id);

  if (!adventure) return null;

  const firstRoom = rooms[0];

  // Build a preview of items the hero starts this adventure with
  const startingItems = hero?.starting_items || [];

  return (
    <Modal
      open={!!adventure}
      onClose={onClose}
      title={`${adventure.emoji || '🗺️'} ${adventure.title}`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={starting}>
            ביטול
          </button>
          <button
            onClick={() => onStart(adventure)}
            className="btn-gold"
            disabled={starting || roomsLoading || !firstRoom || !hero}
          >
            {starting ? 'מתחיל...' : '⚔️ צא להרפתקה'}
          </button>
        </>
      }
    >
      <p className="text-text/80 mb-3">{adventure.description}</p>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="bg-bg/50 rounded p-2 text-center">
          <div className="text-muted">קושי</div>
          <div className="text-gold">{'★'.repeat(adventure.difficulty || 1)}</div>
        </div>
        <div className="bg-bg/50 rounded p-2 text-center">
          <div className="text-muted">פרסים</div>
          <div className="text-gold font-display">+{adventure.xp_reward || 0} XP</div>
        </div>
      </div>

      {/* Starting items notice (PDF rule: heroes start with potions from hero card) */}
      {startingItems.length > 0 && (
        <div className="bg-bg/40 rounded p-2 mb-3 text-sm">
          <span className="text-muted">ציוד פתיחה: </span>
          <span className="text-gold">
            {startingItems.map((si) => `${si.item_id === 'potion_heal_small' ? '🧪' : '📦'} ×${si.quantity}`).join('  ')}
          </span>
        </div>
      )}

      {roomsLoading ? (
        <p className="text-muted text-sm text-center">טוען חדרים...</p>
      ) : !firstRoom ? (
        <p className="text-danger text-sm text-center">להרפתקה זו אין חדרים מוגדרים</p>
      ) : (
        <p className="text-muted text-sm">
          {rooms.length} חדרים · הגיבור: <span className="text-gold">{hero?.custom_name}</span>
        </p>
      )}
      {error && <p className="text-danger text-sm mt-2">{error}</p>}
    </Modal>
  );
}

/**
 * Build the session inventory snapshot and create the session in Firestore.
 *
 * PDF rule (p.16): "Heroes start each adventure with potions shown on their
 * hero card." — hero.starting_items holds those items.
 *
 * Merge strategy:
 *   1. Start from the hero's current persistent inventory.
 *   2. Add starting_items on top (stacking with any already-held copies).
 *      This means accumulated potions are kept, and the hero always gets
 *      at least their starting allocation.
 */
async function startAdventure(adventure, hero, inventory, createSession) {
  // Step 1: copy current persistent inventory into snapshot
  const inventorySnapshot = {};
  for (const [k, v] of Object.entries(inventory || {})) {
    inventorySnapshot[k] = { item_id: v.item_id, quantity: v.quantity };
  }

  // Step 2: merge starting_items (PDF rule — potions from hero card)
  for (const si of hero?.starting_items || []) {
    if (!si.item_id || si.quantity <= 0) continue;
    const existing = inventorySnapshot[si.item_id];
    inventorySnapshot[si.item_id] = {
      item_id:  si.item_id,
      quantity: (existing?.quantity || 0) + si.quantity
    };
  }

  // Step 3: resolve the first room ID
  let firstRoomId = adventure.room_order?.[0];
  if (!firstRoomId) {
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const { db } = await import('../../config/firebase.js');
    const q = query(
      collection(db, 'adventures', adventure.id, 'rooms'),
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    firstRoomId = snap.docs[0]?.id;
  }
  if (!firstRoomId) {
    throw new Error('להרפתקה אין חדרים');
  }

  // Step 4: create session
  const sessionId = await createSession({
    adventureId: adventure.id,
    heroId:      hero.id,
    heroHp:      hero.hp_max,
    inventory:   inventorySnapshot,
    firstRoomId
  });
  return sessionId;
}
