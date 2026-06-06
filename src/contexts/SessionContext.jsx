import { createContext, useContext, useState } from 'react';

const SessionContext = createContext(null);

/**
 * SessionContext holds the active combat state in memory during a play session.
 * Firestore is the source of truth for persisted session data;
 * this context holds the live combat engine state.
 */
export function SessionProvider({ children }) {
  const [combatState, setCombatState] = useState(null);
  const [animation, setAnimation] = useState(null); // { type, target, data }
  const [pendingAttack, setPendingAttack] = useState(null);

  function clearSession() {
    setCombatState(null);
    setAnimation(null);
    setPendingAttack(null);
  }

  return (
    <SessionContext.Provider
      value={{
        combatState,
        setCombatState,
        animation,
        setAnimation,
        pendingAttack,
        setPendingAttack,
        clearSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used inside SessionProvider');
  return ctx;
}
