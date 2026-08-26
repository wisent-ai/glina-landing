import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { docsPages, docsProduct, getDocsPage, renderDocsMarkdown } from "@/lib/docs";

type DocsPageProps = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return docsPages.map((page) => ({ slug: page.slug.split("/") }));
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocsPage(slug.join("/"));
  if (!page) return {};
  return {
    title: page.title,
    description: docsProduct.summary,
    alternates: { canonical: `/docs/${page.slug}` },
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const page = getDocsPage(slug.join("/"));
  if (!page) notFound();
  const html = await renderDocsMarkdown(page);

  return (
    <div className="docs-shell docs-page-shell">
      <nav className="docs-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/docs">Documentation</Link>
        <span aria-hidden="true">/</span>
        <span>{page.title}</span>
      </nav>
      <article className="docs-article" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
