import type { CombatCombatant, CombatState } from "@/lib/combat/types";

function tickConditionsOnTurn(
  combatants: CombatCombatant[],
  turn: number
): CombatCombatant[] {  return combatants.map((c) => {
    if (c.orderIndex !== turn) return c;
    const conditions = c.conditions
      .map((cond) => {
        if (cond.duration === -1) return cond;
        if (cond.duration <= 1) return null;
        return { ...cond, duration: cond.duration - 1 };
      })
      .filter((cond): cond is (typeof c.conditions)[number] => cond !== null);
    return { ...c, conditions };
  });
}

function resetReactionAtTurn(
  combatants: CombatCombatant[],
  turn: number
): CombatCombatant[] {
  return combatants.map((c) =>
    c.orderIndex === turn ? { ...c, usedReaction: false } : c
  );
}

export function applyAdvanceTurn(state: CombatState): CombatState {
  const count = state.combatants.length;
  if (count === 0) return state;

  let combatants = tickConditionsOnTurn(state.combatants, state.session.turn);
  const newTurn = state.session.turn + 1;

  if (newTurn >= count) {
    combatants = resetReactionAtTurn(combatants, 0);
    return {
      session: {
        ...state.session,
        round: state.session.round + 1,
        turn: 0,
      },
      combatants,
    };
  }

  combatants = resetReactionAtTurn(combatants, newTurn);
  return {
    session: { ...state.session, turn: newTurn },
    combatants,
  };
}

export function applyRetreatTurn(state: CombatState): CombatState {
  const count = state.combatants.length;
  const newTurn = state.session.turn - 1;

  if (newTurn < 0) {
    if (state.session.round === 0) return state;
    return {
      session: {
        ...state.session,
        round: state.session.round - 1,
        turn: Math.max(count - 1, 0),
      },
      combatants: state.combatants,
    };
  }

  return {
    session: { ...state.session, turn: newTurn },
    combatants: state.combatants,
  };
}

export function applySetRound(state: CombatState, round: number): CombatState {
  return {
    ...state,
    session: { ...state.session, round },
  };
}

export function applyResetRound(state: CombatState): CombatState {
  return {
    ...state,
    session: { ...state.session, round: 0, turn: 0 },
  };
}

export function applySortByInitiative(state: CombatState): CombatState {
  const sorted = [...state.combatants].sort(
    (a, b) => b.initiative - a.initiative
  );
  return {
    ...state,
    combatants: sorted.map((c, i) => ({ ...c, orderIndex: i })),
  };
}

export function applyCombatantHp(
  state: CombatState,
  combatantId: string,
  hp: number
): CombatState {
  return {
    ...state,
    combatants: state.combatants.map((c) =>
      c.id === combatantId ? { ...c, hp } : c
    ),
  };
}

export function applyReactionUsed(
  state: CombatState,
  combatantId: string,
  used: boolean
): CombatState {
  return {
    ...state,
    combatants: state.combatants.map((c) =>
      c.id === combatantId ? { ...c, usedReaction: used } : c
    ),
  };
}

export function applyShowHpToPlayers(
  state: CombatState,
  show: boolean
): CombatState {
  return {
    ...state,
    session: { ...state.session, showHpToPlayers: show },
  };
}

export function applyDmNotes(state: CombatState, notes: string): CombatState {
  return {
    ...state,
    session: { ...state.session, dmNotes: notes },
  };
}

export function applyReorderCombatants(
  state: CombatState,
  orderedIds: string[]
): CombatState {
  const byId = new Map(state.combatants.map((c) => [c.id, c]));
  const combatants = orderedIds
    .map((id, i) => {
      const c = byId.get(id);
      return c ? { ...c, orderIndex: i } : null;
    })
    .filter((c): c is CombatCombatant => c !== null);
  return { ...state, combatants };
}

export function applyRemoveCombatant(
  state: CombatState,
  combatantId: string
): CombatState {
  const removed = state.combatants.find((c) => c.id === combatantId);
  if (!removed) return state;

  const removedIndex = removed.orderIndex;
  const combatants = state.combatants
    .filter((c) => c.id !== combatantId)
    .map((c, i) => ({ ...c, orderIndex: i }));

  let turn = state.session.turn;
  if (removedIndex < turn) {
    turn -= 1;
  } else if (combatants.length === 0) {
    turn = 0;
  } else if (turn >= combatants.length) {
    turn = combatants.length - 1;
  }

  return {
    ...state,
    session: { ...state.session, turn },
    combatants,
  };
}

type NewCombatantInput = Pick<
  CombatCombatant,
  | "name"
  | "initiative"
  | "hp"
  | "maxHp"
  | "ac"
  | "combatantType"
  | "visible"
  | "nameHidden"
  | "alias"
>;

export function applyAddCombatant(
  state: CombatState,
  input: NewCombatantInput
): CombatState {
  const orderIndex = state.combatants.length;
  const combatant: CombatCombatant = {
    id: `temp-${orderIndex}-${Date.now()}`,
    ...input,
    orderIndex,
    usedReaction: false,
    conditions: [],
  };
  return {
    ...state,
    combatants: [...state.combatants, combatant],
  };
}
