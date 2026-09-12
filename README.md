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
- Sidebar month calendar marks days that have tasks and filters the list by date.
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

## How to use

Tasks live in notes. The plugin only scans and updates those checklist lines; it does not keep a separate task database.

### Open the dashboard

After the plugin is enabled, open **Tasks** from the plugin puzzle menu, or run **Open task dashboard**. The panel lists tasks from every note.

### Create a task

Any of these works:

- In a note, write a normal checklist item: `- [ ] Call the printer shop`.
- With the cursor in a note, run **Insert task at cursor**.
- From the dashboard, use **Create or edit task**. Fill in the description and optional dates there; you do not have to type `[due:: …]` by hand.

Dates, priority, and recurrence are optional. A line with no date goes to **Inbox**. Recurring tasks need a due, scheduled, or start date so the plugin knows the next occurrence.

In the EdgeEver editor, fields such as `[due:: 2026-09-10]` render as compact chips. Click a chip to edit the raw field. Markdown source still stores the text.

### Work from the dashboard

- **Views** — Today, Overdue, This week, Inbox, Open, Recurring, Done, Cancelled, All. Switching a view clears the calendar day filter so the tab shows that whole collection.
- **Calendar** — Days with tasks show a dot. Click a day to see only that date. **Today** and **All dates** jump back out of a day filter.
- **Search, priority, grouping** — Narrow the list, or group by due date, priority, note, or heading.
- **Complete** — Tick the checkbox on a row. The source note is updated in place. Recurring tasks insert the next occurrence automatically.
- **Edit** — Open the dialog from a row to change dates, priority, status, or recurrence.
- **Jump to the note** — Click the task title (or press Enter on a focused row) to open the source.

### Statuses in the note

| Markdown | Meaning |
| --- | --- |
| `- [ ]` | To do |
| `- [/]` | In progress |
| `- [x]` | Done |
| `- [-]` | Cancelled |

## Task syntax

Fields sit on the same line, after the description. All of them are optional. Prefer the create/edit dialog if you do not want to type the markup.

```md
- [ ] Draft announcement [priority:: highest] [due:: 2026-09-10]
- [/] Review copy [repeat:: every week] [scheduled:: 2026-09-11]
- [x] Publish release [completion:: 2026-09-11]
- [-] Dropped approach [cancelled:: 2026-09-09]
```

The plugin writes `[key:: value]` by default. Parentheses such as `(due:: 2026-09-10)` are also read. Existing Obsidian Tasks emoji lines are still read; switch **Task metadata format** to emoji if you want the plugin to write those instead.

### Fields

Dates use `YYYY-MM-DD`.

| Field | Meaning | Example |
| --- | --- | --- |
| `[due:: …]` | Due date | `[due:: 2026-09-10]` |
| `[scheduled:: …]` | Day you plan to work on it | `[scheduled:: 2026-09-11]` |
| `[start:: …]` | Do not start before this day | `[start:: 2026-09-11]` |
| `[completion:: …]` | Done date | `[completion:: 2026-09-11]` |
| `[created:: …]` | Created date | `[created:: 2026-09-01]` |
| `[cancelled:: …]` | Cancelled date | `[cancelled:: 2026-09-09]` |
| `[priority:: …]` | `highest` `high` `medium` `low` `lowest` | `[priority:: high]` |
| `[repeat:: …]` | Recurrence rule | `[repeat:: every week]` |
| `[id:: …]` | Task id | `[id:: screenshots]` |
| `[dependsOn:: …]` | Ids this task waits on | `[dependsOn:: screenshots]` |
| `[onCompletion:: …]` | `delete` or `keep` | `[onCompletion:: delete]` |

Recurring tasks need a due, scheduled, or start date. Completing `[repeat:: every Sunday] [due:: 2021-04-25]` inserts the next occurrence and writes a completion date. Common rules: `every day`, `every weekday`, `every week`, `every Sunday`, `every month`, `every year`, `every week when done`.

### Emoji lines still read

| Emoji | Same as |
| --- | --- |
| 📅 | `[due:: …]` |
| ⏳ | `[scheduled:: …]` |
| 🛫 | `[start:: …]` |
| ✅ | `[completion:: …]` |
| ➕ | `[created:: …]` |
| ❌ | `[cancelled:: …]` |
| 🔺⏫🔼🔽⏬ | `[priority:: …]` |
| 🔁 | `[repeat:: …]` |
| 🆔 | `[id:: …]` |
| ⛔ | `[dependsOn:: …]` |
| 🏁 | `[onCompletion:: …]` |

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
