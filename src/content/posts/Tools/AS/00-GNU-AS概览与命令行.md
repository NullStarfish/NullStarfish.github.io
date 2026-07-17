---
title: "GNU AS 概览与命令行"
published: 2026-07-16
description: "理解 GNU assembler 在工具链中的位置、输入输出、.s 与 .S 的差异，以及 RISC-V 常用汇编参数。"
tags: ["AS", "Assembler", "RISC-V"]
category: "AS"
series: { name: "GNU AS 汇编器", order: 1 }
draft: false
---
GNU `as`，通常称为 GAS，是 GNU Binutils 中的 assembler。它读取汇编源文件，将
instruction、data directive、symbol 和 relocation 信息编码为可重定位目标文件。

```text
source.c
   -> compiler
assembly.s
   -> assembler
object.o
   -> linker
executable.elf
```

Assembler 通常还不知道最终运行地址。遇到跨 section 或外部 symbol 时，它会在 `.o`
中留下 relocation，由 linker 在最终布局确定后处理。

---

### 一、直接调用 GNU as

```bash
riscv64-linux-gnu-as \
  -march=rv32e \
  -mabi=ilp32e \
  -g \
  -o start.o start.s
```

常见参数：

| 参数 | 作用 |
| :--- | :--- |
| `-o FILE` | 指定输出 `.o`。 |
| `-march=ISA` | 指定 RISC-V ISA 和 extension，例如 `rv32e`、`rv32im_zicsr`。 |
| `-mabi=ABI` | 指定 ABI，例如 `ilp32e`、`ilp32`、`lp64`。 |
| `-g` | 生成调试信息。 |
| `-I DIR` | 添加 `.include` 文件搜索路径。 |
| `-alh=FILE` | 生成带源码和机器码的 assembly listing。 |
| `--fatal-warnings` | 将 assembler warning 当作 error。 |
| `--no-relax` | 关闭 RISC-V relaxation。 |

查看目标工具支持的参数：

```bash
riscv64-linux-gnu-as --version
riscv64-linux-gnu-as --help
riscv64-linux-gnu-as --target-help
```

---

### 二、通过 GCC driver 汇编

更常见的方式是让 GCC 调用 assembler：

```bash
riscv64-linux-gnu-gcc \
  -march=rv32e -mabi=ilp32e \
  -g -c start.S -o start.o
```

GCC 会把 `-march`、`-mabi` 等参数传递给 assembler，并保持整个工具链的 ABI 配置
一致。

只运行预处理和编译、查看最终交给 assembler 的文本：

```bash
riscv64-linux-gnu-gcc -E start.S -o start.i
riscv64-linux-gnu-gcc -S main.c -o main.s
```

查看 GCC 实际调用了哪些程序：

```bash
riscv64-linux-gnu-gcc -v -c start.S
```

---

### 三、`.s` 与 `.S`

| 后缀 | GCC 行为 |
| :--- | :--- |
| `.s` | 直接交给 assembler，不经过 C preprocessor。 |
| `.S` | 先经过 C preprocessor，再交给 assembler。 |

大写 `.S` 可以使用：

```asm
#include "platform.h"

#ifdef CONFIG_RVE
  /* RV32E-specific code */
#endif
```

但 `#` 同时可能是汇编注释或 preprocessor 标记。使用 `.S` 时，宏替换发生在 GAS
读取文件之前，必须区分 CPP macro 和 GAS `.macro`。

---

### 四、Assembler 的输出不只是机器码

`.o` 中通常包含：

- 多个 section，例如 `.text`、`.data`、`.bss`。
- symbol table。
- relocation table。
- RISC-V object attribute。
- 可选 DWARF debug section。

检查输出：

```bash
riscv64-linux-gnu-readelf -h -S -s -r -A start.o
riscv64-linux-gnu-objdump -dr start.o
```

---

### 五、手册入口

```bash
info as
man as
```

`man as` 主要介绍命令行；directive、symbol 和 target-specific syntax 的完整内容应查
`info as` 或在线手册。

### 参考

- [GNU assembler 官方手册](https://sourceware.org/binutils/docs/as.html)
- [GNU as RISC-V Dependent Features](https://sourceware.org/binutils/docs/as/RISC_002dV_002dDependent.html)
