import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { useHeroTemplates } from '../../hooks/useHeroTemplates.js';
import { ROUTES } from '../../config/routes.js';
import { SPECIAL_TRIGGERS, SPECIAL_TRIGGER_LABELS } from '../../config/constants.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';

const STAT_OPTIONS = [
  { value: 'hp_max', label: 'HP מקסימום' },
  { value: 'attack_dice', label: 'הוסף קוביית תקיפה' },
  { value: 'defense_dice', label: 'הוסף קוביית הגנה' },
  { value: 'attack_modifier', label: 'בונוס לתקיפה (+1)' },
  { value: 'defense_modifier', label: 'בונוס להגנה (+1)' }
];

const EMPTY = {
  name: '',
  class: '',
  emoji: '⚔️',
  description: '',
  hp_max: 4,
  attack_dice: '2d6',
  defense_dice: '2d6',
  special_name: '',
  special_description: '',
  special_trigger: 'once_per_combat',
  level_up_options: []
};

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createTemplate, updateTemplate } = useHeroTemplates();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'hero_templates', id));
        if (snap.exists()) {
          setForm({ ...EMPTY, ...snap.data() });
        }
      } catch (err) {
        console.error('Load template error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addOption() {
    setForm((f) => ({
      ...f,
      level_up_options: [
        ...(f.level_up_options || []),
        {
          id: `up_${Date.now()}`,
          name: '',
          description: '',
          effect: { stat: 'hp_max', modifier: 1 }
        }
      ]
    }));
  }

  function updateOption(idx, patch) {
    setForm((f) => {
      const opts = [...(f.level_up_options || [])];
      opts[idx] = { ...opts[idx], ...patch };
      return { ...f, level_up_options: opts };
    });
  }

  function updateOptionEffect(idx, patch) {
    setForm((f) => {
      const opts = [...(f.level_up_options || [])];
      opts[idx] = { ...opts[idx], effect: { ...opts[idx].effect, ...patch } };
      return { ...f, level_up_options: opts };
    });
  }

  function removeOption(idx) {
    setForm((f) => {
      const opts = [...(f.level_up_options || [])];
      opts.splice(idx, 1);
      return { ...f, level_up_options: opts };
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('יש להזין שם כיתה');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (id) {
        await updateTemplate(id, form);
      } else {
        await createTemplate(form);
      }
      navigate(ROUTES.GM_TEMPLATES);
    } catch (err) {
      console.error('Save template error:', err);
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
      <PageHeader title={id ? 'עריכת כיתה' : 'כיתה חדשה'} backTo={ROUTES.GM_TEMPLATES} />
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card>
          <h3 className="text-lg text-gold font-display mb-3">פרטים בסיסיים</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-fantasy">שם כיתה</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="input-fantasy w-full"
                placeholder="לוחם"
              />
            </div>
            <div>
              <label className="label-fantasy">סוג (class)</label>
              <input
                value={form.class}
                onChange={(e) => update('class', e.target.value)}
                className="input-fantasy w-full"
                placeholder="warrior"
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
            <div className="sm:col-span-2">
              <label className="label-fantasy">תיאור</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="input-fantasy w-full"
                rows={2}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg text-gold font-display mb-3">סטטיסטיקות</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-fantasy">HP מקס׳</label>
              <input
                type="number"
                value={form.hp_max}
                onChange={(e) => update('hp_max', parseInt(e.target.value, 10) || 1)}
                className="input-fantasy w-full"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="label-fantasy">קוביות תקיפה</label>
              <input
                value={form.attack_dice}
                onChange={(e) => update('attack_dice', e.target.value)}
                className="input-fantasy w-full"
                placeholder="2d6"
              />
            </div>
            <div>
              <label className="label-fantasy">קוביות הגנה</label>
              <input
                value={form.defense_dice}
                onChange={(e) => update('defense_dice', e.target.value)}
                className="input-fantasy w-full"
                placeholder="2d6"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg text-gold font-display mb-3">⭐ יכולת מיוחדת</h3>
          <div className="space-y-3">
            <div>
              <label className="label-fantasy">שם היכולת</label>
              <input
                value={form.special_name}
                onChange={(e) => update('special_name', e.target.value)}
                className="input-fantasy w-full"
                placeholder="התקפה אדירה"
              />
            </div>
            <div>
              <label className="label-fantasy">תיאור</label>
              <textarea
                value={form.special_description}
                onChange={(e) => update('special_description', e.target.value)}
                className="input-fantasy w-full"
                rows={2}
              />
            </div>
            <div>
              <label className="label-fantasy">הפעלה</label>
              <select
                value={form.special_trigger}
                onChange={(e) => update('special_trigger', e.target.value)}
                className="input-fantasy w-full"
              >
                {Object.entries(SPECIAL_TRIGGERS).map(([_, value]) => (
                  <option key={value} value={value}>
                    {SPECIAL_TRIGGER_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg text-gold font-display">🌟 אפשרויות שדרוג</h3>
            <button onClick={addOption} className="btn-primary text-sm">
              + הוסף
            </button>
          </div>
          <p className="text-muted text-xs mb-3">
            ב-level-up מוצגות 2 אפשרויות אקראיות מהרשימה שעדיין לא נבחרו.
          </p>
          {form.level_up_options?.length === 0 && (
            <p className="text-muted text-sm text-center py-4">אין אפשרויות. הוסף כדי לאפשר התקדמות.</p>
          )}
          <div className="space-y-2">
            {form.level_up_options?.map((opt, idx) => (
              <div key={opt.id} className="bg-bg/50 border border-primary/40 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted text-xs">#{idx + 1}</span>
                  <button onClick={() => removeOption(idx)} className="text-danger text-sm">
                    הסר
                  </button>
                </div>
                <input
                  value={opt.name}
                  onChange={(e) => updateOption(idx, { name: e.target.value })}
                  className="input-fantasy w-full"
                  placeholder="שם השדרוג"
                />
                <input
                  value={opt.description}
                  onChange={(e) => updateOption(idx, { description: e.target.value })}
                  className="input-fantasy w-full"
                  placeholder="תיאור קצר"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={opt.effect?.stat || 'hp_max'}
                    onChange={(e) => updateOptionEffect(idx, { stat: e.target.value })}
                    className="input-fantasy"
                  >
                    {STAT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={opt.effect?.modifier ?? 1}
                    onChange={(e) =>
                      updateOptionEffect(idx, { modifier: parseInt(e.target.value, 10) || 0 })
                    }
                    className="input-fantasy"
                    placeholder="ערך"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex justify-end gap-2 sticky bottom-2 z-10 bg-bg/80 backdrop-blur p-2 rounded-md">
          <button onClick={() => navigate(ROUTES.GM_TEMPLATES)} className="btn-ghost" disabled={saving}>
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
