---
title: "LD SECTIONS 与输入段匹配"
published: 2026-07-16
description: "掌握输出段描述、输入文件与 section 通配、排序、KEEP、COMMON 和 DISCARD。"
tags: ["LD", "Linker Script", "Sections"]
category: "LD"
draft: false
---
`SECTIONS` 决定输入 section 如何合并为输出 section，以及输出 section 在地址空间中的
顺序和属性。它是链接脚本中最重要的部分。

---

### 一、输出段描述

常见形式：

```ld
section_name [address] [(type)] :
{
  input-section-commands
} [>region] [AT>load_region] [:phdr] [=fill]
```

例如：

```ld
.text ALIGN(4) : {
  *(.text .text.*)
} > ROM
```

`.text` 是输出段名，`*(.text .text.*)` 负责收集输入段，`>ROM` 指定运行区域。

---

### 二、文件名与段名匹配

```ld
*(.text)
*(.text .text.*)
startup.o(.text.entry)
libfoo.a:driver.o(.text*)
```

含义分别是：

- 所有文件中的 `.text`。
- 所有文件中的 `.text` 和 `.text.*`。
- 只选择 `startup.o` 中的 `.text.entry`。
- 只选择 `libfoo.a` 的 `driver.o` member 中匹配 `.text*` 的段。

通配符通常包括 `*`、`?` 和字符集合 `[...]`。

---

### 三、为什么要同时匹配 `.text` 和 `.text.*`

使用：

```bash
-ffunction-sections -fdata-sections
```

后，编译器可能为每个函数和对象生成独立输入段：

```text
.text.main
.text.uart_init
.data.global_counter
```

因此只写：

```ld
*(.text)
```

无法捕获 `.text.main`。通常应写：

```ld
*(.text .text.*)
*(.rodata .rodata.*)
*(.data .data.*)
*(.bss .bss.*)
```

---

### 四、排序

```ld
*(SORT_BY_NAME(.text.*))
*(SORT_BY_ALIGNMENT(.rodata.*))
```

常用排序器：

- `SORT_BY_NAME`：按 section 名称排序。
- `SORT_BY_ALIGNMENT`：按 alignment 排序。
- `SORT_BY_INIT_PRIORITY`：按初始化优先级排序，常用于 C++ constructor。

例如初始化数组：

```ld
.init_array : {
  PROVIDE_HIDDEN(__init_array_start = .);
  KEEP(*(SORT_BY_INIT_PRIORITY(.init_array.*)))
  KEEP(*(.init_array))
  PROVIDE_HIDDEN(__init_array_end = .);
}
```

---

### 五、`KEEP` 与 section GC

启用：

```bash
ld --gc-sections
```

后，不可达输入段会被删除。中断向量表、注册表、启动入口等段可能只被硬件或脚本
间接使用，需要显式保留：

```ld
.text : {
  KEEP(*(.text.entry))
  KEEP(*(.vectors))
  *(.text .text.*)
}
```

`KEEP` 只对 section GC 有意义，不负责改变段的位置。

---

### 六、BSS 与 COMMON

```ld
.bss (NOLOAD) : {
  _bss_start = .;
  *(.bss .bss.*)
  *(COMMON)
  _bss_end = .;
}
```

`COMMON` 用于接收 common symbol。现代 GCC 默认使用 `-fno-common`，但兼容旧目标
文件时仍常见这一项。

---

### 七、排除和丢弃

排除特定文件：

```ld
*(EXCLUDE_FILE(*debug.o) .text .text.*)
```

彻底丢弃指定输入段：

```ld
/DISCARD/ : {
  *(.comment)
  *(.note.GNU-stack)
}
```

不要随意丢弃 `.eh_frame`、`.init_array` 等运行时可能需要的段，应先确认软件环境不
依赖它们。

### 参考

- [GNU ld Input Section](https://sourceware.org/binutils/docs/ld/Input-Section.html)
- [GNU ld SECTIONS](https://sourceware.org/binutils/docs/ld/SECTIONS.html)

