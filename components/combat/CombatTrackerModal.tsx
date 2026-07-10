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
import { Button, IconButton, Typography } from "@/components/ui";
import "./combat.css";
import { Swords, X } from "lucide-react";

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
      <div className="flex min-h-80 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-700">
          <Swords className="h-5 w-5" aria-hidden />
        </div>
        <Typography variant="h3" as="h3">
          No active encounter
        </Typography>
        <Typography variant="muted" as="p" className="mt-1 max-w-sm leading-6">
          {isDm
            ? "Start an encounter to add combatants and track initiative."
            : "The DM can start combat when an encounter begins."}
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
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 sm:p-6">
        <CombatTrackerTable />
        <CombatTrackerFooter onAddCombatant={() => setAddOpen(true)} />
        {isDm && (
          <section
            aria-label="DM combat settings"
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
          >
            <CombatShowHpToggle />
            <CombatDmNotes />
          </section>
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
      if (
        e.key === "Escape" &&
        !document.querySelector("[data-combat-nested-dialog]")
      ) {
        onClose();
      }
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
          className="combat-tracker relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <Typography variant="h3" as="h2" id="combat-tracker-title">
                Combat tracker
              </Typography>
              <Typography variant="small" as="p" className="mt-0.5">
                Track initiative, health, and active conditions.
              </Typography>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <CombatColorLegend />
              <IconButton
                aria-label="Close combat tracker"
                className="h-8 w-8 shrink-0 rounded-md"
                onClick={onClose}
              >
                <X className="h-4 w-4" aria-hidden />
              </IconButton>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CombatTrackerBody />
          </div>
        </div>
      </CombatTrackerProvider>
    </div>
  );
}
