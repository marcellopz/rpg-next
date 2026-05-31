import "./tv.css";

// The /tv route group is its own read-only surface: no editor, no uploads,
// no mutations. It renders the same data from the same database.
export default function TvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="tv-root">{children}</div>;
}
