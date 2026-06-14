import { picto } from "pictoguys/core";

// Deterministic SVG avatar generated on the server from a seed (the user's
// email). The seed only drives part/color selection inside the library — it is
// never interpolated into the SVG markup — so injecting the result is safe.
// Rendering via the `core` entry point keeps this a pure server component
// (no client JS, no DOM access).
export function PictoAvatar({
  seed,
  size = 28,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const uid = `av_${seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}_`;
  const svg = picto
    .character(seed)
    .svg({ uid })
    .replace("<svg ", '<svg width="100%" height="100%" style="display:block" ');

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "9999px",
        overflow: "hidden",
        lineHeight: 0,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
