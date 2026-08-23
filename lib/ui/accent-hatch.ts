/** Shared hatch used on solid accent surfaces (home hero, empty campaign banners). */
export const ACCENT_HATCH_BACKGROUND = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M0 12L12 0" stroke="rgba(255,255,255,0.12)" stroke-width="1"/></svg>`
)}")`;

export const accentHatchStyle = {
  backgroundImage: ACCENT_HATCH_BACKGROUND,
  backgroundSize: "12px 12px",
} as const;
