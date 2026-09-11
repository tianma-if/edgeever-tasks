# EdgeEver Tasks

[![GitHub Stars](https://img.shields.io/github/stars/tianma-if/edgeever-tasks?style=social)](https://github.com/tianma-if/edgeever-tasks/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/tianma-if/edgeever-tasks?style=social)](https://github.com/tianma-if/edgeever-tasks/network/members)

[简体中文](README.zh-CN.md) | English

> **The official Markdown-native task dashboard plugin for EdgeEver.**

EdgeEver Tasks keeps tasks inside ordinary notes while providing a unified cross-note dashboard. Every task remains plain Markdown and links directly back to its source note.

## Features

- Finds standard Markdown tasks such as `- [ ] Write release notes` and `- [x] Ship` across all notes.
- Understands `- [/] In progress` and `- [-] Cancelled` statuses.
- Ignores task examples inside fenced code blocks and comments.
- Dashboard views for today, overdue, this week, inbox, open, recurring, done, and cancelled tasks.
- Compact month calendar marks days that have tasks and filters the dashboard by date.
- Filters by keyword, priority, and grouping (due date, priority, note, or heading).
- Writes dates and other fields as quiet text, for example `[due:: 2026-09-10]`, and still reads Obsidian Tasks emoji lines.
- Completes a task with an optional done date and creates the next recurring occurrence.
- Create or edit description, dates, priority, status, and recurrence from a dialog — from the dashboard or the current editor line.
- Opens the source note from any dashboard row.
- Completes or updates a task with an optimistic-concurrency range edit, preferring the live editor when that note is open.
- Maintains an event-driven in-memory index after the first scan, so reopening the panel does not rescan every note.
- Optional global filter so only checklist items such as `#task` are indexed.
- Inserts `- [ ] ` at the active editor cursor through a command.

The index is intentionally memory-only. Restarting EdgeEver performs one initial scan; Markdown remains the source of truth and no plugin database or migration is required.

## About EdgeEver

[EdgeEver](https://github.com/tianma-if/edgeever) is an open-source, AI-native knowledge base and portable Evernote alternative with native MCP support.

- GitHub: [github.com/tianma-if/edgeever](https://github.com/tianma-if/edgeever)

## Install

Open EdgeEver's **Plugin Marketplace**, enter this public repository URL, and install:

```text
https://github.com/tianma-if/edgeever-tasks
```

GitHub installation requires a published Release matching the version in `manifest.json`. The release must contain `manifest.json`, `main.js`, and `styles.css` as assets. Pushing `main` publishes that Release automatically if it does not already exist.

## Task syntax

```md
- [ ] Draft announcement [priority:: highest] [due:: 2026-09-10]
- [/] Review copy [repeat:: every week] [scheduled:: 2026-09-11]
- [x] Publish release [completion:: 2026-09-11]
- [-] Dropped approach [cancelled:: 2026-09-09]
```

Existing emoji lines such as `📅 2026-09-10` are still read. The plugin writes the text format above unless you switch the setting back to emoji.

The plugin reads standard list checkboxes. Metadata is optional and remains plain Markdown.

Recurring tasks need a due, scheduled, or start date. Completing `[repeat:: every Sunday] [due:: 2021-04-25]` inserts the next occurrence and writes a completion date.

## Settings

- **Global filter** — only index checklist items that contain this string, for example `#task`.
- **Task metadata format** — write `[due:: YYYY-MM-DD]` (default) or Obsidian Tasks emoji.
- **Write done date on completion** — write a completion date when a task is marked done (on by default).
- **Write cancelled date** — write a cancelled date when a task is cancelled (on by default).
- **Write created date on new tasks** — write a created date when creating from the edit dialog.
- **Next recurring task** — insert the new occurrence above or below the completed task.

## Development

Requires Bun 1.3.14 or later.

```sh
bun run check
bun run release -- --patch
```

`bun run release` is the only supported way to bump the version. It commits the synchronized `package.json` and `manifest.json`, pushes `main`, and publishes the GitHub Release the installer requires.

The distributable files live at the repository root because EdgeEver's GitHub installer expects that layout. `main.js` is already the single-file runtime artifact; no build step is required.

## License and attribution

Licensed under AGPL-3.0-or-later.

This plugin is an independent implementation for EdgeEver. It is compatible with [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)-style task metadata (dates, priorities, and recurrence rules). It is not an official port of Obsidian Tasks.
