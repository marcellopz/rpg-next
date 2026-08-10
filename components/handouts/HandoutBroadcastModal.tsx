"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  isImageContentType,
  isPdfContentType,
} from "@/lib/files/types";
import { Button, IconButton, Typography } from "@/components/ui";
import { useHandoutBroadcast } from "./HandoutBroadcastContext";

const DISPLAY_MS = 20_000;

export function HandoutBroadcastModal() {
  const {
    broadcast,
    broadcastKey,
    dismissedKey,
    clearForEveryone,
    dismissLocally,
    selfUserId,
    allowRemoteDisplay,
  } = useHandoutBroadcast();
  const [clearing, setClearing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(20);

  const file = broadcast?.file ?? null;
  // The sharer always sees their own popup; everyone else can opt out locally.
  const isOwnBroadcast =
    Boolean(broadcast?.shownBy) && broadcast?.shownBy === selfUserId;
  const visible =
    Boolean(file) &&
    Boolean(broadcastKey) &&
    dismissedKey !== broadcastKey &&
    (allowRemoteDisplay || isOwnBroadcast);

  useEffect(() => {
    if (!visible || !broadcast?.updatedAt) return;

    const endsAt = Date.parse(broadcast.updatedAt) + DISPLAY_MS;
    let cleared = false;

    function tick() {
      const remainingMs = endsAt - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
      if (remainingMs <= 0 && !cleared) {
        cleared = true;
        void clearForEveryone();
      }
    }

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [visible, broadcast?.updatedAt, broadcastKey, clearForEveryone]);

  if (!visible || !file || !broadcastKey) {
    return null;
  }

  const isImage = isImageContentType(file.contentType);
  const isPdf = isPdfContentType(file.contentType);
  const url = file.publicUrl;

  async function handleClearForEveryone() {
    setClearing(true);
    await clearForEveryone();
    setClearing(false);
  }

  return (
    <div
      id="handout-broadcast-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="handout-broadcast-title"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <Typography
              variant="h3"
              as="h2"
              id="handout-broadcast-title"
              className="truncate"
            >
              {file.filename}
            </Typography>
            <Typography variant="small" className="mt-0.5">
              Shared with the table · closes in {secondsLeft}s
            </Typography>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={clearing}
              onClick={() => void handleClearForEveryone()}
            >
              {clearing ? "Clearing…" : "Stop sharing"}
            </Button>
            <IconButton
              aria-label="Close for me"
              className="h-8 w-8 rounded-md"
              onClick={dismissLocally}
            >
              <X className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-950 p-3 sm:p-5">
          {url && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file.filename}
              className="max-h-[75vh] max-w-full rounded-lg object-contain"
            />
          ) : url && isPdf ? (
            <iframe
              title={file.filename}
              src={url}
              className="h-[75vh] w-full rounded-lg bg-white"
            />
          ) : url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-accent-700"
            >
              Open {file.filename}
            </a>
          ) : (
            <Typography variant="muted" className="text-white/80">
              This file can’t be previewed here.
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
