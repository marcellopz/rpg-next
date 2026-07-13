"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button, Typography } from "@/components/ui";
import { renderCroppedImage } from "./crop";

// Shared pick-and-crop modal: choose an image file, drag/zoom to select the
// area inside a fixed-aspect frame, and hand the caller a resized JPEG blob.
// The caller owns upload + persistence via onSave (return an error message to
// keep the dialog open, or null on success — the dialog then closes itself).
export function ImageCropDialog({
  title,
  description,
  aspect,
  cropShape = "rect",
  outputWidth,
  outputHeight,
  onSave,
  onRemove,
  onClose,
}: {
  title: string;
  description?: string;
  /** Width / height of the selection frame, e.g. 1 for square, 3 for wide. */
  aspect: number;
  cropShape?: "rect" | "round";
  outputWidth: number;
  outputHeight: number;
  /** Upload + persist the cropped image. Return an error message or null. */
  onSave: (blob: Blob) => Promise<string | null>;
  /** When provided, shows a "Remove current image" action. */
  onRemove?: () => Promise<string | null>;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  // Revoke the object URL when it's replaced or the dialog unmounts.
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    setImageSrc(URL.createObjectURL(file));
  }

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!imageSrc || !areaPixels || pending) return;
    setPending(true);
    setError(null);
    try {
      const blob = await renderCroppedImage(
        imageSrc,
        areaPixels,
        outputWidth,
        outputHeight
      );
      const saveError = await onSave(blob);
      if (saveError) {
        setError(saveError);
        return;
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not process the image."
      );
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    if (!onRemove || pending) return;
    setPending(true);
    setError(null);
    const removeError = await onRemove();
    setPending(false);
    if (removeError) {
      setError(removeError);
      return;
    }
    onClose();
  }

  function close() {
    if (pending) return;
    onClose();
  }

  return (
    <div
      id="image-crop-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <Typography variant="h3" as="h2" id="image-crop-title">
          {title}
        </Typography>
        {description && (
          <Typography variant="muted" className="mt-1">
            {description}
          </Typography>
        )}

        <div className="mt-4 space-y-4">
          {imageSrc ? (
            <>
              <div className="relative h-72 w-full overflow-hidden rounded-lg bg-gray-900">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  cropShape={cropShape}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="image-crop-zoom"
                  className="text-sm font-medium text-gray-700"
                >
                  Zoom
                </label>
                <input
                  id="image-crop-zoom"
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-accent-600"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => inputRef.current?.click()}
                  disabled={pending}
                >
                  Change file
                </Button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-40 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-accent-400 hover:text-accent-700"
            >
              <span className="font-medium">Choose an image</span>
              <span className="text-xs">
                You&apos;ll select the area to keep in the next step.
              </span>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          {error && (
            <Typography variant="small" className="text-red-600">
              {error}
            </Typography>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {onRemove && (
              <Button
                type="button"
                variant="dangerOutline"
                size="sm"
                className="mr-auto"
                onClick={() => void handleRemove()}
                disabled={pending}
              >
                Remove current
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={close}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave()}
              disabled={!imageSrc || !areaPixels || pending}
            >
              {pending ? "Saving…" : "Save image"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
