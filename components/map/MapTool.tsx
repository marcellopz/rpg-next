"use client";

import { History, ImageUp, MapPinPlus, Map as MapIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
  addMapPin,
  deleteMapPin,
  registerCampaignMap,
  updateMapPin,
} from "@/app/actions/maps";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useI18n } from "@/lib/i18n/context";
import type { MapPin, MapPinType } from "@/lib/map/types";
import { Button, Typography } from "@/components/ui";
import { MapHistoryPanel } from "./MapHistoryPanel";
import { MapImage } from "./MapImage";
import { MapPinFormDialog } from "./MapPinFormDialog";
import { useCampaignMap } from "./useCampaignMap";

export function MapTool({
  campaignId,
  publicCode,
  readOnly,
  initialPinId,
}: {
  campaignId: string;
  publicCode: string;
  readOnly?: boolean;
  /** A pin id from a `?pin=` deep link (e.g. a note's "linked pins" jump). */
  initialPinId?: string | null;
}) {
  const { t } = useI18n();
  const {
    map,
    loading,
    error,
    refresh,
    addPinLocally,
    updatePinLocally,
    removePinLocally,
  } = useCampaignMap(campaignId);

  const [addPinMode, setAddPinMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [newPinAt, setNewPinAt] = useState<{ x: number; y: number } | null>(
    null
  );
  const [editingPin, setEditingPin] = useState<MapPin | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error: uploadError, reset } = useFileUpload(
    "public"
  );

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setActionError(null);
    const uploaded = await upload(file, { campaignId, folder: "map" });
    if (!uploaded) return;

    const registered = await registerCampaignMap({
      campaignId,
      path: uploaded.path,
    });
    if (!registered.ok) {
      setActionError(registered.error);
      return;
    }
    reset();
    await refresh({ background: map !== null });
  }

  async function handleCreatePin(
    label: string,
    description: string,
    type: MapPinType
  ): Promise<string | null> {
    if (!map || !newPinAt) return null;
    const result = await addMapPin({
      mapId: map.id,
      x: newPinAt.x,
      y: newPinAt.y,
      label,
      description: description || undefined,
      type,
    });
    if (!result.ok) return result.error;
    addPinLocally(result.data.pin);
    setAddPinMode(false);
    return null;
  }

  async function handleEditPin(
    label: string,
    description: string,
    type: MapPinType
  ): Promise<string | null> {
    if (!editingPin) return null;
    const result = await updateMapPin({
      pinId: editingPin.id,
      label,
      description: description || null,
      type,
    });
    if (!result.ok) return result.error;
    updatePinLocally(editingPin.id, {
      label,
      description: description || null,
      type,
    });
    return null;
  }

  async function handleDropPin(pinId: string, x: number, y: number) {
    updatePinLocally(pinId, { x, y });
    const result = await updateMapPin({ pinId, x, y });
    if (!result.ok) {
      setActionError(result.error);
      await refresh({ background: true });
    }
  }

  async function handleDeletePin(pin: MapPin) {
    if (!window.confirm(t("map.deleteConfirm", { label: pin.label }))) return;
    removePinLocally(pin.id);
    const result = await deleteMapPin({ pinId: pin.id });
    if (!result.ok) {
      setActionError(result.error);
      await refresh({ background: true });
    }
  }

  const uploadLabel = map ? t("map.replace") : t("map.upload");

  return (
    <div id="map-tool" className="flex min-h-[42rem] flex-col">
      {!readOnly && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      )}

      <div
        id="map-toolbar"
        className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6"
      >
        <Typography variant="muted" className="text-sm">
          {addPinMode ? t("map.addPinHint") : t("map.hint")}
        </Typography>

        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && map && (
            <Button
              type="button"
              variant={addPinMode ? "primary" : "secondary"}
              size="sm"
              onClick={() => setAddPinMode((prev) => !prev)}
            >
              <MapPinPlus className="mr-1.5 h-4 w-4" aria-hidden />
              {t("map.addPin")}
            </Button>
          )}
          {!readOnly && map && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="mr-1.5 h-4 w-4" aria-hidden />
              {t("map.history")}
            </Button>
          )}
          {!readOnly && map && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="mr-1.5 h-4 w-4" aria-hidden />
              {uploading ? t("map.uploading") : uploadLabel}
            </Button>
          )}
        </div>
      </div>

      {(actionError || uploadError) && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 md:px-6">
          <Typography variant="small" className="text-red-700">
            {actionError ?? uploadError}
          </Typography>
        </div>
      )}

      <div className="flex-1">
        {loading ? (
          <div className="flex min-h-[32rem] items-center justify-center">
            <Typography variant="muted">{t("buttons.loading")}</Typography>
          </div>
        ) : error ? (
          <div className="flex min-h-[32rem] flex-col items-center justify-center text-center">
            <Typography variant="h3" as="h2">
              {t("map.loadError")}
            </Typography>
            <Typography variant="muted" className="mt-2 max-w-sm leading-6">
              {error}
            </Typography>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => void refresh()}
            >
              {t("map.tryAgain")}
            </Button>
          </div>
        ) : !map ? (
          <div className="flex min-h-[32rem] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-700">
              <MapIcon className="h-5 w-5" aria-hidden />
            </div>
            <Typography variant="h3" as="h2">
              {t("map.noMap")}
            </Typography>
            <Typography variant="muted" className="mt-2 max-w-sm leading-6">
              {readOnly ? t("map.noMapReadOnly") : t("map.noMapDesc")}
            </Typography>
            {!readOnly && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-6"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="mr-1.5 h-4 w-4" aria-hidden />
                {uploading ? t("map.uploading") : t("map.upload")}
              </Button>
            )}
          </div>
        ) : (
          <MapImage
            map={map}
            campaignId={campaignId}
            publicCode={publicCode}
            readOnly={!!readOnly}
            addPinMode={addPinMode}
            initialPinId={initialPinId}
            onAddPinAt={(x, y) => setNewPinAt({ x, y })}
            onDragPin={(pinId, x, y) => updatePinLocally(pinId, { x, y })}
            onDropPin={(pinId, x, y) => void handleDropPin(pinId, x, y)}
            onEditPin={setEditingPin}
            onDeletePin={(pin) => void handleDeletePin(pin)}
          >
            {newPinAt && (
              <MapPinFormDialog
                title={t("map.newPinTitle")}
                onSave={handleCreatePin}
                onClose={() => setNewPinAt(null)}
              />
            )}
            {editingPin && (
              <MapPinFormDialog
                title={t("map.editPinTitle")}
                initialLabel={editingPin.label}
                initialDescription={editingPin.description}
                initialType={editingPin.type}
                onSave={handleEditPin}
                onClose={() => setEditingPin(null)}
              />
            )}
          </MapImage>
        )}
      </div>

      {historyOpen && map && (
        <MapHistoryPanel mapId={map.id} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
}
