import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeroTemplates } from '../../hooks/useHeroTemplates.js';
import { usePlayerHero } from '../../hooks/usePlayerHero.js';
import { ROUTES } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function HeroCreate() {
  const { templates, loading } = useHeroTemplates();
  const { createHero } = usePlayerHero();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!selected || !name.trim()) {
      setError('אנא הזן שם לגיבור');
      return;
    }
    setSaving(true);
    try {
      await createHero(selected, name.trim());
      navigate(ROUTES.PLAY_HOME);
    } catch (err) {
      console.error('Create hero error:', err);
      setError('שגיאה ביצירת הגיבור. נסה שוב.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען גיבורים..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="בחר גיבור" backTo={ROUTES.PLAY_HOME} />

      <main className="max-w-5xl mx-auto p-4">
        {templates.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80 mb-2">אין עדיין כיתות גיבורים זמינות.</p>
            <p className="text-muted text-sm">ה-GM צריך ליצור כיתות גיבורים תחילה.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="card-fantasy text-right hover:card-fantasy-gold hover:scale-[1.02] transition-all animate-fade-in"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-5xl no-rtl">{t.emoji || '⚔️'}</span>
                  <div className="flex-1">
                    <h3 className="text-xl text-gold font-display">{t.name}</h3>
                    <p className="text-muted text-xs">{t.class}</p>
                  </div>
                </div>
                {t.description && (
                  <p className="text-text/80 text-sm mb-3">{t.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-bg/50 rounded p-2">
                    <div className="text-muted">HP</div>
                    <div className="text-gold font-display text-lg">{t.hp_max}</div>
                  </div>
                  <div className="bg-bg/50 rounded p-2">
                    <div className="text-muted">תקיפה</div>
                    <div className="text-gold font-display">{t.attack_dice}</div>
                  </div>
                  <div className="bg-bg/50 rounded p-2">
                    <div className="text-muted">הגנה</div>
                    <div className="text-gold font-display">{t.defense_dice}</div>
                  </div>
                </div>
                {t.special_name && (
                  <div className="mt-3 pt-3 border-t border-gold/20">
                    <div className="text-gold text-sm font-display">⭐ {t.special_name}</div>
                    {t.special_description && (
                      <div className="text-muted text-xs mt-1">{t.special_description}</div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <Modal
          open={!!selected}
          onClose={() => {
            setSelected(null);
            setName('');
            setError('');
          }}
          title={selected ? `${selected.emoji || ''} ${selected.name}` : ''}
          footer={
            <>
              <button
                onClick={() => {
                  setSelected(null);
                  setName('');
                  setError('');
                }}
                className="btn-ghost"
                disabled={saving}
              >
                ביטול
              </button>
              <button
                onClick={handleConfirm}
                className="btn-gold"
                disabled={saving || !name.trim()}
              >
                {saving ? 'יוצר...' : 'יצירה'}
              </button>
            </>
          }
        >
          <p className="text-text/80 mb-4">תן שם לגיבור שלך:</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: אריאל"
            className="input-fantasy w-full"
            autoFocus
            maxLength={30}
          />
          {error && <p className="text-danger text-sm mt-2">{error}</p>}
        </Modal>
      </main>
    </div>
  );
}
