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

export function useHeroTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'hero_templates'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Templates snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  async function createTemplate(data) {
    const docRef = await addDoc(collection(db, 'hero_templates'), {
      ...data,
      created_at: serverTimestamp()
    });
    return docRef.id;
  }

  async function updateTemplate(id, data) {
    await updateDoc(doc(db, 'hero_templates', id), data);
  }

  async function deleteTemplate(id) {
    await deleteDoc(doc(db, 'hero_templates', id));
  }

  return { templates, loading, createTemplate, updateTemplate, deleteTemplate };
}
