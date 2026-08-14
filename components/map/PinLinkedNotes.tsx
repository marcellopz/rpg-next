"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Plus, X } from "lucide-react";
import {
  listPagesLinkedToPin,
  unlinkPinFromPage,
} from "@/app/actions/map-pin-links";
import { useI18n } from "@/lib/i18n/context";
import type { LinkedNote } from "@/lib/map/types";
import { LinkNoteDialog } from "./LinkNoteDialog";

function noteHref(publicCode: string, note: LinkedNote): string {
  const params = new URLSearchParams();
  if (note.visibility === "private") params.set("tab", "my");
  params.set("page", note.pageId);
  return `/campaigns/${publicCode}?${params.toString()}`;
}

export function PinLinkedNotes({
  pinId,
  campaignId,
  publicCode,
  readOnly,
}: {
  pinId: string;
  campaignId: string;
  publicCode: string;
  readOnly: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [notes, setNotes] = useState<LinkedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listPagesLinkedToPin(pinId);
    if (result.ok) setNotes(result.data);
    setLoading(false);
  }, [pinId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleUnlink(pageId: string) {
    setNotes((prev) => prev.filter((n) => n.pageId !== pageId));
    const result = await unlinkPinFromPage({ pinId, pageId });
    if (!result.ok) void refresh();
  }

  if (loading) return null;

  return (
    <div
      className="mt-2.5 border-t border-gray-100 pt-2.5"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="flex items-center gap-1 text-xs font-medium text-gray-500">
        <Link2 className="h-3 w-3" aria-hidden />
        {t("map.linkedNotes")}
      </p>

      {notes.length === 0 && (
        <p className="mt-1 text-xs text-gray-400">{t("map.noLinkedNotes")}</p>
      )}

      <ul className="mt-1 space-y-1">
        {notes.map((note) => (
          <li
            key={note.pageId}
            className="flex items-center justify-between gap-1 rounded-md px-1.5 py-0.5 text-xs hover:bg-gray-50"
          >
            <button
              type="button"
              onClick={() => router.push(noteHref(publicCode, note))}
              className="truncate text-left text-accent-700 hover:underline"
            >
              {note.title}
            </button>
            {!readOnly && (
              <button
                type="button"
                aria-label={t("map.unlinkNote")}
                onClick={() => void handleUnlink(note.pageId)}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-accent-700 hover:underline"
        >
          <Plus className="h-3 w-3" aria-hidden />
          {t("map.linkNote")}
        </button>
      )}

      {pickerOpen && (
        <LinkNoteDialog
          pinId={pinId}
          campaignId={campaignId}
          linkedPageIds={new Set(notes.map((n) => n.pageId))}
          onClose={() => setPickerOpen(false)}
          onLinked={() => {
            setPickerOpen(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
