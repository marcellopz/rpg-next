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

  return (
    <span className="combatant-status-icons" aria-hidden="true">
      {isDead && <Skull className="combatant-status-icon combatant-status-dead" size={14} />}
      <TypeIcon className="combatant-status-icon" size={14} />
      {isDm && combatant.visible === false && (
        <EyeOff className="combatant-status-icon combatant-status-hidden" size={14} />
      )}
    </span>
  );
}
