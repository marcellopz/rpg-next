"use client";

import { useEffect } from "react";
import { Button, Typography } from "@/components/ui";
import type { InventoryLogEntry } from "@/lib/queries/inventory";
import { formatWeight } from "../encumbrance";

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}

function snapshotSummary(snapshot: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof snapshot.quantity === "number" && typeof snapshot.name === "string")
    parts.push(`${snapshot.quantity} × ${snapshot.name}`);
  if (typeof snapshot.type === "string") parts.push(String(snapshot.type));
  if (typeof snapshot.weight === "number")
    parts.push(`${formatWeight(snapshot.weight)} lb each`);
  return parts.join(" · ");
}

// Modal listing the campaign's inventory change history, newest first.
export function InventoryLogPanel({
  entries,
  onClose,
}: {
  entries: InventoryLogEntry[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div id="inventory-log-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-log-title"
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <Typography variant="h3" as="h2" id="inventory-log-title">
            Inventory log
          </Typography>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 && (
            <Typography variant="muted">
              No changes recorded yet. Every add, edit, transfer, and delete
              will show up here.
            </Typography>
          )}

          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
              >
                <p className="text-sm text-gray-800">{entry.description}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {entry.actorName} · {relativeTime(entry.createdAt)}
                  {entry.itemSnapshot && (
                    <span className="text-gray-400">
                      {" "}
                      · {snapshotSummary(entry.itemSnapshot)}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
