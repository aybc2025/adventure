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
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Player has one active hero (v1). Returns the most recent one.
 */
export function usePlayerHero() {
  const { user } = useAuth();
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHero(null);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'players', user.uid, 'heroes'),
      orderBy('last_played', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setHero(null);
        } else {
          const d = snap.docs[0];
          setHero({ id: d.id, ...d.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Hero snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  /**
   * Create a new hero from a template.
   *
   * We copy starting_items from the template so AdventureSelect can
   * read hero.starting_items without an extra Firestore query.
   *
   * PDF rule (p.16): heroes start each adventure with the potions
   * shown on their hero card. The starting_items field encodes that.
   */
  async function createHero(template, customName) {
    if (!user) throw new Error('Not authenticated');
    const heroData = {
      template_id:          template.id,
      custom_name:          customName,
      class:                template.class || template.name,
      hp_max:               template.hp_max,
      attack_dice:          template.attack_dice,
      defense_dice:         template.defense_dice,
      special_name:         template.special_name,
      special_description:  template.special_description,
      special_trigger:      template.special_trigger,
      emoji:                template.emoji,
      level:                1,
      xp:                   0,
      xp_to_next_level:     10,
      applied_upgrades:     [],
      // PDF rule: copy the starting kit so sessions can use it
      starting_items:       template.starting_items || [],
      created_at:           serverTimestamp(),
      last_played:          serverTimestamp()
    };
    const heroRef = await addDoc(
      collection(db, 'players', user.uid, 'heroes'),
      heroData
    );
    return heroRef.id;
  }

  async function updateHero(heroId, data) {
    if (!user) return;
    await updateDoc(doc(db, 'players', user.uid, 'heroes', heroId), data);
  }

  async function deleteHero(heroId) {
    if (!user) return;
    await deleteDoc(doc(db, 'players', user.uid, 'heroes', heroId));
  }

  return { hero, loading, createHero, updateHero, deleteHero };
}
