# AGENTS.md

- Keep `README.md` and `README.zh-CN.md` synchronized.
- Keep `package.json` and `manifest.json` versions synchronized.
- `main.js` must remain a single-file browser module with no relative imports.
- Run `bun run check` before committing or publishing.
- A release must attach `manifest.json`, `main.js`, and `styles.css` without renaming them.
- EdgeEver GitHub installs read the default-branch `manifest.json` version, then download that exact GitHub Release. Shipping a version bump without a matching Release (`vX.Y.Z` containing those three assets) is a user-facing install/update failure.
- Never bump `package.json` or `manifest.json` in a feature commit. Cut a version only with `bun run release -- --patch|--minor|--major`, which commits, pushes `main`, and publishes the Release.
- If `main` already has a version with no Release, run `bun run publish-release` or rely on the `Publish plugin Release` workflow. Do not treat creating a one-off Release as the whole fix when the guard is missing.
- In this repository, "release" / "发 release" / "发个 release" always means this plugin: `bun run release -- --patch|--minor|--major` in `edgeever-tasks`. Never run EdgeEver host `bun run release`, never bump EdgeEver, and never publish an EdgeEver GitHub Release unless the user names the host repo explicitly.
