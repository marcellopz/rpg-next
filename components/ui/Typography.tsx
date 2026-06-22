import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "subtitle"
  | "body"
  | "muted"
  | "small";

const VARIANT_CLASSES: Record<TypographyVariant, string> = {
  h1: "text-3xl font-bold text-gray-900",
  h2: "text-2xl font-bold text-gray-900",
  h3: "text-lg font-semibold text-gray-900",
  subtitle: "text-gray-600",
  body: "text-sm text-gray-700",
  muted: "text-sm text-gray-500",
  small: "text-xs text-gray-500",
};

const DEFAULT_TAG: Record<TypographyVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  subtitle: "p",
  body: "p",
  muted: "p",
  small: "span",
};

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: ElementType;
  children?: ReactNode;
}

export function Typography({
  variant = "body",
  as,
  className,
  children,
  ...rest
}: TypographyProps) {
  const Tag = as ?? DEFAULT_TAG[variant];
  return (
    <Tag className={cn(VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}
