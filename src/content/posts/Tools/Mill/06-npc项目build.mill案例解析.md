---
title: "案例：读懂 npc 项目的 build.mill"
published: 2026-07-20
description: "解析 npc 构建中的公共 trait、完整模块、Fetch/Decode 等选择性编译模块，以及 generatedSources 的设计。"
tags: ["Mill", "Chisel", "NPC", "Case Study"]
category: "Mill"
series: { name: "Mill 1.x 构建工具", order: 7 }
draft: false
---

本地 `~/personal-ysyx-workbench/npc/build.mill` 的目标不仅是“编译整个 NPC”，还为
Fetch、Decode、Hazard、Cache 等单元创建只包含必要源码的独立测试边界。这解释了它
为什么比官方模板长得多。


---

### 一、公共主模块配置

```scala
trait NpcScalaModule extends ScalaModule {
  override def scalaVersion = "2.13.16"
  def chiselVersion = "7.0.0"

  override def mvnDeps = Seq(
    mvn"org.chipsalliance::chisel:${chiselVersion}"
  )

  override def scalacPluginMvnDeps = Seq(
    mvn"org.chipsalliance:::chisel-plugin:${chiselVersion}"
  )
}
这个 trait 集中约束 Scala、Chisel、编译器插件和编译参数。所有具体模块继承它，从而
避免重复配置。


---

### 二、完整工程模块 `npc`

```scala
object npc extends NpcScalaModule {
  object test extends ScalaTests with TestModule.ScalaTest
}
```


对应命令通常是：

```bash
mill npc.compile
mill npc.test
mill show npc.sources
```

---

### 三、选择性编译模块

`fetch`、`decode`、`hazard` 等模块的共同结构是：

```scala
object fetch extends NpcScalaModule {
  override def sources = Task.Sources()

  override def generatedSources = Task {
    val root = Task.workspace
    val files = Seq(/* Fetch 所需的最小源文件闭包 */)
    val dest = Task.dest / "src"

    for (file <- files) {
      val out = dest / file.relativeTo(root)
      Files.createDirectories(out.toNIO.getParent)
      os.copy(file, out)
    }
    Seq(PathRef(dest))
  }
}
```

`sources = Task.Sources()` 将默认源码集合置空，防止模块顺手编译整个工程；
`generatedSources` 再把所需文件复制到自己的 `Task.dest/src`。因此 `fetch.compile` 只看到
Fetch 及其 Bundle、配置和工具依赖。

这种方法的收益是：

- 单元测试编译更快。
- 缺少依赖会立刻暴露，避免无意依赖整个工程的其他实现。
- 不需要重排现有源码目录。

成本是源文件列表必须人工维护。某个 Bundle 新增依赖后，需要同步加入列表，否则会出现
`not found: type ...` 一类编译错误。

---

### 四、目录扫描与显式文件列表

Cache 模块同时使用目录扫描和显式文件：

```scala
val roots = Seq(
  root / "src/main/scala/mycpu/common",
  root / "src/main/scala/mycpu/cache",
)

val files =
  roots.flatMap(srcRoot => os.walk(srcRoot).filter(_.ext == "scala")) ++
    Seq(root / "src/main/scala/mycpu/memory/MemoryBundles.scala")
```

选择规则可以按维护成本分级：

| 方式 | 优点 | 风险 |
| :--- | :--- | :--- |
| 逐文件列举 | 依赖边界最严格 | 新增文件时容易漏改 |
| 扫描一个 package 目录 | 维护简单 | 可能引入不必要文件 |
| 编译整个工程 | 几乎无需维护 | 隔离性和增量速度最差 |

对 `common` 这类高复用目录整体扫描通常合理；对某个 pipeline stage 逐文件列举则能更
严格地约束依赖。

---

### 五、测试模块也使用独立源集

```scala
object test extends ScalaTests with TestModule.ScalaTest {
  override def sources = Task.Sources()
  override def generatedSources = Task {
    // 只复制该单元对应的 Spec
  }
}
```

主模块的选择性编译与测试模块的选择性编译是两层不同配置。只限制主源码而不限制测试
源码，仍可能把其他 Spec 一起编译进来。

---

### 六、建议的维护方向

1. 先补上明确的 Mill 版本锁定，保证所有机器使用同一 API。
2. 把重复的“复制并保持相对路径”代码提取为构建辅助函数。
3. 把选择的源文件本身建模为可跟踪输入，验证修改文件后缓存一定失效。
4. 升级 Mill 时单独做迁移提交，并用 `npc.compile` 与所有选择性模块测试作为回归检查。


