import { UserRound } from "lucide-react";

const CHARACTERS = [
  {
    name: "Wren",
    initial: "W",
    avatar: "bg-violet-600",
    tile: "border-violet-400 bg-violet-200",
    resources: [
      { name: "1st-level spell slots", current: 2, total: 4 },
      { name: "2nd-level spell slots", current: 2, total: 3 },
      { name: "Arcane Recovery", current: 1, total: 1 },
    ],
  },
  {
    name: "Tobi",
    initial: "T",
    avatar: "bg-sky-600",
    tile: "border-sky-400 bg-sky-200",
    resources: [
      { name: "Channel Divinity", current: 1, total: 2 },
      { name: "Second Wind", current: 1, total: 1 },
      { name: "Inspiration", current: 0, total: 1 },
    ],
  },
] as const;

export function ResourcesPreview() {
  return (
    <div className="h-full w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-4">
      <div className="grid h-full grid-cols-2 gap-3">
        {CHARACTERS.map((character) => (
          <section
            key={character.name}
            className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${character.avatar}`}
              >
                {character.initial}
              </span>
              <h3 className="truncate text-xs font-semibold text-gray-900 sm:text-sm">
                {character.name}
              </h3>
              <UserRound className="ml-auto h-3.5 w-3.5 text-gray-400" aria-hidden />
            </div>
            <div className="mt-2 space-y-2.5">
              {character.resources.map((resource) => (
                <div key={resource.name}>
                  <div className="flex justify-between gap-2 text-[0.6rem] font-medium text-gray-500 sm:text-[0.65rem]">
                    <span className="truncate">{resource.name}</span>
                    <span className="shrink-0">
                      {resource.current}/{resource.total}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    {Array.from({ length: resource.total }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-4 flex-1 rounded border ${
                          index < resource.current
                            ? character.tile
                            : "border-gray-200 bg-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
