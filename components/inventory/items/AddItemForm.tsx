"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "@/app/actions/inventory";
import { Button, TextField } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import {
  INVENTORY_ITEM_TYPE_LIST,
  itemTypeTextClass,
  type InventoryItemType,
} from "@/lib/inventory/item-types";

// Collapsed "Add item" button that expands to an inline form.
export function AddItemForm({ characterId }: { characterId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState<InventoryItemType>("normal");
  const [weight, setWeight] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setItemType("normal");
    setWeight("0");
    setQuantity("1");
    setError(null);
  }

  function close() {
    if (isPending) return;
    setOpen(false);
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addItem({
        characterId,
        name,
        itemType,
        weight: Number(weight) || 0,
        quantity: Number(quantity) || 1,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="px-4 py-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {t("character.addItem")}
        </Button>
      </div>
    );
  }

  return (
    <form
      id="inventory-add-item-form"
      onSubmit={handleSubmit}
      className="space-y-3 border-t border-gray-200 bg-gray-50 px-4 py-4"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem]">
        <TextField
          label={t("addItem.name")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={80}
          placeholder={t("addItem.namePlaceholder")}
        />
        <div className="space-y-1">
          <label
            htmlFor="add-item-type"
            className="block text-sm font-medium text-gray-700"
          >
            {t("addItem.type")}
          </label>
          <select
            id="add-item-type"
            value={itemType}
            onChange={(e) => setItemType(e.target.value as InventoryItemType)}
            className={cn(
              "w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent-500 focus:outline-none",
              itemTypeTextClass(itemType)
            )}
          >
            {INVENTORY_ITEM_TYPE_LIST.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label={t("addItem.weight")}
          type="number"
          min={0}
          step="any"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <TextField
          label={t("addItem.quantity")}
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      {error && (
        <p id="inventory-add-item-error" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending ? t("addItem.adding") : t("addItem.add")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={close}
          disabled={isPending}
        >
          {t("addItem.cancel")}
        </Button>
      </div>
    </form>
  );
}
