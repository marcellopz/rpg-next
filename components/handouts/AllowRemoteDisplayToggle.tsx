"use client";

import { useI18n } from "@/lib/i18n/context";
import { useHandoutBroadcast } from "./HandoutBroadcastContext";

export function AllowRemoteDisplayToggle() {
  const { t } = useI18n();
  const { allowRemoteDisplay, setAllowRemoteDisplay } = useHandoutBroadcast();

  return (
    <label
      title={t("handouts.allowRemoteDisplayHint")}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-xs font-medium text-white"
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={allowRemoteDisplay}
          onChange={(e) => setAllowRemoteDisplay(e.target.checked)}
        />
        <span className="h-5 w-9 rounded-full bg-white/30 transition peer-checked:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-white/70 peer-focus-visible:ring-offset-1" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 peer-checked:bg-accent-600" />
      </span>
      {t("handouts.allowRemoteDisplay")}
    </label>
  );
}
