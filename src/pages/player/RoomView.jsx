import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSession } from '../../hooks/useSession.js';
import { usePlayerHero } from '../../hooks/usePlayerHero.js';
import { useInventory } from '../../hooks/useInventory.js';
import { useItems } from '../../hooks/useItems.js';
import { useAdventure } from '../../hooks/useAdventures.js';
import { useRooms } from '../../hooks/useRooms.js';
import { usePlayerHistory } from '../../hooks/useHistory.js';
import { usePlayer } from '../../hooks/usePlayer.js';
import { ROUTES, buildRoute } from '../../config/routes.js';
import { SESSION_STATUS, COMBAT_OUTCOMES } from '../../config/constants.js';
import {
  initCombat,
  playerAttack,
  playerUseItem,
  playerUseSpecial,
  monstersTurn,
  isCombatOver,
  finalizeLoot
} from '../../engine/CombatEngine.js';
import { addXP } from '../../engine/ProgressionEngine.js';

import PageHeader    from '../../components/shared/PageHeader.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import Card          from '../../components/ui/Card.jsx';
import HeroStats     from '../../components/combat/HeroStats.jsx';
import MonsterCard   from '../../components/combat/MonsterCard.jsx';
import GridRenderer  from '../../components/grid/GridRenderer.jsx';
import InventoryBar  from '../../components/combat/InventoryBar.jsx';
import CombatLog     from '../../components/combat/CombatLog.jsx';
import DiceAnimation from '../../components/combat/DiceAnimation.jsx';

const HERO_MOVE_RANGE = 4;
const ATTACK_RANGE    = 1; // Chebyshev distance

export default function RoomView() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, loading: sessionLoading, updateSession } = useSession(sessionId);
  const { hero }   = usePlayerHero();
  const { items }  = useItems();
  const { adventure } = useAdventure(session?.adventure_id);
  const { rooms }  = useRooms(session?.adventure_id);
  const { inventory, syncFromState } = useInventory(hero?.id);
  const { recordHistory }  = usePlayerHistory();
  const { incrementStat }  = usePlayer();

  const [combatState,    setCombatState]    = useState(null);
  const [currentRoom,    setCurrentRoom]    = useState(null);
  const [selectedMonster,setSelectedMonster]= useState(null);
  const [diceOverlay,    setDiceOverlay]    = useState(null);
  const [busy,           setBusy]           = useState(false);
  const [readAloudOpen,  setReadAloudOpen]  = useState(true);
  const [transitioning,  setTransitioning]  = useState(false);
  const [heroPosition,   setHeroPosition]   = useState(null);
  const [movesLeft,      setMovesLeft]      = useState(HERO_MOVE_RANGE);
  const heroPositionRef = useRef(heroPosition);

  // ── Find current room ────────────────────────────────────────
  useEffect(() => {
    if (!session || !rooms.length) return;
    const room = rooms.find((r) => r.id === session.current_room_id);
    setCurrentRoom(room || null);
  }, [session, rooms]);

  // ── Reset position when entering a new room ──────────────────
  useEffect(() => {
    if (!currentRoom?.grid) return;
    const rows = currentRoom.grid.rows || 6;
    setHeroPosition({ x: 0, y: Math.floor(rows / 2) });
    setMovesLeft(HERO_MOVE_RANGE);
  }, [currentRoom?.id]);

  // ── Restore moves at start of player turn ───────────────────
  useEffect(() => {
    if (combatState?.turn === 'player') setMovesLeft(HERO_MOVE_RANGE);
  }, [combatState?.turn]);

  // ── Initialise combat when room loads ───────────────────────
  useEffect(() => {
    if (!currentRoom || !hero || combatState || !session) return;
    const initial = initCombat(
      { ...hero, hp_max: hero.hp_max },
      session.hero_inventory_snapshot || inventory || {},
      currentRoom.monsters || [],
      currentRoom,
      session.hero_hp
    );
    setCombatState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom, hero, session]);

  // ── Keep heroPositionRef in sync ────────────────────────────
  useEffect(() => { heroPositionRef.current = heroPosition; }, [heroPosition]);

  // ── Monster turn — with dice overlay ────────────────────────
  useEffect(() => {
    if (!combatState) return;
    if (combatState.turn !== 'monsters') return;
    if (isCombatOver(combatState)) return;

    const grid       = currentRoom?.grid ?? null;
    const prevLogLen = combatState.log.length;

    const t = setTimeout(() => {
      const { state: newState } = monstersTurn(
        combatState, grid, heroPositionRef.current
      );

      // Find the first monster attack in the new log entries
      const newAttack = newState.log
        .slice(prevLogLen)
        .find((e) => e.type === 'monster_attack' && e.rolls?.length > 0);

      if (newAttack) {
        // Show dice overlay — same style as player attacks
        setDiceOverlay({
          attackRolls:     newAttack.rolls         || [],
          defenseRolls:    newAttack.defense_rolls  || [],
          highestAttack:   newAttack.highestAttack,
          highestDefense:  newAttack.highestDefense,
          attackModifier:  newAttack.attackModifier  || 0,
          defenseModifier: newAttack.defenseModifier || 0,
          isMonsterAttack: true,
          hits:            newAttack.hits,
          label:           newAttack.message,
          onComplete: () => {
            setDiceOverlay(null);
            setCombatState(newState);
          }
        });
      } else {
        // Monster moved but didn't reach the hero yet
        setCombatState(newState);
      }
    }, 800);

    return () => clearTimeout(t);
  }, [combatState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle combat end ────────────────────────────────────────
  useEffect(() => {
    if (!combatState) return;
    if (!isCombatOver(combatState)) return;
    if (transitioning) return;
    if (combatState.outcome === COMBAT_OUTCOMES.PLAYER_DEFEAT) handleDefeat();
    else if (combatState.outcome === COMBAT_OUTCOMES.PLAYER_VICTORY) handleVictory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatState?.outcome]);

  // ── Defeat ──────────────────────────────────────────────────
  async function handleDefeat() {
    if (transitioning) return;
    setTransitioning(true);
    try {
      await updateSession({ status: SESSION_STATUS.FAILED, hero_hp: 0 });
      await recordHistory({
        adventure_id:     session.adventure_id,
        adventure_title:  adventure?.title || 'הרפתקה',
        hero_id:          hero.id,
        hero_name:        hero.custom_name,
        outcome:          'defeat',
        rooms_completed:  session.completed_rooms?.length || 0,
        monsters_defeated:session.monsters_defeated || 0,
        xp_earned:        0,
        duration_minutes: estimateDuration(session.started_at)
      });
      navigate(buildRoute.gameOver(sessionId));
    } catch (err) {
      console.error('Defeat handling error:', err);
      setTransitioning(false);
    }
  }

  // ── Victory ─────────────────────────────────────────────────
  async function handleVictory() {
    if (transitioning) return;
    setTransitioning(true);
    try {
      const { state: finalState, inventory: newInv } = finalizeLoot(combatState);
      await syncFromState(newInv);

      const monstersThisRoom      = (currentRoom.monsters || []).length;
      const updatedCompletedRooms = Array.from(
        new Set([...(session.completed_rooms || []), currentRoom.id])
      );

      const roomOrder   = adventure?.room_order || rooms.map((r) => r.id);
      const currentIdx  = roomOrder.indexOf(currentRoom.id);
      const nextRoomId  = currentIdx >= 0 && currentIdx < roomOrder.length - 1
        ? roomOrder[currentIdx + 1]
        : null;

      if (nextRoomId) {
        // ── Move to next room (with PDF rest: +1 HP) ──────────
        const newInventorySnapshot = {};
        for (const [k, v] of Object.entries(newInv)) {
          newInventorySnapshot[k] = { item_id: v.item_id, quantity: v.quantity };
        }
        // PDF rule (p.16): short rest after each encounter removes 1 damage
        const hpAfterRest = Math.min(finalState.hero.hp + 1, hero.hp_max);

        await updateSession({
          current_room_id:        nextRoomId,
          completed_rooms:        updatedCompletedRooms,
          hero_hp:                hpAfterRest,
          hero_inventory_snapshot:newInventorySnapshot,
          monsters_defeated:      (session.monsters_defeated || 0) + monstersThisRoom
        });
        setCombatState(null);
        setSelectedMonster(null);
        setCurrentRoom(null);
        setReadAloudOpen(true);
        setTransitioning(false);
      } else {
        // ── Adventure complete! ───────────────────────────────
        const xpReward = adventure?.xp_reward || 10;
        await updateSession({
          status:            SESSION_STATUS.COMPLETED,
          completed_rooms:   updatedCompletedRooms,
          monsters_defeated: (session.monsters_defeated || 0) + monstersThisRoom,
          hero_hp:           finalState.hero.hp
        });

        const { updatedHero, leveledUp } = addXP(hero, xpReward);
        const heroRef = doc(db, 'players', user.uid, 'heroes', hero.id);
        await updateDoc(heroRef, {
          xp:                updatedHero.xp,
          level:             updatedHero.level,
          xp_to_next_level:  updatedHero.xp_to_next_level,
          last_played:       serverTimestamp()
        });

        await incrementStat('adventures_completed',    1);
        await incrementStat('total_monsters_defeated', (session.monsters_defeated || 0) + monstersThisRoom);
        await incrementStat('total_xp_earned',         xpReward);

        await recordHistory({
          adventure_id:     session.adventure_id,
          adventure_title:  adventure?.title || 'הרפתקה',
          hero_id:          hero.id,
          hero_name:        hero.custom_name,
          outcome:          'victory',
          rooms_completed:  updatedCompletedRooms.length,
          monsters_defeated:(session.monsters_defeated || 0) + monstersThisRoom,
          xp_earned:        xpReward,
          duration_minutes: estimateDuration(session.started_at)
        });

        if (leveledUp) navigate(buildRoute.levelUp(sessionId));
        else           navigate(buildRoute.gameOver(sessionId));
      }
    } catch (err) {
      console.error('Victory handling error:', err);
      setTransitioning(false);
    }
  }

  // ── Reachable cells BFS ──────────────────────────────────────
  const reachableCellMap = useMemo(() => {
    if (!combatState || combatState.turn !== 'player' || !heroPosition || !currentRoom?.grid || movesLeft <= 0) {
      return new Map();
    }
    const grid    = currentRoom.grid;
    const cols    = grid.cols || 8;
    const rows    = grid.rows || 6;
    const blocked = new Set();
    (grid.cells || []).forEach((c) => { if (c.type === 'wall') blocked.add(`${c.x},${c.y}`); });
    combatState.monsters.forEach((m) => {
      if (m.hp > 0 && m.position) blocked.add(`${m.position.x},${m.position.y}`);
    });
    const distMap = new Map();
    const queue   = [{ x: heroPosition.x, y: heroPosition.y, dist: 0 }];
    const visited = new Set([`${heroPosition.x},${heroPosition.y}`]);
    while (queue.length) {
      const { x, y, dist } = queue.shift();
      if (dist > 0) distMap.set(`${x},${y}`, dist);
      if (dist >= movesLeft) continue;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        const key = `${nx},${ny}`;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        if (blocked.has(key) || visited.has(key)) continue;
        visited.add(key);
        queue.push({ x: nx, y: ny, dist: dist + 1 });
      }
    }
    return distMap;
  }, [combatState?.turn, heroPosition, movesLeft, currentRoom?.grid, combatState?.monsters]);

  const reachableCells = useMemo(
    () => new Set(reachableCellMap.keys()),
    [reachableCellMap]
  );

  // ── Monsters in melee range ─────────────────────────────────
  const inRangeMonsterIds = useMemo(() => {
    if (!heroPosition || !combatState) return new Set();
    return new Set(
      combatState.monsters
        .filter((m) => m.hp > 0 && m.position &&
          Math.max(
            Math.abs(heroPosition.x - m.position.x),
            Math.abs(heroPosition.y - m.position.y)
          ) <= ATTACK_RANGE)
        .map((m) => m.id)
    );
  }, [heroPosition, combatState?.monsters]);

  const canAttackSelected = !!selectedMonster && inRangeMonsterIds.has(selectedMonster);

  // ── Handlers ─────────────────────────────────────────────────
  const handleCellClick = useCallback((x, y) => {
    const dist = reachableCellMap.get(`${x},${y}`);
    if (dist == null) return;
    setHeroPosition({ x, y });
    setMovesLeft((prev) => prev - dist);
    setSelectedMonster(null);
  }, [reachableCellMap]);

  const handleEndTurn = useCallback(() => {
    if (!combatState || combatState.turn !== 'player') return;
    setCombatState((prev) => ({ ...prev, turn: 'monsters' }));
    setSelectedMonster(null);
  }, [combatState]);

  const handleAttack = useCallback(() => {
    if (busy || !combatState || !selectedMonster) return;
    if (combatState.turn !== 'player') return;

    setBusy(true);
    const target = combatState.monsters.find((m) => m.id === selectedMonster);
    const { state: newState, attackResult } = playerAttack(combatState, selectedMonster);

    if (attackResult) {
      setDiceOverlay({
        attackRolls:     attackResult.attackRolls,
        defenseRolls:    attackResult.defenseRolls,
        highestAttack:   attackResult.highestAttack,
        highestDefense:  attackResult.highestDefense,
        attackModifier:  attackResult.attackModifier,
        defenseModifier: attackResult.defenseModifier,
        isMonsterAttack: false,
        hits:            attackResult.hits,
        label:           `${combatState.hero.name} תקף את ${target?.name || ''}`,
        onComplete: () => {
          setDiceOverlay(null);
          setCombatState(newState);
          setSelectedMonster(null);
          setBusy(false);
        }
      });
    } else {
      setCombatState(newState);
      setBusy(false);
    }
  }, [busy, combatState, selectedMonster]);

  const handleUseItem = useCallback((item) => {
    if (busy || !combatState) return;
    const { state: newState } = playerUseItem(combatState, item);
    setCombatState(newState);
  }, [busy, combatState]);

  const handleSpecial = useCallback(() => {
    if (busy || !combatState) return;
    if (combatState.turn !== 'player') return;
    const targetId = selectedMonster || combatState.monsters.find((m) => m.hp > 0)?.id;
    if (!targetId) return;
    const { state } = playerUseSpecial(combatState, { target_id: targetId });
    setCombatState(state);
    setSelectedMonster(null);
  }, [busy, combatState, selectedMonster]);

  // ── Loading / inactive states ────────────────────────────────
  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען הרפתקה..." />
      </div>
    );
  }

  if (session.status !== SESSION_STATUS.ACTIVE) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center max-w-md">
          <p className="text-text mb-3">הרפתקה זו כבר הסתיימה.</p>
          <button onClick={() => navigate(ROUTES.PLAY_HOME)} className="btn-gold">
            חזור לבית
          </button>
        </Card>
      </div>
    );
  }

  if (!currentRoom || !combatState || !hero) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" label="טוען חדר..." />
      </div>
    );
  }

  // ── Derived render values ────────────────────────────────────
  const isPlayerTurn    = combatState.turn === 'player' && !isCombatOver(combatState);
  const livingMonsters  = combatState.monsters.filter((m) => m.hp > 0);
  const specialAvailable =
    combatState.hero.special_name &&
    (combatState.hero.special_trigger !== 'once_per_combat' || !combatState.hero.special_used);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-8">
      <PageHeader title={currentRoom.title || 'חדר'} backTo={ROUTES.PLAY_HOME} />

      <main className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3">

        {/* Read-aloud */}
        {currentRoom.read_aloud && readAloudOpen && (
          <Card className="animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <p className="read-aloud flex-1 mb-0">{currentRoom.read_aloud}</p>
              <button
                onClick={() => setReadAloudOpen(false)}
                className="text-muted hover:text-gold text-xl leading-none mr-1"
                aria-label="סגור"
              >
                ×
              </button>
            </div>
          </Card>
        )}
        {!readAloudOpen && currentRoom.read_aloud && (
          <button
            onClick={() => setReadAloudOpen(true)}
            className="btn-ghost text-sm w-full"
          >
            📖 הצג טקסט קריאה
          </button>
        )}

        {/* Grid */}
        {currentRoom.grid && (
          <div className="animate-fade-in">
            <div className="flex justify-center">
              <GridRenderer
                grid={currentRoom.grid}
                heroPosition={heroPosition}
                heroEmoji={hero.emoji || '⚔️'}
                monsters={combatState.monsters}
                onMonsterClick={(id) => isPlayerTurn && setSelectedMonster(id)}
                selectedMonsterId={selectedMonster}
                onCellClick={isPlayerTurn && movesLeft > 0 ? handleCellClick : null}
                reachableCells={isPlayerTurn ? reachableCells : null}
                inRangeMonsterIds={inRangeMonsterIds}
              />
            </div>
            {isPlayerTurn && (
              <p className="text-center text-muted text-xs mt-1">
                {movesLeft > 0
                  ? `תזוזה: ${movesLeft} משבצות נותרו — לחץ על תא מוזהב לזוז`
                  : 'לא נותרות תזוזות'}
              </p>
            )}
          </div>
        )}

        {/* Hero + monsters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <HeroStats heroState={combatState.hero} />
          <div className="bg-bg/70 border border-primary/40 rounded-lg p-3">
            <div className="text-gold font-display text-sm mb-2">
              מפלצות ({livingMonsters.length})
            </div>
            <div className="space-y-2">
              {combatState.monsters.map((m) => (
                <MonsterCard
                  key={m.id}
                  monster={m}
                  selected={selectedMonster === m.id}
                  onSelect={(id) => isPlayerTurn && setSelectedMonster(id)}
                  disabled={!isPlayerTurn}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <InventoryBar
          inventory={combatState.inventory}
          items={items}
          combatState={combatState}
          onUseItem={handleUseItem}
          disabled={!isPlayerTurn || busy}
        />

        {/* Combat log */}
        <CombatLog entries={combatState.log} />

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sticky bottom-2 z-20">
          <button
            onClick={handleAttack}
            disabled={!isPlayerTurn || !canAttackSelected || busy}
            className="btn-gold"
            title={selectedMonster && !canAttackSelected ? 'מפלצת רחוקה מדי — התקרב אליה תחילה' : ''}
          >
            ⚔️ תקוף
          </button>

          <button
            onClick={handleEndTurn}
            disabled={!isPlayerTurn || busy}
            className="btn-ghost"
          >
            ⏭️ סיים תור
          </button>

          <button
            onClick={handleSpecial}
            disabled={!isPlayerTurn || !specialAvailable || busy}
            className="btn-gold"
            title={combatState.hero.special_description || ''}
          >
            ✨ {combatState.hero.special_name || 'יכולת'}
          </button>

          <div className="text-center text-muted text-xs flex items-center justify-center">
            {isPlayerTurn
              ? 'תורך!'
              : combatState.turn === 'monsters'
                ? 'תור מפלצות...'
                : ''}
          </div>
        </div>

      </main>

      {/* Dice animation overlay */}
      {diceOverlay && <DiceAnimation {...diceOverlay} />}

      {/* Transitioning overlay */}
      {transitioning && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <LoadingSpinner size="large" label="טוען..." />
        </div>
      )}
    </div>
  );
}

function estimateDuration(startedAt) {
  if (!startedAt) return 0;
  const start = startedAt.toMillis
    ? startedAt.toMillis()
    : new Date(startedAt).getTime();
  return Math.round((Date.now() - start) / 60000);
}
