import { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
  limit as fbLimit
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * History of the current player's games.
 */
export function usePlayerHistory(limitCount = 50) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'players', user.uid, 'history'),
      orderBy('played_at', 'desc'),
      fbLimit(limitCount)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('History snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, limitCount]);

  async function recordHistory(data) {
    if (!user) return;
    await addDoc(collection(db, 'players', user.uid, 'history'), {
      ...data,
      played_at: serverTimestamp()
    });
  }

  return { history, loading, recordHistory };
}

/**
 * GM-only: history across all players via collection group query.
 */
export function useGMHistory(limitCount = 200) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isGM) {
      setHistory([]);
      setLoading(false);
      return;
    }
    const q = query(
      collectionGroup(db, 'history'),
      orderBy('played_at', 'desc'),
      fbLimit(limitCount)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const playerUid = d.ref.parent.parent?.id || null;
          return { id: d.id, player_uid: playerUid, ...d.data() };
        });
        setHistory(rows);
        setLoading(false);
      },
      (err) => {
        console.error('GM history snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, limitCount]);

  return { history, loading };
}
