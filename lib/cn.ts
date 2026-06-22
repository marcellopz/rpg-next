// Tiny className joiner: drops falsy values and joins the rest with spaces.
// Keeps component variant logic readable without pulling in a dependency.
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
