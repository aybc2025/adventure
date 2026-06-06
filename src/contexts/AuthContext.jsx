import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isGMEmail } from '../config/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Ensure /players/{uid} doc exists
        try {
          const playerRef = doc(db, 'players', fbUser.uid);
          const snap = await getDoc(playerRef);
          if (!snap.exists()) {
            await setDoc(playerRef, {
              display_name: fbUser.displayName || 'גיבור',
              email: fbUser.email || '',
              created_at: serverTimestamp(),
              stats: {
                adventures_completed: 0,
                total_monsters_defeated: 0,
                total_xp_earned: 0
              }
            });
          }
        } catch (err) {
          console.error('Failed to create/get player doc:', err);
        }

        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          isGM: isGMEmail(fbUser.email)
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn() {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('הכניסה בוטלה');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('הדפדפן חסם את חלון הכניסה. אנא אפשר חלונות קופצים.');
      } else {
        setAuthError('שגיאת כניסה. נסה שוב.');
      }
    }
  }

  async function signOutUser() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
