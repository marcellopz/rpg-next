"use client";

import { MapPin as MapPinIcon, Pencil, Trash2 } from "lucide-react";
import { useRef, type PointerEvent, type RefObject } from "react";
import { useI18n } from "@/lib/i18n/context";
import { PIN_TYPE_STYLES, type MapPin } from "@/lib/map/types";
import { Button, Typography } from "@/components/ui";
import { PinLinkedNotes } from "./PinLinkedNotes";

const DRAG_THRESHOLD_PX = 4;

/** Clamped fractional position of a pointer event inside the map container. */
function pointerFraction(
  container: HTMLElement,
  e: { clientX: number; clientY: number }
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  return { x, y };
}

export function MapPinMarker({
  pin,
  number,
  campaignId,
  publicCode,
  containerRef,
  readOnly,
  selected,
  onSelect,
  onDragMove,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  pin: MapPin;
  /** Sequence number for ordered 'group' pins; null for other types. */
  number: number | null;
  campaignId: string;
  publicCode: string;
  containerRef: RefObject<HTMLElement>;
  readOnly: boolean;
  selected: boolean;
  onSelect: (pinId: string | null) => void;
  /** Live position while dragging (optimistic local state only). */
  onDragMove: (pinId: string, x: number, y: number) => void;
  /** Final position on drop — commits to the server. */
  onDragEnd: (pinId: string, x: number, y: number) => void;
  onEdit: (pin: MapPin) => void;
  onDelete: (pin: MapPin) => void;
}) {
  const { t, locale } = useI18n();
  // Drag session state lives in a ref: pointer moves shouldn't re-render.
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  // A drop fires a trailing click on the same element; this flag swallows it
  // so the popover doesn't open right after a drag.
  const justDragged = useRef(false);

  const styles = PIN_TYPE_STYLES[pin.type];
  const isNumbered = number !== null;
  const createdDate = new Date(pin.createdAt).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || readOnly) return;
    // A pin drag must not also start the viewport's pan gesture.
    e.stopPropagation();
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLButtonElement>) {
    const session = drag.current;
    const container = containerRef.current;
    if (!session || session.pointerId !== e.pointerId || !container) return;
    if (!session.moved) {
      const distance = Math.hypot(
        e.clientX - session.startX,
        e.clientY - session.startY
      );
      if (distance < DRAG_THRESHOLD_PX) return;
      session.moved = true;
      onSelect(null); // dragging closes any open popover
    }
    const { x, y } = pointerFraction(container, e);
    onDragMove(pin.id, x, y);
  }

  function handlePointerUp(e: PointerEvent<HTMLButtonElement>) {
    const session = drag.current;
    drag.current = null;
    const container = containerRef.current;
    if (session?.moved && container) {
      const { x, y } = pointerFraction(container, e);
      onDragEnd(pin.id, x, y);
      justDragged.current = true;
    }
  }

  return (
    <div
      data-pin-id={pin.id}
      className="absolute z-10"
      style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
    >
      <button
        type="button"
        aria-label={pin.label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          e.stopPropagation();
          if (justDragged.current) {
            justDragged.current = false;
            return;
          }
          onSelect(selected ? null : pin.id);
        }}
        className={`touch-none drop-shadow transition-transform ${
          // Numbered group chips anchor at their center; pin glyphs at the tip.
          isNumbered ? "-translate-x-1/2 -translate-y-1/2" : "-translate-x-1/2 -translate-y-full"
        } ${selected ? "scale-125" : ""} ${
          readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        {isNumbered ? (
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold ${styles.chip}`}
          >
            {number}
          </span>
        ) : (
          <MapPinIcon
            className={`h-7 w-7 ${styles.icon} fill-white`}
            strokeWidth={2.25}
            aria-hidden
          />
        )}
      </button>

      {selected && (
        <div
          className="absolute left-1/2 top-1.5 z-20 w-56 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-gray-900">
            {isNumbered ? `${number}. ${pin.label}` : pin.label}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
              aria-hidden
            />
            {t(`map.types.${pin.type}`)} · {createdDate}
          </p>
          {pin.description && (
            <Typography variant="small" className="mt-1.5 whitespace-pre-line leading-5">
              {pin.description}
            </Typography>
          )}
          {!readOnly && (
            <div className="mt-2.5 flex justify-end gap-1.5 border-t border-gray-100 pt-2.5">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => onEdit(pin)}
              >
                <Pencil className="mr-1 h-3 w-3" aria-hidden />
                {t("map.edit")}
              </Button>
              <Button
                type="button"
                variant="dangerOutline"
                size="xs"
                onClick={() => onDelete(pin)}
              >
                <Trash2 className="mr-1 h-3 w-3" aria-hidden />
                {t("map.delete")}
              </Button>
            </div>
          )}
          <PinLinkedNotes
            pinId={pin.id}
            campaignId={campaignId}
            publicCode={publicCode}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
