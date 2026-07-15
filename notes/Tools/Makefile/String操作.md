---
title: "Makefile String操作"
description: "Makefile 变量本质上保存文本，内置字符串函数大多把文本视为空格分隔的单词列表。"
topic: "Makefile"
tags:
  - "Makefile"
  - "String"
featured: false
draft: false
---
Makefile 变量本质上保存的是**文本**。GNU Make 的大多数字符串函数会进一步把文本
视为由空白分隔的“单词列表”，因此它更擅长处理文件名列表，而不是任意字符序列。

---

### 一、字符串拼接

Make 没有 `+` 拼接运算符，直接把文本和变量引用写在一起即可：

```makefile
SIM_TARGET := npc
SUFFIX := -debug
BUILD_TAG := $(SIM_TARGET)$(SUFFIX)
# npc-debug
```

在列表前后批量添加字符串：

```makefile
NAMES := cpu memory dut
HEADERS := $(addsuffix .h,$(NAMES))
OBJECTS := $(addprefix build/,$(addsuffix .o,$(NAMES)))
```

结果为：

```text
cpu.h memory.h dut.h
build/cpu.o build/memory.o build/dut.o
```

---

### 二、去除多余空白

`strip` 会删除首尾空白，并把中间连续空白压缩成一个空格：

```makefile
RAW :=    npc      ysyxsoc
TARGETS := $(strip $(RAW))
# npc ysyxsoc
```

Makefile 中缩进和函数参数附近的空格有时也会进入变量值，进行字符串判断前使用
`strip` 通常更稳。

---

### 三、普通替换与模式替换

`subst` 进行纯文本替换：

```makefile
$(subst FROM,TO,TEXT)

NAME := npc-debug
RELEASE_NAME := $(subst -debug,-release,$(NAME))
```

`patsubst` 按空格遍历单词，并使用 `%` 匹配“茎”：

```makefile
SOURCES := main.cpp cpu.cpp memory.cpp
OBJECTS := $(patsubst %.cpp,build/%.o,$(SOURCES))
```

变量替换引用是常见简写：

```makefile
OBJECTS := $(SOURCES:%.cpp=build/%.o)
```

模式规则的完整用法参见 [[makefile模式匹配]]。

---

### 四、查找与过滤

```makefile
FILES := main.cpp cpu.cpp cpu.h README.md

CPP_FILES := $(filter %.cpp,$(FILES))
NON_CPP   := $(filter-out %.cpp,$(FILES))
HAS_CPU   := $(findstring cpu.cpp,$(FILES))
```

结果：

```text
CPP_FILES = main.cpp cpu.cpp
NON_CPP   = cpu.h README.md
HAS_CPU   = cpu.cpp
```

`findstring` 在第二个参数中查找连续子串；找到时返回第一个参数，否则返回空字符串。
`filter` 则按单词和 `%` 模式匹配。

---

### 五、单词列表操作

```makefile
FILES := a.cpp b.cpp c.cpp b.cpp

COUNT  := $(words $(FILES))       # 4
FIRST  := $(firstword $(FILES))   # a.cpp
LAST   := $(lastword $(FILES))    # b.cpp
SECOND := $(word 2,$(FILES))      # b.cpp
PART   := $(wordlist 2,3,$(FILES))# b.cpp c.cpp
UNIQUE := $(sort $(FILES))        # a.cpp b.cpp c.cpp
```

`sort` 不仅排序，还会删除重复单词。GNU Make 没有只去重且保留原顺序的简单内置
函数，需要自行定义函数或交给外部工具。

---

### 六、路径和后缀操作

```makefile
FILES := src/core/main.cpp lib/cache.a

DIRS     := $(dir $(FILES))
NAMES    := $(notdir $(FILES))
SUFFIXES := $(suffix $(FILES))
BASES    := $(basename $(FILES))
```

结果：

```text
DIRS     = src/core/ lib/
NAMES    = main.cpp cache.a
SUFFIXES = .cpp .a
BASES    = src/core/main lib/cache
```

路径规范化函数：

```makefile
ABS  := $(abspath ../npc)
REAL := $(realpath ../npc)
```

`abspath` 只进行文本层面的绝对路径规范化；`realpath` 还会访问文件系统并解析符号
链接，不存在的路径会得到空字符串。

---

### 七、特殊字符

函数参数使用逗号分隔，如果要把逗号当作数据，可以先定义：

```makefile
comma := ,
empty :=
space := $(empty) $(empty)

PAIR := left$(comma)right
```

字面量 `$` 写成 `$$`。尤其是在 recipe 中引用 Shell 变量时：

```makefile
show:
	@name=npc; echo $$name
```

Make 不适合处理包含空格的文件名，因为绝大多数函数天然按空格分词。

### 常用函数速查

| 目的 | 函数 |
| :--- | :--- |
| 拼接前后缀 | `addprefix`、`addsuffix` |
| 普通文本替换 | `subst` |
| `%` 模式替换 | `patsubst` |
| 清理空白 | `strip` |
| 查找子串 | `findstring` |
| 过滤列表 | `filter`、`filter-out` |
| 获取列表元素 | `word`、`wordlist`、`firstword`、`lastword` |
| 排序并去重 | `sort` |
| 路径拆分 | `dir`、`notdir`、`suffix`、`basename` |
