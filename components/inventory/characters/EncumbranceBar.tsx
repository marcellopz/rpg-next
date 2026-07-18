"use client";

import {
  encumbranceColorsI18n,
  encumbrancePercent,
  encumbranceZoneSegmentsI18n,
  formatWeight,
  getEncumbranceZones,
  maxCarryWeight,
} from "../encumbrance";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

// Multi-zone carry bar: green → yellow → orange → red segments are always
// visible; a darker fill grows through each zone as weight increases. A black
// marker line sits at the current carry-weight position.
export function EncumbranceBar({
  strength,
  weight,
}: {
  strength: number;
  weight: number;
}) {
  const { t } = useI18n();
  const zones = getEncumbranceZones(t);
  const max = maxCarryWeight(strength);
  const chip = encumbranceColorsI18n(strength, weight, zones);
  const segments = encumbranceZoneSegmentsI18n(strength, weight, zones);
  const tipLeft = encumbrancePercent(strength, weight);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="tabular-nums text-gray-600">
          {formatWeight(weight)} / {max} lb
        </span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[0.65rem] font-medium leading-none",
            chip.chipClassName
          )}
        >
          {chip.label}
        </span>
      </div>

      <div className="relative">
        <div
          className="flex h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={Math.round(weight * 100) / 100}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Carrying ${formatWeight(weight)} of ${max} lb maximum`}
        >
          {segments.map((segment, index) => (
            <div
              key={index}
              className={cn(
                "relative h-full shrink-0",
                segment.trackClassName,
                index > 0 && "border-l-2 border-white"
              )}
              style={{ width: `${segment.widthPercent}%` }}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width]",
                  segment.fillClassName
                )}
                style={{ width: `${segment.fillRatio}%` }}
              />
            </div>
          ))}
        </div>

        {/* Black marker — vertically centered on the bar, horizontally at weight */}
        <div
          className="pointer-events-none absolute top-1/2 z-10 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-500 transition-[left]"
          style={{ left: `${tipLeft}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
