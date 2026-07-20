---
title: "Mill 调试手册"
published: 2026-07-20
description: "使用 resolve、inspect、show、out 目录和分层排查法定位 Mill 模块、源码、依赖、缓存与测试问题。"
tags: ["Mill", "Debugging", "Chisel"]
category: "Mill"
series: { name: "Mill 1.x 构建工具", order: 8 }
draft: false
---

调试 Mill 时先判断问题发生在哪一层：构建定义编译、任务选择、源码发现、依赖解析、
Scala/Chisel 编译、测试执行，还是缓存。混在一起看日志通常效率最低。

---

### 一、构建文件本身无法编译

先运行一个只做查询的命令：

```bash
mill resolve _
```

如果这里就报 Scala 编译错误，问题属于 `build.mill`，还没有进入 RTL/测试源码编译。
重点检查：

- build header 的 Mill 版本是否正确。
- 括号、逗号、`override` 后的返回值类型是否匹配。

---

### 二、找不到任务或模块

```bash
mill resolve _
mill resolve __.compile
mill resolve npc._
```

模块嵌套会形成点分路径。`object npc { object test ... }` 对应 `npc.test`，而不是根级
`test`。

进一步检查一个任务：

```bash
mill inspect npc.compile
```

`inspect` 会显示说明、定义位置和输入任务，适合确认某次 override 是否真的进入任务图。

---

### 三、源码没有被编译

```bash
mill show npc.sources
mill show npc.generatedSources
mill show npc.allSourceFiles
```

具体可用任务名随版本和模块类型变化，先用 `resolve npc._` 确认。重点核对：

2. 使用的是 Mill 原生布局还是 `SbtModule` 布局。
3. 是否用空的 `sources` 刻意关闭了默认源集。
4. `generatedSources` 返回的 `PathRef` 是否覆盖真正生成/复制的目录。
5. 文件扩展名和相对路径是否保持正确。

---

### 四、依赖下载或类找不到

先区分两类错误：

- 下载失败、仓库不可达：检查网络、repository 和依赖坐标。
- Scala 报 `not found`：依赖可能已下载，但没有进入正确模块的 classpath，或选择性源集漏了
  工程内部文件。

检查配置返回值：

```bash
mill show npc.mvnDeps       # 新版构建
mill inspect npc.compile
```


---

### 五、测试找不到或执行了错误的 Spec

```bash
mill resolve npc.test._
mill show npc.test.sources
mill npc.test
```

检查测试 module 是否混入正确的 framework trait，ScalaTest 依赖是否属于测试模块，以及
选择性测试模块是否清空默认 `sources` 后又正确返回了 `generatedSources`。

---

### 六、任务意外重复执行

连续运行两次：

```bash
mill npc.compile
mill npc.compile
```

若第二次仍进行实质编译，检查：

- 是否修改了构建文件或输入源码。
- 自定义任务是否为 command、uncached task 或读取了不稳定数据。
- 环境变量是否通过 `Task.Input`/`Task.env` 建模。
- 生成文件是否写入自己的 `Task.dest`。
- 返回值中是否包含时间戳、随机数或顺序不稳定的集合。

不要把删除整个 `out/` 当作第一步；那会破坏现场。可以先查看对应的
`out/<module>/<task>.json` 和 `.dest/`，确认 Mill 实际记录了什么。

---

### 七、最小化排查顺序

```bash
mill version
mill resolve __.compile
mill inspect fetch.compile
mill show fetch.sources
mill show fetch.generatedSources
mill fetch.compile
mill fetch.test
```

这个顺序从构建工具、选择器、任务图、输入集合逐步走到真正执行。在哪一步首次失败，问题
通常就属于那一层。

---

### Reference

- [Mill Built-in Commands](https://mill-build.org/mill/cli/builtin-commands.html)
- [Mill Tasks](https://mill-build.org/mill/fundamentals/tasks.html)

