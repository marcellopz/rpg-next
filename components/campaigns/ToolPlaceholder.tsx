import { Chip, Typography } from "@/components/ui";

export function ToolPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      id="campaign-tool-placeholder"
      className="flex min-h-[42rem] flex-1 items-center justify-center bg-gradient-to-b from-gray-50 to-white p-8"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <Chip variant="accent">Coming soon</Chip>
        <Typography variant="h3" as="h2" className="mt-4">
          {title}
        </Typography>
        <Typography variant="muted" className="mx-auto mt-3 max-w-md leading-6">
          {description}
        </Typography>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {["Overview", "Session tools", "TV display"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <Typography variant="small" className="font-semibold text-gray-700">
                {label}
              </Typography>
              <div className="mt-3 space-y-2">
                <div className="h-2 rounded-full bg-gray-200" />
                <div className="h-2 w-2/3 rounded-full bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
