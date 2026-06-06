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
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SESSION_STATUS } from '../config/constants.js';

/**
 * Hook for the currently active session (if any), and listing past sessions.
 */
export function useActiveSession() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'players', user.uid, 'sessions'),
      where('status', '==', SESSION_STATUS.ACTIVE),
      orderBy('updated_at', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setSession(null);
        } else {
          const d = snap.docs[0];
          setSession({ id: d.id, ...d.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Session snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  return { session, loading };
}

export function useSession(sessionId) {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !sessionId) {
      setLoading(false);
      return;
    }
    const ref = doc(db, 'players', user.uid, 'sessions', sessionId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSession({ id: snap.id, ...snap.data() });
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Session snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, sessionId]);

  async function updateSession(data) {
    if (!user || !sessionId) return;
    await updateDoc(doc(db, 'players', user.uid, 'sessions', sessionId), {
      ...data,
      updated_at: serverTimestamp()
    });
  }

  return { session, loading, updateSession };
}

/**
 * Operations for creating sessions.
 */
export function useSessionOps() {
  const { user } = useAuth();

  async function createSession({ adventureId, heroId, heroHp, inventory, firstRoomId }) {
    if (!user) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, 'players', user.uid, 'sessions'), {
      adventure_id: adventureId,
      hero_id: heroId,
      hero_hp: heroHp,
      hero_inventory_snapshot: inventory || {},
      current_room_id: firstRoomId,
      completed_rooms: [],
      monsters_defeated: 0,
      started_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      status: SESSION_STATUS.ACTIVE
    });
    return ref.id;
  }

  async function deleteSession(sessionId) {
    if (!user) return;
    await deleteDoc(doc(db, 'players', user.uid, 'sessions', sessionId));
  }

  async function getSession(sessionId) {
    if (!user) return null;
    const snap = await getDoc(doc(db, 'players', user.uid, 'sessions', sessionId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  return { createSession, deleteSession, getSession };
}
