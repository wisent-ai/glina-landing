import { marked } from "marked";
import catalog from "@/content/docs.json";

export type DocsPage = (typeof catalog.pages)[number];

export const docsProduct = catalog.product;
export const docsPages = catalog.pages;

export function docsHref(slug: string): string {
  return `/docs/${slug}`;
}

export function getDocsPage(slug: string): DocsPage | undefined {
  return docsPages.find((page) => page.slug === slug);
}

export async function renderDocsMarkdown(page: DocsPage): Promise<string> {
  const html = await marked.parse(page.markdown);
  const base = page.slug.includes("/") ? page.slug.slice(0, page.slug.lastIndexOf("/") + 1) : "";
  return html.replace(/href="([^"#][^"]*?)\.md(#[^"]*)?"/g, (_match, target: string, anchor = "") => {
    const normalized = new URL(target, `https://docs.invalid/${base}`).pathname.slice(1);
    return `href="/docs/${normalized}${anchor}"`;
  });
}
