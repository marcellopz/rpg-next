"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

type PreviewItem = {
  name: string;
  type: "normal" | "magic" | "consumable" | "other";
  weight: number;
  quantity: number;
};

const ITEMS: PreviewItem[] = [
  { name: "Longsword", type: "normal", weight: 3, quantity: 1 },
  { name: "Chain mail", type: "normal", weight: 55, quantity: 1 },
  { name: "Blightglass vial", type: "magic", weight: 0.2, quantity: 1 },
  { name: "Healing potion", type: "consumable", weight: 0.5, quantity: 2 },
];

const TYPE_CLASS: Record<PreviewItem["type"], string> = {
  normal: "text-gray-600",
  magic: "font-semibold text-violet-600",
  consumable: "font-semibold text-amber-700",
  other: "font-semibold text-sky-700",
};

const COIN_FIELDS = [
  { label: "PP", value: 0, dot: "bg-slate-400" },
  { label: "GP", value: 42, dot: "bg-amber-400" },
  { label: "SP", value: 15, dot: "bg-gray-300" },
  { label: "CP", value: 8, dot: "bg-orange-600" },
];

// A static, hand-built mockup of the inventory tool for the marketing
// homepage — not a real screenshot, so it stays crisp at any size and never
// goes stale when the real UI changes.
export function InventoryPreview() {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Character header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-accent-500 to-accent-700 text-base font-bold text-white">
          M
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">Mara</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1">
              <span className="font-semibold uppercase tracking-wide text-gray-400">STR</span>
              <span className="font-medium tabular-nums text-gray-900">16</span>
            </span>
            {COIN_FIELDS.map((coin) => (
              <span key={coin.label} className="flex items-center gap-1">
                <span className="flex items-center gap-0.5 font-semibold uppercase tracking-wide text-gray-400">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", coin.dot)} aria-hidden />
                  {coin.label}
                </span>
                <span className="font-medium tabular-nums text-gray-900">{coin.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Encumbrance bar */}
      <div className="px-4 pt-3 sm:px-5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="tabular-nums text-gray-600">58.7 / 240 lb</span>
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[0.65rem] font-medium leading-none text-emerald-700">
            Unencumbered
          </span>
        </div>
        <div className="relative mt-1 flex h-2 overflow-hidden rounded-full">
          <div className="h-full w-[50%] bg-emerald-100" />
          <div className="h-full w-[20%] border-l-2 border-white bg-amber-100" />
          <div className="h-full w-[15%] border-l-2 border-white bg-orange-100" />
          <div className="h-full w-[15%] border-l-2 border-white bg-red-100" />
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gray-500"
            style={{ left: "24%" }}
            aria-hidden
          />
        </div>
      </div>

      {/* Item table */}
      <div className="mt-3">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem_3.5rem_3rem] gap-2 border-b border-gray-200 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-400 sm:px-5">
          <span>{t("inventory.table.qty")}</span>
          <span>{t("inventory.table.name")}</span>
          <span>{t("inventory.table.type")}</span>
          <span>{t("inventory.table.weight")}</span>
          <span>{t("inventory.table.total")}</span>
        </div>
        {ITEMS.map((item, index) => (
          <div
            key={item.name}
            className={cn(
              "grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem_3.5rem_3rem] items-center gap-2 px-4 py-2 text-sm sm:px-5",
              index % 2 === 1 && "bg-gray-50"
            )}
          >
            <span className="text-gray-600">{item.quantity}</span>
            <span className={cn("truncate", TYPE_CLASS[item.type])}>{item.name}</span>
            <span className={cn("truncate capitalize", TYPE_CLASS[item.type])}>{item.type}</span>
            <span className="text-gray-600">{item.weight}</span>
            <span className="text-gray-600">{item.weight * item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
