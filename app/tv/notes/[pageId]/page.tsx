// Placeholder route. The server-rendered read-only TV note view will be
// rebuilt later.
export default function TvNote({ params }: { params: { pageId: string } }) {
  return (
    <article className="tv-note">
      <h1>Note</h1>
      <p>Coming soon ({params.pageId}).</p>
    </article>
  );
}
