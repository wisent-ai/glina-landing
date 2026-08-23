import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const manifestRaw = await readFile("landing.manifest.json", "utf8");
const manifest = JSON.parse(manifestRaw);
let approval;
try { approval = JSON.parse(await readFile("landing.approval.json", "utf8")); }
catch { throw new Error("Publication refused: landing.approval.json is missing. Build with npm run build:review, review the page, then run landing approve with --by, --reference, and --statement."); }
const rows = [];
for (const relative of [...manifest.files].filter((f) => !f.startsWith(".")).sort()) rows.push(relative + "\0" + hash(await readFile(relative)));
const siteDigest = hash(rows.join("\n"));
const checks = [
  [approval.manifestDigest, hash(manifestRaw), "manifest"],
  [approval.siteDigest, siteDigest, "site files"],
  [approval.briefDigest, manifest.briefDigest, "brief"],
  [approval.componentPlanDigest, manifest.componentPlanDigest, "component plan"],
  [approval.contentPlanDigest, manifest.planDigest, "content plan"],
];
for (const [approved, current, label] of checks) if (approved !== current) throw new Error("Publication refused: " + label + " changed after approval.");
if (!approval.approvedBy) throw new Error("Publication refused: approval does not name a human.");
if (!approval.approvalReference) throw new Error("Publication refused: approval has no conversation or review reference.");
if (!approval.approvalStatement) throw new Error("Publication refused: approval has no explicit human approval statement.");
console.log("Landing approved by " + approval.approvedBy + " at " + approval.approvedAt);
