---
title: "GNU AS 源文件语法与 Label"
published: 2026-07-16
description: "理解 GAS statement、instruction、directive、label、局部符号、数字标签和表达式。"
tags: ["AS", "Assembly", "Symbol"]
category: "AS"
draft: false
---
GAS 源文件由 statement 组成。每条 statement 通常在换行处结束，其形式可以是：

```asm
label:      instruction operands
label:      .directive arguments
            instruction operands
```

如果关键字以 `.` 开头，它通常是 assembler directive；如果以 instruction mnemonic
开头，它会编码成机器指令。

---

### 一、Instruction、Directive 和 Label

```asm
start:                  # label
  addi sp, sp, -16      # instruction
  .word 0x12345678      # directive
```

- Instruction 生成指令编码或伪指令展开。
- Directive 控制 assembler，可能生成数据，也可能只修改 ELF metadata。
- Label 定义一个 symbol，其值是当前 section 中的位置。

```asm
foo:
bar:
  nop
```

`foo` 和 `bar` 可以指向同一地址。

---

### 二、注释和语句分隔

RISC-V GAS 使用 `#` 开始行注释：

```asm
addi a0, a0, 1  # increment a0
```

分号可以在同一行分隔 statement：

```asm
li a0, 1; li a1, 2
```

在 `.S` 文件中，行首 `#` 还可能由 C preprocessor 解释。复杂条件应明确使用 CPP
directive，普通注释推荐写在 instruction 后方或使用 `/* ... */`。

---

### 三、普通符号与局部符号

```asm
.globl public_function
public_function:
  j .Ldone

.Ldone:
  ret
```

以 `.L` 开头的符号通常被视为局部临时符号，linker 默认不会把它们保留在最终 symbol
table 中。它们适合函数内部的 branch target。

普通 label 默认也是 local binding，只是名称通常会保留在 `.o` symbol table 中。
`.globl` 才会把 binding 改为 global。

---

### 四、数字局部标签

```asm
1:
  beq a0, zero, 2f
  addi a0, a0, -1
  j 1b
2:
```

- `1b`：向后寻找最近的 `1:`。
- `1f`：向前寻找最近的 `1:`。

同一个数字 label 可以在文件中重复出现，适合短小的局部控制流。跨越较长代码时应
使用有意义的 `.Lname`，避免维护困难。

---

### 五、特殊符号 `.`

在 assembler 表达式中，`.` 表示当前 section 的 location counter：

```asm
function:
  nop
  ret
.size function, . - function
```

`. - function` 得到从 `function` 到当前位置的字节数。

---

### 六、常量与表达式

```asm
.equ STACK_SIZE, 4096
.equ STACK_WORDS, STACK_SIZE / 4

.word 1 + 2
.word 1 << 8
.word end - start
```

表达式可以包含 integer、symbol 和运算符。但两个尚未最终定位的外部 symbol 通常不
能任意相减；assembler 能否求值取决于它们是否位于已知的同一 section，以及目标
格式是否支持相应 relocation。

---

### 七、RISC-V 寄存器名

GAS 同时支持编号名和 ABI 名：

```text
x0  = zero
x1  = ra
x2  = sp
x8  = s0/fp
x10 = a0
```

RV32E 只有 `x0` 到 `x15`。使用 `s2`、`a6` 等寄存器会在 `-march=rv32e` 下报错。

### 参考

- [GNU as Statements](https://sourceware.org/binutils/docs/as/Statements.html)
- [GNU as Symbols](https://sourceware.org/binutils/docs/as/Symbols.html)
- [GNU as Expressions](https://sourceware.org/binutils/docs/as/Expressions.html)

