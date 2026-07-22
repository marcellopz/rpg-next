export function CombatColorLegend() {
  const segments = [
    { label: "Critical", range: "≤25%", dot: "bg-gray-700" },
    { label: "Bloodied", range: "26–50%", dot: "bg-red-500" },
    { label: "Hurt", range: "51–75%", dot: "bg-amber-500" },
    { label: "Healthy", range: ">75%", dot: "bg-emerald-500" },
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
          <span className="text-gray-400">({seg.range})</span>
        </span>
      ))}
    </div>
  );
}
