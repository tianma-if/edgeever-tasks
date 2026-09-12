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

## 任务语法

```md
- [ ] 撰写公告 [priority:: highest] [due:: 2026-09-10]
- [/] 审阅文案 [repeat:: every week] [scheduled:: 2026-09-11]
- [x] 发布版本 [completion:: 2026-09-11]
- [-] 放弃方案 [cancelled:: 2026-09-09]
```

已有的表情行（例如 `📅 2026-09-10`）仍可读取。除非在设置里改回表情格式，插件写入时使用上面的文本格式。

插件读取标准列表复选框。元数据全部可选，并始终保留为普通 Markdown 文本。

重复任务需要设置截止日期、计划日期或开始日期。完成 `[repeat:: every Sunday] [due:: 2021-04-25]` 时，会插入下一次任务，并写入完成日期。

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
