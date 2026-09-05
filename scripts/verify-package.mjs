import { readFile, stat } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

if (manifest.type !== "plugin") throw new Error("manifest.type must be plugin");
if (manifest.id !== "org.edgeever.tasks") throw new Error("Unexpected plugin id");
if (manifest.entry !== "./main.js") throw new Error("GitHub plugins must use ./main.js");
if (manifest.version !== packageJson.version) throw new Error("package.json and manifest.json versions differ");
if (process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME !== `v${manifest.version}`) {
  throw new Error(`Release tag ${process.env.GITHUB_REF_NAME} does not match v${manifest.version}`);
}

const entry = await readFile(new URL("../main.js", import.meta.url), "utf8");
if (/\b(?:import|export)\s+(?:[^;]*?\s+from\s+)?["']\.\.?\//u.test(entry)) {
  throw new Error("main.js must not contain relative module imports");
}

const limits = [["manifest.json", 256 * 1024], ["main.js", 5 * 1024 * 1024], ["styles.css", 1024 * 1024]];
for (const [name, maximum] of limits) {
  const info = await stat(new URL(`../${name}`, import.meta.url));
  if (info.size > maximum) throw new Error(`${name} exceeds the EdgeEver package limit`);
}

console.log(`Verified EdgeEver Tasks v${manifest.version}`);
