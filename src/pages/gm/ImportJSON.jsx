import { useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { ROUTES } from '../../config/routes.js';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';

export default function ImportJSON() {
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleImport() {
    setImporting(true);
    setError('');
    setResult(null);

    try {
      const data = JSON.parse(jsonText);
      const stats = { templates: 0, items: 0, adventures: 0, rooms: 0 };

      // Templates
      if (Array.isArray(data.hero_templates)) {
        for (const t of data.hero_templates) {
          const { id, created_at, ...payload } = t;
          if (id) {
            await setDoc(doc(db, 'hero_templates', id), {
              ...payload,
              created_at: serverTimestamp()
            });
          } else {
            await addDoc(collection(db, 'hero_templates'), {
              ...payload,
              created_at: serverTimestamp()
            });
          }
          stats.templates++;
        }
      }

      // Items
      if (Array.isArray(data.items)) {
        for (const it of data.items) {
          const { id, created_at, ...payload } = it;
          if (id) {
            await setDoc(doc(db, 'items', id), {
              ...payload,
              created_at: serverTimestamp()
            });
          } else {
            await addDoc(collection(db, 'items'), {
              ...payload,
              created_at: serverTimestamp()
            });
          }
          stats.items++;
        }
      }

      // Adventures + rooms
      if (Array.isArray(data.adventures)) {
        for (const adv of data.adventures) {
          const { id, rooms: roomList, created_at, ...payload } = adv;

          // Build adventure first (without room_order; we'll set it after creating rooms)
          let advRef;
          if (id) {
            advRef = doc(db, 'adventures', id);
            await setDoc(advRef, {
              ...payload,
              room_order: [],
              created_at: serverTimestamp()
            });
          } else {
            advRef = await addDoc(collection(db, 'adventures'), {
              ...payload,
              room_order: [],
              created_at: serverTimestamp()
            });
          }
          stats.adventures++;

          // Rooms
          const roomIds = [];
          if (Array.isArray(roomList)) {
            const sorted = [...roomList].sort((a, b) => (a.order || 0) - (b.order || 0));
            for (const room of sorted) {
              const { id: rid, ...roomPayload } = room;
              let roomRef;
              if (rid) {
                roomRef = doc(advRef, 'rooms', rid);
                await setDoc(roomRef, roomPayload);
              } else {
                roomRef = await addDoc(collection(advRef, 'rooms'), roomPayload);
              }
              roomIds.push(roomRef.id);
              stats.rooms++;
            }
          }

          // Update adventure with room_order
          if (roomIds.length) {
            await setDoc(advRef, { room_order: roomIds }, { merge: true });
          }
        }
      }

      setResult(stats);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'שגיאה בייבוא');
    } finally {
      setImporting(false);
    }
  }

  async function handleLoadSeed() {
    setError('');
    try {
      const base = import.meta.env.BASE_URL || '/';
      const url = `${base}seed-data.json`.replace(/\/\//g, '/');
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('לא נמצא קובץ seed');
      const txt = await resp.text();
      setJsonText(txt);
    } catch (err) {
      setError(`שגיאה בטעינת seed: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="ייבוא JSON" backTo={ROUTES.GM_DASHBOARD} />
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card>
          <p className="text-text/80 mb-3 text-sm">
            הדבק קובץ JSON שמכיל <code className="text-gold">hero_templates</code>,{' '}
            <code className="text-gold">items</code>, ו/או{' '}
            <code className="text-gold">adventures</code> (כל אחת עם <code>rooms</code> פנימיים).
          </p>
          <div className="flex gap-2 flex-wrap mb-3">
            <button onClick={handleLoadSeed} className="btn-primary text-sm">
              טען seed-data.json
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="input-fantasy w-full font-mono text-xs"
            rows={15}
            dir="ltr"
            placeholder='{"hero_templates": [...], "items": [...], "adventures": [...]}'
          />
        </Card>

        {error && <p className="text-danger text-sm">{error}</p>}
        {result && (
          <Card gold>
            <h3 className="text-gold font-display mb-2">✓ ייבוא הצליח</h3>
            <ul className="text-text/80 text-sm space-y-1">
              <li>כיתות גיבורים: {result.templates}</li>
              <li>פריטים: {result.items}</li>
              <li>הרפתקאות: {result.adventures}</li>
              <li>חדרים: {result.rooms}</li>
            </ul>
          </Card>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleImport}
            className="btn-gold"
            disabled={importing || !jsonText.trim()}
          >
            {importing ? 'מייבא...' : '📥 ייבא'}
          </button>
        </div>
      </main>
    </div>
  );
}
