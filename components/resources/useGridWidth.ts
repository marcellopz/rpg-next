"use client";

import { useState } from "react";
import { useResizeDetector } from "react-resize-detector";

/** Measure the grid container width before rendering react-grid-layout. */
export function useGridWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState<number | null>(null);

  useResizeDetector({
    targetRef: ref,
    handleWidth: true,
    handleHeight: false,
    onResize: () => {
      if (ref.current) setWidth(ref.current.offsetWidth);
    },
  });

  return width;
}
