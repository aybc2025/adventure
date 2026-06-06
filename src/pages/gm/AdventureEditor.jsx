import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { useAdventures } from '../../hooks/useAdventures.js';
import { useRooms } from '../../hooks/useRooms.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';

const EMPTY = {
  title: '',
  description: '',
  emoji: '🗺️',
  difficulty: 1,
  min_players: 1,
  max_players: 4,
  xp_reward: 10,
  published: false,
  room_order: []
};

export default function AdventureEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createAdventure, updateAdventure } = useAdventures(false);
  const { rooms, deleteRoom } = useRooms(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState(id || null);
  const [confirmRoomDelete, setConfirmRoomDelete] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'adventures', id));
        if (snap.exists()) setForm({ ...EMPTY, ...snap.data() });
      } catch (err) {
        console.error('Load adventure error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Auto-sync room_order with the actual rooms list
  useEffect(() => {
    if (!id || !rooms.length) return;
    const orderIds = rooms.map((r) => r.id);
    if (
      orderIds.length !== form.room_order?.length ||
      orderIds.some((rid, i) => rid !== form.room_order?.[i])
    ) {
      setForm((f) => ({ ...f, room_order: orderIds }));
    }
  }, [rooms, id]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('יש להזין כותרת');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (savedId) {
        await updateAdventure(savedId, form);
      } else {
        const newId = await createAdventure(form);
        setSavedId(newId);
        navigate(buildRoute.gmAdventureEdit(newId), { replace: true });
      }
    } catch (err) {
      console.error('Save adventure error:', err);
      setError('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRoom() {
    if (!confirmRoomDelete) return;
    try {
      await deleteRoom(confirmRoomDelete.id);
      setConfirmRoomDelete(null);
    } catch (err) {
      console.error('Delete room error:', err);
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
      <PageHeader title={id ? 'עריכת הרפתקה' : 'הרפתקה חדשה'} backTo={ROUTES.GM_ADVENTURES} />
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card>
          <h3 className="text-lg text-gold font-display mb-3">פרטים</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr,80px] gap-3">
              <div>
                <label className="label-fantasy">כותרת</label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  className="input-fantasy w-full"
                  placeholder="מרתף העכברושים"
                />
              </div>
              <div>
                <label className="label-fantasy">אימוג'י</label>
                <input
                  value={form.emoji}
                  onChange={(e) => update('emoji', e.target.value)}
                  className="input-fantasy w-full text-2xl"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <label className="label-fantasy">תיאור</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="input-fantasy w-full"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label-fantasy">קושי (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.difficulty}
                  onChange={(e) => update('difficulty', parseInt(e.target.value, 10) || 1)}
                  className="input-fantasy w-full"
                />
              </div>
              <div>
                <label className="label-fantasy">XP פרס</label>
                <input
                  type="number"
                  min={0}
                  value={form.xp_reward}
                  onChange={(e) => update('xp_reward', parseInt(e.target.value, 10) || 0)}
                  className="input-fantasy w-full"
                />
              </div>
              <div>
                <label className="label-fantasy">מינ׳ שחקנים</label>
                <input
                  type="number"
                  min={1}
                  value={form.min_players}
                  onChange={(e) => update('min_players', parseInt(e.target.value, 10) || 1)}
                  className="input-fantasy w-full"
                />
              </div>
              <div>
                <label className="label-fantasy">מקס׳ שחקנים</label>
                <input
                  type="number"
                  min={1}
                  value={form.max_players}
                  onChange={(e) => update('max_players', parseInt(e.target.value, 10) || 1)}
                  className="input-fantasy w-full"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => update('published', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-text">פורסם (זמין לשחקנים)</span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <button onClick={() => navigate(ROUTES.GM_ADVENTURES)} className="btn-ghost" disabled={saving}>
            ביטול
          </button>
          <button onClick={handleSave} className="btn-gold" disabled={saving}>
            {saving ? 'שומר...' : savedId ? 'שמור' : 'שמור והמשך'}
          </button>
        </div>

        {/* Rooms section — only after first save */}
        {savedId && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg text-gold font-display">🏰 חדרים</h3>
              <Link to={buildRoute.gmRoomNew(savedId)} className="btn-gold text-sm">
                + חדר חדש
              </Link>
            </div>
            {rooms.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">
                עוד אין חדרים. התחל בהוספת חדר ראשון.
              </p>
            ) : (
              <div className="space-y-2">
                {rooms.map((room, idx) => (
                  <div key={room.id} className="bg-bg/50 border border-primary/40 rounded p-3 flex items-center gap-3">
                    <div className="text-muted text-sm font-display w-8 text-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gold font-display">{room.title || 'ללא שם'}</div>
                      <div className="text-muted text-xs">
                        {room.monsters?.length || 0} מפלצות •{' '}
                        {room.grid?.cols || 0}×{room.grid?.rows || 0} גריד
                      </div>
                    </div>
                    <Link
                      to={buildRoute.gmRoomEdit(savedId, room.id)}
                      className="btn-primary text-xs"
                    >
                      ערוך
                    </Link>
                    <button
                      onClick={() => setConfirmRoomDelete(room)}
                      className="btn-danger text-xs"
                    >
                      מחק
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}

        <Modal
          open={!!confirmRoomDelete}
          onClose={() => setConfirmRoomDelete(null)}
          title="מחיקת חדר"
          footer={
            <>
              <button onClick={() => setConfirmRoomDelete(null)} className="btn-ghost">
                ביטול
              </button>
              <button onClick={handleDeleteRoom} className="btn-danger">
                מחק
              </button>
            </>
          }
        >
          <p className="text-text/80">למחוק את החדר "{confirmRoomDelete?.title}"?</p>
        </Modal>
      </main>
    </div>
  );
}
