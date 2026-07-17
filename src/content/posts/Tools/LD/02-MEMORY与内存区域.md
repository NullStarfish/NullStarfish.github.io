---
title: "LD MEMORY 与内存区域"
published: 2026-07-16
description: "使用 MEMORY 描述 ROM、RAM 等物理地址区域，并将输出段约束到指定 region。"
tags: ["LD", "Linker Script", "Memory"]
category: "LD"
series: { name: "GNU LD 与链接脚本", order: 3 }
draft: false
---
`MEMORY` 用来描述目标机器可用的物理地址区域。它不会创建或初始化真实内存，只是
让链接器知道每块 region 的起点、长度和允许的 section 属性。

---

### 一、基本语法

```ld
MEMORY
{
  ROM (rx)  : ORIGIN = 0x30000000, LENGTH = 16M
  RAM (rwx) : ORIGIN = 0x80000000, LENGTH = 4M
}
```

每个 region 包含：

- 名称，例如 `ROM`、`RAM`。
- 属性，例如 `rwx`。
- `ORIGIN`：起始地址，也可写成 `org` 或 `o`。
- `LENGTH`：区域长度，也可写成 `len` 或 `l`。

长度支持 `K`、`M` 等后缀：

```ld
LENGTH = 128K
LENGTH = 16M
```

---

### 二、Region 属性

常见属性字符：

| 属性 | 含义 |
| :--- | :--- |
| `R` | Read-only section。 |
| `W` | Writable section。 |
| `X` | Executable section。 |
| `A` | Allocatable section。 |
| `I` / `L` | Initialized / loadable section。 |
| `!` | 反转后续属性判断。 |

属性主要用于没有显式 `>REGION` 的输出段选择。工程中最好仍然为关键输出段显式指定
region，避免依赖隐式分配。

---

### 三、将输出段放入 Region

```ld
SECTIONS
{
  .text : {
    *(.text .text.*)
  } > ROM

  .rodata : {
    *(.rodata .rodata.*)
  } > ROM

  .data : {
    *(.data .data.*)
  } > RAM

  .bss (NOLOAD) : {
    *(.bss .bss.*)
    *(COMMON)
  } > RAM
}
```

`> ROM` 表示输出段的 VMA 位于 ROM region。若某个输出段超过 region 边界，ld 会
报告 region overflow。

---

### 四、读取 Region 参数

脚本表达式可以使用：

```ld
ORIGIN(RAM)
LENGTH(RAM)
```

例如把栈顶放在 RAM 末尾：

```ld
_stack_top = ORIGIN(RAM) + LENGTH(RAM);
```

或者检查堆和栈是否还有空间：

```ld
ASSERT(_heap_end <= _stack_top, "RAM layout overlaps stack")
```

---

### 五、Region Alias

同一套 section 布局需要适配不同芯片时，可以使用 `REGION_ALIAS`：

```ld
REGION_ALIAS("REGION_TEXT", ROM);
REGION_ALIAS("REGION_DATA", RAM);

SECTIONS
{
  .text : { *(.text .text.*) } > REGION_TEXT
  .data : { *(.data .data.*) } > REGION_DATA
}
```

不同平台只需修改 alias 指向的实际 region。

---

### 六、常见误区

1. `MEMORY` 不会自动创建 `.text`、`.data` 或 `.bss`。
2. region 属性不是 CPU 页权限，也不会配置 PMP/MMU。
3. `LENGTH` 是可用容量，不是结束地址。
4. `>RAM` 只指定运行地址；初始化数据放在哪里，需要结合 `AT` 或 `AT>`。

最后一点涉及 VMA 和 LMA，将在 `05-VMA与LMA.md` 中单独说明。

### 参考

- [GNU ld MEMORY Command](https://sourceware.org/binutils/docs/ld/MEMORY.html)
