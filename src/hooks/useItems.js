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
  query
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'items'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Items snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  async function createItem(data) {
    const ref = await addDoc(collection(db, 'items'), {
      ...data,
      created_at: serverTimestamp()
    });
    return ref.id;
  }

  async function updateItem(id, data) {
    await updateDoc(doc(db, 'items', id), data);
  }

  async function deleteItem(id) {
    await deleteDoc(doc(db, 'items', id));
  }

  function getItem(id) {
    return items.find((i) => i.id === id);
  }

  return { items, loading, createItem, updateItem, deleteItem, getItem };
}
