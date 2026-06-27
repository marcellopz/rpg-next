import type { ReactNode } from "react";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";

export function CampaignToolCard({
  title,
  description,
  status = "Coming soon",
  children,
  className,
}: {
  title: string;
  description: string;
  status?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <Chip variant="accent" className="shrink-0">
          {status}
        </Chip>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
