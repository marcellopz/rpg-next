import { Bold, Italic, List, Search } from "lucide-react";

const PAGES = ["Eldermoor", "The Withered Grove", "Important NPCs"];

export function WikiPreview() {
  return (
    <div className="flex h-full w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <aside className="w-32 shrink-0 border-r border-gray-200 bg-gray-50 p-3 sm:w-40">
        <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1.5 text-gray-400">
          <Search className="h-3.5 w-3.5" aria-hidden />
          <span className="text-[0.65rem]">Search notes</span>
        </div>
        <p className="mt-4 text-[0.6rem] font-bold uppercase tracking-wider text-gray-400">
          World
        </p>
        <div className="mt-1.5 space-y-1">
          {PAGES.map((page, index) => (
            <div
              key={page}
              className={`truncate rounded px-2 py-1.5 text-xs ${
                index === 1
                  ? "bg-accent-100 font-semibold text-accent-800"
                  : "text-gray-600"
              }`}
            >
              {page}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.6rem] font-bold uppercase tracking-wider text-gray-400">
          Characters
        </p>
        <div className="mt-1.5 rounded px-2 py-1.5 text-xs text-gray-600">
          Mara
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex h-10 items-center gap-1 border-b border-gray-200 px-3 text-gray-500">
          <span className="rounded p-1.5">
            <Bold className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="rounded p-1.5">
            <Italic className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="rounded p-1.5">
            <List className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="ml-auto text-[0.65rem] text-emerald-600">Saved</span>
        </div>
        <article className="p-4 sm:p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-accent-600">
            Locations
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-gray-900 sm:text-2xl">
            The Withered Grove
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Beyond the old bridge, blackened trees lean toward a clearing where
            no birds sing.
          </p>
          <div className="mt-4 border-l-2 border-accent-300 bg-accent-50 px-3 py-2 text-xs italic text-gray-600">
            The blight grows stronger beneath the moon.
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-full rounded bg-gray-100" />
            <div className="h-1.5 w-5/6 rounded bg-gray-100" />
            <div className="h-1.5 w-2/3 rounded bg-gray-100" />
          </div>
        </article>
      </div>
    </div>
  );
}
