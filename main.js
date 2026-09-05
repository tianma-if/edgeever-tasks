// EdgeEver Tasks — a standalone Markdown task index plugin.
const TASK_LINE_PATTERN = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\]\s*)(.*)$/u;
const DATE_MARKERS = {
  start: "🛫",
  scheduled: "⏳",
  due: "📅",
  completed: "✅",
  created: "➕",
  cancelled: "⛔",
};
const PRIORITIES = [
  ["🔺", 5, "highest"],
  ["⏫", 4, "high"],
  ["🔼", 3, "medium"],
  ["🔽", 2, "low"],
  ["⏬", 1, "lowest"],
];

const copy = {
  en: {
    panelTitle: "Tasks",
    openDashboard: "Open task dashboard",
    insertTask: "Insert task at cursor",
    inserted: "Task inserted at the cursor.",
    insertFailed: "Open an editable note before inserting a task.",
    loading: "Scanning notes…",
    empty: "No tasks match these filters.",
    search: "Search tasks",
    status: "Status",
    due: "Due",
    all: "All",
    open: "Open",
    done: "Done",
    overdue: "Overdue",
    today: "Today",
    upcoming: "Upcoming",
    noDate: "No date",
    refresh: "Refresh",
    summary: (visible, total) => `${visible} of ${total} tasks`,
    source: "Source",
    toggleFailed: "The source note changed. Refresh the task list and try again.",
    scanFailed: "Tasks could not scan the notes.",
  },
  zh: {
    panelTitle: "待办任务",
    openDashboard: "打开待办任务面板",
    insertTask: "在光标处插入待办任务",
    inserted: "已在光标处插入待办任务。",
    insertFailed: "请先打开一篇可编辑的笔记。",
    loading: "正在扫描笔记…",
    empty: "没有符合当前条件的任务。",
    search: "搜索任务",
    status: "状态",
    due: "日期",
    all: "全部",
    open: "未完成",
    done: "已完成",
    overdue: "已逾期",
    today: "今天",
    upcoming: "之后",
    noDate: "无日期",
    refresh: "刷新",
    summary: (visible, total) => `显示 ${visible} / ${total} 项任务`,
    source: "来源",
    toggleFailed: "来源笔记已发生变化，请刷新任务列表后重试。",
    scanFailed: "无法扫描笔记中的任务。",
  },
};

const language = () => globalThis.navigator?.language?.toLocaleLowerCase().startsWith("zh") ? copy.zh : copy.en;

const readMarkedDate = (body, marker) => {
  const match = body.match(new RegExp(`${marker}\\s*(\\d{4}-\\d{2}-\\d{2})`, "u"));
  return match?.[1] ?? null;
};

const cleanDescription = (body) => {
  let description = body;
  for (const marker of Object.values(DATE_MARKERS)) {
    description = description.replace(new RegExp(`\\s*${marker}\\s*\\d{4}-\\d{2}-\\d{2}`, "gu"), "");
  }
  for (const [marker] of PRIORITIES) description = description.replaceAll(marker, "");
  description = description.replace(/\s+🔁\s+.*?(?=\s+(?:🛫|⏳|📅|✅|➕|⛔)\s*\d{4}-\d{2}-\d{2}|$)/u, "");
  return description.trim();
};

export const parseTaskLine = (line, location = {}) => {
  const match = line.match(TASK_LINE_PATTERN);
  if (!match) return null;
  const body = match[4];
  const priority = PRIORITIES.find(([marker]) => body.includes(marker));
  return {
    noteId: location.noteId ?? "",
    noteTitle: location.noteTitle ?? "",
    noteRevision: location.noteRevision ?? 0,
    noteContentHash: location.noteContentHash ?? "",
    from: location.from ?? 0,
    to: (location.from ?? 0) + line.length,
    checkboxOffset: (location.from ?? 0) + match[1].length,
    lineNumber: location.lineNumber ?? 1,
    rawLine: line,
    completed: match[2].toLocaleLowerCase() === "x",
    description: cleanDescription(body) || body.trim(),
    start: readMarkedDate(body, DATE_MARKERS.start),
    scheduled: readMarkedDate(body, DATE_MARKERS.scheduled),
    due: readMarkedDate(body, DATE_MARKERS.due),
    completedDate: readMarkedDate(body, DATE_MARKERS.completed),
    priority: priority ? { rank: priority[1], name: priority[2], marker: priority[0] } : null,
  };
};

export const parseTasksFromNote = (note) => {
  const tasks = [];
  const markdown = note.contentMarkdown ?? "";
  let from = 0;
  let lineNumber = 1;
  let fence = null;
  while (from < markdown.length) {
    const newline = markdown.indexOf("\n", from);
    const rawEnd = newline === -1 ? markdown.length : newline;
    const lineEnd = rawEnd > from && markdown[rawEnd - 1] === "\r" ? rawEnd - 1 : rawEnd;
    const line = markdown.slice(from, lineEnd);
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/u);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === marker) fence = null;
      else if (fence === null) fence = marker;
    }
    const task = fence === null && !fenceMatch ? parseTaskLine(line, {
      noteId: note.id,
      noteTitle: note.title || note.excerpt || "Untitled",
      noteRevision: note.revision,
      noteContentHash: note.contentHash,
      from,
      lineNumber,
    }) : null;
    if (task) tasks.push(task);
    if (newline === -1) break;
    from = newline + 1;
    lineNumber += 1;
  }
  return tasks;
};

export const createTaskStatusEdit = (note, scannedTask, completed) => {
  const currentTasks = parseTasksFromNote(note);
  let currentTask = null;
  if (note.revision === scannedTask.noteRevision && note.contentHash === scannedTask.noteContentHash) {
    currentTask = currentTasks.find((task) => task.from === scannedTask.from && task.rawLine === scannedTask.rawLine) ?? null;
  } else {
    const exactMatches = currentTasks.filter((task) => task.rawLine === scannedTask.rawLine);
    if (exactMatches.length === 1) currentTask = exactMatches[0];
  }
  if (!currentTask) throw new Error("TASK_SOURCE_CHANGED");
  return currentTask.completed === completed
    ? null
    : { from: currentTask.checkboxOffset, to: currentTask.checkboxOffset + 1, insert: completed ? "x" : " " };
};

export const scanAllTasks = async (context) => {
  const tasks = [];
  let offset = 0;
  do {
    const result = await context.notes.queryContent({ sort: "updated-desc", limit: 200, offset });
    for (const note of result.notes) tasks.push(...parseTasksFromNote(note));
    if (result.nextOffset === null) break;
    offset = result.nextOffset;
  } while (true);
  return tasks;
};

export const createTaskIndex = (tasks = []) => {
  const index = new Map();
  for (const task of tasks) {
    const noteTasks = index.get(task.noteId) ?? [];
    noteTasks.push(task);
    index.set(task.noteId, noteTasks);
  }
  return index;
};

export const replaceNoteInTaskIndex = (index, note) => {
  const tasks = parseTasksFromNote(note);
  if (tasks.length) index.set(note.id, tasks);
  else index.delete(note.id);
  return index;
};

export const removeNoteFromTaskIndex = (index, noteId) => {
  index.delete(noteId);
  return index;
};

export const flattenTaskIndex = (index) => [...index.values()].flat();

const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createOption = (value, label) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
};

const createFilter = (labelText, options) => {
  const label = document.createElement("label");
  label.className = "edgeever-tasks__filter";
  const text = document.createElement("span");
  text.textContent = labelText;
  const select = document.createElement("select");
  for (const [value, optionLabel] of options) select.append(createOption(value, optionLabel));
  label.append(text, select);
  return { label, select };
};

const taskDueCategory = (task, today) => {
  if (!task.due) return "none";
  if (task.due < today && !task.completed) return "overdue";
  if (task.due === today) return "today";
  if (task.due > today) return "upcoming";
  return "none";
};

const taskSort = (left, right) => {
  if (left.completed !== right.completed) return Number(left.completed) - Number(right.completed);
  if (left.due !== right.due) return (left.due ?? "9999-99-99").localeCompare(right.due ?? "9999-99-99");
  if ((left.priority?.rank ?? 0) !== (right.priority?.rank ?? 0)) return (right.priority?.rank ?? 0) - (left.priority?.rank ?? 0);
  return left.noteTitle.localeCompare(right.noteTitle);
};

export const createTaskController = (context) => {
  let refreshGeneration = 0;
  const controller = {
    index: new Map(),
    tasks: [],
    initialized: false,
    loading: false,
    error: null,
    render: null,
    pendingMutations: new Map(),
    publish() {
      controller.tasks = flattenTaskIndex(controller.index);
      controller.render?.();
    },
    replaceNote(note) {
      if (controller.loading) {
        controller.pendingMutations.set(note.id, note);
        return;
      }
      if (!controller.initialized) return;
      replaceNoteInTaskIndex(controller.index, note);
      controller.publish();
    },
    removeNote(noteId) {
      if (controller.loading) {
        controller.pendingMutations.set(noteId, null);
        return;
      }
      if (!controller.initialized) return;
      removeNoteFromTaskIndex(controller.index, noteId);
      controller.publish();
    },
    async refresh() {
      const generation = ++refreshGeneration;
      controller.pendingMutations.clear();
      controller.loading = true;
      controller.error = null;
      controller.render?.();
      try {
        const tasks = await scanAllTasks(context);
        if (generation !== refreshGeneration) return;
        const nextIndex = createTaskIndex(tasks);
        for (const [noteId, note] of controller.pendingMutations) {
          if (note) replaceNoteInTaskIndex(nextIndex, note);
          else removeNoteFromTaskIndex(nextIndex, noteId);
        }
        controller.index = nextIndex;
        controller.tasks = flattenTaskIndex(nextIndex);
        controller.initialized = true;
      } catch (error) {
        if (generation !== refreshGeneration) return;
        controller.error = error;
      } finally {
        if (generation === refreshGeneration) {
          controller.loading = false;
          controller.render?.();
        }
      }
    },
    dispose() {
      refreshGeneration += 1;
      controller.render = null;
      controller.pendingMutations.clear();
    },
  };
  return controller;
};

const mountDashboard = (container, context, controller) => {
  const text = language();
  const root = document.createElement("section");
  root.className = "edgeever-tasks";
  const header = document.createElement("header");
  header.className = "edgeever-tasks__header";
  const headingBlock = document.createElement("div");
  const heading = document.createElement("h2");
  heading.textContent = text.panelTitle;
  const summary = document.createElement("p");
  summary.className = "edgeever-tasks__summary";
  headingBlock.append(heading, summary);
  const refresh = document.createElement("button");
  refresh.type = "button";
  refresh.className = "edgeever-tasks__refresh";
  refresh.textContent = text.refresh;
  header.append(headingBlock, refresh);

  const toolbar = document.createElement("div");
  toolbar.className = "edgeever-tasks__toolbar";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = text.search;
  search.setAttribute("aria-label", text.search);
  const statusFilter = createFilter(text.status, [["open", text.open], ["all", text.all], ["done", text.done]]);
  const dueFilter = createFilter(text.due, [["all", text.all], ["overdue", text.overdue], ["today", text.today], ["upcoming", text.upcoming], ["none", text.noDate]]);
  toolbar.append(search, statusFilter.label, dueFilter.label);
  const message = document.createElement("p");
  message.className = "edgeever-tasks__message";
  const list = document.createElement("div");
  list.className = "edgeever-tasks__list";
  root.append(header, toolbar, message, list);
  container.append(root);

  const render = () => {
    const today = localDateKey();
    const query = search.value.trim().toLocaleLowerCase();
    const visible = controller.tasks.filter((task) => {
      if (statusFilter.select.value === "open" && task.completed) return false;
      if (statusFilter.select.value === "done" && !task.completed) return false;
      if (dueFilter.select.value !== "all" && taskDueCategory(task, today) !== dueFilter.select.value) return false;
      return !query || `${task.description} ${task.noteTitle}`.toLocaleLowerCase().includes(query);
    }).sort(taskSort);
    summary.textContent = text.summary(visible.length, controller.tasks.length);
    message.textContent = controller.loading ? text.loading : controller.error ? text.scanFailed : visible.length ? "" : text.empty;
    list.replaceChildren();
    for (const task of visible) {
      const row = document.createElement("article");
      row.className = `edgeever-tasks__row${task.completed ? " is-completed" : ""}`;
      const checkbox = document.createElement("button");
      checkbox.type = "button";
      checkbox.className = "edgeever-tasks__checkbox";
      checkbox.setAttribute("role", "checkbox");
      checkbox.setAttribute("aria-checked", String(task.completed));
      checkbox.setAttribute("aria-label", task.completed ? text.open : text.done);
      checkbox.textContent = task.completed ? "✓" : "";
      checkbox.addEventListener("click", async () => {
        checkbox.disabled = true;
        try {
          const note = await context.notes.get(task.noteId);
          const edit = createTaskStatusEdit(note, task, !task.completed);
          if (edit) {
            const updated = await context.notes.editMarkdown(task.noteId, {
              expectedRevision: note.revision,
              expectedContentHash: note.contentHash,
              edits: [edit],
            });
            controller.replaceNote(updated);
          }
        } catch {
          context.ui.showNotice(text.toggleFailed);
          checkbox.disabled = false;
        }
      });
      const content = document.createElement("button");
      content.type = "button";
      content.className = "edgeever-tasks__content";
      const description = document.createElement("span");
      description.className = "edgeever-tasks__description";
      description.textContent = task.description;
      const metadata = document.createElement("span");
      metadata.className = "edgeever-tasks__metadata";
      const source = document.createElement("span");
      source.textContent = `${text.source}: ${task.noteTitle}`;
      metadata.append(source);
      if (task.due) {
        const due = document.createElement("span");
        due.className = taskDueCategory(task, today) === "overdue" ? "is-overdue" : "";
        due.textContent = `📅 ${task.due}`;
        metadata.append(due);
      }
      if (task.priority) {
        const priority = document.createElement("span");
        priority.textContent = task.priority.marker;
        metadata.append(priority);
      }
      content.append(description, metadata);
      content.addEventListener("click", () => {
        void context.ui.openNote(task.noteId, { search: task.rawLine.trim().slice(0, 500) })
          .catch(() => context.ui.showNotice(text.toggleFailed));
      });
      row.append(checkbox, content);
      list.append(row);
    }
  };

  controller.render = render;
  search.addEventListener("input", render);
  statusFilter.select.addEventListener("change", render);
  dueFilter.select.addEventListener("change", render);
  refresh.addEventListener("click", () => void controller.refresh());
  render();
  if (!controller.initialized) void controller.refresh();
  return () => {
    if (controller.render === render) controller.render = null;
    root.remove();
  };
};

export default {
  activate(context) {
    const text = language();
    const controller = createTaskController(context);
    const disposePanel = context.ui.panels.register({
      id: "tasks",
      title: text.panelTitle,
      presentation: "fullscreen",
      mount(container) { return mountDashboard(container, context, controller); },
    });
    const disposeOpen = context.commands.register({
      id: "open-dashboard",
      title: text.openDashboard,
      run: () => context.ui.panels.open("tasks"),
    });
    const disposeInsert = context.commands.register({
      id: "insert-task",
      title: text.insertTask,
      async run() {
        try {
          await context.editor.insertAtCursor("- [ ] ");
          context.ui.showNotice(text.inserted);
        } catch {
          context.ui.showNotice(text.insertFailed);
        }
      },
    });
    const disposers = [
      disposePanel,
      disposeOpen,
      disposeInsert,
      context.events.on("note.created", ({ note }) => controller.replaceNote(note)),
      context.events.on("note.updated", ({ note }) => controller.replaceNote(note)),
      context.events.on("note.deleted", ({ noteId }) => controller.removeNote(noteId)),
    ];
    return () => {
      controller.dispose();
      for (const dispose of disposers.reverse()) dispose();
    };
  },
};
