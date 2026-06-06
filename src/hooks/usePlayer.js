import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function usePlayer() {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlayer(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'players', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setPlayer({ id: snap.id, ...snap.data() });
        } else {
          setPlayer(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Player snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  async function incrementStat(field, amount = 1) {
    if (!user) return;
    const ref = doc(db, 'players', user.uid);
    try {
      await updateDoc(ref, { [`stats.${field}`]: increment(amount) });
    } catch (err) {
      console.error('incrementStat error:', err);
    }
  }

  return { player, loading, incrementStat };
}
