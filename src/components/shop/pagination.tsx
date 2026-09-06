import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
  searchParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") sp.set(key, value);
    }
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={
            p === page
              ? "flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm text-white"
              : "flex h-9 w-9 items-center justify-center rounded-lg border border-border text-sm text-muted hover:text-foreground"
          }
        >
          {p}
        </Link>
      ))}
    </div>
  );
}
