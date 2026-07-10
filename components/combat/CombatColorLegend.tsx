export function CombatColorLegend() {
  const segments = [
    { label: "Critical", dot: "bg-gray-700" },
    { label: "Bloodied", dot: "bg-red-500" },
    { label: "Hurt", dot: "bg-amber-500" },
    { label: "Healthy", dot: "bg-emerald-500" },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
      aria-label="Health status legend"
    >
      {segments.map((seg) => (
        <span
          key={seg.label}
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-gray-500"
        >
          <span className={`h-2 w-2 rounded-full ${seg.dot}`} aria-hidden />
          {seg.label}
        </span>
      ))}
    </div>
  );
}
