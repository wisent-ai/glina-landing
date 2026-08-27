import assert from "node:assert/strict";
import test from "node:test";

const productionOrigin = "https://glina.wisent.com";
const commands = [
  ["help", "glina help"],
  ["create", "glina create <prompt> [--race <race>] [--out <dir>] [--config <path>]"],
  ["sculpt", "glina sculpt <prompt> [--out <dir>] [--filename <file.glb>] [--rounds <n>] [--config <path>]"],
  ["verify", "glina verify <file.glb> [--config <path>]"],
  ["check-config", "glina check-config [--config <path>]"],
  ["weles-tools", "glina weles-tools"],
  ["blender-health", "glina blender-health"],
  ["preview-anim", "glina preview-anim <file.glb> [--clip <name>] [--frames <n>] [--fps <n>] [--out <file.gif>] [--config <path>]"],
  ["animate", "glina animate <file.glb> [--preset dragon] [--out <file.glb>] [--config <path>]"],
  ["showcase", "glina showcase [dragon] [--out <file.glb>] [--config <path>]"],
  ["serve", "glina serve [--port <n>] [--config <path>]"],
  ["setup", "glina setup [--check] [--dry-run]"],
  ["export-config", "glina export-config --out <path> [--config <path>]"],
];

function canonicalHref(html) {
  const tag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

test("production publishes every Glina human CLI command route", async (t) => {
  for (const [path, invocation] of commands) {
    await t.test(path, async () => {
      const expectedUrl = `${productionOrigin}/docs/cli/${path}`;
      const response = await fetch(expectedUrl, { redirect: "manual" });
      const html = await response.text();

      assert.equal(response.status, 200, `${expectedUrl} must return 200 without redirecting`);
      assert.equal(canonicalHref(html), expectedUrl, `${expectedUrl} must declare its exact canonical URL`);
      assert.match(visibleText(html), new RegExp(invocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${expectedUrl} must show ${invocation}`);
    });
  }
});

test("production CLI index links the complete command tree", async () => {
  const indexUrl = `${productionOrigin}/docs/cli`;
  const response = await fetch(indexUrl, { redirect: "manual" });
  const html = await response.text();

  assert.equal(response.status, 200, `${indexUrl} must return 200 without redirecting`);
  assert.equal(canonicalHref(html), indexUrl, `${indexUrl} must declare its exact canonical URL`);

  for (const [path] of commands) {
    const route = `/docs/cli/${path}`;
    assert.match(html, new RegExp(`href=["']${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`), `${indexUrl} must link ${route}`);
  }
});
