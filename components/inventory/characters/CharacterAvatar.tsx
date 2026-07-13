import { PictoAvatar } from "@/components/PictoAvatar";
import { cn } from "@/lib/cn";

// A character's round avatar: the uploaded photo when set, otherwise the
// deterministic generated avatar seeded by the character's name.
export function CharacterAvatar({
  name,
  imageUrl,
  size,
  className,
}: {
  name: string;
  imageUrl: string | null;
  size: number;
  className?: string;
}) {
  if (!imageUrl) {
    return <PictoAvatar seed={name} size={size} className={className} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
    </span>
  );
}
