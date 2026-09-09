// EdgeEver Tasks — a standalone Markdown task index plugin.
const TASK_LINE_PATTERN = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)([ xX/-])(\]\s*)(.*)$/u;
const DATE_MARKERS = {
  start: "🛫",
  scheduled: "⏳",
  due: "📅",
  completed: "✅",
  created: "➕",
  cancelled: "❌",
};
const LEGACY_CANCELLED_MARKER = "⛔";
const ID_MARKER = "🆔";
const DEPENDS_MARKER = "⛔";
const ON_COMPLETION_MARKER = "🏁";
const RECURRENCE_MARKER = "🔁";
const PRIORITIES = [
  ["🔺", 5, "highest"],
  ["⏫", 4, "high"],
  ["🔼", 3, "medium"],
  ["🔽", 1, "low"],
  ["⏬", 0, "lowest"],
];
const NONE_PRIORITY_RANK = 2;
const STATUS_CHARS = { todo: " ", in_progress: "/", done: "x", cancelled: "-" };
const STATUS_BY_CHAR = { " ": "todo", "/": "in_progress", x: "done", X: "done", "-": "cancelled" };
const STATUS_SORT = { in_progress: 0, todo: 1, done: 2, cancelled: 3 };
const WEEKDAY_INDEX = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};
const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTH_INDEX = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};
const DISPLAY_LIMIT = 500;
const DASHBOARD_STATE_KEY = "dashboard-state";
const DEFAULT_SETTINGS = {
  globalFilter: "",
  setDoneDate: true,
  setCancelledDate: true,
  setCreatedDate: false,
  recurrenceInsert: "before",
};
const DEFAULT_DASHBOARD_STATE = {
  view: "open",
  search: "",
  priority: "all",
  groupBy: "due",
};
const VIEWS = ["today", "overdue", "week", "inbox", "open", "recurring", "done", "cancelled", "all"];
const DATE_TOKEN = "\\d{4}-\\d{2}-\\d{2}";
const SIGNIFIER_LOOKAHEAD = `(?=\\s+(?:🛫|⏳|📅|✅|➕|❌|⛔|🆔|🏁)(?:\\s|$)|$)`;

const copy = {
  en: {
    panelTitle: "Tasks",
    editTitle: "Create or edit task",
    openDashboard: "Open task dashboard",
    insertTask: "Insert task at cursor",
    createOrEdit: "Create or edit task",
    inserted: "Task inserted at the cursor.",
    insertFailed: "Open an editable note before inserting a task.",
    editFailed: "Open an editable note before creating or editing a task.",
    saved: "Task saved.",
    loading: "Scanning notes…",
    empty: "No tasks match these filters.",
    truncated: (shown, total) => `Showing ${shown} of ${total} matching tasks.`,
    search: "Search tasks",
    refresh: "Refresh",
    summary: (visible, total) => `${visible} of ${total} tasks`,
    source: "Source",
    heading: "Heading",
    toggleFailed: "The source note changed. Refresh the task list and try again.",
    scanFailed: "Tasks could not scan the notes.",
    saveFailed: "The task could not be saved. Refresh and try again.",
    recurrenceNeedsDate: "Recurring tasks need a due, scheduled, or start date.",
    descriptionRequired: "Add a task description.",
    views: {
      today: "Today",
      overdue: "Overdue",
      week: "This week",
      inbox: "Inbox",
      open: "Open",
      recurring: "Recurring",
      done: "Done",
      cancelled: "Cancelled",
      all: "All",
    },
    priority: "Priority",
    groupBy: "Group",
    all: "All",
    none: "None",
    priorities: {
      highest: "Highest",
      high: "High",
      medium: "Medium",
      low: "Low",
      lowest: "Lowest",
      none: "None",
    },
    noHeading: "(No heading)",
    groups: {
      none: "No grouping",
      due: "Due date",
      priority: "Priority",
      note: "Note",
      heading: "Heading",
      overdue: "Overdue",
      today: "Today",
      week: "This week",
      later: "Later",
    },
    statuses: {
      todo: "To do",
      in_progress: "In progress",
      done: "Done",
      cancelled: "Cancelled",
    },
    fields: {
      description: "Description",
      status: "Status",
      priority: "Priority",
      due: "Due",
      scheduled: "Scheduled",
      start: "Start",
      recurrence: "Recurrence",
    },
    dateShortcuts: { today: "Today", tomorrow: "Tomorrow", nextWeek: "Next week", clear: "Clear" },
    recurrenceHints: ["every day", "every weekday", "every week", "every month", "every month on the last", "every year"],
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    created: "Created",
    recurrence: "Repeats",
  },
  zh: {
    panelTitle: "待办任务",
    editTitle: "创建或编辑任务",
    openDashboard: "打开待办任务面板",
    insertTask: "在光标处插入待办任务",
    createOrEdit: "创建或编辑任务",
    inserted: "已在光标处插入待办任务。",
    insertFailed: "请先打开一篇可编辑的笔记。",
    editFailed: "请先打开一篇可编辑的笔记，再创建或编辑任务。",
    saved: "任务已保存。",
    loading: "正在扫描笔记…",
    empty: "没有符合当前条件的任务。",
    truncated: (shown, total) => `仅显示前 ${shown} / ${total} 项匹配任务。`,
    search: "搜索任务",
    refresh: "刷新",
    summary: (visible, total) => `显示 ${visible} / ${total} 项任务`,
    source: "来源",
    heading: "标题",
    toggleFailed: "来源笔记已发生变化，请刷新任务列表后重试。",
    scanFailed: "无法扫描笔记中的任务。",
    saveFailed: "无法保存任务，请刷新后重试。",
    recurrenceNeedsDate: "重复任务需要设置截止日期、计划日期或开始日期。",
    descriptionRequired: "请填写任务描述。",
    views: {
      today: "今天",
      overdue: "已逾期",
      week: "本周",
      inbox: "收集箱",
      open: "未完成",
      recurring: "重复",
      done: "已完成",
      cancelled: "已取消",
      all: "全部",
    },
    priority: "优先级",
    groupBy: "分组",
    all: "全部",
    none: "无",
    priorities: {
      highest: "最高",
      high: "高",
      medium: "中",
      low: "低",
      lowest: "最低",
      none: "无",
    },
    noHeading: "（无标题）",
    groups: {
      none: "不分组",
      due: "截止日期",
      priority: "优先级",
      note: "笔记",
      heading: "标题",
      overdue: "已逾期",
      today: "今天",
      week: "本周",
      later: "更晚",
    },
    statuses: {
      todo: "待办",
      in_progress: "进行中",
      done: "已完成",
      cancelled: "已取消",
    },
    fields: {
      description: "描述",
      status: "状态",
      priority: "优先级",
      due: "截止",
      scheduled: "计划",
      start: "开始",
      recurrence: "重复",
    },
    dateShortcuts: { today: "今天", tomorrow: "明天", nextWeek: "下周", clear: "清除" },
    recurrenceHints: ["every day", "every weekday", "every week", "every month", "every month on the last", "every year"],
    save: "保存",
    cancel: "取消",
    edit: "编辑",
    created: "创建",
    recurrence: "重复",
  },
};

const language = () => (globalThis.navigator?.language?.toLocaleLowerCase().startsWith("zh") ? copy.zh : copy.en);

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(dateKey ?? "");
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addCalendarDays = (dateKey, days) => {
  const date = parseLocalDate(dateKey);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return localDateKey(date);
};

const diffDays = (fromKey, toKey) => {
  const from = parseLocalDate(fromKey);
  const to = parseLocalDate(toKey);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
};

const takeMatch = (body, pattern) => {
  const match = body.match(pattern);
  if (!match) return { body, value: null };
  return { body: body.replace(pattern, " ").replace(/\s+/gu, " ").trim(), value: match[1] };
};

const parseWeekdays = (text) => [...new Set(text.split(/[,\s]+/u).flatMap((part) => {
  const key = part.trim().toLowerCase();
  return key in WEEKDAY_INDEX ? [WEEKDAY_INDEX[key]] : [];
}))];

export const parseRecurrenceRule = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\s+/gu, " ");
  const whenDone = /\bwhen done$/iu.test(trimmed);
  const text = whenDone ? trimmed.replace(/\s*when done$/iu, "").trim() : trimmed;
  const lower = text.toLowerCase();
  if (!lower.startsWith("every ")) return { raw: trimmed, whenDone, kind: "unknown" };
  const rest = lower.slice(6).trim();
  if (rest === "weekday" || rest === "weekdays") return { raw: trimmed, whenDone, kind: "weekday", interval: 1 };

  const monthName = Object.keys(MONTH_INDEX).find((name) => rest.startsWith(name));
  if (monthName) {
    const tail = rest.slice(monthName.length).trim();
    const last = tail.match(/^on the last$/u);
    const nth = tail.match(/^on the (\d+)(?:st|nd|rd|th)$/u);
    return {
      raw: trimmed,
      whenDone,
      kind: "year-month",
      interval: 1,
      month: MONTH_INDEX[monthName],
      day: last ? "last" : nth ? Number(nth[1]) : 1,
    };
  }

  const singleWeekday = WEEKDAY_NAMES.find((name) => rest === name);
  if (singleWeekday) return { raw: trimmed, whenDone, kind: "week", interval: 1, weekdays: [WEEKDAY_INDEX[singleWeekday]] };

  const counted = rest.match(/^(\d+)\s+(day|days|week|weeks|month|months|year|years)\b(.*)$/u);
  const simple = rest.match(/^(day|days|week|weeks|month|months|year|years)\b(.*)$/u);
  if (!counted && !simple) return { raw: trimmed, whenDone, kind: "unknown" };
  const interval = counted ? Number(counted[1]) : 1;
  const unit = (counted ? counted[2] : simple[1]).replace(/s$/u, "");
  const tail = (counted ? counted[3] : simple[2]).trim();
  if (unit === "day") return { raw: trimmed, whenDone, kind: "day", interval };
  if (unit === "year") return { raw: trimmed, whenDone, kind: "year", interval };
  if (unit === "week") {
    const on = tail.match(/^on\s+(.+)$/u);
    return { raw: trimmed, whenDone, kind: "week", interval, weekdays: on ? parseWeekdays(on[1]) : [] };
  }
  if (unit === "month") {
    const onThe = tail.match(/^on the\s+(.+)$/u);
    if (!onThe) return { raw: trimmed, whenDone, kind: "month", interval };
    const spec = onThe[1];
    if (spec === "last") return { raw: trimmed, whenDone, kind: "month", interval, day: "last" };
    const dayNumber = spec.match(/^(\d+)(?:st|nd|rd|th)$/u);
    if (dayNumber) return { raw: trimmed, whenDone, kind: "month", interval, day: Number(dayNumber[1]) };
    const lastWeekday = spec.match(/^(?:(\d+)(?:st|nd|rd|th)\s+)?last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/u);
    if (lastWeekday) {
      return { raw: trimmed, whenDone, kind: "month-weekday", interval, weekday: WEEKDAY_INDEX[lastWeekday[2]], nth: lastWeekday[1] ? -Number(lastWeekday[1]) : -1 };
    }
    const nthWeekday = spec.match(/^(\d+)(?:st|nd|rd|th)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/u);
    if (nthWeekday) {
      return { raw: trimmed, whenDone, kind: "month-weekday", interval, weekday: WEEKDAY_INDEX[nthWeekday[2]], nth: Number(nthWeekday[1]) };
    }
    return { raw: trimmed, whenDone, kind: "unknown" };
  }
  return { raw: trimmed, whenDone, kind: "unknown" };
};

const lastDayOfMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const nthWeekdayOfMonth = (year, month, weekday, nth) => {
  if (nth < 0) {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    last.setDate(last.getDate() - offset + (nth + 1) * 7);
    return last.getMonth() === month ? last : null;
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const date = new Date(year, month, 1 + offset + (nth - 1) * 7);
  return date.getMonth() === month ? date : null;
};

export const nextRecurrenceDate = (dateKey, rule) => {
  const date = parseLocalDate(dateKey);
  if (!date || !rule || rule.kind === "unknown") return null;
  if (rule.kind === "day") {
    date.setDate(date.getDate() + rule.interval);
    return localDateKey(date);
  }
  if (rule.kind === "weekday") {
    do date.setDate(date.getDate() + 1);
    while (date.getDay() === 0 || date.getDay() === 6);
    return localDateKey(date);
  }
  if (rule.kind === "week") {
    const weekdays = rule.weekdays?.length ? rule.weekdays : null;
    if (!weekdays) {
      date.setDate(date.getDate() + 7 * rule.interval);
      return localDateKey(date);
    }
    for (let step = 1; step <= 7 * rule.interval + 7; step += 1) {
      const candidate = new Date(date);
      candidate.setDate(date.getDate() + step);
      if (weekdays.includes(candidate.getDay())) return localDateKey(candidate);
    }
    return null;
  }
  if (rule.kind === "month") {
    if (rule.day === "last") {
      const next = new Date(date.getFullYear(), date.getMonth() + rule.interval + 1, 0);
      return localDateKey(next);
    }
    if (typeof rule.day === "number") {
      let year = date.getFullYear();
      let month = date.getMonth() + rule.interval;
      for (let i = 0; i < 36; i += 1) {
        if (rule.day <= lastDayOfMonth(year, month)) return localDateKey(new Date(year, month, rule.day));
        month += rule.interval;
        year += Math.floor(month / 12);
        month %= 12;
      }
      return null;
    }
    const day = date.getDate();
    const next = new Date(date.getFullYear(), date.getMonth() + rule.interval, 1);
    next.setDate(Math.min(day, lastDayOfMonth(next.getFullYear(), next.getMonth())));
    return localDateKey(next);
  }
  if (rule.kind === "month-weekday") {
    let year = date.getFullYear();
    let month = date.getMonth() + rule.interval;
    for (let i = 0; i < 36; i += 1) {
      const candidate = nthWeekdayOfMonth(year, month, rule.weekday, rule.nth);
      if (candidate && localDateKey(candidate) > dateKey) return localDateKey(candidate);
      month += rule.interval;
      year += Math.floor(month / 12);
      month %= 12;
    }
    return null;
  }
  if (rule.kind === "year") {
    const next = new Date(date.getFullYear() + rule.interval, date.getMonth(), date.getDate());
    if (next.getMonth() !== date.getMonth()) next.setDate(0);
    return localDateKey(next);
  }
  if (rule.kind === "year-month") {
    let year = date.getFullYear() + rule.interval;
    for (let i = 0; i < 8; i += 1) {
      const day = rule.day === "last" ? lastDayOfMonth(year, rule.month) : rule.day;
      if (day <= lastDayOfMonth(year, rule.month)) {
        const candidate = localDateKey(new Date(year, rule.month, day));
        if (candidate > dateKey) return candidate;
      }
      year += 1;
    }
    return null;
  }
  return null;
};

export const shiftTaskDates = (task, today = localDateKey()) => {
  const rule = parseRecurrenceRule(task.recurrence);
  const reference = task.due || task.scheduled || task.start;
  if (!rule || !reference) return null;
  const base = rule.whenDone ? today : reference;
  const nextReference = nextRecurrenceDate(base, rule);
  if (!nextReference) return null;
  const delta = diffDays(reference, nextReference);
  return {
    due: task.due ? addCalendarDays(task.due, delta) : null,
    scheduled: task.scheduled ? addCalendarDays(task.scheduled, delta) : null,
    start: task.start ? addCalendarDays(task.start, delta) : null,
  };
};

const extractMetadata = (body) => {
  let rest = body;
  const blockLink = takeMatch(rest, /\s+(\^[A-Za-z0-9-]+)\s*$/u);
  rest = blockLink.body;
  const dates = {};
  for (const [name, marker] of Object.entries(DATE_MARKERS)) {
    const taken = takeMatch(rest, new RegExp(`\\s*${marker}\\s*(${DATE_TOKEN})`, "u"));
    rest = taken.body;
    dates[name] = taken.value;
  }
  const legacyCancelled = !dates.cancelled ? takeMatch(rest, new RegExp(`\\s*${LEGACY_CANCELLED_MARKER}\\s*(${DATE_TOKEN})(?!\\S)`, "u")) : { body: rest, value: null };
  rest = legacyCancelled.body;
  const id = takeMatch(rest, new RegExp(`\\s*${ID_MARKER}\\s+([A-Za-z0-9_-]+)`, "u"));
  rest = id.body;
  const dependsOn = takeMatch(rest, new RegExp(`\\s*${DEPENDS_MARKER}\\s+([A-Za-z0-9_-]+(?:\\s*,\\s*[A-Za-z0-9_-]+)*)`, "u"));
  rest = dependsOn.body;
  const onCompletion = takeMatch(rest, new RegExp(`\\s*${ON_COMPLETION_MARKER}\\s+(delete|keep)`, "iu"));
  rest = onCompletion.body;
  const recurrence = takeMatch(rest, new RegExp(`\\s*${RECURRENCE_MARKER}\\s+(.+?)${SIGNIFIER_LOOKAHEAD}`, "u"));
  rest = recurrence.body;
  const priority = PRIORITIES.find(([marker]) => rest.includes(marker));
  if (priority) rest = rest.replaceAll(priority[0], " ");
  const tags = [...rest.matchAll(/(?<!\S)#([^\s#]+)/gu)].map((match) => `#${match[1]}`);
  return {
    description: rest.replace(/\s+/gu, " ").trim() || body.trim(),
    start: dates.start,
    scheduled: dates.scheduled,
    due: dates.due,
    completedDate: dates.completed,
    created: dates.created,
    cancelledDate: dates.cancelled ?? legacyCancelled.value,
    recurrence: recurrence.value?.trim() ?? null,
    id: id.value,
    dependsOn: dependsOn.value?.replace(/\s+/gu, "") ?? null,
    onCompletion: onCompletion.value?.toLowerCase() ?? null,
    blockLink: blockLink.value ?? null,
    tags,
    priority: priority ? { rank: priority[1], name: priority[2], marker: priority[0] } : null,
  };
};

export const formatTaskBody = (task) => {
  const chunks = [task.description?.trim() ?? ""];
  if (task.priority?.marker) chunks.push(task.priority.marker);
  if (task.recurrence) chunks.push(`${RECURRENCE_MARKER} ${task.recurrence}`);
  if (task.created) chunks.push(`${DATE_MARKERS.created} ${task.created}`);
  if (task.start) chunks.push(`${DATE_MARKERS.start} ${task.start}`);
  if (task.scheduled) chunks.push(`${DATE_MARKERS.scheduled} ${task.scheduled}`);
  if (task.due) chunks.push(`${DATE_MARKERS.due} ${task.due}`);
  if (task.completedDate) chunks.push(`${DATE_MARKERS.completed} ${task.completedDate}`);
  if (task.cancelledDate) chunks.push(`${DATE_MARKERS.cancelled} ${task.cancelledDate}`);
  if (task.id) chunks.push(`${ID_MARKER} ${task.id}`);
  if (task.dependsOn) chunks.push(`${DEPENDS_MARKER} ${task.dependsOn}`);
  if (task.onCompletion) chunks.push(`${ON_COMPLETION_MARKER} ${task.onCompletion}`);
  if (task.blockLink) chunks.push(task.blockLink);
  return chunks.filter((chunk, index) => index === 0 || Boolean(chunk)).join(" ").trim();
};

export const formatTaskLine = (task) => {
  const prefix = task.linePrefix ?? "- [";
  const after = task.afterCheckbox ?? "] ";
  const status = task.status ?? (task.completed ? "done" : "todo");
  return `${prefix}${STATUS_CHARS[status] ?? " "}${after}${formatTaskBody(task)}`.replace(/[ \t]+$/u, "");
};

export const parseTaskLine = (line, location = {}, options = {}) => {
  const match = line.match(TASK_LINE_PATTERN);
  if (!match) return null;
  if (options.globalFilter && !line.includes(options.globalFilter)) return null;
  const metadata = extractMetadata(match[4]);
  const status = STATUS_BY_CHAR[match[2]] ?? "todo";
  return {
    noteId: location.noteId ?? "",
    noteTitle: location.noteTitle ?? "",
    noteRevision: location.noteRevision ?? 0,
    noteContentHash: location.noteContentHash ?? "",
    from: location.from ?? 0,
    to: (location.from ?? 0) + line.length,
    checkboxOffset: (location.from ?? 0) + match[1].length,
    lineNumber: location.lineNumber ?? 1,
    heading: location.heading ?? "",
    rawLine: line,
    linePrefix: match[1],
    afterCheckbox: match[3],
    status,
    completed: status === "done",
    ...metadata,
  };
};

export const parseTasksFromNote = (note, options = {}) => {
  const tasks = [];
  const markdown = note.contentMarkdown ?? "";
  let from = 0;
  let lineNumber = 1;
  let fence = null;
  let heading = "";
  let htmlComment = false;
  let percentComment = false;
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
    } else if (fence === null) {
      const htmlOpen = line.includes("<!--");
      const htmlClose = line.includes("-->");
      const percentTokens = (line.match(/%%/gu) ?? []).length;
      let skip = htmlComment || percentComment;
      if (htmlOpen && htmlClose) skip = true;
      else if (htmlOpen) {
        htmlComment = true;
        skip = true;
      } else if (htmlComment && htmlClose) {
        htmlComment = false;
        skip = true;
      }
      if (percentTokens >= 2) skip = true;
      else if (percentTokens === 1) {
        percentComment = !percentComment;
        skip = true;
      }
      if (!skip) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/u);
        if (headingMatch) heading = headingMatch[2].trim();
        const task = parseTaskLine(line, {
          noteId: note.id,
          noteTitle: note.title || note.excerpt || "Untitled",
          noteRevision: note.revision,
          noteContentHash: note.contentHash,
          from,
          lineNumber,
          heading,
        }, options);
        if (task) tasks.push(task);
      }
    }
    if (newline === -1) break;
    from = newline + 1;
    lineNumber += 1;
  }
  return tasks;
};

export const lineBoundsAt = (markdown, pos) => {
  const clamped = Math.max(0, Math.min(pos, markdown.length));
  const from = clamped === 0 ? 0 : markdown.lastIndexOf("\n", clamped - 1) + 1;
  const newline = markdown.indexOf("\n", clamped);
  const to = newline === -1 ? markdown.length : newline;
  return { from, to, line: markdown.slice(from, to) };
};

export const locateCurrentTask = (note, scannedTask) => {
  const currentTasks = parseTasksFromNote(note);
  if (note.revision === scannedTask.noteRevision && note.contentHash === scannedTask.noteContentHash) {
    return currentTasks.find((task) => task.from === scannedTask.from && task.rawLine === scannedTask.rawLine) ?? null;
  }
  const exactMatches = currentTasks.filter((task) => task.rawLine === scannedTask.rawLine);
  return exactMatches.length === 1 ? exactMatches[0] : null;
};

const defaultToggleStatus = (status) => (status === "done" || status === "cancelled" ? "todo" : "done");

const withStatusDates = (task, status, options) => {
  const today = options.today ?? localDateKey();
  if (status === "done") {
    return {
      ...task,
      status,
      completed: true,
      completedDate: options.setDoneDate === false ? null : task.completedDate || today,
      cancelledDate: null,
    };
  }
  if (status === "cancelled") {
    return {
      ...task,
      status,
      completed: false,
      completedDate: null,
      cancelledDate: options.setCancelledDate === false ? null : task.cancelledDate || today,
    };
  }
  return { ...task, status, completed: false, completedDate: null, cancelledDate: null };
};

const nextOccurrenceLine = (task, options) => {
  if (!task.recurrence) return null;
  const shifted = shiftTaskDates(task, options.today ?? localDateKey());
  if (!shifted) return null;
  return formatTaskLine({
    ...task,
    ...shifted,
    status: "todo",
    completed: false,
    completedDate: null,
    cancelledDate: null,
    created: options.setCreatedDate ? (options.today ?? localDateKey()) : null,
    id: null,
    dependsOn: null,
  });
};

export const createTaskSaveEdits = (note, scannedTask, nextFields = {}, options = {}) => {
  const current = locateCurrentTask(note, scannedTask);
  if (!current) throw new Error("TASK_SOURCE_CHANGED");
  const nextStatus = nextFields.status ?? current.status;
  const merged = withStatusDates({ ...current, ...nextFields, status: nextStatus }, nextStatus, options);
  if (merged.recurrence && !merged.due && !merged.scheduled && !merged.start) {
    throw new Error("TASK_RECURRENCE_NEEDS_DATE");
  }
  const nextLine = formatTaskLine(merged);
  const edits = [];
  if (nextLine !== current.rawLine) edits.push({ from: current.from, to: current.to, insert: nextLine });
  const completing = nextStatus === "done" && current.status !== "done";
  if (completing) {
    const occurrence = nextOccurrenceLine({ ...current, ...merged }, options);
    if (occurrence) {
      const after = options.recurrenceInsert === "after";
      edits.push({
        from: after ? current.to : current.from,
        to: after ? current.to : current.from,
        insert: after ? `\n${occurrence}` : `${occurrence}\n`,
      });
    }
  }
  return edits;
};

export const createTaskToggleEdits = (note, scannedTask, options = {}) => {
  const current = locateCurrentTask(note, scannedTask);
  if (!current) throw new Error("TASK_SOURCE_CHANGED");
  return createTaskSaveEdits(note, scannedTask, { status: options.nextStatus ?? defaultToggleStatus(current.status) }, options);
};

export const createTaskStatusEdit = (note, scannedTask, completed) => {
  const currentTask = locateCurrentTask(note, scannedTask);
  if (!currentTask) throw new Error("TASK_SOURCE_CHANGED");
  return currentTask.completed === completed
    ? null
    : { from: currentTask.checkboxOffset, to: currentTask.checkboxOffset + 1, insert: completed ? "x" : " " };
};

export const scanAllTasks = async (context, options = {}) => {
  const tasks = [];
  let offset = 0;
  do {
    const result = await context.notes.queryContent({ sort: "updated-desc", limit: 200, offset });
    for (const note of result.notes) tasks.push(...parseTasksFromNote(note, options));
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

export const replaceNoteInTaskIndex = (index, note, options = {}) => {
  const tasks = parseTasksFromNote(note, options);
  if (tasks.length) index.set(note.id, tasks);
  else index.delete(note.id);
  return index;
};

export const removeNoteFromTaskIndex = (index, noteId) => {
  index.delete(noteId);
  return index;
};

export const flattenTaskIndex = (index) => [...index.values()].flat();

export const taskDueCategory = (task, today) => {
  if (!task.due) return "none";
  if (task.due === today) return "today";
  if (task.due > today) return "upcoming";
  if (task.status !== "done" && task.status !== "cancelled") return "overdue";
  return "past";
};

export const compareTasks = (left, right) => {
  const status = (STATUS_SORT[left.status] ?? 9) - (STATUS_SORT[right.status] ?? 9);
  if (status) return status;
  if (left.due !== right.due) return (left.due ?? "9999-99-99").localeCompare(right.due ?? "9999-99-99");
  const leftRank = left.priority?.rank ?? NONE_PRIORITY_RANK;
  const rightRank = right.priority?.rank ?? NONE_PRIORITY_RANK;
  if (leftRank !== rightRank) return rightRank - leftRank;
  const notes = left.noteTitle.localeCompare(right.noteTitle);
  if (notes) return notes;
  return left.lineNumber - right.lineNumber;
};

export const matchesView = (task, view, today) => {
  const open = task.status === "todo" || task.status === "in_progress";
  const dueCat = taskDueCategory(task, today);
  const weekEnd = addCalendarDays(today, 7);
  const date = task.due || task.scheduled;
  if (view === "today") return open && (dueCat === "overdue" || dueCat === "today" || task.scheduled === today);
  if (view === "overdue") return open && dueCat === "overdue";
  if (view === "week") return open && Boolean(date) && (dueCat === "overdue" || (date >= today && date < weekEnd));
  if (view === "inbox") return open && !task.due && !task.scheduled && !task.start;
  if (view === "open") return open;
  if (view === "recurring") return open && Boolean(task.recurrence);
  if (view === "done") return task.status === "done";
  if (view === "cancelled") return task.status === "cancelled";
  return true;
};

export const filterTasks = (tasks, query, today) => {
  const search = query.search?.trim().toLocaleLowerCase() ?? "";
  return tasks.filter((task) => {
    if (!matchesView(task, query.view ?? "open", today)) return false;
    if (query.priority && query.priority !== "all") {
      const name = task.priority?.name ?? "none";
      if (name !== query.priority) return false;
    }
    if (!search) return true;
    const haystack = `${task.description} ${task.noteTitle} ${task.heading} ${task.tags.join(" ")} ${task.recurrence ?? ""}`.toLocaleLowerCase();
    return haystack.includes(search);
  }).sort(compareTasks);
};

export const groupTasks = (tasks, groupBy, today, text) => {
  if (!groupBy || groupBy === "none") return [{ key: "", label: "", tasks }];
  const buckets = new Map();
  for (const task of tasks) {
    let key = "";
    if (groupBy === "priority") key = task.priority?.name ?? "none";
    else if (groupBy === "note") key = task.noteTitle || "Untitled";
    else if (groupBy === "heading") key = task.heading || text.noHeading;
    else if (groupBy === "due") {
      const date = task.due || task.scheduled;
      if (!date) key = "none";
      else if (date < today && task.status !== "done" && task.status !== "cancelled") key = "overdue";
      else if (date === today) key = "today";
      else if (date < addCalendarDays(today, 7)) key = "week";
      else if (date > today) key = "later";
      else key = "none";
    }
    const bucket = buckets.get(key) ?? [];
    bucket.push(task);
    buckets.set(key, bucket);
  }
  const labelFor = (key) => {
    if (groupBy === "priority") return text.priorities[key] ?? key;
    if (groupBy === "due") return key === "none" ? text.none : text.groups[key] ?? text.views[key] ?? key;
    return key;
  };
  const order = groupBy === "priority"
    ? ["highest", "high", "medium", "none", "low", "lowest"]
    : groupBy === "due"
      ? ["overdue", "today", "week", "later", "none"]
      : [...buckets.keys()].sort((left, right) => left.localeCompare(right));
  const keys = [...new Set([...order, ...buckets.keys()])].filter((key) => buckets.has(key));
  return keys.map((key) => ({ key, label: labelFor(key), tasks: buckets.get(key) }));
};

const readPluginSettings = async (context) => {
  if (!context.settings?.get) return { ...DEFAULT_SETTINGS };
  const readBoolean = async (key, fallback) => {
    const value = await context.settings.get(key);
    return value === null || value === undefined ? fallback : value === true || value === "true";
  };
  return {
    globalFilter: String(await context.settings.get("global-filter") ?? "").trim(),
    setDoneDate: await readBoolean("set-done-date", true),
    setCancelledDate: await readBoolean("set-cancelled-date", true),
    setCreatedDate: await readBoolean("set-created-date", false),
    recurrenceInsert: (await context.settings.get("recurrence-insert")) === "after" ? "after" : "before",
  };
};

export const createTaskController = (context) => {
  let refreshGeneration = 0;
  const controller = {
    index: new Map(),
    tasks: [],
    settings: { ...DEFAULT_SETTINGS },
    initialized: false,
    loading: false,
    error: null,
    render: null,
    pendingMutations: new Map(),
    parseOptions() {
      return { globalFilter: controller.settings.globalFilter };
    },
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
      replaceNoteInTaskIndex(controller.index, note, controller.parseOptions());
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
        if (context.settings?.get) controller.settings = await readPluginSettings(context);
        const tasks = await scanAllTasks(context, controller.parseOptions());
        if (generation !== refreshGeneration) return;
        const nextIndex = createTaskIndex(tasks);
        for (const [noteId, note] of controller.pendingMutations) {
          if (note) replaceNoteInTaskIndex(nextIndex, note, controller.parseOptions());
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

const applyMarkdownEdits = (markdown, edits) => {
  const ordered = [...edits].sort((left, right) => left.from - right.from || left.to - right.to);
  return ordered.reduceRight((value, edit) => `${value.slice(0, edit.from)}${edit.insert}${value.slice(edit.to)}`, markdown);
};

const applyTaskEdits = async (context, controller, scannedTask, buildEdits) => {
  const document = await context.editor.getDocument?.().catch(() => null);
  if (document?.noteId === scannedTask.noteId) {
    const liveNote = {
      id: document.noteId,
      title: scannedTask.noteTitle,
      revision: scannedTask.noteRevision,
      contentHash: scannedTask.noteContentHash,
      contentMarkdown: document.contentMarkdown,
    };
    const edits = buildEdits(liveNote);
    if (!edits.length) return;
    await context.editor.editMarkdown(edits);
    controller.replaceNote({ ...liveNote, contentMarkdown: applyMarkdownEdits(liveNote.contentMarkdown, edits) });
    return;
  }
  const note = await context.notes.get(scannedTask.noteId);
  const edits = buildEdits(note);
  if (!edits.length) return;
  const updated = await context.notes.editMarkdown(scannedTask.noteId, {
    expectedRevision: note.revision,
    expectedContentHash: note.contentHash,
    edits,
  });
  controller.replaceNote(updated);
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

const snapshotTask = (task) => ({
  noteId: task.noteId,
  noteTitle: task.noteTitle,
  noteRevision: task.noteRevision,
  noteContentHash: task.noteContentHash,
  from: task.from,
  to: task.to,
  rawLine: task.rawLine,
  lineNumber: task.lineNumber,
});

const openEditPanel = (context, state) => context.ui.panels.open("edit-task", { state });

const mountDashboard = (container, context, controller, mountContext) => {
  const text = language();
  const hasShell = typeof mountContext?.shell?.set === "function";
  const state = { ...DEFAULT_DASHBOARD_STATE };
  const root = document.createElement("section");
  root.className = "edgeever-tasks";
  const list = document.createElement("div");
  list.className = "edgeever-tasks__list";
  let summary;
  let message;
  let search;
  let priorityFilter;
  let groupFilter;
  let views;
  let viewButtons;
  let refresh;
  if (hasShell) {
    root.classList.add("edgeever-tasks--host-chrome");
    root.append(list);
  } else {
    const header = document.createElement("header");
    header.className = "edgeever-tasks__header";
    const headingBlock = document.createElement("div");
    const heading = document.createElement("h2");
    heading.textContent = text.panelTitle;
    summary = document.createElement("p");
    summary.className = "edgeever-tasks__summary";
    headingBlock.append(heading, summary);
    refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "edgeever-tasks__refresh";
    refresh.textContent = text.refresh;
    header.append(headingBlock, refresh);
    views = document.createElement("div");
    views.className = "edgeever-tasks__views";
    views.setAttribute("role", "tablist");
    viewButtons = new Map();
    for (const view of VIEWS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "edgeever-tasks__view";
      button.dataset.view = view;
      button.setAttribute("role", "tab");
      views.append(button);
      viewButtons.set(view, button);
    }
    const toolbar = document.createElement("div");
    toolbar.className = "edgeever-tasks__toolbar";
    search = document.createElement("input");
    search.type = "search";
    search.placeholder = text.search;
    search.setAttribute("aria-label", text.search);
    priorityFilter = createFilter(text.priority, [
      ["all", text.all],
      ...["highest", "high", "medium", "none", "low", "lowest"].map((name) => [name, text.priorities[name]]),
    ]);
    groupFilter = createFilter(text.groupBy, [
      ["due", text.groups.due],
      ["priority", text.groups.priority],
      ["note", text.groups.note],
      ["heading", text.groups.heading],
      ["none", text.groups.none],
    ]);
    groupFilter.select.value = state.groupBy;
    toolbar.append(search, priorityFilter.label, groupFilter.label);
    message = document.createElement("p");
    message.className = "edgeever-tasks__message";
    root.append(header, views, toolbar, message, list);
  }
  container.append(root);

  const persistState = () => {
    void context.storage?.set(DASHBOARD_STATE_KEY, {
      view: state.view,
      search: state.search,
      priority: state.priority,
      groupBy: state.groupBy,
    });
  };

  const toggleTask = async (task) => {
    try {
      await applyTaskEdits(context, controller, task, (note) => createTaskToggleEdits(note, task, {
        ...controller.settings,
        today: localDateKey(),
      }));
    } catch {
      context.ui.showNotice(text.toggleFailed);
      throw new Error("TASK_TOGGLE_FAILED");
    }
  };

  const statusMessage = (visible) => (controller.loading
    ? text.loading
    : controller.error
      ? text.scanFailed
      : visible.length === 0
        ? text.empty
        : visible.length > DISPLAY_LIMIT
          ? text.truncated(DISPLAY_LIMIT, visible.length)
          : "");

  const publishChrome = (visible, today) => {
    if (!hasShell) return;
    mountContext.shell.set({
      header: {
        title: text.panelTitle,
        description: visible.length > DISPLAY_LIMIT
          ? text.truncated(DISPLAY_LIMIT, visible.length)
          : text.summary(visible.length, controller.tasks.length),
        actions: [{ id: "refresh", label: text.refresh }],
      },
      toolbar: [
        {
          type: "tabs",
          key: "view",
          value: state.view,
          options: VIEWS.map((view) => ({
            value: view,
            label: `${text.views[view]} · ${filterTasks(controller.tasks, { ...state, view, search: "", priority: "all" }, today).length}`,
          })),
        },
        { type: "search", key: "search", placeholder: text.search, value: state.search },
        {
          type: "select",
          key: "priority",
          label: text.priority,
          value: state.priority,
          options: [["all", text.all], ...["highest", "high", "medium", "none", "low", "lowest"].map((name) => [name, text.priorities[name]])].map(([value, label]) => ({ value, label })),
        },
        {
          type: "select",
          key: "groupBy",
          label: text.groupBy,
          value: state.groupBy,
          options: [
            ["due", text.groups.due],
            ["priority", text.groups.priority],
            ["note", text.groups.note],
            ["heading", text.groups.heading],
            ["none", text.groups.none],
          ].map(([value, label]) => ({ value, label })),
        },
      ],
      empty: visible.length === 0 ? { title: statusMessage(visible) } : null,
      onAction(id) {
        if (id === "refresh") void controller.refresh();
      },
      onChange(key, value) {
        if (key === "view" && VIEWS.includes(value)) state.view = value;
        else if (key === "search") state.search = value;
        else if (key === "priority") state.priority = value;
        else if (key === "groupBy") state.groupBy = value;
        else return;
        persistState();
        render();
      },
    });
  };

  const render = () => {
    const today = localDateKey();
    if (!hasShell) {
      state.search = search.value;
      state.priority = priorityFilter.select.value;
      state.groupBy = groupFilter.select.value;
    }
    const visible = filterTasks(controller.tasks, state, today);
    if (!hasShell) {
      summary.textContent = text.summary(visible.length, controller.tasks.length);
      for (const [view, button] of viewButtons) {
        const count = filterTasks(controller.tasks, { ...state, view, search: "", priority: "all" }, today).length;
        button.textContent = `${text.views[view]} · ${count}`;
        button.setAttribute("aria-selected", String(view === state.view));
        button.classList.toggle("is-active", view === state.view);
      }
      message.textContent = statusMessage(visible);
    }
    publishChrome(visible, today);
    const shown = visible.slice(0, DISPLAY_LIMIT);
    list.replaceChildren();
    const groups = groupTasks(shown, state.groupBy, today, text);
    for (const group of groups) {
      const section = document.createElement("section");
      section.className = "edgeever-tasks__group";
      if (group.label) {
        const title = document.createElement("h3");
        title.className = "edgeever-tasks__group-title";
        title.textContent = `${group.label} · ${group.tasks.length}`;
        section.append(title);
      }
      for (const task of group.tasks) {
        const row = document.createElement("article");
        row.className = `edgeever-tasks__row is-${task.status}`;
        row.tabIndex = 0;
        const checkbox = document.createElement("button");
        checkbox.type = "button";
        checkbox.className = "edgeever-tasks__checkbox";
        checkbox.setAttribute("role", "checkbox");
        checkbox.setAttribute("aria-checked", task.status === "done" ? "true" : task.status === "in_progress" ? "mixed" : "false");
        checkbox.setAttribute("aria-label", task.status === "done" || task.status === "cancelled" ? text.statuses.todo : text.statuses.done);
        checkbox.textContent = task.status === "done" ? "✓" : task.status === "cancelled" ? "–" : task.status === "in_progress" ? "▶" : "";
        checkbox.addEventListener("click", async (event) => {
          event.stopPropagation();
          checkbox.disabled = true;
          try {
            await toggleTask(task);
          } catch {
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
        if (task.heading) {
          const headingMeta = document.createElement("span");
          headingMeta.textContent = `${text.heading}: ${task.heading}`;
          metadata.append(headingMeta);
        }
        if (task.status === "in_progress" || task.status === "cancelled") {
          const statusMeta = document.createElement("span");
          statusMeta.textContent = text.statuses[task.status];
          metadata.append(statusMeta);
        }
        if (task.due) {
          const due = document.createElement("span");
          due.className = taskDueCategory(task, today) === "overdue" ? "is-overdue" : "";
          due.textContent = `📅 ${task.due}`;
          metadata.append(due);
        }
        if (task.scheduled) {
          const scheduled = document.createElement("span");
          scheduled.textContent = `⏳ ${task.scheduled}`;
          metadata.append(scheduled);
        }
        if (task.start) {
          const start = document.createElement("span");
          start.textContent = `🛫 ${task.start}`;
          metadata.append(start);
        }
        if (task.priority) {
          const priority = document.createElement("span");
          priority.textContent = `${task.priority.marker} ${text.priorities[task.priority.name]}`;
          metadata.append(priority);
        }
        if (task.recurrence) {
          const recurrence = document.createElement("span");
          recurrence.textContent = `🔁 ${task.recurrence}`;
          metadata.append(recurrence);
        }
        if (task.completedDate) {
          const done = document.createElement("span");
          done.textContent = `✅ ${task.completedDate}`;
          metadata.append(done);
        }
        if (task.cancelledDate) {
          const cancelled = document.createElement("span");
          cancelled.textContent = `❌ ${task.cancelledDate}`;
          metadata.append(cancelled);
        }
        content.append(description, metadata);
        content.addEventListener("click", () => {
          void context.ui.openNote(task.noteId, { search: task.rawLine.trim().slice(0, 500) })
            .catch(() => context.ui.showNotice(text.toggleFailed));
        });
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "edgeever-tasks__edit";
        edit.textContent = text.edit;
        edit.addEventListener("click", (event) => {
          event.stopPropagation();
          void openEditPanel(context, { mode: "edit", task: snapshotTask(task) });
        });
        row.append(checkbox, content, edit);
        row.addEventListener("keydown", (event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            if (event.key === " ") void toggleTask(task).catch(() => {});
            else void context.ui.openNote(task.noteId, { search: task.rawLine.trim().slice(0, 500) });
          } else if (event.key === "e") {
            event.preventDefault();
            void openEditPanel(context, { mode: "edit", task: snapshotTask(task) });
          }
        });
        section.append(row);
      }
      list.append(section);
    }
  };

  controller.render = render;
  if (!hasShell) {
    search.addEventListener("input", () => {
      persistState();
      render();
    });
    priorityFilter.select.addEventListener("change", () => {
      persistState();
      render();
    });
    groupFilter.select.addEventListener("change", () => {
      persistState();
      render();
    });
    views.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view]");
      if (!button) return;
      state.view = button.dataset.view;
      persistState();
      render();
    });
    refresh.addEventListener("click", () => void controller.refresh());
  }
  void context.storage?.get(DASHBOARD_STATE_KEY).then((stored) => {
    if (!stored || typeof stored !== "object") return;
    if (VIEWS.includes(stored.view)) state.view = stored.view;
    if (typeof stored.search === "string") {
      state.search = stored.search;
      if (search) search.value = stored.search;
    }
    if (typeof stored.priority === "string") {
      state.priority = stored.priority;
      if (priorityFilter) priorityFilter.select.value = stored.priority;
    }
    if (typeof stored.groupBy === "string") {
      state.groupBy = stored.groupBy;
      if (groupFilter) groupFilter.select.value = stored.groupBy;
    }
    render();
  });
  render();
  if (!controller.initialized) void controller.refresh();
  return () => {
    if (controller.render === render) controller.render = null;
    root.remove();
  };
};

const fieldBlock = (labelText, control) => {
  const label = document.createElement("label");
  label.className = "edgeever-tasks-edit__field";
  const caption = document.createElement("span");
  caption.textContent = labelText;
  label.append(caption, control);
  return label;
};

const fillTaskForm = (form, task) => {
  form.description.value = task?.description ?? "";
  form.status.value = task?.status ?? "todo";
  form.priority.value = task?.priority?.name ?? "none";
  form.due.value = task?.due ?? "";
  form.scheduled.value = task?.scheduled ?? "";
  form.start.value = task?.start ?? "";
  form.recurrence.value = task?.recurrence ?? "";
};

const readTaskForm = (form, base = {}) => {
  const priorityName = form.priority.value;
  const priority = PRIORITIES.find(([, , name]) => name === priorityName);
  return {
    ...base,
    description: form.description.value.trim(),
    status: form.status.value,
    priority: priority ? { rank: priority[1], name: priority[2], marker: priority[0] } : null,
    due: form.due.value || null,
    scheduled: form.scheduled.value || null,
    start: form.start.value || null,
    recurrence: form.recurrence.value.trim() || null,
  };
};

const mountEditor = (container, context, controller, mountContext) => {
  const text = language();
  const state = mountContext.state && typeof mountContext.state === "object" ? mountContext.state : { mode: "create" };
  const scanned = state.task ?? null;
  const parsed = scanned?.rawLine ? parseTaskLine(scanned.rawLine, scanned, controller.parseOptions()) : null;
  const root = document.createElement("form");
  root.className = "edgeever-tasks-edit";
  root.noValidate = true;
  const error = document.createElement("p");
  error.className = "edgeever-tasks-edit__error";
  error.hidden = true;
  const description = document.createElement("textarea");
  description.rows = 3;
  description.required = true;
  const status = document.createElement("select");
  for (const value of ["todo", "in_progress", "done", "cancelled"]) status.append(createOption(value, text.statuses[value]));
  const priority = document.createElement("select");
  priority.append(createOption("none", text.priorities.none));
  for (const [, , name] of PRIORITIES) priority.append(createOption(name, text.priorities[name]));
  const due = document.createElement("input");
  due.type = "date";
  const scheduled = document.createElement("input");
  scheduled.type = "date";
  const start = document.createElement("input");
  start.type = "date";
  const recurrence = document.createElement("input");
  recurrence.type = "text";
  recurrence.placeholder = "every week";
  const form = { description, status, priority, due, scheduled, start, recurrence };
  fillTaskForm(form, parsed);

  const dateRow = (input) => {
    const wrap = document.createElement("div");
    wrap.className = "edgeever-tasks-edit__date";
    wrap.append(input);
    const shortcuts = [
      ["today", 0],
      ["tomorrow", 1],
      ["nextWeek", 7],
    ];
    for (const [key, days] of shortcuts) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "edgeever-tasks-edit__chip";
      button.textContent = text.dateShortcuts[key];
      button.addEventListener("click", () => {
        input.value = addCalendarDays(localDateKey(), days);
      });
      wrap.append(button);
    }
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "edgeever-tasks-edit__chip";
    clear.textContent = text.dateShortcuts.clear;
    clear.addEventListener("click", () => {
      input.value = "";
    });
    wrap.append(clear);
    return wrap;
  };

  const hints = document.createElement("div");
  hints.className = "edgeever-tasks-edit__hints";
  for (const hint of text.recurrenceHints) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "edgeever-tasks-edit__chip";
    chip.textContent = hint;
    chip.addEventListener("click", () => {
      recurrence.value = hint;
    });
    hints.append(chip);
  }

  const hasShell = typeof mountContext?.shell?.set === "function";
  let save;
  if (!hasShell) {
    const actions = document.createElement("div");
    actions.className = "edgeever-tasks-edit__actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = text.cancel;
    save = document.createElement("button");
    save.type = "submit";
    save.className = "edgeever-tasks-edit__save";
    save.textContent = text.save;
    actions.append(cancel, save);
    cancel.addEventListener("click", () => void mountContext.requestClose());
    root.append(
      fieldBlock(text.fields.description, description),
      fieldBlock(text.fields.status, status),
      fieldBlock(text.fields.priority, priority),
      fieldBlock(text.fields.due, dateRow(due)),
      fieldBlock(text.fields.scheduled, dateRow(scheduled)),
      fieldBlock(text.fields.start, dateRow(start)),
      fieldBlock(text.fields.recurrence, recurrence),
      hints,
      error,
      actions,
    );
  } else {
    root.append(
      fieldBlock(text.fields.description, description),
      fieldBlock(text.fields.status, status),
      fieldBlock(text.fields.priority, priority),
      fieldBlock(text.fields.due, dateRow(due)),
      fieldBlock(text.fields.scheduled, dateRow(scheduled)),
      fieldBlock(text.fields.start, dateRow(start)),
      fieldBlock(text.fields.recurrence, recurrence),
      hints,
      error,
    );
  }
  container.append(root);
  description.focus();

  const showError = (message) => {
    error.hidden = !message;
    error.textContent = message ?? "";
  };

  const submit = async () => {
    const fields = readTaskForm(form, parsed ?? {});
    if (!fields.description) {
      showError(text.descriptionRequired);
      return;
    }
    if (fields.recurrence && !fields.due && !fields.scheduled && !fields.start) {
      showError(text.recurrenceNeedsDate);
      return;
    }
    if (controller.settings.setCreatedDate && state.mode === "create") fields.created = localDateKey();
    if (save) save.disabled = true;
    mountContext.shell?.set?.({
      header: {
        title: text.editTitle,
        description: null,
        actions: [
          { id: "cancel", label: text.cancel, variant: "ghost" },
          { id: "save", label: text.save, variant: "primary", disabled: true },
        ],
      },
      onAction,
    });
    try {
      if (scanned) {
        await applyTaskEdits(context, controller, scanned, (note) => createTaskSaveEdits(note, scanned, fields, {
          ...controller.settings,
          today: localDateKey(),
        }));
      } else {
        const line = formatTaskLine({ ...fields, linePrefix: "- [", afterCheckbox: "] " });
        await context.editor.insertAtCursor(line);
      }
      context.ui.showNotice(text.saved);
      await mountContext.requestClose();
    } catch (cause) {
      if (save) save.disabled = false;
      showError(cause?.message === "TASK_RECURRENCE_NEEDS_DATE" ? text.recurrenceNeedsDate : text.saveFailed);
      publishEditorChrome();
    }
  };

  const onAction = (id) => {
    if (id === "cancel") void mountContext.requestClose();
    if (id === "save") void submit();
  };

  const publishEditorChrome = () => {
    if (!hasShell) return;
    mountContext.shell.set({
      header: {
        title: text.editTitle,
        description: null,
        actions: [
          { id: "cancel", label: text.cancel, variant: "ghost" },
          { id: "save", label: text.save, variant: "primary" },
        ],
      },
      onAction,
    });
  };

  publishEditorChrome();
  root.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit();
  });

  return () => root.remove();
};

const findTaskAtCursor = async (context, options) => {
  const document = await context.editor.getDocument();
  if (!document) return null;
  const selection = await context.editor.getSelection();
  const pos = selection?.from ?? 0;
  const bounds = lineBoundsAt(document.contentMarkdown, pos);
  const task = parseTaskLine(bounds.line, {
    noteId: document.noteId,
    from: bounds.from,
    noteRevision: 0,
    noteContentHash: "",
  }, options);
  return task ? { ...task, noteId: document.noteId } : { mode: "create", noteId: document.noteId };
};

export default {
  activate(context) {
    const text = language();
    const controller = createTaskController(context);
    const disposeDashboard = context.ui.panels.register({
      id: "tasks",
      title: text.panelTitle,
      purpose: "dashboard",
      presentation: "fullscreen",
      mount(container, mountContext) { return mountDashboard(container, context, controller, mountContext); },
    });
    const disposeEditor = context.ui.panels.register({
      id: "edit-task",
      title: text.editTitle,
      purpose: "workflow",
      presentation: "dialog",
      mount(container, mountContext) { return mountEditor(container, context, controller, mountContext); },
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
    const disposeCreateOrEdit = context.commands.register({
      id: "create-or-edit",
      title: text.createOrEdit,
      async run() {
        try {
          const found = await findTaskAtCursor(context, controller.parseOptions());
          if (!found) {
            context.ui.showNotice(text.editFailed);
            return;
          }
          if (found.rawLine) await openEditPanel(context, { mode: "edit", task: snapshotTask(found) });
          else await openEditPanel(context, { mode: "create" });
        } catch {
          context.ui.showNotice(text.editFailed);
        }
      },
    });
    const disposers = [
      disposeDashboard,
      disposeEditor,
      disposeOpen,
      disposeInsert,
      disposeCreateOrEdit,
      context.events.on("note.created", ({ note }) => controller.replaceNote(note)),
      context.events.on("note.updated", ({ note }) => controller.replaceNote(note)),
      context.events.on("note.deleted", ({ noteId }) => controller.removeNote(noteId)),
      context.events.on("settings.changed", () => {
        const previous = controller.settings.globalFilter;
        void readPluginSettings(context).then((settings) => {
          controller.settings = settings;
          if (settings.globalFilter !== previous) void controller.refresh();
        });
      }),
    ];
    return () => {
      controller.dispose();
      for (const dispose of disposers.reverse()) dispose();
    };
  },
};
