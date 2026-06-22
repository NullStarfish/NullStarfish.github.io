---
title: "makefile模式匹配"
description: "你提到的 OBJECTS = $(SOURCES:%.c=%.o) 属于 Makefile 中的 变量替换引用 (Substitution Reference)。"
topic: "编译工具"
tags:
  - "Linux"
  - "编译"
featured: false
draft: false
---
你提到的 `OBJECTS = $(SOURCES:%.c=%.o)` 属于 Makefile 中的 **变量替换引用 (Substitution Reference)**。

虽然它看起来像模式匹配，但它实际上是 Makefile 提供的一种**字符串替换简写**。为了让你彻底理解，我将 Makefile 中所有涉及 `%` 的“模式匹配”规则分为四大类进行详细汇总。


__注意，本章和shell中的%不同。shell更像是对字符串的裁剪__
[[参数扩展，字符串提取]]

---

### 一、 变量替换引用 (Substitution Reference)
**语法：** `$(变量名:模式=替换方案)`

这是你例子中的用法。它的作用是：遍历变量中的每一个字符串，如果匹配 `模式`，就将其替换为 `替换方案`。

*   **例子：**
    ```makefile
    SOURCES = main.c tool.c
    OBJECTS = $(SOURCES:%.c=%.o)
    # 结果：OBJECTS 变为 main.o tool.o
    ```
*   **规则细节：**
    *   `%` 代表任意长度的字符串（茎）。
    *   这本质上是 `$(patsubst %.c,%.o,$(SOURCES))` 的简写。
    *   如果不用 `%`，也可以写成 `$(SOURCES:.c=.o)`（这是老式的后缀替换，效果相同）。

---

### 二、 模式规则 (Pattern Rules)
**语法：** `目标模式 : 依赖模式`

这是最核心的用法，用于告诉 Make “如何将一类文件转换成另一类文件”。

*   **例子：**
    ```makefile
    # 只要看到 .o 文件，就去找同名的 .c 文件来编译它
    %.o: %.c
        $(CC) -c $< -o $@
    ```
*   **规则细节：**
    *   **推导机制**：当你要求 Make 生成 `foo.o` 时，它发现没有显式规则，但命中此模式，于是寻找 `foo.c`。
    *   **茎 (Stem)**：`%` 匹配的部分（本例中是 `foo`）会被提取出来，传递给依赖项。

---

### 三、 静态模式规则 (Static Pattern Rules)
**语法：** `目标列表 : 目标模式 : 依赖模式`

它是模式规则的“安全版”。普通的模式规则会应用到全项目，而静态模式只针对你指定的列表。

*   **例子：**
    ```makefile
    FILES = main.o display.o
    
    # 规则只对 FILES 里的文件生效
    $(FILES): %.o: %.c
        $(CC) -c $< -o $@
    ```
*   **为什么用它？**
    *   防止“误伤”：如果你有其他 `.o` 文件（比如从第三方库拷过来的），普通的 `%.o: %.c` 可能会尝试重新编译它们，而静态模式则限定了范围。

---

### 四、 模式处理函数 (Pattern Functions)
Makefile 内置了一些专门处理模式的函数，功能比简单的变量替换更强大。

#### 1. `patsubst` (Pattern Substitution)
**用法：** `$(patsubst 模式, 替换, 文本)`
*   **例子：** `$(patsubst %.c, %.o, main.c test.c)` -> `main.o test.o`
*   **优势**：可以处理更复杂的路径，比如 `$(patsubst src/%.c, obj/%.o, $(SOURCES))`。

#### 2. `wildcard` (查找文件)
**用法：** `$(wildcard 模式)`
*   **注意**：这里用的是 Shell 风格的通配符 `*`。
*   **例子：** `SOURCES = $(wildcard src/*.c)` -> 获取 src 目录下所有 .c 文件。

#### 3. `filter` / `filter-out` (过滤)
**用法：** `$(filter 模式, 文本)`
*   **例子：**
    ```makefile
    FILE_LIST = main.c main.h utils.c utils.h
    C_FILES = $(filter %.c, $(FILE_LIST))
    # 结果：C_FILES 变为 main.c utils.c
    ```

---

### 五、 关键符号对比：`%` vs `*`

很多初学者在这里摔跟头，请记住：

| 符号 | 名称 | 使用场景 | 含义 |
| :--- | :--- | :--- | :--- |
| **`%`** | **模式匹配符** | 目标、依赖定义、变量替换、patsubst 函数。 | 代表“由我推导出的那段字符串”。 |
| **`*`** | **通配符** | `wildcard` 函数、Shell 命令（如 `rm *.o`）。 | 代表“磁盘上现有的所有匹配文件”。 |

---

### 六、 综合实战：一个通用的 C 项目 Makefile 模板

结合以上所有规则，一个标准的 Makefile 通常长这样：

```makefile
# 1. 使用 wildcard 获取所有源文件
SRCS = $(wildcard src/*.c)

# 2. 使用变量替换引用，将 src/*.c 映射到 obj/*.o
OBJS = $(SRCS:src/%.c=obj/%.o)

TARGET = bin/app

# 链接
$(TARGET): $(OBJS)
	$(CC) $^ -o $@

# 3. 使用模式规则编译每个 .o
# 使用 @mkdir 确保输出目录存在
obj/%.o: src/%.c
	@mkdir -p obj
	$(CC) -c $< -o $@

clean:
	rm -rf obj bin
```

### 总结
你看到的 `$(SOURCES:%.c=%.o)` 仅仅是 **“字符串替换”** 的便捷语法。在 Makefile 中，`%` 就像一个占位符，它在左边匹配了什么“茎”，在右边就吐出什么“茎”。