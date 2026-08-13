"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  MAP_PIN_TYPES,
  PIN_TYPE_STYLES,
  type MapPinType,
} from "@/lib/map/types";
import { Button, TextArea, TextField, Typography } from "@/components/ui";

/**
 * Create/edit form for a pin. The caller owns the actual server call via
 * `onSave`; a returned error string keeps the dialog open.
 */
export function MapPinFormDialog({
  title,
  initialLabel,
  initialDescription,
  initialType,
  onSave,
  onClose,
}: {
  title: string;
  initialLabel?: string;
  initialDescription?: string | null;
  initialType?: MapPinType;
  onSave: (
    label: string,
    description: string,
    type: MapPinType
  ) => Promise<string | null>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [label, setLabel] = useState(initialLabel ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [type, setType] = useState<MapPinType>(initialType ?? "location");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || pending) return;
    setPending(true);
    setError(null);
    const failure = await onSave(label.trim(), description.trim(), type);
    setPending(false);
    if (failure) {
      setError(failure);
      return;
    }
    onClose();
  }

  return (
    <div
      id="map-pin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-pin-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h3" as="h2" id="map-pin-modal-title">
          {title}
        </Typography>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <TextField
            label={t("map.pinLabel")}
            placeholder={t("map.pinLabelPlaceholder")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={120}
            autoFocus
            required
          />

          <div className="space-y-1">
            <p className="block text-sm font-medium text-gray-700">
              {t("map.pinType")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MAP_PIN_TYPES.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${
                    type === option
                      ? "border-accent-500 bg-accent-50 text-accent-800"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="pin-type"
                    className="sr-only"
                    checked={type === option}
                    onChange={() => setType(option)}
                  />
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${PIN_TYPE_STYLES[option].dot}`}
                    aria-hidden
                  />
                  {t(`map.types.${option}`)}
                </label>
              ))}
            </div>
          </div>

          <TextArea
            label={t("map.pinDescription")}
            placeholder={t("map.pinDescriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
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
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!label.trim() || pending}
            >
              {pending ? t("buttons.loading") : t("buttons.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
