"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Responsive, type Layout, type Layouts } from "react-grid-layout";
import { saveResourceLayouts } from "@/app/actions/resources";
import type { ResourceCard as ResourceCardData } from "@/lib/resources/types";
import { syncLayoutsWithCards } from "@/lib/resources/layouts";
import { ResourceCardPanel } from "./ResourceCard";
import { useGridWidth } from "./useGridWidth";
import "./resources-grid.css";

export function ResourcesDashboardGrid({
  campaignId,
  cards,
  initialLayouts,
  isEditing,
}: {
  campaignId: string;
  cards: ResourceCardData[];
  initialLayouts: Layouts;
  isEditing: boolean;
}) {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);
  const width = useGridWidth(parentRef);
  const [isReady, setIsReady] = useState(false);
  const [layouts, setLayouts] = useState<Layouts>(() =>
    syncLayoutsWithCards(
      initialLayouts,
      cards.map((c) => c.id)
    )
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLayouts(
      syncLayoutsWithCards(
        initialLayouts,
        cards.map((c) => c.id)
      )
    );
  }, [initialLayouts, cards]);

  useEffect(() => {
    if (!isReady && width) {
      const id = window.setTimeout(() => setIsReady(true), 300);
      return () => window.clearTimeout(id);
    }
  }, [width, isReady]);

  const persistLayouts = useCallback(
    (next: Layouts) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await saveResourceLayouts({ campaignId, layouts: next });
        router.refresh();
      }, 500);
    },
    [campaignId, router]
  );

  const onLayoutChange = useCallback(
    (_layout: Layout[], allLayouts: Layouts) => {
      setLayouts(allLayouts);
      if (isEditing) persistLayouts(allLayouts);
    },
    [isEditing, persistLayouts]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (cards.length === 0) return null;

  return (
    <div
      ref={parentRef}
      id="resources-dashboard-grid"
      className={`resources-grid min-h-[36rem] ${isReady ? "" : "grid-initializing"}`}
    >
      {width ? (
        <Responsive
          className={`layout ${isEditing ? "mb-8" : ""}`}
          draggableHandle=".draggable-handle"
          layouts={layouts}
          cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          rowHeight={48}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          onLayoutChange={onLayoutChange}
          isDraggable={isEditing}
          isResizable={isEditing}
          resizeHandles={["n", "s", "e", "w", "ne", "nw", "se", "sw"]}
          autoSize
          useCSSTransforms
          width={width}
        >
          {cards.map((card) => (
            <div key={card.id} className={isEditing ? "editing" : ""}>
              <ResourceCardPanel card={card} isEditing={isEditing} />
            </div>
          ))}
        </Responsive>
      ) : (
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-48 rounded-2xl bg-gray-200" />
          <div className="h-48 rounded-2xl bg-gray-200" />
        </div>
      )}
    </div>
  );
}
