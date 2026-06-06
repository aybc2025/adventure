import { useMemo, useState } from 'react';
import { useGMHistory } from '../../hooks/useHistory.js';
import { ROUTES } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function GMHistory() {
  const { history, loading } = useGMHistory();
  const [filterOutcome, setFilterOutcome] = useState('all');

  const filtered = useMemo(() => {
    if (filterOutcome === 'all') return history;
    return history.filter((h) => h.outcome === filterOutcome);
  }, [history, filterOutcome]);

  function exportCSV() {
    const headers = ['שחקן UID', 'גיבור', 'הרפתקה', 'תוצאה', 'חדרים', 'מפלצות', 'XP', 'דקות', 'תאריך'];
    const rows = filtered.map((h) => [
      h.player_uid || '',
      h.hero_name || '',
      h.adventure_title || '',
      h.outcome === 'victory' ? 'ניצחון' : 'הפסד',
      h.rooms_completed || 0,
      h.monsters_defeated || 0,
      h.xp_earned || 0,
      h.duration_minutes || 0,
      formatDate(h.played_at)
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hero-kids-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען היסטוריה..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="היסטוריית כל השחקנים" backTo={ROUTES.GM_DASHBOARD} />
      <main className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex gap-1">
            {['all', 'victory', 'defeat'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterOutcome(f)}
                className={`text-xs px-3 py-1.5 rounded ${
                  filterOutcome === f ? 'bg-gold text-bg' : 'bg-surface text-text border border-primary/50'
                }`}
              >
                {f === 'all' ? 'הכל' : f === 'victory' ? '🏆 ניצחונות' : '💀 הפסדים'}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-primary text-sm" disabled={filtered.length === 0}>
            📥 ייצא CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <Card className="text-center">
            <p className="text-text/80">אין משחקים תואמים לסינון.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => (
              <Card key={h.id} className="animate-fade-in">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gold font-display">{h.adventure_title}</span>
                      <Badge variant={h.outcome === 'victory' ? 'gold' : 'danger'}>
                        {h.outcome === 'victory' ? '🏆' : '💀'}
                      </Badge>
                    </div>
                    <p className="text-muted text-xs mt-1">
                      גיבור: <span className="text-text">{h.hero_name}</span> •{' '}
                      שחקן: <code className="text-xs">{(h.player_uid || '').slice(0, 8)}…</code> •{' '}
                      {formatDate(h.played_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs text-muted">
                    <span>חדרים: <span className="text-text">{h.rooms_completed || 0}</span></span>
                    <span>מפלצות: <span className="text-text">{h.monsters_defeated || 0}</span></span>
                    <span>XP: <span className="text-gold">+{h.xp_earned || 0}</span></span>
                    <span>{h.duration_minutes || 0}'</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
