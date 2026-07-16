---
title: "GNU AS Section 与 Subsection"
published: 2026-07-16
description: "使用 .section、标准段、ELF flags、section type 和 section stack 组织目标文件。"
tags: ["AS", "ELF", "Section"]
category: "AS"
draft: false
---
Section 是 assembler 输出和 linker 输入的基本布局单位。同一 section 中的字节保持
相对顺序，linker 可以整体移动、合并或丢弃 section，但不会随意打乱内部内容。

---

### 一、标准 Section

```asm
.text
  /* executable code */

.data
  /* initialized writable data */

.bss
  /* zero-initialized storage */
```

这些 directive 切换当前 section。后续 instruction 和 data directive 都会写入当前
section，直到再次切换。

---

### 二、自定义 ELF Section

```asm
.section entry, "ax", @progbits
```

通用 ELF 语法：

```asm
.section name, "flags", @type
```

常见 flags：

| Flag | ELF 含义 |
| :--- | :--- |
| `a` | 运行时需要分配内存，`SHF_ALLOC`。 |
| `w` | 可写，`SHF_WRITE`。 |
| `x` | 可执行，`SHF_EXECINSTR`。 |
| `M` | 可合并，`SHF_MERGE`。 |
| `S` | 由零结尾字符串组成，`SHF_STRINGS`。 |
| `G` | section group。 |
| `T` | TLS section。 |
| `R` | GNU retain，防止 linker section GC。 |

常见 type：

- `@progbits`：section 在文件中包含实际字节。
- `@nobits`：只描述内存空间，不在文件中保存内容，典型例子是 `.bss`。
- `@note`：ELF note。
- `@init_array`、`@fini_array`：函数指针数组。

---

### 三、Section 名称是接口

```asm
.section .text.startup, "ax", @progbits
.section .rodata.table, "a", @progbits
.section .data.percpu, "aw", @progbits
```

这些名称会被 linker script pattern 匹配：

```ld
.text : {
  KEEP(*(.text.startup))
  *(.text .text.*)
}
```

如果汇编写的是 `entry`，脚本就必须匹配 `*(entry)`；`.text.entry` 与 `entry` 是两个
不同名称。

---

### 四、Subsection

```asm
.text 0
  /* subsection 0 */

.text 1
  /* subsection 1 */
```

或在 ELF 中：

```asm
.section .text
.subsection 1
```

Subsection 是 assembler 内部排序机制。写入 `.o` 时，同一 section 的 subsection 会按
编号排列并合并，linker 通常看不到独立 subsection。

---

### 五、Section Stack

临时切换 section 后返回：

```asm
.pushsection .rodata, "a", @progbits
message:
  .asciz "hello"
.popsection
```

其他相关 directive：

- `.previous`：返回前一个 section。
- `.pushsection`：把当前 section 压栈后切换。
- `.popsection`：恢复栈顶 section。

宏中生成常量表时，section stack 比手工假设调用者当前位于 `.text` 更安全。

---

### 六、检查输出

```bash
riscv64-linux-gnu-readelf -S start.o
riscv64-linux-gnu-objdump -h start.o
```

重点检查 section name、type、size、alignment 和 `W/A/X` flags。

### 参考

- [GNU as Sections and Relocation](https://sourceware.org/binutils/docs/as/Sections.html)
- [GNU as .section](https://sourceware.org/binutils/docs/as/Section.html)

