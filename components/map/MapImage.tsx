"use client";

/* eslint-disable @next/next/no-img-element -- the map keeps its natural,
   unknown-at-build-time dimensions; next/image needs fixed sizing or fill. */

import { Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  MAP_PIN_TYPES,
  PIN_TYPE_STYLES,
  type CampaignMap,
  type MapPin,
  type MapPinType,
} from "@/lib/map/types";
import { IconButton } from "@/components/ui";
import { MapPinMarker } from "./MapPinMarker";

const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const BUTTON_ZOOM_STEP = 1.4;
const PAN_THRESHOLD_PX = 4;

export function MapImage({
  map,
  campaignId,
  publicCode,
  readOnly,
  addPinMode,
  initialPinId,
  onAddPinAt,
  onDragPin,
  onDropPin,
  onEditPin,
  onDeletePin,
  children,
}: {
  map: CampaignMap;
  campaignId: string;
  publicCode: string;
  readOnly: boolean;
  addPinMode: boolean;
  /** A pin id from a `?pin=` deep link — auto-selected and scrolled into view once. */
  initialPinId?: string | null;
  onAddPinAt: (x: number, y: number) => void;
  onDragPin: (pinId: string, x: number, y: number) => void;
  onDropPin: (pinId: string, x: number, y: number) => void;
  onEditPin: (pin: MapPin) => void;
  onDeletePin: (pin: MapPin) => void;
  /**
   * Modals that must stay visible in fullscreen: browsers only render
   * descendants of the fullscreened element, so the pin dialogs are
   * mounted inside the canvas rather than beside it.
   */
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  // Zoom stretches the inner container to zoom×100% width; the viewport
  // scrolls, so pins keep their fractional math and constant size. Panning
  // is a pointer-drag that adjusts the viewport's scroll position.
  const [zoom, setZoom] = useState(1);
  const [hiddenTypes, setHiddenTypes] = useState<Set<MapPinType>>(new Set());
  // Fullscreen puts the whole canvas (viewport + overlays) on the browser's
  // fullscreen stage, so zoom, pan, legend, and pins keep working unchanged.
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === canvasRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void canvasRef.current?.requestFullscreen();
    }
  }

  function toggleType(type: MapPinType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  // Legend lists only types that have pins, in the canonical order.
  const typesInUse = MAP_PIN_TYPES.filter((type) =>
    map.pins.some((pin) => pin.type === type)
  );
  const visiblePins = map.pins.filter((pin) => !hiddenTypes.has(pin.type));
  // 'group' pins form an ordered trail: number them by creation order
  // (pins arrive sorted by created_at). Numbering ignores visibility so
  // toggling other types never renumbers the trail.
  const groupNumbers = new Map(
    map.pins
      .filter((pin) => pin.type === "group")
      .map((pin, index) => [pin.id, index + 1])
  );

  // Deep link: select the target pin and scroll it into view, once, as soon
  // as it shows up in `map.pins` (which may load asynchronously after mount).
  const jumpedToInitialPin = useRef(false);
  useEffect(() => {
    if (jumpedToInitialPin.current || !initialPinId) return;
    const pin = map.pins.find((p) => p.id === initialPinId);
    if (!pin) return;
    jumpedToInitialPin.current = true;
    if (hiddenTypes.has(pin.type)) {
      setHiddenTypes((prev) => {
        const next = new Set(prev);
        next.delete(pin.type);
        return next;
      });
    }
    setSelectedPinId(pin.id);
    const marker = containerRef.current?.querySelector(
      `[data-pin-id="${pin.id}"]`
    );
    marker?.scrollIntoView({ block: "center", inline: "center" });
  }, [initialPinId, map.pins, hiddenTypes]);

  // Viewport-relative point to keep fixed across the next zoom change
  // (the cursor for wheel zoom; null = viewport center for the buttons).
  const zoomAnchor = useRef<{ x: number; y: number } | null>(null);
  const prevZoom = useRef(zoom);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const factor = zoom / prevZoom.current;
    prevZoom.current = zoom;
    const anchor = zoomAnchor.current;
    zoomAnchor.current = null;
    if (!viewport || factor === 1) return;
    const ax = anchor?.x ?? viewport.clientWidth / 2;
    const ay = anchor?.y ?? viewport.clientHeight / 2;
    viewport.scrollLeft = (viewport.scrollLeft + ax) * factor - ax;
    viewport.scrollTop = (viewport.scrollTop + ay) * factor - ay;
  }, [zoom]);

  function zoomBy(factor: number, clientX?: number, clientY?: number) {
    const viewport = viewportRef.current;
    if (viewport && clientX !== undefined && clientY !== undefined) {
      const rect = viewport.getBoundingClientRect();
      zoomAnchor.current = { x: clientX - rect.left, y: clientY - rect.top };
    } else {
      zoomAnchor.current = null;
    }
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor)));
  }

  // Wheel = zoom toward the cursor. A native non-passive listener is
  // required: React registers wheel handlers as passive, so preventDefault
  // (needed to stop the page from scrolling) wouldn't work via onWheel.
  const zoomByRef = useRef(zoomBy);
  zoomByRef.current = zoomBy;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      // deltaMode 1 = lines (Firefox); normalize to ~pixels.
      const delta = e.deltaY * (e.deltaMode === 1 ? 33 : 1);
      zoomByRef.current(Math.pow(2, -delta * 0.0015), e.clientX, e.clientY);
    }
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  // Pan session state lives in a ref: pointer moves shouldn't re-render.
  const pan = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    moved: boolean;
  } | null>(null);
  // A pan fires a trailing click on release; this flag swallows it so it
  // doesn't also place a pin or dismiss the open popover.
  const didPan = useRef(false);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    didPan.current = false;
    pan.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      moved: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const session = pan.current;
    const viewport = viewportRef.current;
    if (!session || session.pointerId !== e.pointerId || !viewport) return;
    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;
    if (!session.moved) {
      if (Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return;
      session.moved = true;
      didPan.current = true;
      // Capture only once panning actually starts — capturing on pointerdown
      // would retarget the release click away from the pins/canvas.
      viewport.setPointerCapture(e.pointerId);
    }
    viewport.scrollLeft = session.scrollLeft - dx;
    viewport.scrollTop = session.scrollTop - dy;
  }

  function handlePointerUp() {
    pan.current = null;
  }

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    if (didPan.current) {
      didPan.current = false;
      return;
    }
    if (!addPinMode) {
      setSelectedPinId(null);
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onAddPinAt(x, y);
  }

  return (
    <div
      id="map-canvas"
      ref={canvasRef}
      className={`relative ${isFullscreen ? "bg-gray-900" : ""}`}
    >
      <div className="absolute right-3 top-3 z-20 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white/95 p-1 shadow-sm">
        <IconButton
          aria-label={t("map.zoomOut")}
          disabled={zoom <= MIN_ZOOM}
          className="disabled:opacity-40"
          onClick={() => zoomBy(1 / BUTTON_ZOOM_STEP)}
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </IconButton>
        <button
          type="button"
          title={t("map.zoomReset")}
          onClick={() => setZoom(1)}
          className="min-w-[3rem] rounded px-1 text-center text-xs font-medium tabular-nums text-gray-600 transition hover:bg-gray-200 hover:text-gray-800"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton
          aria-label={t("map.zoomIn")}
          disabled={zoom >= MAX_ZOOM}
          className="disabled:opacity-40"
          onClick={() => zoomBy(BUTTON_ZOOM_STEP)}
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </IconButton>
        <div className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <IconButton
          aria-label={
            isFullscreen ? t("map.exitFullscreen") : t("map.fullscreen")
          }
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize className="h-4 w-4" aria-hidden />
          )}
        </IconButton>
      </div>

      {typesInUse.length > 0 && (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-0.5 rounded-lg border border-gray-200 bg-white/95 p-1.5 shadow-sm">
          {typesInUse.map((type) => {
            const hidden = hiddenTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={!hidden}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-2 rounded px-1.5 py-0.5 text-left text-xs font-medium transition hover:bg-gray-100 ${
                  hidden ? "text-gray-400" : "text-gray-700"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    PIN_TYPE_STYLES[type].dot
                  } ${hidden ? "opacity-30" : ""}`}
                  aria-hidden
                />
                <span className={hidden ? "line-through" : ""}>
                  {t(`map.types.${type}`)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full touch-none overflow-auto ${
          // Fullscreen: fill the stage and center the map via flex + m-auto
          // (auto margins collapse once content overflows, so scrolling
          // still reaches the edges — plain flex centering would clip them).
          isFullscreen ? "flex h-full" : "max-h-[75vh]"
        }`}
      >
        <div
          ref={containerRef}
          onClick={handleImageClick}
          className={`relative ${isFullscreen ? "m-auto" : ""} ${
            addPinMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
          }`}
          style={{ width: `${zoom * 100}%` }}
        >
          <img
            src={map.imageUrl}
            alt={t("map.imageAlt")}
            className="block w-full select-none"
            draggable={false}
          />
          {visiblePins.map((pin) => (
            <MapPinMarker
              key={pin.id}
              pin={pin}
              number={groupNumbers.get(pin.id) ?? null}
              campaignId={campaignId}
              publicCode={publicCode}
              containerRef={containerRef}
              readOnly={readOnly || addPinMode}
              selected={selectedPinId === pin.id}
              onSelect={setSelectedPinId}
              onDragMove={onDragPin}
              onDragEnd={onDropPin}
              onEdit={onEditPin}
              onDelete={onDeletePin}
            />
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}
