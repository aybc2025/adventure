import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useInventory(heroId) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !heroId) {
      setInventory({});
      setLoading(false);
      return;
    }
    const ref = collection(db, 'players', user.uid, 'heroes', heroId, 'inventory');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const inv = {};
        snap.forEach((d) => {
          inv[d.id] = { ...d.data() };
        });
        setInventory(inv);
        setLoading(false);
      },
      (err) => {
        console.error('Inventory snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user, heroId]);

  async function addItem(itemId, quantity = 1) {
    if (!user || !heroId) return;
    const ref = doc(db, 'players', user.uid, 'heroes', heroId, 'inventory', itemId);
    const current = inventory[itemId];
    if (current) {
      await setDoc(ref, {
        item_id: itemId,
        quantity: current.quantity + quantity,
        acquired_at: current.acquired_at || serverTimestamp()
      });
    } else {
      await setDoc(ref, {
        item_id: itemId,
        quantity,
        acquired_at: serverTimestamp()
      });
    }
  }

  async function setQuantity(itemId, quantity) {
    if (!user || !heroId) return;
    const ref = doc(db, 'players', user.uid, 'heroes', heroId, 'inventory', itemId);
    if (quantity <= 0) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        item_id: itemId,
        quantity,
        acquired_at: serverTimestamp()
      });
    }
  }

  /**
   * Bulk sync from an in-memory inventory snapshot (used at end of combat).
   */
  async function syncFromState(newInventory) {
    if (!user || !heroId) return;
    const batch = writeBatch(db);
    const collRef = collection(db, 'players', user.uid, 'heroes', heroId, 'inventory');

    // Set/update each item in new inventory
    for (const [itemId, entry] of Object.entries(newInventory)) {
      const itemRef = doc(collRef, itemId);
      batch.set(itemRef, {
        item_id: itemId,
        quantity: entry.quantity,
        acquired_at: entry.acquired_at || Date.now()
      });
    }

    // Remove items no longer in inventory
    for (const oldId of Object.keys(inventory)) {
      if (!newInventory[oldId]) {
        batch.delete(doc(collRef, oldId));
      }
    }

    await batch.commit();
  }

  return { inventory, loading, addItem, setQuantity, syncFromState };
}
