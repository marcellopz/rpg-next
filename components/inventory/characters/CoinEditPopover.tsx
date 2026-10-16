"use client";

import { useEffect, useRef, useState } from "react";
import { Button, TextField } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

type Mode = "add" | "subtract";

const QUICK_AMOUNTS = [1, 10, 100];

export function CoinEditPopover({
  value,
  label,
  dotClassName,
  readOnly,
  onCommit,
}: {
  value: number;
  label: string;
  dotClassName: string;
  readOnly?: boolean;
  onCommit: (value: number) => Promise<void>;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [amount, setAmount] = useState("");
  const [exact, setExact] = useState(String(value));
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      setMode("add");
      setAmount("");
      setExact(String(value));
    }
    setOpen((current) => !current);
  }

  async function save(next: number) {
    const normalized = Math.max(0, Math.trunc(next));
    if (!Number.isFinite(normalized)) return;
    setBusy(true);
    await onCommit(normalized);
    setBusy(false);
    setOpen(false);
  }

  const delta = Math.trunc(Number(amount));
  const validDelta = Number.isFinite(delta) && delta > 0;
  const result = validDelta
    ? Math.max(0, mode === "add" ? value + delta : value - delta)
    : value;
  const adding = mode === "add";

  // Quick buttons only change the amount field; the operation (add or
  // subtract) is chosen by the toggle above. The amount never goes negative.
  const currentAmount = validDelta ? delta : 0;
  function nudgeAmount(step: number) {
    const next = currentAmount + step;
    if (next < 0) return;
    setAmount(next === 0 ? "" : String(next));
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-0.5">
      <span className="flex items-center gap-0.5 font-semibold uppercase tracking-wide text-gray-400">
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", dotClassName)}
          aria-hidden="true"
        />
        {label}
      </span>
      {readOnly ? (
        <span className="min-w-[1.75rem] px-1 font-medium tabular-nums text-gray-900">
          {value}
        </span>
      ) : (
        <button
          type="button"
          aria-label={t("inventory.editCoins", { coin: label })}
          aria-expanded={open}
          onClick={toggle}
          className="min-w-[1.75rem] rounded px-1 text-left font-medium tabular-nums text-gray-900 hover:bg-accent-50 hover:text-accent-700"
        >
          {value}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t("inventory.editCoins", { coin: label })}
          className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 text-sm normal-case shadow-xl"
        >
          <p className="mb-2 font-semibold text-gray-900">
            {t("inventory.editCoins", { coin: label })}
            <span className="ml-1 font-normal text-gray-500">({value})</span>
          </p>

          <div
            role="group"
            aria-label={t("inventory.coinMode")}
            className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
          >
            <button
              type="button"
              aria-pressed={adding}
              onClick={() => setMode("add")}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm font-semibold transition",
                adding
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              )}
            >
              + {t("inventory.coinAdd")}
            </button>
            <button
              type="button"
              aria-pressed={!adding}
              onClick={() => setMode("subtract")}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm font-semibold transition",
                !adding
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              )}
            >
              − {t("inventory.coinSubtract")}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "w-4 text-center text-lg font-bold",
                adding ? "text-green-600" : "text-red-600"
              )}
            >
              {adding ? "+" : "−"}
            </span>
            <TextField
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={amount}
              placeholder="0"
              aria-label={t("inventory.coinAmount")}
              onChange={(event) => setAmount(event.target.value)}
              className={cn(
                "py-1.5",
                adding
                  ? "border-green-300 focus:border-green-500"
                  : "border-red-300 focus:border-red-500"
              )}
            />
          </div>

          {([1, -1] as const).map((sign) => (
            <div key={sign} className="mt-2 grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((step) => (
                <Button
                  key={step}
                  variant="secondary"
                  size="sm"
                  className="py-2"
                  disabled={currentAmount + sign * step < 0}
                  onClick={() => nudgeAmount(sign * step)}
                >
                  {sign > 0 ? "+" : "−"}
                  {step}
                </Button>
              ))}
            </div>
          ))}

          <Button
            variant={adding ? "primary" : "danger"}
            size="sm"
            fullWidth
            className={cn("mt-3", adding && "bg-green-600 hover:bg-green-500")}
            disabled={busy || !validDelta}
            onClick={() => void save(result)}
          >
            {busy
              ? t("buttons.loading")
              : t(adding ? "inventory.coinApplyAdd" : "inventory.coinApplySubtract", {
                  amount: validDelta ? delta : 0,
                  coin: label,
                })}
          </Button>
          {validDelta && (
            <p className="mt-1.5 text-center text-xs tabular-nums text-gray-500">
              {value} → {result}
            </p>
          )}

          <div className="my-3 border-t border-gray-100" />
          <TextField
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={exact}
            onChange={(event) => setExact(event.target.value)}
            label={t("inventory.coinExactValue")}
            className="py-1.5"
          />
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-2"
            disabled={
              busy || exact.trim() === "" || !Number.isFinite(Number(exact)) || Number(exact) < 0
            }
            onClick={() => void save(Number(exact))}
          >
            {t("inventory.coinSet")}
          </Button>
        </div>
      )}
    </div>
  );
}
