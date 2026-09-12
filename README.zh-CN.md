# EdgeEver Tasks

[![GitHub Stars](https://img.shields.io/github/stars/tianma-if/edgeever-tasks?style=social)](https://github.com/tianma-if/edgeever-tasks/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/tianma-if/edgeever-tasks?style=social)](https://github.com/tianma-if/edgeever-tasks/network/members)

[English](README.md) | 简体中文

> **EdgeEver 官方 Markdown 原生任务面板插件。**

EdgeEver Tasks 让任务继续保存在普通笔记中，同时提供统一的跨笔记任务面板。每项任务始终是纯 Markdown，并可直接链接回来源笔记。

## 功能

- 跨全部笔记查找 `- [ ] 撰写发布说明`、`- [x] 发布` 等标准 Markdown 任务。
- 识别 `- [/] 进行中` 与 `- [-] 已取消` 状态。
- 忽略围栏代码块和注释中的任务示例。
- 面板视图：今天、已逾期、本周、收集箱、未完成、重复、已完成、已取消。
- 左侧月历标出有任务的日期，并可按日期筛选列表。
- 按关键词、优先级筛选，并按截止日期、优先级、笔记或标题分组。
- 日期等字段默认写成安静的文本，例如 `[due:: 2026-09-10]`，同时仍能读取 Obsidian Tasks 的表情行。
- 完成任务时可写入完成日期，并自动生成下一次重复任务。
- 通过对话框创建或编辑描述、日期、优先级、状态和重复规则；可从面板或当前编辑器行打开。
- 从任务面板直接打开来源笔记。
- 通过带乐观并发校验的局部编辑完成或更新任务；若来源笔记正在编辑，则优先写入实时文档。
- 首次扫描后维护事件驱动的内存增量索引，重新打开面板不会再次遍历全部笔记。
- 可选全局过滤，例如只把包含 `#task` 的清单项当作任务。
- 通过命令在当前编辑器光标处插入 `- [ ] `。

索引有意只保存在内存中。EdgeEver 重启后会执行一次初始扫描；Markdown 始终是唯一事实来源，不需要插件数据库或数据迁移。

## 关于 EdgeEver

[EdgeEver](https://github.com/tianma-if/edgeever) 是一款开源、AI 原生的知识库和可迁移的 Evernote 替代方案，原生支持 MCP。

- GitHub：[github.com/tianma-if/edgeever](https://github.com/tianma-if/edgeever)

## 安装

打开 EdgeEver 的「插件市场」，输入下面的公开仓库地址并安装：

```text
https://github.com/tianma-if/edgeever-tasks
```

通过 GitHub 安装时，需要存在与 `manifest.json` 版本一致的正式 Release，并附带 `manifest.json`、`main.js` 和 `styles.css` 三个资产。推送到 `main` 时，若不存在对应 Release，工作流会自动发布。

## 用法

任务写在笔记里。插件只扫描和改这些清单行，不会另建任务数据库。

### 打开面板

启用插件后，从左下角拼图菜单打开 **待办任务**，或运行 **打开待办任务面板**。面板会汇总全部笔记里的任务。

### 创建任务

下面三种都可以：

- 在笔记里写普通清单：`- [ ] 给打印店打电话`。
- 光标停在笔记里时，运行 **在光标处插入待办任务**。
- 在面板里用 **创建或编辑任务**。描述和日期在对话框里填即可，不必手打 `[due:: …]`。

日期、优先级、重复都是可选的。没有日期的任务进 **收集箱**。重复任务需要截止、计划或开始日期之一，插件才知道下一次往哪天推。

在 EdgeEver 编辑器里，`[due:: 2026-09-10]` 这类字段会显示成小标签。点标签即可改原文。Markdown 源码里存的仍是文本。

### 在面板里处理

- **视图** — 今天、已逾期、本周、收集箱、未完成、重复、已完成、已取消、全部。切换视图会清掉日历上的日期筛选，直接显示该视图的全部任务。
- **月历** — 有任务的日子带圆点。点某一天只看那天。**今天** 和 **全部日期** 用来退出按天筛选。
- **搜索、优先级、分组** — 缩小范围，或按截止日期、优先级、笔记、标题分组。
- **完成** — 勾选一行的复选框，来源笔记会就地更新。重复任务会自动插入下一次。
- **编辑** — 从一行打开对话框，改日期、优先级、状态或重复规则。
- **跳到来源** — 点任务标题（或在聚焦行上按 Enter）打开源笔记。

### 笔记里的状态

| Markdown | 含义 |
| --- | --- |
| `- [ ]` | 待办 |
| `- [/]` | 进行中 |
| `- [x]` | 已完成 |
| `- [-]` | 已取消 |

## 任务语法

字段写在同一行、描述后面。全部可选。不想手打标记时，用创建/编辑对话框即可。

```md
- [ ] 撰写公告 [priority:: highest] [due:: 2026-09-10]
- [/] 审阅文案 [repeat:: every week] [scheduled:: 2026-09-11]
- [x] 发布版本 [completion:: 2026-09-11]
- [-] 放弃方案 [cancelled:: 2026-09-09]
```

插件默认写入 `[key:: value]`。`(due:: 2026-09-10)` 这种括号写法也能读。已有的 Obsidian Tasks 表情行仍可读取；若希望插件改回写表情，把 **任务元数据格式** 设成表情。

### 字段

日期一律 `YYYY-MM-DD`。

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `[due:: …]` | 截止日期 | `[due:: 2026-09-10]` |
| `[scheduled:: …]` | 计划动手的日期 | `[scheduled:: 2026-09-11]` |
| `[start:: …]` | 这天之前先不做 | `[start:: 2026-09-11]` |
| `[completion:: …]` | 完成日期 | `[completion:: 2026-09-11]` |
| `[created:: …]` | 创建日期 | `[created:: 2026-09-01]` |
| `[cancelled:: …]` | 取消日期 | `[cancelled:: 2026-09-09]` |
| `[priority:: …]` | `highest` `high` `medium` `low` `lowest` | `[priority:: high]` |
| `[repeat:: …]` | 重复规则 | `[repeat:: every week]` |
| `[id:: …]` | 任务 id | `[id:: screenshots]` |
| `[dependsOn:: …]` | 依赖的任务 id | `[dependsOn:: screenshots]` |
| `[onCompletion:: …]` | `delete` 或 `keep` | `[onCompletion:: delete]` |

重复任务需要截止、计划或开始日期之一。完成 `[repeat:: every Sunday] [due:: 2021-04-25]` 时，会插入下一次，并写入完成日期。常用规则：`every day`、`every weekday`、`every week`、`every Sunday`、`every month`、`every year`、`every week when done`。

### 仍能读取的表情写法

| 表情 | 等同于 |
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

## 设置

- **全局过滤** — 只索引包含该字符串的清单项，例如 `#task`。
- **任务元数据格式** — 写入 `[due:: YYYY-MM-DD]`（默认）或 Obsidian Tasks 表情。
- **完成时写入日期** — 完成任务时写入完成日期（默认开启）。
- **取消时写入日期** — 取消任务时写入取消日期（默认开启）。
- **新建任务写入创建日期** — 从编辑对话框创建任务时写入创建日期。
- **下一次重复任务** — 将新实例插入到已完成任务的上方或下方。

## 开发

需要 Bun 1.3.14 或更高版本。

```sh
bun run check
bun run release -- --patch
```

升版本只能用 `bun run release`。它会同步提交 `package.json` 和 `manifest.json`、推送 `main`，并发布安装器所需的 GitHub Release。

可分发文件位于仓库根目录，因为 EdgeEver 的 GitHub 安装器要求这种结构。`main.js` 已经是单文件运行产物，不需要构建步骤。

## 许可证与致谢

采用 AGPL-3.0-or-later 许可证。

本插件是面向 EdgeEver 的独立实现，兼容 [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 风格的任务元数据（日期、优先级、重复规则）。它不是 Obsidian Tasks 的官方移植。
