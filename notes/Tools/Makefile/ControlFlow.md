---
title: "Makefile ControlFlow"
description: "Makefile 的控制流分为解析阶段的条件指令、展开阶段的函数，以及执行阶段的 Shell 控制语句。"
topic: "Makefile"
tags:
  - "Makefile"
  - "Control Flow"
featured: false
draft: false
---
Makefile 中存在三个不同的执行阶段：

1. **解析阶段**：Make 读取变量、规则、`include` 和条件指令。
2. **展开阶段**：Make 展开变量与函数，建立目标依赖图。
3. **执行阶段**：Make 将需要执行的 recipe 交给 Shell。

理解代码属于哪个阶段，是理解 Makefile 控制流的关键。

---

### 一、`ifeq` 与 `ifneq`

条件指令在解析阶段决定一段 Makefile 是否存在：

```makefile
SIM_TARGET ?= npc

ifeq ($(SIM_TARGET),npc)
TOP_MODULE := NpcTop
else ifeq ($(SIM_TARGET),ysyxsoc)
TOP_MODULE := ysyxSoCFull
else
$(error unsupported SIM_TARGET: $(SIM_TARGET))
endif
```

也可以使用带引号的形式：

```makefile
ifeq "$(BOARD)" "1"
CPPFLAGS += -DCONFIG_BOARD
endif
```

引号不是值的一部分，只负责让条件的边界更明显。

---

### 二、`ifdef` 与 `ifndef`

```makefile
ifdef NEMU_HOME
DIFF_SO := $(NEMU_HOME)/build/riscv32-nemu-interpreter-so
endif

ifndef NEMU_HOME
$(warning difftest path is unavailable)
endif
```

`ifdef` 检查变量展开后是否非空。它不能区分“没有定义”和“定义为空”；需要这种
区别时使用 `$(origin VARIABLE)`。

---

### 三、函数式分支

`if` 函数可以出现在变量值内部：

```makefile
SIM_BUILD_TAG := $(SIM_TARGET)$(if $(filter 1,$(BOARD)),-board,)
```

一般形式：

```makefile
$(if CONDITION,THEN,ELSE)
```

条件展开为空是假，非空是真。`and` 和 `or` 可以组合多个条件：

```makefile
ENABLE_DEBUG := $(and $(filter npc,$(SIM_TARGET)),$(filter 1,$(DEBUG)))
TOOLCHAIN    := $(or $(CROSS_COMPILE),riscv64-linux-gnu-)
```

函数式分支适合短表达式；较大的配置块使用 `ifeq` 更容易阅读。

---

### 四、条件变量赋值

`?=` 只在变量尚未定义时赋值：

```makefile
SIM_TARGET ?= npc
BOARD ?= 0
```

用户可以从命令行覆盖：

```bash
make SIM_TARGET=ysyxsoc BOARD=1
```

目标专属变量只对指定目标及其依赖生效：

```makefile
rundiff: CXXFLAGS += -DCONFIG_DIFFTEST
rundiff: npc
	./npc --diff=$(DIFF_SO) $(IMG)
```

模式专属变量则对匹配的目标生效：

```makefile
build/debug/%.o: CXXFLAGS += -O0 -g
```

---

### 五、控制 Makefile 的加载

```makefile
include mk/config.mk
-include .config
```

`include` 文件不存在时会报错；`-include` 会忽略不存在的文件，常用于自动生成的
`.d` 依赖文件和可选配置。

根据配置选择文件：

```makefile
ifeq ($(SIM_TARGET),npc)
include mk/npc.mk
else
include mk/soc.mk
endif
```

---

### 六、目标之间的执行顺序

Make 的核心控制流不是从上到下，而是依赖图：

```makefile
all: app

app: main.o cpu.o
	$(CC) $^ -o $@

main.o: main.c
cpu.o: cpu.c
```

执行 `make all` 时，Make 会递归更新 `app` 的依赖。没有依赖关系的目标在并行构建
时可能同时执行，不能依赖规则在文件中的书写顺序。

仅用于排序、不参与目标新旧判断的依赖称为 order-only prerequisite：

```makefile
build/main.o: main.c | build
	$(CC) -c $< -o $@

build:
	mkdir -p $@
```

---

### 七、Recipe 中的 Shell 控制流

Recipe 中的 `if`、`case` 等属于 Shell，不属于 Make：

```makefile
run:
	@if [ "$(BOARD)" = "1" ]; then \
		echo "run with board"; \
	else \
		echo "run simulator"; \
	fi
```

`\` 将多行连接成同一个 Shell 逻辑行。Shell 变量必须写成 `$$name`，因为 Make
会先把 `$$` 转换为一个 `$`。

### 选择原则

| 场景 | 使用方式 |
| :--- | :--- |
| 决定是否加载规则或源码 | `ifeq`、`ifdef`、`include` |
| 在一个变量值中选择文本 | `if`、`and`、`or` |
| 为特定目标增加参数 | target-specific variable |
| 表达构建先后关系 | prerequisites |
| 根据命令运行结果分支 | Shell 的 `if` / `case` |
