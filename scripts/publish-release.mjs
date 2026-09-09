import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

export const releaseTagFor = (version) => `v${version}`;

export const readReleaseVersion = (manifest) => {
  if (!manifest || typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    throw new Error("manifest.json version must be SemVer X.Y.Z");
  }
  return manifest.version;
};

export const bumpSemVer = (version, kind) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Invalid version: ${version}`);
  const parts = match.slice(1).map(Number);
  if (kind === "major") return `${parts[0] + 1}.0.0`;
  if (kind === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
  if (kind === "patch") return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  throw new Error("Use --patch, --minor, or --major");
};

const runGh = (args) => spawnSync("gh", args, { cwd: root, encoding: "utf8" });

export const findExistingReleaseTag = (version, gh = runGh) => {
  const tag = releaseTagFor(version);
  for (const name of [tag, version]) {
    const result = gh(["release", "view", name, "--json", "tagName"]);
    if (result.status === 0) return name;
  }
  return null;
};

export const releaseNotesFor = (version) =>
  `EdgeEver GitHub installs read this Release for v${version}. Assets must remain manifest.json, main.js, and styles.css.`;

export const publishMissingRelease = ({ version, notes, gh = runGh, dryRun = false } = {}) => {
  const tag = releaseTagFor(version);
  const existing = findExistingReleaseTag(version, gh);
  if (existing) return { created: false, tag: existing };
  if (dryRun) return { created: true, tag, dryRun: true };
  const created = gh([
    "release", "create", tag,
    "manifest.json", "main.js", "styles.css",
    "--title", tag,
    "--notes", notes ?? releaseNotesFor(version),
  ]);
  if (created.status !== 0) {
    throw new Error(created.stderr?.trim() || created.stdout?.trim() || `Failed to create GitHub Release ${tag}`);
  }
  return { created: true, tag };
};

if (import.meta.main) {
  const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
  const version = readReleaseVersion(manifest);
  const result = publishMissingRelease({ version, dryRun: process.argv.includes("--dry-run") });
  console.log(result.created
    ? `Published GitHub Release ${result.tag}${result.dryRun ? " (dry run)" : ""}`
    : `GitHub Release ${result.tag} already exists`);
}
