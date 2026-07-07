import { getHpColorClass } from "@/lib/combat/hp-colors";

export function CombatColorLegend() {
  const segments: { label: string; cls: ReturnType<typeof getHpColorClass> }[] = [
    { label: "0% - 25%", cls: "preto" },
    { label: "25% - 50%", cls: "vermelho" },
    { label: "50% - 75%", cls: "amarelo" },
    { label: "75% - 100%", cls: "verde" },
  ];

  return (
    <div className="combat-color-system-bar">
      {segments.map((seg) => (
        <div key={seg.cls} className={`${seg.cls} px-4`}>
          {seg.label}
        </div>
      ))}
    </div>
  );
}
