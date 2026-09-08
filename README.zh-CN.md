# EdgeEver Tasks

[![GitHub Stars](https://img.shields.io/github/stars/tianma-if/edgeever-tasks?style=social)](https://github.com/tianma-if/edgeever-tasks/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/tianma-if/edgeever-tasks?style=social)](https://github.com/tianma-if/edgeever-tasks/network/members)

[English](README.md) | 简体中文

> **EdgeEver 官方 Markdown 原生任务面板插件。**

EdgeEver Tasks 让任务继续保存在普通笔记中，同时提供统一的跨笔记任务面板。每项任务始终是纯 Markdown，并可直接链接回来源笔记。

## 功能

- 跨全部笔记查找 `- [ ] 撰写发布说明`、`- [x] 发布` 等标准 Markdown 任务。
- 忽略围栏代码块中的任务示例。
- 按完成状态、截止日期类别和关键词筛选。
- 识别 Obsidian Tasks 风格的日期标记（`🛫`、`⏳`、`📅`、`✅`、`➕`、`⛔`）及优先级标记。
- 从任务面板直接打开来源笔记。
- 通过带乐观并发校验的局部编辑完成或重新打开任务；来源存在歧义时拒绝回写。
- 首次扫描后维护事件驱动的内存增量索引，重新打开面板不会再次遍历全部笔记。
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

通过 GitHub 安装时，需要存在与 `manifest.json` 版本一致的正式 Release，并附带 `manifest.json`、`main.js` 和 `styles.css` 三个资产。

## 任务语法

```md
- [ ] 撰写公告 🔺 📅 2026-09-10
- [x] 发布版本 ✅ 2026-09-11
```

插件读取标准列表复选框。元数据全部可选，并始终保留为普通 Markdown 文本。

## 开发

需要 Bun 1.3.14 或更高版本。

```sh
bun run check
```

可分发文件位于仓库根目录，因为 EdgeEver 的 GitHub 安装器要求这种结构。`main.js` 已经是单文件运行产物，不需要构建步骤。

## 许可证与致谢

采用 AGPL-3.0-or-later 许可证。产品思路及兼容的任务元数据格式受到 [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 启发。
