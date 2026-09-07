"use client";

import { useEffect, useRef, useState } from "react";

const HORIZON = -0.2;
/** World size of one square, in pixels at the near plane (bottom of the hero). */
const CELL = 100;
const LINE = "rgba(255,255,255,0.22)";

function xAtY(
  xBottom: number,
  y: number,
  h: number,
  horizonY: number,
  vpX: number
) {
  const t = (h - y) / (h - horizonY);
  return xBottom + t * (vpX - xBottom);
}

function gridGeometry(w: number, h: number) {
  const horizonY = h * HORIZON;
  const vpX = w / 2;
  const depthPx = h - horizonY;
  const rungs: number[] = [];
  const xBottoms: number[] = [];

  if (depthPx <= 0 || CELL <= 0) {
    return { horizonY, vpX, rungs, farY: horizonY, leftBottom: 0, rightBottom: w, xBottoms };
  }

  // Camera at height `depthPx`, focal length `depthPx`, so 1 world unit = 1px
  // at the near plane. Equal X/Z steps keep squares unstretched at any width.
  const zNear = depthPx;
  for (let i = 1; i <= 80; i++) {
    const z = zNear + i * CELL;
    const y = Math.round(horizonY + (zNear * depthPx) / z);
    if (y >= h - 1) continue;
    if (y <= 0) break;
    rungs.push(y);
  }

  const farY = rungs.length > 0 ? rungs.reduce((a, b) => Math.min(a, b)) : horizonY;
  const tFar = (h - farY) / depthPx;
  const denom = Math.max(1 - tFar, 0.08);
  const leftBottom = (0 - tFar * vpX) / denom;
  const rightBottom = (w - tFar * vpX) / denom;

  const nExtent = Math.max(
    Math.abs(Math.floor((leftBottom - vpX) / CELL)),
    Math.abs(Math.ceil((rightBottom - vpX) / CELL))
  );
  for (let n = -nExtent; n <= nExtent && xBottoms.length < 240; n++) {
    xBottoms.push(vpX + n * CELL);
  }

  return {
    horizonY,
    vpX,
    rungs,
    farY,
    leftBottom: xBottoms[0] ?? leftBottom,
    rightBottom: xBottoms[xBottoms.length - 1] ?? rightBottom,
    xBottoms,
  };
}

/** Square grid drawn in 1-point perspective, in screen pixels so lines stay sharp. */
export function HeroGridPlane() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setSize({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (size.w === 0 || !intro) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setIntro(false), reduceMotion ? 0 : 1400);
    return () => window.clearTimeout(timeout);
  }, [size.w, intro]);

  const { w, h } = size;
  const grid = w > 0 && h > 0 ? gridGeometry(w, h) : null;
  const depthMid = grid ? (grid.xBottoms.length - 1) / 2 : 0;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {grid && grid.rungs.length > 0 && (
        <svg
          className="absolute inset-0"
          width={w}
          height={h}
          shapeRendering="geometricPrecision"
        >
          {grid.xBottoms.map((xBottom, i) => (
            <line
              key={`d-${i}`}
              pathLength={1}
              x1={Math.round(xBottom)}
              y1={h}
              x2={Math.round(xAtY(xBottom, grid.farY, h, grid.horizonY, grid.vpX))}
              y2={grid.farY}
              stroke={LINE}
              strokeWidth={1}
              className={intro ? "hero-grid-depth" : undefined}
              style={
                intro
                  ? { animationDelay: `${Math.abs(i - depthMid) * 14}ms` }
                  : undefined
              }
            />
          ))}
          {grid.rungs.map((y, i) => (
            <line
              key={`r-${i}`}
              pathLength={1}
              x1={Math.round(xAtY(grid.leftBottom, y, h, grid.horizonY, grid.vpX))}
              y1={y}
              x2={Math.round(xAtY(grid.rightBottom, y, h, grid.horizonY, grid.vpX))}
              y2={y}
              stroke={LINE}
              strokeWidth={1}
              shapeRendering="crispEdges"
              className={intro ? "hero-grid-rung" : undefined}
              style={intro ? { animationDelay: `${180 + i * 42}ms` } : undefined}
            />
          ))}
        </svg>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-800 via-accent-800/50 to-transparent to-45%" />
    </div>
  );
}
