"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  listPinsLinkedToPage,
  unlinkPinFromPage,
} from "@/app/actions/map-pin-links";
import { useI18n } from "@/lib/i18n/context";
import { PIN_TYPE_STYLES, type LinkedPin } from "@/lib/map/types";
import { LinkPinDialog } from "./LinkPinDialog";

export function PageLinkedPins({
  pageId,
  campaignId,
  publicCode,
  canEdit,
  pickerOpen,
  onPickerClose,
}: {
  pageId: string;
  campaignId: string;
  publicCode: string;
  canEdit: boolean;
  /** The "link a pin" picker is triggered from the editor toolbar, not here. */
  pickerOpen: boolean;
  onPickerClose: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pins, setPins] = useState<LinkedPin[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await listPinsLinkedToPage(pageId);
    if (result.ok) setPins(result.data);
    setLoading(false);
  }, [pageId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleUnlink(pinId: string) {
    setPins((prev) => prev.filter((p) => p.pinId !== pinId));
    const result = await unlinkPinFromPage({ pinId, pageId });
    if (!result.ok) void refresh();
  }

  return (
    <>
      {pins.length > 0 && (
        <div
          id="page-linked-pins"
          className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-4 py-2 md:px-6"
        >
          {pins.map((pin) => (
            <span
              key={pin.pinId}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-0.5 pl-2.5 pr-1 text-xs"
            >
              <button
                type="button"
                onClick={() =>
                  router.push(`/campaigns/${publicCode}?tool=map&pin=${pin.pinId}`)
                }
                className="flex items-center gap-1.5 text-accent-700 hover:underline"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${PIN_TYPE_STYLES[pin.type].dot}`}
                  aria-hidden
                />
                {pin.label}
              </button>
              {canEdit && (
                <button
                  type="button"
                  aria-label={t("map.unlinkPin")}
                  onClick={() => void handleUnlink(pin.pinId)}
                  className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {pickerOpen && !loading && (
        <LinkPinDialog
          pageId={pageId}
          campaignId={campaignId}
          linkedPinIds={new Set(pins.map((p) => p.pinId))}
          onClose={onPickerClose}
          onLinked={() => {
            onPickerClose();
            void refresh();
          }}
        />
      )}
    </>
  );
}
