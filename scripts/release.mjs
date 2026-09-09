import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bumpSemVer, publishMissingRelease, readReleaseVersion, releaseTagFor } from "./publish-release.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`);
};

const runCapture = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `${command} failed`);
  return result.stdout.trim();
};

if (import.meta.main) {
  const kind = process.argv.includes("--major") ? "major" : process.argv.includes("--minor") ? "minor" : process.argv.includes("--patch") ? "patch" : null;
  if (!kind) throw new Error("Usage: bun run release -- --patch|--minor|--major");
  if (runCapture("git", ["status", "--porcelain"])) throw new Error("Working tree must be clean before releasing");
  if (runCapture("git", ["branch", "--show-current"]) !== "main") throw new Error("Releases must be cut from main");

  const manifestPath = new URL("../manifest.json", import.meta.url);
  const packagePath = new URL("../package.json", import.meta.url);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const current = readReleaseVersion(manifest);
  if (packageJson.version !== current) throw new Error("package.json and manifest.json versions differ");
  const version = bumpSemVer(current, kind);
  manifest.version = version;
  packageJson.version = version;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  run("bun", ["run", "check"]);
  run("git", ["add", "manifest.json", "package.json"]);
  run("git", ["commit", "-m", `chore: release ${releaseTagFor(version)}`]);
  run("git", ["push", "origin", "main"]);
  const published = publishMissingRelease({ version });
  console.log(`Released ${published.tag}`);
}
