# EdgeEver Tasks

[简体中文](README.zh-CN.md)

A Markdown-native task dashboard for [EdgeEver](https://github.com/tianma-if/edgeever). Tasks stay inside ordinary notes while the plugin builds a cross-note view and links each item back to its source.

## Features

- Finds standard Markdown tasks such as `- [ ] Write release notes` and `- [x] Ship` across all notes.
- Ignores task examples inside fenced code blocks.
- Filters by completion state, due-date category, and free-text search.
- Recognizes Obsidian Tasks-style date markers (`🛫`, `⏳`, `📅`, `✅`, `➕`, `⛔`) and priority markers.
- Opens the source note from any dashboard row.
- Completes or reopens a task with an optimistic-concurrency range edit, refusing ambiguous stale matches.
- Maintains an event-driven in-memory index after the first scan, so reopening the panel does not rescan every note.
- Inserts `- [ ] ` at the active editor cursor through a command.

The index is intentionally memory-only. Restarting EdgeEver performs one initial scan; Markdown remains the source of truth and no plugin database or migration is required.

## Install

Open EdgeEver's **Plugin Marketplace**, enter this public repository URL, and install:

```text
https://github.com/tianma-if/edgeever-tasks
```

GitHub installation requires a published Release matching the version in `manifest.json`. The release must contain `manifest.json`, `main.js`, and `styles.css` as assets.

## Task syntax

```md
- [ ] Draft announcement 🔺 📅 2026-09-10
- [x] Publish release ✅ 2026-09-11
```

The plugin reads standard list checkboxes. Metadata is optional and remains plain Markdown.

## Development

Requires Bun 1.3.14 or later.

```sh
bun run check
```

The distributable files live at the repository root because EdgeEver's GitHub installer expects that layout. `main.js` is already the single-file runtime artifact; no build step is required.

## License and attribution

Licensed under AGPL-3.0-or-later. The product concept and compatible task metadata are inspired by [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks); this implementation does not copy or bundle its source code.
