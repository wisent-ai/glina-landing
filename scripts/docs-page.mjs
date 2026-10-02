#!/usr/bin/env node
// docs-page.mjs — export, import, create or remove one page of the Glina
// documentation corpus (src/content/docs.json). The corpus is a catalogue
// of page objects whose `headings` and `order` are derived data: a hand
// edit drifts them, so this tool is the one writer. It computes the
// headings from the markdown the same way the site renders it and keeps
// `order` sequential when a page enters or leaves.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS = resolve(ROOT, "src/content/docs.json");
const USAGE = `usage: node scripts/docs-page.mjs export <slug> <markdown-file>
       node scripts/docs-page.mjs import <slug> <markdown-file>
       node scripts/docs-page.mjs create <slug> <markdown-file> --source <repository>:<path> --after <slug>
       node scripts/docs-page.mjs remove <slug>
       node scripts/docs-page.mjs list
A slug is the page's URL under /docs/, e.g. cli/doctor. create places the new
page right after --after and renumbers what follows; remove closes the gap.`;

function refuse(sentence, code) {
  console.error(sentence);
  process.exit(code);
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}
const options = {};
const words = [];
for (let index = 0; index < argv.length; index += 1) {
  const word = argv[index];
  if (!word.startsWith("--")) {
    words.push(word);
    continue;
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) refuse(`${word} requires a value\n${USAGE}`, 2);
  options[word.slice(2)] = value;
  index += 1;
}
const [operation, slug, markdownFile] = words;

const corpus = JSON.parse(readFileSync(CORPUS, "utf8"));
const pages = corpus.pages;
const at = pages.findIndex((page) => page.slug === slug);

if (operation === "list") {
  for (const page of pages) console.log(`${page.order}\t${page.slug}\t${page.title}`);
  process.exit(0);
}
if (slug === undefined) refuse(USAGE, 2);

// GitHub's heading slug: lower case, punctuation dropped, spaces to hyphens.
function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

function headings(markdown) {
  const rows = [];
  for (const token of marked.lexer(markdown)) {
    if (token.type !== "heading") continue;
    const text = token.text.replace(/`/g, "");
    rows.push({ depth: token.depth, text, id: token.depth === 1 ? "" : headingId(text) });
  }
  return rows;
}

function title(markdown) {
  const first = headings(markdown).find((row) => row.depth === 1);
  if (!first) refuse(`Documentation refused: ${markdownFile} has no "# " title line.`, 2);
  return first.text;
}

function write() {
  pages.sort((left, right) => left.order - right.order);
  writeFileSync(CORPUS, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
}

if (operation === "export") {
  if (at < 0) refuse(`Documentation refused: no page has the slug ${slug}.`, 1);
  if (!markdownFile) refuse(USAGE, 2);
  writeFileSync(resolve(markdownFile), pages[at].markdown, "utf8");
  console.log(`exported ${slug} to ${markdownFile}`);
  process.exit(0);
}

if (operation === "import") {
  if (at < 0) refuse(`Documentation refused: no page has the slug ${slug}; add it with create.`, 1);
  if (!markdownFile || !existsSync(markdownFile)) refuse(`Documentation refused: ${markdownFile} does not exist.`, 2);
  const markdown = readFileSync(resolve(markdownFile), "utf8");
  const page = pages[at];
  if (page.markdown === markdown) {
    console.log(`${slug} is unchanged`);
    process.exit(0);
  }
  page.markdown = markdown;
  page.title = title(markdown);
  page.headings = headings(markdown);
  write();
  console.log(`imported ${markdownFile} into ${slug} (${page.headings.length} headings)`);
  process.exit(0);
}

if (operation === "create") {
  if (at >= 0) refuse(`Documentation refused: ${slug} already exists; change it with import.`, 1);
  if (!markdownFile || !existsSync(markdownFile)) refuse(`Documentation refused: ${markdownFile} does not exist.`, 2);
  const source = options.source;
  const afterSlug = options.after;
  if (!source || !source.includes(":")) refuse(`Documentation refused: create needs --source <repository>:<path>.\n${USAGE}`, 2);
  const after = pages.findIndex((page) => page.slug === afterSlug);
  if (after < 0) {
    refuse(`Documentation refused: --after must name an existing page; ${afterSlug ?? "nothing"} is not one.`, 1);
  }
  const markdown = readFileSync(resolve(markdownFile), "utf8");
  const colon = source.indexOf(":");
  const repository = source.slice(0, colon);
  const path = source.slice(colon + 1);
  const order = pages[after].order + 1;
  for (const page of pages) if (page.order >= order) page.order += 1;
  pages.push({
    productSlug: corpus.product.slug,
    slug,
    title: title(markdown),
    markdown,
    headings: headings(markdown),
    source: { repository, path, ref: "main", url: `https://github.com/wisent-ai/${repository}/blob/main/${path}` },
    order,
  });
  write();
  console.log(`created ${slug} at order ${order}, after ${afterSlug}`);
  process.exit(0);
}

if (operation === "remove") {
  if (at < 0) refuse(`Documentation refused: no page has the slug ${slug}.`, 1);
  const removed = pages.splice(at, 1)[0];
  for (const page of pages) if (page.order > removed.order) page.order -= 1;
  const referrers = pages.filter((page) => page.markdown.includes(`${removed.slug.split("/").pop()}.md`));
  write();
  console.log(`removed ${slug} (was order ${removed.order})`);
  for (const page of referrers) console.log(`note: ${page.slug} still links to ${removed.slug}`);
  process.exit(0);
}

refuse(`unknown operation: ${operation}\n${USAGE}`, 2);
