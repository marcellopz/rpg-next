import {
  EyeOff,
  Ghost,
  Handshake,
  Skull,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type { CombatCombatant } from "@/lib/combat/types";

const TYPE_ICONS: Record<CombatCombatant["combatantType"], LucideIcon> = {
  player: Handshake,
  ally: Handshake,
  enemy: Swords,
  undead: Ghost,
};

export function CombatantStatusIcons({
  combatant,
  isDm,
}: {
  combatant: Pick<CombatCombatant, "hp" | "combatantType" | "visible">;
  isDm: boolean;
}) {
  const TypeIcon = TYPE_ICONS[combatant.combatantType];
  const isDead = combatant.hp <= 0;
  const labels = [
    isDead ? "Defeated" : null,
    combatant.combatantType,
    isDm && combatant.visible === false ? "Hidden from players" : null,
  ].filter(Boolean).join(", ");

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-gray-500"
      aria-label={labels}
      title={labels}
    >
      {isDead && <Skull className="h-3.5 w-3.5 text-gray-800" aria-hidden />}
      <TypeIcon className="h-5 w-5" aria-hidden />
      {isDm && combatant.visible === false && (
        <EyeOff className="h-3.5 w-3.5 text-gray-600" aria-hidden />
      )}
    </span>
  );
}
