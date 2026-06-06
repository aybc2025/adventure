import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { useItems } from '../../hooks/useItems.js';
import { ROUTES } from '../../config/routes.js';
import { ITEM_EFFECTS, ITEM_EFFECT_LABELS } from '../../config/constants.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';

const EMPTY = {
  name: '',
  description: '',
  emoji: '📦',
  consumable: true,
  effect: { type: ITEM_EFFECTS.HEAL, amount: 1, duration: null }
};

export default function ItemEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createItem, updateItem } = useItems();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'items', id));
        if (snap.exists()) setForm({ ...EMPTY, ...snap.data() });
      } catch (err) {
        console.error('Load item error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateEffect(patch) {
    setForm((f) => ({ ...f, effect: { ...f.effect, ...patch } }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('יש להזין שם');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (id) {
        await updateItem(id, form);
      } else {
        await createItem(form);
      }
      navigate(ROUTES.GM_ITEMS);
    } catch (err) {
      console.error('Save item error:', err);
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
      <PageHeader title={id ? 'עריכת פריט' : 'פריט חדש'} backTo={ROUTES.GM_ITEMS} />
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Card>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,80px] gap-3">
              <div>
                <label className="label-fantasy">שם</label>
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="input-fantasy w-full"
                  placeholder="שיקוי ריפוי"
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
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.consumable !== false}
                onChange={(e) => update('consumable', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-text">חד-פעמי (נעלם אחרי שימוש)</span>
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg text-gold font-display mb-3">השפעה</h3>
          <div className="space-y-3">
            <div>
              <label className="label-fantasy">סוג</label>
              <select
                value={form.effect?.type || ITEM_EFFECTS.HEAL}
                onChange={(e) => updateEffect({ type: e.target.value })}
                className="input-fantasy w-full"
              >
                {Object.entries(ITEM_EFFECTS).map(([_, value]) => (
                  <option key={value} value={value}>
                    {ITEM_EFFECT_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-fantasy">כמות</label>
                <input
                  type="number"
                  value={form.effect?.amount ?? 1}
                  onChange={(e) => updateEffect({ amount: parseInt(e.target.value, 10) || 0 })}
                  className="input-fantasy w-full"
                />
              </div>
              <div>
                <label className="label-fantasy">משך (סיבובים, ריק=לתמיד)</label>
                <input
                  type="number"
                  value={form.effect?.duration ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateEffect({ duration: v === '' ? null : parseInt(v, 10) });
                  }}
                  className="input-fantasy w-full"
                  placeholder="—"
                />
              </div>
            </div>
          </div>
        </Card>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={() => navigate(ROUTES.GM_ITEMS)} className="btn-ghost" disabled={saving}>
            ביטול
          </button>
          <button onClick={handleSave} className="btn-gold" disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </main>
    </div>
  );
}
