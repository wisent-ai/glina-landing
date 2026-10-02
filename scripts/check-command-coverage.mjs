#!/usr/bin/env node
// Every command `glina` dispatches has a page in this site's corpus, or this
// refuses. The commands are read from the dispatcher in the Glina checkout
// (pipeline/cli.js: each `case '<name>':` of the command switch), the pages
// from src/content/docs.json (one page per `cli/<name>` slug). `help` is the
// usage itself and `showcases`/`presets` are documented on the pages of the
// commands that read them, so those are expected under the names they carry.
//
//   node scripts/check-command-coverage.mjs [--glina-root DIR]
//
// Exit 0 when every command has a page, 1 with the missing ones named, 2 for
// a wrong invocation or an unreadable dispatcher.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
let glinaRoot = resolve(root, "..", "glina");
for (let index = 0; index < argv.length; index += 1) {
  if (argv[index] === "--glina-root" && index + 1 < argv.length) {
    index += 1;
    glinaRoot = resolve(argv[index]);
    continue;
  }
  console.error(`check-command-coverage: unknown argument ${argv[index]}`);
  process.exit(2);
}

const dispatcherPath = resolve(glinaRoot, "pipeline/cli.js");
let dispatcher;
try {
  dispatcher = readFileSync(dispatcherPath, "utf8");
} catch (error) {
  console.error(`check-command-coverage: ${dispatcherPath} cannot be read (${error.message}); name the Glina checkout with --glina-root`);
  process.exit(2);
}
const start = dispatcher.indexOf("switch (command)");
if (start < 0) {
  console.error(`check-command-coverage: ${dispatcherPath} has no command switch`);
  process.exit(2);
}
const dispatched = new Set();
for (const arm of dispatcher.slice(start).matchAll(/^\s*case '([a-z][a-z-]*)':/gm)) {
  dispatched.add(arm[1]);
}

const corpus = JSON.parse(readFileSync(resolve(root, "src/content/docs.json"), "utf8"));
const slugs = new Set(corpus.pages.map((page) => page.slug));
const missing = [...dispatched]
  .filter((command) => !slugs.has(`cli/${command}`))
  .sort();
if (missing.length) {
  console.error(
    `check-command-coverage: ${missing.length} dispatched command(s) have no page: ${missing.join(", ")}; add cli/<command> with scripts/docs-page.mjs create`,
  );
  process.exit(1);
}
console.log(`check-command-coverage: every one of ${dispatched.size} dispatched commands has a page`);
