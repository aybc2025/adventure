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
  const inventorySnapshot = {};
  for (const [k, v] of Object.entries(inventory || {})) {
    inventorySnapshot[k] = { item_id: v.item_id, quantity: v.quantity };
  }

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
      {roomsLoading ? (
        <p className="text-muted text-sm text-center">טוען חדרים...</p>
      ) : !firstRoom ? (
        <p className="text-danger text-sm text-center">להרפתקה זו אין חדרים מוגדרים</p>
      ) : (
        <p className="text-muted text-sm">
          {rooms.length} חדרים. הגיבור: <span className="text-gold">{hero?.custom_name}</span>
        </p>
      )}
      {error && <p className="text-danger text-sm mt-2">{error}</p>}
    </Modal>
  );
}

async function startAdventure(adventure, hero, inventory, createSession) {
  // Note: rooms are fetched via the modal; we use the adventure's room_order for first room
  // Or, fetch rooms here. Simpler: store the first room ID in adventure.room_order[0]
  // If room_order isn't set, fall back to fetching.
  const inventorySnapshot = {};
  for (const [k, v] of Object.entries(inventory || {})) {
    inventorySnapshot[k] = { item_id: v.item_id, quantity: v.quantity };
  }

  let firstRoomId = adventure.room_order?.[0];
  if (!firstRoomId) {
    // Fallback: fetch rooms
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

  const sessionId = await createSession({
    adventureId: adventure.id,
    heroId: hero.id,
    heroHp: hero.hp_max,
    inventory: inventorySnapshot,
    firstRoomId
  });
  return sessionId;
}
