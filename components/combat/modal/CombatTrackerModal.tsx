"use client";

import { useEffect, useState } from "react";
import { startCombat } from "@/app/actions/combat";
import { useI18n } from "@/lib/i18n/context";
import { CombatColorLegend } from "@/components/combat/modal/CombatColorLegend";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { CombatDmNotes } from "@/components/combat/modal/CombatDmNotes";
import { CombatShowHpToggle } from "@/components/combat/modal/CombatShowHpToggle";
import { CombatTrackerFooter } from "@/components/combat/modal/CombatTrackerFooter";
import { CombatTrackerTable } from "@/components/combat/table/CombatTrackerTable";
import { AddCombatantDialog } from "@/components/combat/dialogs/AddCombatantDialog";
import { Button, IconButton, Typography } from "@/components/ui";
import "../combat.css";
import { Swords, X } from "lucide-react";

function CombatTrackerBody() {
  const { t } = useI18n();
  const { combat, isDm, campaignId, refreshCombat, localOnly, setCombat } =
    useCombatTracker();
  const [addOpen, setAddOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleStartCombat() {
    setStarting(true);
    setStartError(null);
    if (localOnly) {
      setCombat((prev) =>
        prev
          ? {
              ...prev,
              session: {
                ...prev.session,
                active: true,
                updatedAt: new Date().toISOString(),
              },
            }
          : prev
      );
      setStarting(false);
      return;
    }
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
          {t("combat.noEncounter")}
        </Typography>
        <Typography variant="muted" as="p" className="mt-1 max-w-sm leading-6">
          {isDm
            ? t("combat.startEncounter")
            : t("combat.join")}
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
              {t("combat.start")}
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

function CombatDemoRoleSwitch({ id }: { id?: string }) {
  const { t } = useI18n();
  const { isDm, setIsDm, localOnly } = useCombatTracker();
  if (!localOnly || !setIsDm) return null;

  return (
    <div
      id={id}
      role="group"
      aria-label={t("combat.role")}
      className="inline-flex shrink-0 rounded-md border border-gray-300 bg-gray-100 p-0.5"
    >
      {(
        [
          { value: true, label: t("campaign.dm") },
          { value: false, label: t("campaign.player") },
        ] as const
      ).map((option) => {
        const active = isDm === option.value;
        return (
          <Button
            key={option.label}
            size="xs"
            variant={active ? "primary" : "ghost"}
            aria-pressed={active}
            onClick={() => setIsDm(option.value)}
            className={
              active
                ? "shadow-none"
                : "text-gray-600 hover:bg-transparent hover:text-gray-900"
            }
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function CombatTrackerHeader({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <header className="flex items-start gap-3 border-b border-gray-200 px-4 py-4 sm:items-center sm:px-6">
      <div className="min-w-0 flex-1">
        <Typography variant="h3" as="h2" id="combat-tracker-title">
          {t("combat.tool")}
        </Typography>
        <Typography variant="small" as="p" className="mt-0.5">
          {t("combat.subtitle")}
        </Typography>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:hidden">
          <CombatDemoRoleSwitch id="combat-demo-role-mobile" />
          <CombatColorLegend compact />
        </div>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <CombatDemoRoleSwitch id="combat-demo-role" />
        <CombatColorLegend />
      </div>
      <IconButton
        aria-label="Close combat tracker"
        className="h-8 w-8 shrink-0 rounded-md"
        onClick={onClose}
      >
        <X className="h-4 w-4" aria-hidden />
      </IconButton>
    </header>
  );
}

export function CombatTrackerModal({
  open,
  onClose,
}: {
  open: boolean;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="combat-tracker-title"
        className="combat-tracker relative flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CombatTrackerHeader onClose={onClose} />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <CombatTrackerBody />
        </div>
      </div>
    </div>
  );
}
