import type { Metadata } from "next";
import Link from "next/link";
import { docsHref, docsPages, docsProduct } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation",
  description: docsProduct.summary,
  alternates: { canonical: "/docs" },
};

export default function DocsIndex() {
  return (
    <div className="docs-shell">
      <header className="docs-hero">
        <p className="docs-kicker">Glina documentation</p>
        <h1>Build verified game assets.</h1>
        <p>{docsProduct.summary}</p>
      </header>
      <ol className="docs-grid">
        {docsPages.map((page, index) => (
          <li key={page.slug}>
            <Link href={docsHref(page.slug)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{page.title}</strong>
              <small>{page.headings.length} sections</small>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
