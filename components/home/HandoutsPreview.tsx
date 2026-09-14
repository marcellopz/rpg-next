"use client";

import {
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Presentation,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const HANDOUTS = [
  {
    name: "Eldermoor map.jpg",
    type: "Image",
    icon: ImageIcon,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "The torn letter.pdf",
    type: "PDF",
    icon: FileText,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    name: "Stag sigil.png",
    type: "Image",
    icon: ImageIcon,
    tone: "bg-violet-50 text-violet-700",
  },
];

export function HandoutsPreview() {
  const { t } = useI18n();

  return (
    <div className="h-full w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Campaign files</p>
          <p className="text-[0.65rem] text-gray-500">Share clues with the table</p>
        </div>
        <span className="rounded bg-accent-600 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white">
          Upload file
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {HANDOUTS.map((handout, index) => {
          const FileIcon = handout.icon;
          return (
            <article
              key={handout.name}
              className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <div
                className={`flex h-16 items-center justify-center sm:h-20 ${handout.tone}`}
              >
                <FileIcon className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
              </div>
              <div className="p-2">
                <p className="truncate text-[0.65rem] font-semibold text-gray-800 sm:text-xs">
                  {handout.name}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-1 text-[0.55rem] text-gray-500 sm:text-[0.65rem]">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" aria-hidden />
                    {index === 1 ? "Personal" : "Shared"}
                  </span>
                  {index === 0 && (
                    <Presentation
                      className="h-3.5 w-3.5 text-accent-600"
                      aria-label="Shown to table"
                    />
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <span className="flex h-6 items-center justify-center gap-1 rounded border border-gray-300 bg-white px-1 text-[0.55rem] font-semibold text-gray-700 sm:text-[0.6rem]">
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    {t("handouts.open")}
                  </span>
                  <span className="flex h-6 items-center justify-center gap-1 rounded bg-accent-600 px-1 text-[0.55rem] font-semibold text-white sm:text-[0.6rem]">
                    <Presentation className="h-3 w-3" aria-hidden />
                    <span className="truncate">{t("handouts.show")}</span>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
