---
title: "Makefile Loop"
description: "Makefile 中常见的循环包括 foreach 文本展开、Shell recipe 循环和递归调用子目录 Makefile。"
topic: "Makefile"
tags:
  - "Makefile"
  - "Loop"
featured: false
draft: false
---
Makefile 没有通用的 `for` 或 `while` 语句。根据需求不同，循环通常由三种机制完成：

1. `foreach`：在 Make 展开变量时遍历单词列表。
2. Shell 循环：在 recipe 执行命令时循环。
3. 递归 Make：进入多个子目录分别执行 Makefile。

---

### 一、`foreach` 函数

语法：

```makefile
$(foreach VAR,LIST,TEXT)
```

Make 会依次把 `LIST` 中的每个单词赋给临时变量 `VAR`，展开 `TEXT`，最后用空格
连接所有结果：

```makefile
MODULES := cpu memory dut
SOURCES := $(foreach module,$(MODULES),src/$(module).cpp)

# src/cpu.cpp src/memory.cpp src/dut.cpp
```

`foreach` 本质是文本生成，不会自动执行其中出现的命令：

```makefile
INCLUDES := $(foreach dir,$(INCLUDE_DIRS),-I$(dir))
```

---

### 二、在 `foreach` 中调用函数

```makefile
MODULES := core cache memory
UPPER_NAMES := $(foreach module,$(MODULES),$(shell echo $(module) | tr a-z A-Z))
```

不过频繁调用 `shell` 会启动大量子进程，构建性能较差。文件名映射通常应该优先
使用 `addprefix`、`addsuffix` 或 `patsubst`：

```makefile
OBJECTS := $(addprefix build/,$(addsuffix .o,$(MODULES)))
```

---

### 三、Recipe 中的 Shell `for`

需要实际执行多条命令时，使用 Shell 循环：

```makefile
show-modules:
	@for module in $(MODULES); do \
		echo "module=$$module"; \
	done
```

这里有两个重要细节：

1. `$$module` 经过 Make 展开后才会成为 Shell 看到的 `$module`。
2. 行尾 `\` 保证整个循环交给同一个 Shell，否则 `do` 和 `done` 会被拆开执行。

`while` 循环同理：

```makefile
count:
	@i=1; while [ $$i -le 3 ]; do \
		echo $$i; \
		i=$$((i + 1)); \
	done
```

---

### 四、不要用循环代替依赖图

下面的写法可以工作，但 Make 无法了解每个子任务的依赖，也难以并行：

```makefile
bad-build:
	@for src in $(SOURCES); do \
		$(CC) -c $$src; \
	done
```

更好的方式是生成目标列表并使用模式规则：

```makefile
OBJECTS := $(SOURCES:%.cpp=build/%.o)

app: $(OBJECTS)
	$(CXX) $^ -o $@

build/%.o: %.cpp
	@mkdir -p $(@D)
	$(CXX) -c $< -o $@
```

这样 `make -j` 可以并行编译，时间戳也能正确控制增量构建。

---

### 五、递归调用子目录 Makefile

```makefile
SUBDIRS := core runtime tools

.PHONY: all $(SUBDIRS)
all: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) -C $@
```

必须使用 `$(MAKE)`，不要直接写 `make`。GNU Make 会为 `$(MAKE)` 正确传递 jobserver、
命令行变量和并行构建参数。

如果子目录之间存在依赖，应显式表达：

```makefile
runtime: core
tools: core
```

---

### 六、用 `call`、`foreach` 和 `eval` 批量生成规则

```makefile
PROGRAMS := add mul div

define PROGRAM_template
build/$(1): src/$(1).c
	$$(CC) $$< -o $$@
endef

$(foreach program,$(PROGRAMS),\
  $(eval $(call PROGRAM_template,$(program))))
```

这会生成三条规则。`eval` 的参数会经历两次展开，所以模板中的自动变量要写成
`$$@`、`$$<`，第一次展开后保留给生成的 recipe。

`eval` 很强，但会增加阅读难度。普通模式规则能够表达需求时，应优先使用模式规则。

### 选择原则

| 需求 | 推荐方式 |
| :--- | :--- |
| 将文件名列表映射成另一组文本 | `foreach` 或 `patsubst` |
| 执行一串动态 Shell 命令 | recipe 中的 `for` / `while` |
| 编译一组相似文件 | 目标列表加模式规则 |
| 构建多个子项目 | `$(MAKE) -C` |
| 批量生成结构相似的规则 | `define` + `call` + `eval` |
