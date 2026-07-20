---
title: "build.mill 核心元素：Mill 1.x 特殊值与路径语义"
published: 2026-07-20
description: "集中解释 T、Task.dest、Task.workspace、moduleDir、PathRef、BuildCtx 和 os.pwd 等 Mill 1.x 构建元素。"
tags: ["Mill", "Task", "Path", "Build Logic"]
category: "Mill"
series: { name: "Mill 1.x 构建工具", order: 3 }
draft: false
---

`build.mill` 虽然是 Scala，但其中最需要学习的是 Mill 注入的上下文和特殊类型。路径取错、输入没有建模、返回值不适合缓存，都会让语法正确的构建产生错误行为。

### 一、`T[A]` 是任务类型

`T[A]` 是 `mill.api.Task[A]` 的简写。它表达“计算后得到 `A` 的任务节点”，不是普通的 `A`：

```scala
def width: T[Int] = Task { 32 }
def banner: T[String] = Task { s"XLEN=${width()}" }
```

在另一个 task 中调用 `width()` 会建立依赖边并读取其结果。不要在构建加载阶段提前读取文件或环境变量；那会绕过 Mill 的失效判断。

### 二、`Task.dest`：当前任务的唯一输出目录

```scala
def emitConfig: T[PathRef] = Task {
  val out = Task.dest / "Config.scala"
  os.write(out, "package generated\nobject Config { val xlen = 32 }", createFolders = true)
  PathRef(out)
}
```

- 路径由模块路径和任务名决定，例如 `out/cpu/emitConfig.dest/`。
- 普通 task 重新执行前，该目录会被清空。
- task 应只把受管理产物写进自己的 `Task.dest`。
- `os.pwd` 在 task 内默认也是 `Task.dest`，不能把它理解为项目根目录。

需要跨次执行保留目录内容时使用 `Task(persistent = true)`，并自行维护缓存一致性。

### 三、`moduleDir`：模块输入文件的基准目录

```scala
object cpu extends ScalaModule {
  def scalaVersion = "2.13.18"
  def extraRtl = Task.Source("rtl")
}
```

相对路径 `"rtl"` 相对 `cpu.moduleDir` 解析。默认情况下，模块树也决定目录树。`moduleDir` 用于定位输入；它不会改变输出位置，输出仍在 `out/cpu/...`。移动或嵌套模块时，基于 `moduleDir` 的相对路径可以继续工作。

### 四、工作区根：`Task.workspace` 与 `BuildCtx.workspaceRoot`

```scala
def topFile = Task.Source(Task.workspace / "src/main/scala/Top.scala")

import mill.api.BuildCtx
def gitHead = Task.Input {
  os.call(("git", "rev-parse", "HEAD"), cwd = BuildCtx.workspaceRoot)
    .out.text().trim()
}
```

工作区根是跨模块的全局坐标，耦合度高。模块自身的源文件应继续使用 `moduleDir`；只有顶层配置、Git 元数据或现有单体源码树等真正的全局输入才使用 workspace root。

### 五、`PathRef`：带文件签名语义的路径

```scala
def generatedSources: T[Seq[PathRef]] = Task {
  val dir = Task.dest / "src"
  Seq(PathRef(dir))
}
```

普通 `os.Path` 只表示路径；`PathRef` 用来把文件或目录作为 task 返回值传给下游，并让 Mill 对内容建立签名。文件产物应返回 `PathRef`，不要返回字符串路径。`Task.Source`/`Task.Sources` 也返回 `PathRef`，并传播内容变化。

### 六、`Task.env` 与外部状态

```scala
def verilatorRoot = Task.Input {
  Task.env.get("VERILATOR_ROOT")
}
```

环境变量、系统属性、Git HEAD 等不会自动成为缓存输入。把最小的外部状态读取放进 `Task.Input`，再由普通 cached task 消费它。`Task.Input` 每次都会求值，不应承载耗时工作。

### 七、`mvn"..."` 依赖坐标

```scala
override def mvnDeps = Seq(
  mvn"org.chipsalliance::chisel:7.7.0"
)
override def scalacPluginMvnDeps = Seq(
  mvn"org.chipsalliance:::chisel-plugin:7.7.0"
)
```

- 单冒号使用精确 artifact 名。
- 双冒号追加 Scala binary version。
- 三冒号追加完整 Scala version，编译器插件通常需要它。

### 八、任务返回值与元数据

普通 cached task 的返回值会序列化到相邻的 `.json` 文件。基本类型、集合、tuple 和 `PathRef` 已有 uPickle 支持；自定义类型需要提供 `upickle.ReadWriter`。不适合序列化的长生命周期对象，应由 Worker 管理。

### Reference

- [Mill Tasks](https://mill-build.org/mill/fundamentals/tasks.html)
- [Mill Modules：moduleDir](https://mill-build.org/mill/fundamentals/modules.html)

