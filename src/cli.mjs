#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function verifyDesignContract() {
  const manifest = JSON.parse(readFileSync("landing.manifest.json", "utf8"));
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const pin = pkg.dependencies?.["@wisent-ai/components"];
  if (!pin) {
    console.log(
      "Design lint skipped: this site predates the pinned @wisent-ai/components dependency. Regenerate it with landing build.",
    );
    return;
  }

  const configName = manifest.designLint?.config ?? ".wisent-design-lint.json";
  const recorded = manifest.designLint?.configDigest;
  const current = createHash("sha256").update(readFileSync(configName)).digest("hex");
  if (recorded && recorded !== current) {
    throw new Error(
      `Build refused: ${configName} changed after generation, so the design lint would run against a configuration nobody generated. Regenerate with landing build.`,
    );
  }
  if (!existsSync("node_modules/.bin/wisent-design-lint")) {
    throw new Error(`Build refused: ${pin} is declared but not installed, so the design lint cannot run. Run npm install.`);
  }
  const lint = spawnSync("npx", ["--no-install", "wisent-design-lint", "."], { stdio: "inherit" });
  if (lint.error) throw lint.error;
  if (lint.status !== 0) {
    throw new Error("Build refused: wisent-design-lint reported findings in the generated site.");
  }
}

function verifyPublicationApproval() {
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  const manifestRaw = readFileSync("landing.manifest.json", "utf8");
  const manifest = JSON.parse(manifestRaw);
  let approval;
  try {
    approval = JSON.parse(readFileSync("landing.approval.json", "utf8"));
  } catch {
    throw new Error(
      "Publication refused: landing.approval.json is missing. Build with npm run build:review, review the page, then run landing approve with --by, --reference, and --statement.",
    );
  }

  const rows = [...manifest.files]
    .filter((file) => !file.startsWith("."))
    .sort()
    .map((relative) => {
      try {
        return `${relative}\0${hash(readFileSync(relative))}`;
      } catch {
        return `${relative}\0<missing>`;
      }
    });
  const siteDigest = hash(rows.join("\n"));
  const checks = [
    [approval.manifestDigest, hash(manifestRaw), "manifest"],
    [approval.siteDigest, siteDigest, "site files"],
    [approval.briefDigest, manifest.briefDigest, "brief"],
    [approval.componentPlanDigest, manifest.componentPlanDigest, "component plan"],
    [approval.contentPlanDigest, manifest.planDigest, "content plan"],
  ];
  for (const [approved, current, label] of checks) {
    if (approved !== current) throw new Error(`Publication refused: ${label} changed after approval.`);
  }
  if (!approval.approvedBy) throw new Error("Publication refused: approval does not name a human.");
  if (!approval.approvalReference) throw new Error("Publication refused: approval has no conversation or review reference.");
  if (!approval.approvalStatement) throw new Error("Publication refused: approval has no explicit human approval statement.");
  console.log(`Landing approved by ${approval.approvedBy} at ${approval.approvedAt}`);
}

const command = process.argv[2];
if (!new Set(["build", "review"]).has(command) || process.argv.length !== 3) {
  console.error("Usage: glina-landing build|review");
  process.exit(2);
}
verifyDesignContract();
if (command === "build") verifyPublicationApproval();
const next = spawnSync("npx", ["--no-install", "next", "build"], { stdio: "inherit" });
if (next.error) throw next.error;
process.exit(next.status ?? 1);
