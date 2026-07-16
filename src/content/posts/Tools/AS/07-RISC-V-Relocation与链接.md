---
title: "GNU AS RISC-V Relocation 与链接"
published: 2026-07-16
description: "理解 assembler 为什么留下 relocation，以及 RISC-V HI20/LO12、PC-relative、CALL 和 relaxation 如何配合 linker。"
tags: ["AS", "RISC-V", "Relocation"]
category: "AS"
draft: false
---
Assembler 只能确定当前 `.o` 内部部分地址。外部 symbol、跨 section 地址和最终内存
布局通常要等 linker 决定，因此 GAS 会在目标文件中生成 relocation record。

---

### 一、绝对地址的 HI20/LO12

```asm
lui  a0, %hi(symbol)
addi a0, a0, %lo(symbol)
```

典型 relocation：

```text
R_RISCV_HI20
R_RISCV_LO12_I
```

Linker 根据 `symbol` 最终地址填写两条 instruction。高低部分不是简单机械切片；工具链
会处理低 12-bit 作为 signed immediate 时产生的进位。

Store 使用 S-type low relocation：

```asm
lui a0, %hi(symbol)
sw  a1, %lo(symbol)(a0)
```

对应 `R_RISCV_LO12_S`。

---

### 二、PC-relative 地址

```asm
.Laddr_hi:
  auipc a0, %pcrel_hi(symbol)
  addi  a0, a0, %pcrel_lo(.Laddr_hi)
```

注意 `%pcrel_lo` 引用的是标记 `auipc` 的 local label，而不是再次直接引用 `symbol`。
这样 linker 才能把 LO12 relocation 与正确的 HI20 relocation 配对。

通常应直接使用：

```asm
la a0, symbol
lla a0, local_symbol
```

让 assembler 选择正确 sequence。

---

### 三、函数调用

```asm
call function
```

在 `.o` 中通常表现为 `auipc` + `jalr`，并带有 `R_RISCV_CALL` 或
`R_RISCV_CALL_PLT` relocation。Linker 发现目标足够近时，可能 relax 成一条 `jal`。

```asm
tail function
```

同样生成远调用 sequence，但目标寄存器是 `x0`，不写入返回地址。

---

### 四、Linker Relaxation

RISC-V 工具链可以把通用但较长的 sequence 优化为更短形式，例如：

- `auipc + jalr` 缩短为 `jal`。
- address materialization 缩短为 GP-relative access。
- 某些 instruction 缩短为 compressed instruction。

控制：

```asm
.option push
.option norelax
  la gp, __global_pointer$
.option pop
```

初始化 `gp` 时必须防止 linker 把这条 `la` 自己 relax 成依赖尚未初始化的 GP-relative
sequence。

全局关闭：

```bash
riscv64-linux-gnu-as --no-relax ...
riscv64-linux-gnu-ld --no-relax ...
```

---

### 五、Assembler 与 Linker 的职责边界

Assembler 负责：

- 验证 instruction operand 和 ISA extension。
- 生成初始 instruction/data bytes。
- 建立 section 和 symbol table。
- 为未知最终值生成 relocation。

Linker 负责：

- 解析跨 `.o` symbol。
- 决定 output section 和最终地址。
- 应用 relocation。
- 执行 relaxation 和 section GC。

因此 `.section` 只定义输入 section，不能代替 linker script 指定最终 VMA。

---

### 六、观察 Relocation

```bash
riscv64-linux-gnu-readelf -rW file.o
riscv64-linux-gnu-objdump -dr file.o
```

链接后再次检查：

```bash
riscv64-linux-gnu-objdump -dr app.elf
riscv64-linux-gnu-readelf -rW app.elf
```

静态 executable 的大部分 relocation 应已经被应用；PIC、动态链接或保留 relocation 的
输出可能仍有 relocation section。

### 参考

- [GNU as RISC-V Modifiers](https://sourceware.org/binutils/docs/as/RISC_002dV_002dModifiers.html)
- [GNU ld RISC-V](https://sourceware.org/binutils/docs/ld/RISC_002dV.html)

