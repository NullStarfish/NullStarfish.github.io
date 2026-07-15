---
title: "Makefile CommonFunctions"
published: 2026-01-01
description: "GNU Make 常用函数按照字符串、文件名、控制流、用户函数和调试用途分类速查。"
tags: ["Makefile", "Function"]
category: "Makefile"
draft: false
---
GNU Make 函数的基本调用形式是：

```makefile
$(FUNCTION ARGUMENTS)
```

函数名和第一个参数之间使用空格，后续参数通常使用逗号分隔。参数会在函数需要时
展开，因此逗号和参数两侧的空格都可能影响结果。

---

### 一、字符串与列表函数

| 函数 | 作用 | 示例 |
| :--- | :--- | :--- |
| `strip` | 清理首尾空白并压缩中间空白 | `$(strip  a   b )` -> `a b` |
| `subst` | 普通文本替换 | `$(subst .c,.o,a.c)` -> `a.o` |
| `patsubst` | 使用 `%` 对单词进行模式替换 | `$(patsubst %.c,%.o,a.c)` |
| `findstring` | 查找连续子串 | `$(findstring cpu,mycpu)` -> `cpu` |
| `filter` | 保留匹配模式的单词 | `$(filter %.c,a.c a.h)` -> `a.c` |
| `filter-out` | 删除匹配模式的单词 | `$(filter-out %.c,a.c a.h)` -> `a.h` |
| `sort` | 排序并去重 | `$(sort b a b)` -> `a b` |
| `words` | 返回单词数量 | `$(words a b c)` -> `3` |
| `word` | 返回第 N 个单词 | `$(word 2,a b c)` -> `b` |
| `wordlist` | 返回一段单词列表 | `$(wordlist 2,3,a b c d)` -> `b c` |
| `firstword` | 返回第一个单词 | `$(firstword a b)` -> `a` |
| `lastword` | 返回最后一个单词 | `$(lastword a b)` -> `b` |

---

### 二、文件名函数

```makefile
FILES := src/main.cpp lib/cache.a
```

| 函数 | 示例结果 |
| :--- | :--- |
| `$(dir $(FILES))` | `src/ lib/` |
| `$(notdir $(FILES))` | `main.cpp cache.a` |
| `$(suffix $(FILES))` | `.cpp .a` |
| `$(basename $(FILES))` | `src/main lib/cache` |
| `$(addsuffix .o,cpu mem)` | `cpu.o mem.o` |
| `$(addprefix build/,cpu.o mem.o)` | `build/cpu.o build/mem.o` |
| `$(join a b,c d)` | `ac bd` |
| `$(wildcard src/*.cpp)` | 返回磁盘上实际存在的匹配文件 |
| `$(abspath ../npc)` | 规范化后的绝对路径 |
| `$(realpath ../npc)` | 解析符号链接后的真实路径 |

`wildcard` 使用 `*`、`?` 等文件通配符；模式规则和 `patsubst` 使用 `%`。两者不是
同一套匹配机制。

---

### 三、条件与循环函数

```makefile
$(if CONDITION,THEN,ELSE)
$(and CONDITION1,CONDITION2,...)
$(or CONDITION1,CONDITION2,...)
$(foreach VAR,LIST,TEXT)
```

示例：

```makefile
BOARD_SUFFIX := $(if $(filter 1,$(BOARD)),-board,)
CC_SELECTED  := $(or $(CUSTOM_CC),$(CC),cc)
OBJECTS      := $(foreach name,cpu mem dut,build/$(name).o)
```

条件函数以空字符串为假，以非空字符串为真；字符串 `0` 仍然是真。

---

### 四、自定义函数 `call`

```makefile
reverse = $(2) $(1)
RESULT := $(call reverse,left,right)
# right left
```

调用期间：

- `$(0)` 是函数变量名。
- `$(1)`、`$(2)` 等是传入的参数。

更实用的路径映射：

```makefile
object-path = $(patsubst src/%.cpp,build/%.o,$(1))
OBJECTS := $(call object-path,$(SOURCES))
```

---

### 五、执行外部命令 `shell`

```makefile
GIT_HASH := $(shell git rev-parse --short HEAD)
HOSTNAME := $(shell hostname)
```

`shell` 在 Make 展开函数时启动子进程，并把输出中的换行转换为空格。它不是 recipe，
因此执行失败通常不会像 recipe 那样直接终止构建。

递归变量中的 `shell` 可能在每次引用时重复执行：

```makefile
SLOW = $(shell expensive-command)  # 每次展开 SLOW 都执行
FAST := $(shell expensive-command) # 定义时只执行一次
```

---

### 六、变量检查函数

```makefile
$(origin VARIABLE)
$(flavor VARIABLE)
$(value VARIABLE)
```

| 函数 | 用途 |
| :--- | :--- |
| `origin` | 查询变量来自文件、命令行、环境还是默认值。 |
| `flavor` | 查询变量是递归展开、立即展开还是未定义。 |
| `value` | 读取变量保存的原始文本，不展开其中的引用。 |

```makefile
TAG = $(TARGET)-debug

$(info expanded=$(TAG))
$(info raw=$(value TAG))
$(info origin=$(origin TAG))
$(info flavor=$(flavor TAG))
```

---

### 七、输出与错误函数

```makefile
$(info MESSAGE)
$(warning MESSAGE)
$(error MESSAGE)
```

- `info` 输出普通调试信息。
- `warning` 带 Makefile 位置输出警告，但继续解析。
- `error` 输出错误并立即停止。

```makefile
ifndef NEMU_HOME
$(error NEMU_HOME is not defined)
endif
```

---

### 八、`eval` 与 `value`

`eval` 将展开后的文本重新作为 Makefile 语法解析：

```makefile
define RULE_template
$(1): $(1).c
	$$(CC) $$< -o $$@
endef

$(eval $(call RULE_template,app))
```

`eval` 的参数会被展开一次，解析生成的 Makefile 时还会再次展开，因此 `$` 经常需要
写成 `$$`。它适合批量生成规则，但普通规则和模式规则通常更容易维护。

`value` 可以阻止一次展开，在处理模板和延迟展开时很有用：

```makefile
RAW_RULE := $(value RULE_template)
```

### 使用建议

1. 文件列表转换优先使用 `patsubst`、`filter`、`addprefix` 和 `addsuffix`。
2. 能用 Make 内置函数完成时，避免频繁调用 `shell`。
3. `eval` 只用于确实需要生成 Makefile 语法的场景。
4. 不确定变量行为时，用 `origin`、`flavor`、`value` 和 `info` 检查。
