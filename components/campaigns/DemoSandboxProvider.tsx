"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { NoteScope } from "@/app/actions/categories";
import { DEMO_PAGES, getDemoCampaign } from "@/data/demo-campaign";
import type { CombatState } from "@/lib/combat/types";
import type { Character } from "@/lib/queries/inventory";
import type { NotePage, NoteTree, NoteTrees } from "@/lib/queries/notes";

export type DemoSandboxValue = {
  noteTrees: NoteTrees;
  setNoteTree: (scope: NoteScope, tree: NoteTree) => void;
  pagesById: Record<string, NotePage>;
  upsertPage: (page: NotePage) => void;
  removePage: (pageId: string) => void;
  characters: Character[];
  setCharacters: Dispatch<SetStateAction<Character[]>>;
  combat: CombatState;
  setCombat: Dispatch<SetStateAction<CombatState>>;
  combatIsDm: boolean;
  setCombatIsDm: (isDm: boolean) => void;
};

const DemoSandboxContext = createContext<DemoSandboxValue | null>(null);

function cloneSeed() {
  const demo = getDemoCampaign();
  return {
    noteTrees: structuredClone(demo.noteTrees),
    pagesById: structuredClone(DEMO_PAGES),
    characters: structuredClone(demo.characters),
    combat: structuredClone(demo.combat),
  };
}

export function DemoSandboxProvider({ children }: { children: ReactNode }) {
  const [seed] = useState(cloneSeed);
  const [noteTrees, setNoteTrees] = useState<NoteTrees>(seed.noteTrees);
  const [pagesById, setPagesById] = useState<Record<string, NotePage>>(
    seed.pagesById
  );
  const [characters, setCharacters] = useState<Character[]>(seed.characters);
  const [combat, setCombat] = useState<CombatState>(seed.combat);
  const [combatIsDm, setCombatIsDm] = useState(true);

  const setNoteTree = useCallback((scope: NoteScope, tree: NoteTree) => {
    setNoteTrees((prev) =>
      prev[scope] === tree ? prev : { ...prev, [scope]: tree }
    );
  }, []);

  const upsertPage = useCallback((page: NotePage) => {
    setPagesById((prev) => ({ ...prev, [page.id]: page }));
  }, []);

  const removePage = useCallback((pageId: string) => {
    setPagesById((prev) => {
      if (!(pageId in prev)) return prev;
      const next = { ...prev };
      delete next[pageId];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      noteTrees,
      setNoteTree,
      pagesById,
      upsertPage,
      removePage,
      characters,
      setCharacters,
      combat,
      setCombat,
      combatIsDm,
      setCombatIsDm,
    }),
    [
      noteTrees,
      setNoteTree,
      pagesById,
      upsertPage,
      removePage,
      characters,
      combat,
      combatIsDm,
    ]
  );

  return (
    <DemoSandboxContext.Provider value={value}>
      {children}
    </DemoSandboxContext.Provider>
  );
}

export function useOptionalDemoSandbox(): DemoSandboxValue | null {
  return useContext(DemoSandboxContext);
}

export function useDemoSandbox(): DemoSandboxValue {
  const ctx = useContext(DemoSandboxContext);
  if (!ctx) {
    throw new Error("useDemoSandbox must be used within DemoSandboxProvider");
  }
  return ctx;
}
