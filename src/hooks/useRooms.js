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
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useRooms(advId) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !advId) {
      setRooms([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'adventures', advId, 'rooms'),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Rooms snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, advId]);

  async function createRoom(data) {
    const ref = await addDoc(collection(db, 'adventures', advId, 'rooms'), {
      ...data,
      created_at: serverTimestamp()
    });
    return ref.id;
  }

  async function updateRoom(roomId, data) {
    await updateDoc(doc(db, 'adventures', advId, 'rooms', roomId), data);
  }

  async function deleteRoom(roomId) {
    await deleteDoc(doc(db, 'adventures', advId, 'rooms', roomId));
  }

  async function getRoom(roomId) {
    const snap = await getDoc(doc(db, 'adventures', advId, 'rooms', roomId));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  }

  return { rooms, loading, createRoom, updateRoom, deleteRoom, getRoom };
}
