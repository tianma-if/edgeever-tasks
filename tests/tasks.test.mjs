import { describe, expect, test } from "bun:test";
import {
  createTaskIndex,
  createTaskController,
  createTaskStatusEdit,
  flattenTaskIndex,
  parseTaskLine,
  parseTasksFromNote,
  removeNoteFromTaskIndex,
  replaceNoteInTaskIndex,
  scanAllTasks,
} from "../main.js";
import taskPlugin from "../main.js";

const note = (overrides = {}) => ({
  id: "note-1",
  title: "Release plan",
  excerpt: "",
  revision: 3,
  contentHash: "hash-3",
  contentMarkdown: "Intro\n- [ ] Ship release 🔺 📅 2026-09-10\n  * [x] Tell users ✅ 2026-09-11\nNot a task",
  ...overrides,
});

describe("EdgeEver Tasks", () => {
  test("registers an API v2 dashboard panel", () => {
    let panel;
    const dispose = () => {};
    const context = {
      ui: {
        panels: {
          register: (value) => { panel = value; return dispose; },
          open: async () => {},
        },
        showNotice: () => {},
      },
      commands: { register: () => dispose },
      events: { on: () => dispose },
      editor: { insertAtCursor: async () => {} },
    };

    const deactivate = taskPlugin.activate(context);
    expect(panel).toMatchObject({ id: "tasks", purpose: "dashboard", presentation: "fullscreen" });
    deactivate();
  });

  test("parses standard Markdown tasks with source offsets and metadata", () => {
    const tasks = parseTasksFromNote(note());
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      noteId: "note-1",
      noteTitle: "Release plan",
      from: 6,
      checkboxOffset: 9,
      lineNumber: 2,
      completed: false,
      description: "Ship release",
      due: "2026-09-10",
      priority: { rank: 5, name: "highest", marker: "🔺" },
    });
    expect(tasks[1]).toMatchObject({ completed: true, description: "Tell users", completedDate: "2026-09-11" });
  });

  test("supports bullets and numbered list markers but ignores arbitrary checkboxes", () => {
    expect(parseTaskLine("+ [ ] plus")).not.toBeNull();
    expect(parseTaskLine("10. [x] numbered")).not.toBeNull();
    expect(parseTaskLine("> - [ ] quoted")).not.toBeNull();
    expect(parseTaskLine("[ ] missing list marker")).toBeNull();
  });

  test("does not turn examples inside fenced code blocks into tasks", () => {
    const tasks = parseTasksFromNote(note({ contentMarkdown: "```md\n- [ ] example\n```\n- [ ] real" }));
    expect(tasks.map((task) => task.description)).toEqual(["real"]);
  });

  test("creates a one-character status edit against the scanned revision", () => {
    const source = note();
    const task = parseTasksFromNote(source)[0];
    expect(createTaskStatusEdit(source, task, true)).toEqual({ from: 9, to: 10, insert: "x" });
  });

  test("relocates one exact task after unrelated edits and rejects ambiguous matches", () => {
    const task = parseTasksFromNote(note())[0];
    const moved = note({ revision: 4, contentHash: "hash-4", contentMarkdown: `New heading\n${task.rawLine}` });
    expect(createTaskStatusEdit(moved, task, true)).toEqual({ from: 15, to: 16, insert: "x" });
    const duplicated = note({ revision: 5, contentHash: "hash-5", contentMarkdown: `${task.rawLine}\n${task.rawLine}` });
    expect(() => createTaskStatusEdit(duplicated, task, true)).toThrow("TASK_SOURCE_CHANGED");
  });

  test("pages through note content instead of assuming a single result page", async () => {
    const offsets = [];
    const context = {
      notes: {
        queryContent: async ({ offset }) => {
          offsets.push(offset);
          return offset === 0
            ? { notes: [note()], nextOffset: 200 }
            : { notes: [note({ id: "note-2", contentMarkdown: "- [ ] Second" })], nextOffset: null };
        },
      },
    };
    const tasks = await scanAllTasks(context);
    expect(offsets).toEqual([0, 200]);
    expect(tasks).toHaveLength(3);
  });

  test("updates only the changed note in the in-memory task index", () => {
    const first = note();
    const second = note({ id: "note-2", contentMarkdown: "- [ ] Keep me" });
    const index = createTaskIndex([...parseTasksFromNote(first), ...parseTasksFromNote(second)]);
    const untouchedTasks = index.get("note-2");
    replaceNoteInTaskIndex(index, note({ contentMarkdown: "- [x] Replaced" }));
    expect(index.get("note-2")).toBe(untouchedTasks);
    expect(flattenTaskIndex(index).map((task) => task.description)).toEqual(["Replaced", "Keep me"]);
    removeNoteFromTaskIndex(index, "note-1");
    expect(flattenTaskIndex(index).map((task) => task.description)).toEqual(["Keep me"]);
    replaceNoteInTaskIndex(index, note({ id: "note-2", contentMarkdown: "No tasks here" }));
    expect(index.has("note-2")).toBe(false);
  });

  test("replays note mutations that arrive during the initial scan", async () => {
    let finishScan;
    let queryCount = 0;
    const context = {
      notes: {
        queryContent: () => {
          queryCount += 1;
          return new Promise((resolve) => { finishScan = resolve; });
        },
      },
    };
    const controller = createTaskController(context);
    const refreshing = controller.refresh();
    controller.replaceNote(note({ revision: 4, contentHash: "hash-4", contentMarkdown: "- [ ] Latest" }));
    finishScan({ notes: [note({ contentMarkdown: "- [ ] Stale" })], nextOffset: null });
    await refreshing;
    expect(controller.tasks.map((task) => task.description)).toEqual(["Latest"]);

    controller.replaceNote(note({ revision: 5, contentHash: "hash-5", contentMarkdown: "- [ ] Incremental" }));
    expect(controller.tasks.map((task) => task.description)).toEqual(["Incremental"]);
    expect(queryCount).toBe(1);
    controller.dispose();
  });

  test("parses a large note in linear time", () => {
    const contentMarkdown = Array.from({ length: 10_000 }, (_, index) => `- [ ] Task ${index} 📅 2026-12-31`).join("\n");
    const startedAt = performance.now();
    const tasks = parseTasksFromNote(note({ contentMarkdown }));
    const elapsed = performance.now() - startedAt;
    expect(tasks).toHaveLength(10_000);
    expect(elapsed).toBeLessThan(1_500);
  });
});
