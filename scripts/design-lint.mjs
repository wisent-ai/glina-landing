import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
const manifest = JSON.parse(await readFile("landing.manifest.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const pin = pkg.dependencies?.["@wisent-ai/components"];
if (!pin) {
  console.log("Design lint skipped: this site predates the pinned @wisent-ai/components dependency. Regenerate it with landing build.");
  process.exit(0);
}
const configName = manifest.designLint?.config ?? ".wisent-design-lint.json";
const recorded = manifest.designLint?.configDigest;
const current = createHash("sha256").update(await readFile(configName)).digest("hex");
if (recorded && recorded !== current) {
  throw new Error("Build refused: " + configName + " changed after generation, so the design lint would run against a configuration nobody generated. Regenerate with landing build.");
}
if (!existsSync("node_modules/.bin/wisent-design-lint")) {
  throw new Error("Build refused: " + pin + " is declared but not installed, so the design lint cannot run. Run npm install.");
}
const run = spawnSync("npx", ["--no-install", "wisent-design-lint", "."], { stdio: "inherit" });
if (run.error) throw run.error;
if (run.status !== 0) throw new Error("Build refused: wisent-design-lint reported findings in the generated site.");
