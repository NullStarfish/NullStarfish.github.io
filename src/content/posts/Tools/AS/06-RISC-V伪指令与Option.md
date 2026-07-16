---
title: "GNU AS RISC-V 伪指令与 Option"
published: 2026-07-16
description: "理解 RISC-V GAS 中的伪指令、ISA 选择、PIC、relaxation、object attribute 和自定义指令编码。"
tags: ["AS", "RISC-V", "Pseudo Instruction"]
category: "AS"
draft: false
---
RISC-V assembly 中既有真实 ISA instruction，也有 assembler pseudoinstruction。伪指令
可能展开为一条或多条真实 instruction，并可能携带 relocation 交给 linker 继续处理。

---

### 一、常见伪指令

| 伪指令 | 典型含义 |
| :--- | :--- |
| `nop` | `addi x0, x0, 0` |
| `mv rd, rs` | `addi rd, rs, 0` |
| `not rd, rs` | `xori rd, rs, -1` |
| `neg rd, rs` | `sub rd, x0, rs` |
| `j label` | `jal x0, label` |
| `jr rs` | `jalr x0, 0(rs)` |
| `ret` | `jalr x0, 0(ra)` |
| `beqz rs, label` | `beq rs, x0, label` |
| `bnez rs, label` | `bne rs, x0, label` |

这些通常是一条真实 instruction 的别名。

---

### 二、可能展开为多条指令

```asm
li a0, 0x12345678
la a1, global_object
call function
tail function
```

- `li` 根据常量大小选择一条或多条 instruction。
- `la` 根据 PIC 模式和 symbol 类型生成 address materialization sequence。
- `call` 通常生成带 `R_RISCV_CALL` relocation 的 `auipc`/`jalr` sequence。
- `tail` 与 `call` 类似，但不保留返回地址。

Linker relaxation 可能继续把多指令 sequence 缩短。因此伪指令源代码不能直接代表
最终机器码。

---

### 三、`.option push` 与 `.option pop`

临时修改 assembler option 时应保存和恢复状态：

```asm
.option push
.option norelax
  la gp, __global_pointer$
.option pop
```

常见 option：

```asm
.option pic
.option nopic
.option relax
.option norelax
.option rvc
.option norvc
.option arch, +m
.option arch, rv32e
```

局部 `.option` 最好放在 `push/pop` 之间，避免无意影响文件后续代码。

---

### 四、ISA 与 ABI

命令行：

```bash
riscv64-linux-gnu-as -march=rv32e -mabi=ilp32e start.s
```

`-march` 决定允许哪些 instruction 和寄存器；`-mabi` 决定调用约定、寄存器使用和
object metadata。

RV32E 只有 `x0` 到 `x15`。即使某条 instruction 编码在基础 ISA 中存在，使用 `x16`
以上寄存器仍不符合 RVE。

---

### 五、Object Attribute

```asm
.attribute arch, "rv32e2p0"
.attribute Tag_RISCV_stack_align, 4
.attribute Tag_RISCV_unaligned_access, 0
```

这些 attribute 写入 `.riscv.attributes`，linker 可以据此发现不兼容的输入对象。通常
toolchain 会根据 `-march`、`-mabi` 自动生成，不应随意手写与实际代码不一致的值。

检查：

```bash
riscv64-linux-gnu-readelf -A file.o
```

---

### 六、`.insn` 与自定义编码

```asm
.insn r 0x33, 0, 0, a0, a1, a2
```

它按 RISC-V instruction format 生成编码。也可以指定完整数值：

```asm
.insn 4, 0x00c58533
```

相比：

```asm
.word 0x00c58533
```

`.insn` 明确告诉工具这是 instruction，未来的 disassembler、mapping symbol 和分析
工具能更正确地处理它。自定义 extension 应优先使用 `.insn`。

---

### 七、查看最终展开

```bash
riscv64-linux-gnu-as -march=rv32e -mabi=ilp32e -o test.o test.s
riscv64-linux-gnu-objdump -dr -M no-aliases test.o
```

`-M no-aliases` 尽量显示真实 instruction mnemonic，而不是再次显示成伪指令。

### 参考

- [GNU as RISC-V Directives](https://sourceware.org/binutils/docs/as/RISC_002dV_002dDirectives.html)
- [RISC-V Assembly Programmer's Manual](https://github.com/riscv-non-isa/riscv-asm-manual)

