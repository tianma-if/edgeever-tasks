import { describe, expect, test } from "bun:test";
import {
  addCalendarDays,
  addCalendarMonths,
  compareTasks,
  countTasksByDate,
  createTaskController,
  createTaskIndex,
  createTaskSaveEdits,
  createTaskStatusEdit,
  createTaskToggleEdits,
  filterTasks,
  flattenTaskIndex,
  formatTaskLine,
  groupTasks,
  lineBoundsAt,
  localDateKey,
  matchesView,
  monthGrid,
  monthKeyFromDate,
  nextRecurrenceDate,
  parseRecurrenceRule,
  parseTaskLine,
  parseTasksFromNote,
  removeNoteFromTaskIndex,
  replaceNoteInTaskIndex,
  scanAllTasks,
  shiftTaskDates,
  taskDueCategory,
  taskOccursOn,
} from "../main.js";
import taskPlugin from "../main.js";

const applyEdits = (markdown, edits) => {
  const ordered = [...edits].sort((left, right) => left.from - right.from || left.to - right.to);
  return ordered.reduceRight((value, edit) => `${value.slice(0, edit.from)}${edit.insert}${value.slice(edit.to)}`, markdown);
};

const note = (overrides = {}) => ({
  id: "note-1",
  title: "Release plan",
  excerpt: "",
  revision: 3,
  contentHash: "hash-3",
  contentMarkdown: "Intro\n- [ ] Ship release 🔺 📅 2026-09-10\n  * [x] Tell users ✅ 2026-09-11\nNot a task",
  ...overrides,
});

const copy = {
  priorities: { highest: "Highest", high: "High", medium: "Medium", low: "Low", lowest: "Lowest", none: "None" },
  groups: { none: "No grouping", overdue: "Overdue", today: "Today", week: "This week", later: "Later" },
  views: { overdue: "Overdue", today: "Today" },
  none: "None",
};

describe("EdgeEver Tasks", () => {
  test("registers dashboard and edit panels", () => {
    const panels = [];
    const commands = [];
    const dispose = () => {};
    const context = {
      ui: {
        panels: {
          register: (value) => { panels.push(value); return dispose; },
          open: async () => {},
        },
        showNotice: () => {},
      },
      commands: { register: (value) => { commands.push(value); return dispose; } },
      events: { on: () => dispose },
      editor: { insertAtCursor: async () => {}, getDocument: async () => null, getSelection: async () => null },
    };

    const deactivate = taskPlugin.activate(context);
    expect(panels).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "tasks", purpose: "dashboard", presentation: "fullscreen" }),
      expect.objectContaining({ id: "edit-task", purpose: "workflow", presentation: "dialog" }),
    ]));
    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "open-dashboard", menu: false }),
      expect.objectContaining({ id: "insert-task", listed: false }),
      expect.objectContaining({ id: "create-or-edit", listed: false }),
    ]));
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
      status: "todo",
      description: "Ship release",
      due: "2026-09-10",
      priority: { rank: 5, name: "highest", marker: "🔺" },
    });
    expect(tasks[1]).toMatchObject({ completed: true, status: "done", description: "Tell users", completedDate: "2026-09-11" });
  });

  test("supports bullets and numbered list markers but ignores arbitrary checkboxes", () => {
    expect(parseTaskLine("+ [ ] plus")).not.toBeNull();
    expect(parseTaskLine("10. [x] numbered")).not.toBeNull();
    expect(parseTaskLine("> - [ ] quoted")).not.toBeNull();
    expect(parseTaskLine("[ ] missing list marker")).toBeNull();
  });

  test("parses in-progress and cancelled statuses", () => {
    expect(parseTaskLine("- [/] Writing")).toMatchObject({ status: "in_progress", completed: false, description: "Writing" });
    expect(parseTaskLine("- [-] Dropped ❌ 2026-09-01")).toMatchObject({
      status: "cancelled",
      cancelledDate: "2026-09-01",
      description: "Dropped",
    });
  });

  test("uses Obsidian cancelled, id, and depends-on markers", () => {
    const task = parseTaskLine("- [ ] Review 🆔 design ⛔ draft");
    expect(task).toMatchObject({ id: "design", dependsOn: "draft", description: "Review" });
    expect(parseTaskLine("- [-] Old style ⛔ 2026-01-02")).toMatchObject({
      cancelledDate: "2026-01-02",
      dependsOn: null,
    });
  });

  test("parses recurrence, tags, headings, and block links", () => {
    const tasks = parseTasksFromNote(note({
      contentMarkdown: "# Launch\n- [ ] Ship #work 🔁 every Sunday 📅 2026-09-13 ^abc",
    }));
    expect(tasks[0]).toMatchObject({
      heading: "Launch",
      tags: ["#work"],
      recurrence: "every Sunday",
      due: "2026-09-13",
      blockLink: "^abc",
      description: "Ship #work",
    });
  });

  test("does not turn examples inside fenced code blocks or comments into tasks", () => {
    const tasks = parseTasksFromNote(note({
      contentMarkdown: "```md\n- [ ] example\n```\n<!--\n- [ ] commented\n-->\n%%\n- [ ] percent\n%%\n- [ ] real",
    }));
    expect(tasks.map((task) => task.description)).toEqual(["real"]);
  });

  test("honors a global filter when indexing", () => {
    const tasks = parseTasksFromNote(note({
      contentMarkdown: "- [ ] #task Keep\n- [ ] Ignore",
    }), { globalFilter: "#task" });
    expect(tasks.map((task) => task.description)).toEqual(["#task Keep"]);
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

  test("completing a task writes a done date", () => {
    const source = note({ contentMarkdown: "- [ ] Ship 📅 2026-09-10" });
    const task = parseTasksFromNote(source)[0];
    const markdown = applyEdits(source.contentMarkdown, createTaskToggleEdits(source, task, { today: "2026-09-09", setDoneDate: true }));
    expect(markdown).toBe("- [x] Ship 📅 2026-09-10 ✅ 2026-09-09");
  });

  test("completing a recurring task inserts the next occurrence", () => {
    const source = note({ contentMarkdown: "- [ ] trash 🔁 every Sunday 📅 2021-04-25" });
    const task = parseTasksFromNote(source)[0];
    const markdown = applyEdits(source.contentMarkdown, createTaskToggleEdits(source, task, {
      today: "2021-04-24",
      setDoneDate: true,
      recurrenceInsert: "before",
    }));
    expect(markdown).toBe("- [ ] trash 🔁 every Sunday 📅 2021-05-02\n- [x] trash 🔁 every Sunday 📅 2021-04-25 ✅ 2021-04-24");
  });

  test("reopening a task removes the done date", () => {
    const source = note({ contentMarkdown: "- [x] Ship 📅 2026-09-10 ✅ 2026-09-09" });
    const task = parseTasksFromNote(source)[0];
    const markdown = applyEdits(source.contentMarkdown, createTaskToggleEdits(source, task, { today: "2026-09-09" }));
    expect(markdown).toBe("- [ ] Ship 📅 2026-09-10");
  });

  test("saving an edited task preserves id and updates dates", () => {
    const source = note({ contentMarkdown: "- [ ] Review 🆔 design 📅 2026-09-10" });
    const task = parseTasksFromNote(source)[0];
    const markdown = applyEdits(source.contentMarkdown, createTaskSaveEdits(source, task, {
      description: "Review copy",
      due: "2026-09-12",
      priority: { rank: 4, name: "high", marker: "⏫" },
    }));
    expect(markdown).toBe("- [ ] Review copy ⏫ 📅 2026-09-12 🆔 design");
  });

  test("rejects a recurrence rule without a date", () => {
    const source = note({ contentMarkdown: "- [ ] Repeat" });
    const task = parseTasksFromNote(source)[0];
    expect(() => createTaskSaveEdits(source, task, { recurrence: "every week" })).toThrow("TASK_RECURRENCE_NEEDS_DATE");
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

describe("recurrence and views", () => {
  test("advances weekly, weekday, and monthly recurrences", () => {
    expect(nextRecurrenceDate("2021-04-25", parseRecurrenceRule("every Sunday"))).toBe("2021-05-02");
    expect(nextRecurrenceDate("2026-09-11", parseRecurrenceRule("every weekday"))).toBe("2026-09-14");
    expect(nextRecurrenceDate("2021-10-31", parseRecurrenceRule("every month"))).toBe("2021-11-30");
    expect(nextRecurrenceDate("2022-01-31", parseRecurrenceRule("every month on the last"))).toBe("2022-02-28");
    expect(nextRecurrenceDate("2022-01-31", parseRecurrenceRule("every month on the 31st"))).toBe("2022-03-31");
  });

  test("shifts sibling dates by the same delta and honors when done", () => {
    const task = parseTaskLine("- [ ] Mow 🔁 every 2 weeks ⏳ 2021-10-28 📅 2021-10-30");
    expect(shiftTaskDates(task, "2021-10-30")).toEqual({ due: "2021-11-13", scheduled: "2021-11-11", start: null });
    const whenDone = parseTaskLine("- [ ] Sweep 🔁 every week when done ⏳ 2021-02-06");
    expect(shiftTaskDates(whenDone, "2022-02-13")).toEqual({ due: null, scheduled: "2022-02-20", start: null });
  });

  test("round-trips a formatted task line", () => {
    const original = "- [ ] Ship #work 🔺 🔁 every week 📅 2026-09-10 🆔 abc ^link";
    expect(formatTaskLine(parseTaskLine(original))).toBe(original);
  });

  test("sorts unprioritized tasks between medium and low", () => {
    const tasks = [
      parseTaskLine("- [ ] low 🔽"),
      parseTaskLine("- [ ] none"),
      parseTaskLine("- [ ] medium 🔼"),
    ].sort(compareTasks);
    expect(tasks.map((task) => task.description)).toEqual(["medium", "none", "low"]);
  });

  test("today and inbox views hide completed and dated tasks correctly", () => {
    const today = "2026-09-09";
    const openToday = parseTaskLine("- [ ] Due today 📅 2026-09-09");
    const overdue = parseTaskLine("- [ ] Late 📅 2026-09-01");
    const inbox = parseTaskLine("- [ ] Capture this");
    const done = parseTaskLine("- [x] Finished 📅 2026-09-09 ✅ 2026-09-09");
    expect(matchesView(openToday, "today", today)).toBe(true);
    expect(matchesView(overdue, "today", today)).toBe(true);
    expect(matchesView(inbox, "today", today)).toBe(false);
    expect(matchesView(inbox, "inbox", today)).toBe(true);
    expect(matchesView(done, "today", today)).toBe(false);
    expect(taskDueCategory(done, today)).toBe("today");
    expect(taskDueCategory(overdue, today)).toBe("overdue");
  });

  test("filters by search and groups by due bucket", () => {
    const today = "2026-09-09";
    const tasks = [
      parseTaskLine("- [ ] Late docs 📅 2026-09-01"),
      parseTaskLine("- [ ] Ship docs 📅 2026-09-09"),
      parseTaskLine("- [ ] Later 📅 2026-10-01"),
    ];
    const visible = filterTasks(tasks, { view: "open", search: "docs", priority: "all" }, today);
    expect(visible.map((task) => task.description)).toEqual(["Late docs", "Ship docs"]);
    const grouped = groupTasks(visible, "due", today, copy);
    expect(grouped.map((group) => group.key)).toEqual(["overdue", "today"]);
    const scheduledToday = groupTasks([parseTaskLine("- [/] Announce ⏳ 2026-09-09")], "due", today, copy);
    expect(scheduledToday.map((group) => group.key)).toEqual(["today"]);
  });

  test("lineBoundsAt finds the current editor line", () => {
    const markdown = "alpha\n- [ ] beta\ngamma";
    expect(lineBoundsAt(markdown, 10)).toEqual({ from: 6, to: 16, line: "- [ ] beta" });
    expect(addCalendarDays("2026-09-09", 1)).toBe("2026-09-10");
    expect(localDateKey(new Date(2026, 8, 9))).toBe("2026-09-09");
  });

  test("filters tasks to a selected calendar date", () => {
    const today = "2026-09-10";
    const tasks = [
      parseTaskLine("- [ ] Due today 📅 2026-09-10"),
      parseTaskLine("- [/] Scheduled today ⏳ 2026-09-10"),
      parseTaskLine("- [ ] Starts today 🛫 2026-09-10"),
      parseTaskLine("- [ ] Tomorrow 📅 2026-09-11"),
      parseTaskLine("- [x] Finished ✅ 2026-09-10"),
      parseTaskLine("- [-] Dropped ❌ 2026-09-10"),
    ];
    expect(taskOccursOn(tasks[0], "2026-09-10")).toBe(true);
    expect(taskOccursOn(tasks[3], "2026-09-10")).toBe(false);
    expect(filterTasks(tasks, { view: "open", onDate: "2026-09-10" }, today).map((task) => task.description))
      .toEqual(["Scheduled today", "Due today", "Starts today"]);
    expect(filterTasks(tasks, { view: "done", onDate: "2026-09-10" }, today).map((task) => task.description))
      .toEqual(["Finished"]);
    expect(filterTasks(tasks, { view: "cancelled", onDate: "2026-09-10" }, today).map((task) => task.description))
      .toEqual(["Dropped"]);
    expect(filterTasks(tasks, { view: "open", onDate: "2026-09-11" }, today).map((task) => task.description))
      .toEqual(["Tomorrow"]);
  });

  test("calendar month grid and per-day counts follow the current view", () => {
    expect(monthKeyFromDate("2026-09-10")).toBe("2026-09");
    expect(addCalendarMonths("2026-09", 1)).toBe("2026-10");
    expect(addCalendarMonths("2026-01", -1)).toBe("2025-12");
    const mondayFirst = monthGrid("2026-09", { weekStartsOn: 1 });
    expect(mondayFirst).toHaveLength(35);
    expect(mondayFirst[0]).toMatchObject({ date: "2026-08-31", inMonth: false });
    expect(mondayFirst.find((cell) => cell.date === "2026-09-01")).toMatchObject({ day: 1, inMonth: true, weekday: 2 });
    const sundayFirst = monthGrid("2026-09", { weekStartsOn: 0 });
    expect(sundayFirst[0].date).toBe("2026-08-30");
    const tasks = [
      parseTaskLine("- [ ] Due today 📅 2026-09-10"),
      parseTaskLine("- [ ] Tomorrow 📅 2026-09-11"),
      parseTaskLine("- [x] Finished ✅ 2026-09-10"),
    ];
    const counts = countTasksByDate(tasks, { view: "open", onDate: "2026-09-11" }, "2026-09-10");
    expect(counts.get("2026-09-10")).toBe(1);
    expect(counts.get("2026-09-11")).toBe(1);
    expect(counts.has("2026-09-12")).toBe(false);
  });
});
