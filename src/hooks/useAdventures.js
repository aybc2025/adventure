import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * onlyPublished: when true, returns only published adventures (player view).
 * When false, returns all (GM view).
 */
export function useAdventures(onlyPublished = false) {
  const { user } = useAuth();
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAdventures([]);
      setLoading(false);
      return;
    }
    let q;
    if (onlyPublished) {
      q = query(
        collection(db, 'adventures'),
        where('published', '==', true),
        orderBy('created_at', 'desc')
      );
    } else {
      q = query(collection(db, 'adventures'), orderBy('created_at', 'desc'));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAdventures(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Adventures snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, onlyPublished]);

  async function createAdventure(data) {
    const ref = await addDoc(collection(db, 'adventures'), {
      ...data,
      created_at: serverTimestamp(),
      published: data.published ?? false
    });
    return ref.id;
  }

  async function updateAdventure(id, data) {
    await updateDoc(doc(db, 'adventures', id), data);
  }

  async function deleteAdventure(id) {
    // Delete subcollection rooms first
    const roomsSnap = await getDocs(collection(db, 'adventures', id, 'rooms'));
    for (const r of roomsSnap.docs) {
      await deleteDoc(r.ref);
    }
    await deleteDoc(doc(db, 'adventures', id));
  }

  return { adventures, loading, createAdventure, updateAdventure, deleteAdventure };
}

export function useAdventure(advId) {
  const { user } = useAuth();
  const [adventure, setAdventure] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !advId) {
      setAdventure(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'adventures', advId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setAdventure({ id: snap.id, ...snap.data() });
        } else {
          setAdventure(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Adventure snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, advId]);

  return { adventure, loading };
}
