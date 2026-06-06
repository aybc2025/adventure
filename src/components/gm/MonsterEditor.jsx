import { useEffect, useState } from 'react';
import {
  TRIGGER_EVENTS,
  TRIGGER_EVENT_LABELS,
  TRIGGER_EFFECTS,
  TRIGGER_EFFECT_LABELS,
  STATUS_EFFECTS
} from '../../config/constants.js';
import Modal from '../ui/Modal.jsx';

const EMPTY = {
  id: '',
  name: '',
  emoji: '👹',
  hp: 1,
  attack_dice: '1d6',
  defense_dice: '1d6',
  position: { x: 0, y: 0 },
  loot: [],
  triggers: []
};

function genId() {
  return `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export default function MonsterEditor({ open, monster, items, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (monster) setForm({ ...EMPTY, ...monster });
    else setForm({ ...EMPTY, id: genId() });
  }, [monster, open]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // ----- Loot -----
  function addLoot() {
    update('loot', [
      ...(form.loot || []),
      { item_id: items[0]?.id || '', drop_chance: 50 }
    ]);
  }
  function updateLoot(idx, patch) {
    const next = [...(form.loot || [])];
    next[idx] = { ...next[idx], ...patch };
    update('loot', next);
  }
  function removeLoot(idx) {
    const next = [...(form.loot || [])];
    next.splice(idx, 1);
    update('loot', next);
  }

  // ----- Triggers -----
  function addTrigger() {
    update('triggers', [
      ...(form.triggers || []),
      {
        event: TRIGGER_EVENTS.ON_HIT,
        effect: TRIGGER_EFFECTS.DEAL_DAMAGE,
        params: { amount: 1 }
      }
    ]);
  }
  function updateTrigger(idx, patch) {
    const next = [...(form.triggers || [])];
    next[idx] = { ...next[idx], ...patch };
    update('triggers', next);
  }
  function updateTriggerParams(idx, paramsPatch) {
    const next = [...(form.triggers || [])];
    next[idx] = { ...next[idx], params: { ...next[idx].params, ...paramsPatch } };
    update('triggers', next);
  }
  function removeTrigger(idx) {
    const next = [...(form.triggers || [])];
    next.splice(idx, 1);
    update('triggers', next);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      hp: Number(form.hp) || 1,
      position: form.position || { x: 0, y: 0 }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={monster ? 'עריכת מפלצת' : 'מפלצת חדשה'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            ביטול
          </button>
          <button onClick={handleSave} className="btn-gold" disabled={!form.name.trim()}>
            שמור
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Basic */}
        <div className="grid grid-cols-[1fr,80px] gap-2">
          <div>
            <label className="label-fantasy">שם</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input-fantasy w-full"
              placeholder="גובלין"
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
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label-fantasy">HP</label>
            <input
              type="number"
              min={1}
              value={form.hp}
              onChange={(e) => update('hp', parseInt(e.target.value, 10) || 1)}
              className="input-fantasy w-full"
            />
          </div>
          <div>
            <label className="label-fantasy">תקיפה</label>
            <input
              value={form.attack_dice}
              onChange={(e) => update('attack_dice', e.target.value)}
              className="input-fantasy w-full"
              placeholder="1d6"
            />
          </div>
          <div>
            <label className="label-fantasy">הגנה</label>
            <input
              value={form.defense_dice}
              onChange={(e) => update('defense_dice', e.target.value)}
              className="input-fantasy w-full"
              placeholder="1d6"
            />
          </div>
        </div>

        {/* Loot */}
        <div className="bg-bg/40 border border-primary/30 rounded p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gold font-display text-sm">💰 שלל (loot)</span>
            <button onClick={addLoot} className="btn-primary text-xs" disabled={items.length === 0}>
              + פריט
            </button>
          </div>
          {items.length === 0 && (
            <p className="text-muted text-xs">צור פריטים בקטלוג קודם</p>
          )}
          <div className="space-y-1">
            {(form.loot || []).map((l, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <select
                  value={l.item_id}
                  onChange={(e) => updateLoot(idx, { item_id: e.target.value })}
                  className="input-fantasy flex-1 text-sm py-1"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.emoji} {it.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={l.drop_chance ?? 50}
                  onChange={(e) =>
                    updateLoot(idx, { drop_chance: parseInt(e.target.value, 10) || 0 })
                  }
                  className="input-fantasy w-16 text-sm py-1"
                />
                <span className="text-muted text-xs">%</span>
                <button onClick={() => removeLoot(idx)} className="text-danger px-2">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Triggers */}
        <div className="bg-bg/40 border border-primary/30 rounded p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gold font-display text-sm">⚡ Triggers</span>
            <button onClick={addTrigger} className="btn-primary text-xs">
              + Trigger
            </button>
          </div>
          <div className="space-y-2">
            {(form.triggers || []).map((t, idx) => (
              <div key={idx} className="bg-bg border border-muted/30 rounded p-2 space-y-1">
                <div className="flex items-center gap-1">
                  <select
                    value={t.event}
                    onChange={(e) => updateTrigger(idx, { event: e.target.value })}
                    className="input-fantasy flex-1 text-xs py-1"
                  >
                    {Object.values(TRIGGER_EVENTS).map((ev) => (
                      <option key={ev} value={ev}>
                        {TRIGGER_EVENT_LABELS[ev]}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted text-xs">→</span>
                  <select
                    value={t.effect}
                    onChange={(e) => updateTrigger(idx, { effect: e.target.value, params: {} })}
                    className="input-fantasy flex-1 text-xs py-1"
                  >
                    {Object.values(TRIGGER_EFFECTS).map((ef) => (
                      <option key={ef} value={ef}>
                        {TRIGGER_EFFECT_LABELS[ef]}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeTrigger(idx)} className="text-danger px-2">
                    ×
                  </button>
                </div>
                <TriggerParamsEditor
                  effect={t.effect}
                  params={t.params || {}}
                  items={items}
                  onChange={(patch) => updateTriggerParams(idx, patch)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function TriggerParamsEditor({ effect, params, items, onChange }) {
  if (effect === TRIGGER_EFFECTS.DEAL_DAMAGE || effect === TRIGGER_EFFECTS.HEAL) {
    return (
      <div className="grid grid-cols-2 gap-1">
        <input
          type="number"
          value={params.amount ?? 1}
          onChange={(e) => onChange({ amount: parseInt(e.target.value, 10) || 0 })}
          className="input-fantasy text-xs py-1"
          placeholder="כמות"
        />
        <input
          value={params.message || ''}
          onChange={(e) => onChange({ message: e.target.value })}
          className="input-fantasy text-xs py-1"
          placeholder="הודעה (אופציונלי)"
        />
      </div>
    );
  }
  if (effect === TRIGGER_EFFECTS.APPLY_STATUS) {
    return (
      <div className="grid grid-cols-2 gap-1">
        <select
          value={params.status || 'poisoned'}
          onChange={(e) => onChange({ status: e.target.value })}
          className="input-fantasy text-xs py-1"
        >
          {Object.entries(STATUS_EFFECTS).map(([key, def]) => (
            <option key={key} value={key}>
              {def.emoji} {def.label}
            </option>
          ))}
        </select>
        <input
          value={params.message || ''}
          onChange={(e) => onChange({ message: e.target.value })}
          className="input-fantasy text-xs py-1"
          placeholder="הודעה"
        />
      </div>
    );
  }
  if (effect === TRIGGER_EFFECTS.DROP_ITEM) {
    return (
      <div className="grid grid-cols-2 gap-1">
        <select
          value={params.item_id || items[0]?.id || ''}
          onChange={(e) => onChange({ item_id: e.target.value })}
          className="input-fantasy text-xs py-1"
        >
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.emoji} {it.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={params.quantity || 1}
          onChange={(e) => onChange({ quantity: parseInt(e.target.value, 10) || 1 })}
          className="input-fantasy text-xs py-1"
          placeholder="כמות"
        />
      </div>
    );
  }
  if (effect === TRIGGER_EFFECTS.SPAWN_MONSTER) {
    const m = params.monster || { name: '', emoji: '👹', hp: 1, attack_dice: '1d6', defense_dice: '1d6' };
    return (
      <div className="grid grid-cols-2 gap-1">
        <input
          value={m.name || ''}
          onChange={(e) => onChange({ monster: { ...m, name: e.target.value } })}
          className="input-fantasy text-xs py-1"
          placeholder="שם מפלצת"
        />
        <input
          type="number"
          value={m.hp || 1}
          onChange={(e) => onChange({ monster: { ...m, hp: parseInt(e.target.value, 10) || 1 } })}
          className="input-fantasy text-xs py-1"
          placeholder="HP"
        />
      </div>
    );
  }
  return null;
}
