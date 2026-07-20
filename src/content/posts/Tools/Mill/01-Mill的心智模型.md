---
title: "Mill 的心智模型：模块树、任务图与命令行"
published: 2026-07-20
description: "用模块树和任务依赖图理解 Mill，并掌握 resolve、inspect、show 等探索命令。"
tags: ["Mill", "Build Tool", "Task Graph"]
category: "Mill"
series: { name: "Mill 1.x 构建工具", order: 2 }
draft: false
---

阅读 `build.mill` 时，不要把它当作从上到下执行的 Shell 脚本。Mill 大致经历三个阶段：

1. 编译构建定义：`build.mill` 本身是 Scala 代码。
2. 解析选择器：把 `npc.test` 解析为模块树中的任务。
3. 计算任务图：先计算过期的上游任务，再执行目标任务，未变化的结果直接复用缓存。

---

### 一、Module 是命名空间和模板

```scala
package build
import mill.*

object cpu extends Module {
  def rtl = Task { "Cpu.scala" }

  object test extends Module {
    def list = Task { Seq("AluSpec", "CsrSpec") }
  }
}
```

模块的嵌套关系直接变成命令路径：

```bash
mill cpu.rtl
mill cpu.test.list
```

`object` 是模块的一个具体实例；`trait` 则适合定义可供多个模块复用的模板。这正是大型
`build.mill` 常用 `trait NpcScalaModule extends ScalaModule` 的原因。

---

### 二、Task 是依赖图中的节点

```scala
def sourceCount = Task {
  os.walk(Task.workspace / "src").count(_.ext == "scala")
}

def report = Task {
  s"Scala source count: ${sourceCount()}"
}
```

任务体内的 `sourceCount()` 不是普通的随意函数调用。Mill 会记录 `report` 依赖
`sourceCount`，从而决定执行顺序和缓存失效范围。

对于 `ScalaModule`，`compile`、`run`、`test`、`assembly` 等任务已经由 Mill 提供；
用户通常通过覆写 `scalaVersion`、`mvnDeps`、`sources` 等任务来配置它们。

---

### 三、先探索，再执行

面对陌生项目，推荐先运行：

```bash
# 查看根下可以选择的任务和模块
mill resolve _

# 递归查询所有 compile 任务
mill resolve __.compile

# 查看任务说明、定义位置和直接输入
mill inspect npc.compile

# 执行任务并将返回值以 JSON 形式打印出来
mill show npc.sources

# 普通执行，只关注日志和成功失败
mill npc.compile
```

选择器中 `_` 匹配一层，`__` 递归匹配多层。先用 `resolve` 验证名字，可以避免靠猜测
任务路径。

---

### 四、输出目录也映射任务路径

`npc.compile` 的缓存与输出通常位于 `out/npc/compile.*`，`npc.test.compile` 则位于
`out/npc/test/compile.*`。常见内容包括：

- `*.json`：任务返回值及缓存元数据。
- `*.dest/`：该任务独占的输出目录。
- 编译生成的 class、jar 或其他中间产物。

不要让多个任务直接写同一个手工指定的临时目录。使用各自的 `Task.dest`，可以避免
并行冲突，并让 Mill 正确管理缓存。

---

### Reference

- [Mill Modules](https://mill-build.org/mill/fundamentals/modules.html)
- [Mill Tasks](https://mill-build.org/mill/fundamentals/tasks.html)
- [Mill Evaluation Model](https://mill-build.org/mill/depth/evaluation-model.html)


