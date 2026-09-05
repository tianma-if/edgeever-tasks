# AGENTS.md

- Keep `README.md` and `README.zh-CN.md` synchronized.
- Keep `package.json` and `manifest.json` versions synchronized.
- `main.js` must remain a single-file browser module with no relative imports.
- Run `bun run check` before committing or publishing.
- A release must attach `manifest.json`, `main.js`, and `styles.css` without renaming them.
