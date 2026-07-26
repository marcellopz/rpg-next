import Image from "next/image";
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
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, lineHeight: 0 }}
    >
      <Image src={imageUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}
