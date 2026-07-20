---
title: "Mill 1.x 合集导读"
published: 2026-07-20
description: "面向熟悉 Scala 的 Chisel 开发者，系统讲解 Mill 1.x 的任务图、模块、路径、缓存、依赖、测试和调试。"
tags: ["Mill", "Chisel", "Build Tool"]
category: "Mill"
series: { name: "Mill 1.x 构建工具", order: 1 }
draft: false
---

本合集默认已经掌握 Scala，集中讨论 Mill 1.x 特有的构建模型和 API。学习目标不是照抄一个
`build.mill`，而是能够解释任务为什么执行、输入变化如何传播、源码从哪里发现，以及如何
为 Chisel 工程设计可维护的编译和测试边界。

### 合集目录

| 篇目 | 主题 | 学习结果 |
| :--- | :--- | :--- |
| [01　Mill 的心智模型](/posts/tools/mill/01-mill的心智模型/) | 模块树、任务图、CLI 查询 | 能用 `resolve`、`inspect`、`show` 探索陌生构建 |
| [02　build.mill 核心元素](/posts/tools/mill/02-buildmill语法速成/) | `T[A]`、`Task.dest`、`moduleDir`、`PathRef` | 能正确处理任务上下文、输入和输出路径 |
| [03　Chisel 官方模板逐行解析](/posts/tools/mill/03-chisel官方模板逐行解析/) | Mill 版本、`SbtModule`、Chisel 插件、ScalaTest | 能独立阅读现代 Chisel 模板 |
| [04　任务输入、输出与缓存](/posts/tools/mill/04-任务输入输出与缓存/) | Source、Input、Command、缓存失效 | 能编写缓存正确的生成任务 |
| [05　模块依赖与测试](/posts/tools/mill/05-模块依赖与测试/) | module trait、`moduleDeps`、测试子模块 | 能设计多模块 Chisel 工程 |
| [06　npc 构建案例](/posts/tools/mill/06-npc项目buildmill案例解析/) | 选择性编译、源码闭包、单元隔离 | 能将现有 npc 需求表达为 Mill 1.x 构建 |
| [07　Mill 调试手册](/posts/tools/mill/07-mill调试手册/) | 分层定位构建问题 | 能定位任务、源码、依赖、测试和缓存问题 |

### 贯穿全合集的构建主线

```text
build.mill
    ↓ 编译并发现 Module / Task
命令选择器
    ↓ 例如 cpu.test
任务依赖图
    ↓ 比较输入签名与已有缓存
只执行失效节点
    ↓
out/<module>/<task>.{json,dest}
```

推荐按编号顺序阅读。01—04 建立 Mill 的底层模型，05 讨论工程组织，06 将这些概念放回
实际 NPC 项目，07 用于日常查询。

### Reference

- [Mill 官方文档](https://mill-build.org/mill/)
- [Mill Tasks](https://mill-build.org/mill/fundamentals/tasks.html)
- [Mill Modules](https://mill-build.org/mill/fundamentals/modules.html)
- [Chisel 官方模板](https://github.com/chipsalliance/chisel-template)

