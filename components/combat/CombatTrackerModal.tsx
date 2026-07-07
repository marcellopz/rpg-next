"use client";

import { useEffect, useState } from "react";
import { startCombat } from "@/app/actions/combat";
import type { CombatState } from "@/lib/combat/types";
import { CombatColorLegend } from "@/components/combat/CombatColorLegend";
import {
  CombatTrackerProvider,
  useCombatTracker,
} from "@/components/combat/CombatTrackerContext";
import { CombatDmNotes } from "@/components/combat/CombatDmNotes";
import { CombatShowHpToggle } from "@/components/combat/CombatShowHpToggle";
import { CombatTrackerFooter } from "@/components/combat/CombatTrackerFooter";
import { CombatTrackerTable } from "@/components/combat/CombatTrackerTable";
import { AddCombatantDialog } from "@/components/combat/dialogs/AddCombatantDialog";
import { Button, Typography } from "@/components/ui";
import "./combat.css";
import { XIcon } from "lucide-react";

function CombatTrackerBody() {
  const { combat, isDm, campaignId, refreshCombat } = useCombatTracker();
  const [addOpen, setAddOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleStartCombat() {
    setStarting(true);
    setStartError(null);
    const result = await startCombat(campaignId);
    setStarting(false);
    if (!result.ok) {
      setStartError(result.error);
      return;
    }
    await refreshCombat();
  }

  if (!combat) {
    return (
      <div className="no-combat">
        <Typography variant="muted" as="p">
          No active combat session.
        </Typography>
        {isDm ? (
          <>
            <Button
              type="button"
              variant="primary"
              className="mt-4"
              disabled={starting}
              onClick={handleStartCombat}
            >
              Start combat
            </Button>
            {startError && (
              <Typography variant="small" className="mt-2 text-red-600">
                {startError}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="muted" className="mt-2">
            The DM can start combat when an encounter begins.
          </Typography>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="combat-tracker-content">
        <CombatTrackerTable />
        <CombatTrackerFooter onAddCombatant={() => setAddOpen(true)} />
        {isDm && (
          <div className="combat-dm-panel">
            <CombatShowHpToggle />
            <CombatDmNotes />
          </div>
        )}
      </div>
      <AddCombatantDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}

export function CombatTrackerModal({
  open,
  campaignId,
  isDm,
  combat,
  onClose,
}: {
  open: boolean;
  campaignId: string;
  isDm: boolean;
  combat: CombatState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="combat-tracker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <CombatTrackerProvider
        campaignId={campaignId}
        isDm={isDm}
        initialCombat={combat}
        enabled={open}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="combat-tracker-title"
          className="combat-tracker relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="combat-tracker-topbar mb-4">
            <Typography variant="h3" as="h2" id="combat-tracker-title">
              Combat tracker
            </Typography>
            <div className="combat-tracker-topbar-actions">
              <CombatColorLegend />
              <XIcon className="w-7 h-7 p-1 cursor-pointer hover:bg-gray-100 rounded-full" onClick={onClose} />
            </div>
          </div>
          <CombatTrackerBody />
        </div>
      </CombatTrackerProvider>
    </div>
  );
}
