import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRooms } from '../../hooks/useRooms.js';
import { useItems } from '../../hooks/useItems.js';
import { buildRoute } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import GridEditor from '../../components/grid/GridEditor.jsx';
import MonsterEditor from '../../components/gm/MonsterEditor.jsx';

const EMPTY = {
  title: '',
  read_aloud: '',
  gm_notes: '',
  order: 1,
  grid: { cols: 8, rows: 6, cells: [] },
  monsters: []
};

export default function RoomEditor() {
  const { advId, roomId } = useParams();
  const navigate = useNavigate();
  const { rooms, createRoom, updateRoom, getRoom } = useRooms(advId);
  const { items } = useItems();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!roomId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingMonster, setEditingMonster] = useState(null);
  const [monsterEditorOpen, setMonsterEditorOpen] = useState(false);

  useEffect(() => {
    if (!roomId) {
      // Set a sensible default order = (last room's order + 1)
      const maxOrder = rooms.reduce((max, r) => Math.max(max, r.order || 0), 0);
      setForm((f) => ({ ...f, order: maxOrder + 1 }));
      return;
    }
    (async () => {
      try {
        const room = await getRoom(roomId);
        if (room) setForm({ ...EMPTY, ...room });
      } catch (err) {
        console.error('Load room error:', err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openNewMonster() {
    setEditingMonster(null);
    setMonsterEditorOpen(true);
  }
  function openEditMonster(m) {
    setEditingMonster(m);
    setMonsterEditorOpen(true);
  }
  function handleSaveMonster(monster) {
    setForm((f) => {
      const list = [...(f.monsters || [])];
      const idx = list.findIndex((m) => m.id === monster.id);
      if (idx >= 0) list[idx] = monster;
      else list.push(monster);
      return { ...f, monsters: list };
    });
    setMonsterEditorOpen(false);
  }
  function removeMonster(id) {
    setForm((f) => ({ ...f, monsters: (f.monsters || []).filter((m) => m.id !== id) }));
  }
  function updateMonsterPosition(id, position) {
    setForm((f) => ({
      ...f,
      monsters: (f.monsters || []).map((m) => (m.id === id ? { ...m, position } : m))
    }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('יש להזין כותרת');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (roomId) {
        await updateRoom(roomId, form);
      } else {
        await createRoom(form);
      }
      navigate(buildRoute.gmAdventureEdit(advId));
    } catch (err) {
      console.error('Save room error:', err);
      setError('שגיאה בשמירה');
      setSaving(false);
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
      <PageHeader
        title={roomId ? 'עריכת חדר' : 'חדר חדש'}
        backTo={buildRoute.gmAdventureEdit(advId)}
      />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Basic info */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,80px] gap-3">
            <div>
              <label className="label-fantasy">כותרת חדר</label>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="input-fantasy w-full"
                placeholder="כניסת המרתף"
              />
            </div>
            <div>
              <label className="label-fantasy">סדר</label>
              <input
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => update('order', parseInt(e.target.value, 10) || 1)}
                className="input-fantasy w-full"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="label-fantasy">📖 טקסט קריאה</label>
            <textarea
              value={form.read_aloud}
              onChange={(e) => update('read_aloud', e.target.value)}
              className="input-fantasy w-full"
              rows={3}
              placeholder="הטקסט שייקרא לשחקנים כשהם נכנסים לחדר..."
            />
          </div>
          <div className="mt-3">
            <label className="label-fantasy">📝 הערות GM</label>
            <textarea
              value={form.gm_notes}
              onChange={(e) => update('gm_notes', e.target.value)}
              className="input-fantasy w-full"
              rows={2}
            />
          </div>
        </Card>

        {/* Two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Grid */}
          <Card>
            <h3 className="text-lg text-gold font-display mb-3">🗺️ גריד</h3>
            <GridEditor
              grid={form.grid}
              onGridChange={(g) => update('grid', g)}
              monsters={form.monsters}
              onMonsterPositionChange={updateMonsterPosition}
            />
          </Card>

          {/* Monsters */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg text-gold font-display">👹 מפלצות</h3>
              <button onClick={openNewMonster} className="btn-gold text-sm">
                + הוסף
              </button>
            </div>
            {(!form.monsters || form.monsters.length === 0) ? (
              <p className="text-muted text-sm text-center py-4">אין מפלצות בחדר</p>
            ) : (
              <div className="space-y-2">
                {form.monsters.map((m) => (
                  <div key={m.id} className="bg-bg/60 border border-primary/40 rounded p-2 flex items-center gap-2">
                    <span className="text-2xl no-rtl">{m.emoji || '👹'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-text font-display text-sm">{m.name || 'ללא שם'}</div>
                      <div className="text-muted text-xs">
                        HP {m.hp} • {m.attack_dice}/{m.defense_dice} •{' '}
                        ({m.position?.x ?? '-'},{m.position?.y ?? '-'})
                      </div>
                      {m.triggers?.length > 0 && (
                        <div className="text-muted text-xs">⚡ {m.triggers.length} triggers</div>
                      )}
                    </div>
                    <button onClick={() => openEditMonster(m)} className="btn-primary text-xs">
                      ערוך
                    </button>
                    <button onClick={() => removeMonster(m.id)} className="btn-danger text-xs">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2 sticky bottom-2 z-10 bg-bg/80 backdrop-blur p-2 rounded-md">
          <button
            onClick={() => navigate(buildRoute.gmAdventureEdit(advId))}
            className="btn-ghost"
            disabled={saving}
          >
            ביטול
          </button>
          <button onClick={handleSave} className="btn-gold" disabled={saving}>
            {saving ? 'שומר...' : 'שמור חדר'}
          </button>
        </div>
      </main>

      <MonsterEditor
        open={monsterEditorOpen}
        monster={editingMonster}
        items={items}
        onClose={() => setMonsterEditorOpen(false)}
        onSave={handleSaveMonster}
      />
    </div>
  );
}
