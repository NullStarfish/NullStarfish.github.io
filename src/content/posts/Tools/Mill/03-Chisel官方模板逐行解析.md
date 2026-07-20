---
title: "Chisel 官方 build.mill 模板逐行解析"
published: 2026-07-20
description: "解析 Chisel Mill 1.x 模板中的版本锁定、SbtModule、插件依赖、编译参数和 ScalaTest。"
tags: ["Mill", "Chisel", "ScalaTest"]
category: "Mill"
series: { name: "Mill 1.x 构建工具", order: 4 }
draft: false
---

下面按职责拆解本地 `~/chisel-template/build.mill`。模板使用 Mill 1.1.2 和 Chisel
7.7.0；版本会继续变化，因此具体数字应以项目文件为准。

---

### 一、锁定 Mill 版本

```scala
//| mill-version: 1.1.2
```

`//|` 开头的是 build header，不是普通的无效注释。它让 Mill launcher 为项目选择指定
版本，使 CI 和本地开发者使用一致的构建 API。

项目还要求 `.mill-jvm-opts`：

```text
-Dchisel.project.root=${PWD}
```

它在启动 Mill JVM 时设置系统属性。`${PWD}` 会由 header/JVM opts 机制展开。这是 JVM
级配置，不应写进某个普通 task 内。

---

### 二、声明模块

```scala
package build

import mill.*
import mill.scalalib.*

object myproject extends SbtModule {
  def scalaVersion = "2.13.18"
  def chiselVersion = "7.7.0"

  def moduleDir = super.moduleDir / os.up
}
```

`SbtModule` 是 Mill 提供的 Scala 模块类型，它采用接近 sbt/Maven 的目录布局，例如
`src/main/scala` 和 `src/test/scala`。由于模块对象位于构建根的逻辑子路径，模板将
`moduleDir` 上移一层，使源码仍从项目根目录寻找。

对象名决定命令前缀：

```bash
mill myproject.compile
mill myproject.test
```

模板中的 `%NAME%` 是生成项目时需要替换的占位符，不是特殊 Mill 语法。

---

### 三、编译参数

```scala
override def scalacOptions = Seq(
  "-language:reflectiveCalls",
  "-deprecation",
  "-feature",
  "-Xcheckinit",
  "-Ymacro-annotations",
)
```

- `reflectiveCalls`：允许结构类型相关的反射调用。
- `deprecation`、`feature`：显示弃用和特性警告。
- `Xcheckinit`：帮助发现字段初始化顺序问题。
- `Ymacro-annotations`：Scala 2 宏注解支持。

这些是传给 Scala 编译器的参数，不是 Mill 自身选项。

---

### 四、Chisel 库与编译器插件

```scala
override def mvnDeps = Seq(
  mvn"org.chipsalliance::chisel:$chiselVersion",
)

override def scalacPluginMvnDeps = Seq(
  mvn"org.chipsalliance:::chisel-plugin:$chiselVersion",
)
```

Chisel 主库进入普通编译 classpath；`chisel-plugin` 则进入 Scala 编译器插件列表。两者
职责不同，不能把插件仅仅放入 `mvnDeps`。插件通常还要求与完整 Scala 编译器版本匹配，
因此使用三个冒号。

---

### 五、测试子模块

```scala
object test extends SbtTests with TestModule.ScalaTest {
  override def mvnDeps = Seq(
    mvn"org.scalatest::scalatest::3.2.19"
  )
}
```

`test` 嵌套在主模块内，因此测试命令是 `myproject.test`。它会使用主模块的编译产物，
同时增加 ScalaTest 依赖和测试框架适配。

常用验证命令：

```bash
mill resolve myproject._
mill show myproject.sources
mill myproject.compile
mill myproject.test
```

---

### Reference

- [Mill Build Header](https://mill-build.org/mill/cli/build-header.html)
- [Mill Scala Module](https://mill-build.org/mill/scalalib/module-config.html)
- [Chisel Template](https://github.com/chipsalliance/chisel-template)


