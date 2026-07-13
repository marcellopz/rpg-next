"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { IconButton, Typography } from "@/components/ui";
import {
  searchNotesClient,
  type NoteSearchResult,
} from "@/lib/notes/client-state";

const DEBOUNCE_MS = 400;

function pageHref(publicCode: string, result: NoteSearchResult): string {
  const params = new URLSearchParams();
  if (result.scope === "personal") params.set("tab", "my");
  params.set("page", result.pageId);
  return `/campaigns/${publicCode}?${params.toString()}`;
}

function ResultRow({
  result,
  publicCode,
  onNavigate,
}: {
  result: NoteSearchResult;
  publicCode: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(pageHref(publicCode, result))}
      className="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-accent-300 hover:bg-accent-50"
    >
      <div className="text-sm font-semibold text-gray-900">
        {result.categoryName ? `${result.categoryName} > ` : ""}
        {result.title}
        {result.scope === "personal" && (
          <span className="ml-2 text-xs font-normal text-gray-400">
            My notes
          </span>
        )}
      </div>
      {result.snippet && (
        <p className="mt-1.5 text-sm leading-5 text-gray-600">
          {result.snippet.truncatedStart && "… "}
          {result.snippet.before}
          <mark className="rounded bg-accent-200/70 px-0.5 text-gray-900">
            {result.snippet.match}
          </mark>
          {result.snippet.after}
          {result.snippet.truncatedEnd && " …"}
        </p>
      )}
    </button>
  );
}

export function CampaignSearchModal({
  campaignId,
  publicCode,
  onClose,
}: {
  campaignId: string;
  publicCode: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<NoteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedQuery(query.trim()),
      DEBOUNCE_MS
    );
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchNotesClient(campaignId, debouncedQuery)
      .then((next) => {
        if (!cancelled) setResults(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Search failed.");
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId, debouncedQuery]);

  function handleNavigate(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div
      id="campaign-search-modal"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-search-title"
        className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <h2 id="campaign-search-title" className="sr-only">
          Search notes
        </h2>
        <div className="flex items-center gap-3 border-b border-gray-200 p-4">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            ref={inputRef}
            id="campaign-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="min-w-0 flex-1 border-none p-0 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
          <IconButton
            aria-label="Close search"
            onClick={onClose}
            className="h-8 w-8 rounded-md"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        <div
          id="campaign-search-results"
          className="flex-1 space-y-2 overflow-y-auto p-4"
        >
          {loading && (
            <Typography variant="muted" className="py-6 text-center">
              Searching…
            </Typography>
          )}
          {!loading && error && (
            <Typography variant="muted" className="py-6 text-center text-red-600">
              {error}
            </Typography>
          )}
          {!loading &&
            !error &&
            debouncedQuery.length > 0 &&
            results.length === 0 && (
              <Typography variant="muted" className="py-6 text-center">
                No results found.
              </Typography>
            )}
          {!loading &&
            !error &&
            results.map((result) => (
              <ResultRow
                key={result.pageId}
                result={result}
                publicCode={publicCode}
                onNavigate={handleNavigate}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
