"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { InventoryItem } from "@/lib/queries/inventory";
import { Button, TextField, Typography } from "@/components/ui";

export function TransferItemDialog({
  item,
  targetName,
  onSend,
  onClose,
}: {
  item: InventoryItem;
  targetName: string;
  onSend: (quantity: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(item.quantity);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > item.quantity) {
      setError(t("inventory.transferInvalidQuantity", { max: item.quantity }));
      return;
    }
    onSend(quantity);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-item-title"
        className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h3" as="h2" id="transfer-item-title">
          {t("inventory.transferTitle", { item: item.name, character: targetName })}
        </Typography>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <TextField
            label={t("inventory.transferQuantity")}
            type="number"
            min={1}
            max={item.quantity}
            autoFocus
            value={quantity}
            onChange={(e) => {
              setError(null);
              setQuantity(Number(e.target.value));
            }}
          />
          {error && (
            <Typography variant="small" className="text-red-600">
              {error}
            </Typography>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {t("inventory.transferSend")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
