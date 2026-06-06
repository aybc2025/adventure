import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useHeroTemplates } from '../../hooks/useHeroTemplates.js';
import { useItems } from '../../hooks/useItems.js';
import { useAdventures } from '../../hooks/useAdventures.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';

export default function GMDashboard() {
  const { templates } = useHeroTemplates();
  const { items } = useItems();
  const { adventures } = useAdventures(false);

  const tiles = [
    {
      to: ROUTES.GM_TEMPLATES,
      emoji: '⚔️',
      title: 'כיתות גיבורים',
      count: templates.length,
      desc: 'הגדר את הכיתות שמהן שחקנים יכולים ליצור גיבור'
    },
    {
      to: ROUTES.GM_ITEMS,
      emoji: '🎒',
      title: 'פריטים',
      count: items.length,
      desc: 'קטלוג הפריטים שיכולים ליפול מהרפתקאות'
    },
    {
      to: ROUTES.GM_ADVENTURES,
      emoji: '🗺️',
      title: 'הרפתקאות',
      count: adventures.length,
      desc: 'נהל הרפתקאות, חדרים, ומפלצות'
    },
    {
      to: ROUTES.GM_HISTORY,
      emoji: '📜',
      title: 'היסטוריה',
      count: null,
      desc: 'צפה במשחקי כל השחקנים'
    },
    {
      to: ROUTES.GM_IMPORT,
      emoji: '📥',
      title: 'ייבוא JSON',
      count: null,
      desc: 'ייבא הרפתקאות מקובץ JSON'
    },
    {
      to: ROUTES.PLAY_HOME,
      emoji: '🎮',
      title: 'מצב שחקן',
      count: null,
      desc: 'עבור לממשק המשחק כשחקן'
    }
  ];

  return (
    <div className="min-h-screen">
      <PageHeader title="🛡️ ממשק ניהול" />
      <main className="max-w-5xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className="card-fantasy hover:card-fantasy-gold hover:scale-[1.02] transition-all animate-fade-in"
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-4xl no-rtl">{tile.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-xl text-gold font-display">{tile.title}</h3>
                  {tile.count !== null && (
                    <p className="text-muted text-sm">{tile.count} פריטים</p>
                  )}
                </div>
              </div>
              <p className="text-text/70 text-sm">{tile.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
