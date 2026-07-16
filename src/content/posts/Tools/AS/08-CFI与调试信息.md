---
title: "GNU AS CFI 与调试信息"
published: 2026-07-16
description: "使用 .cfi directive 描述手写汇编栈帧，使 debugger 和 unwinder 能恢复调用链。"
tags: ["AS", "DWARF", "CFI"]
category: "AS"
draft: false
---
手写汇编正确保存寄存器并不代表 debugger 能理解它。Call Frame Information，CFI，
用来描述每个位置如何找到上一层 stack frame、return address 和 saved register。

CFI 通常写入 `.eh_frame` 或 `.debug_frame`，不会生成 CPU 执行的普通 instruction。

---

### 一、最小函数

```asm
.text
.globl foo
.type foo, @function
foo:
  .cfi_startproc

  addi sp, sp, -16
  .cfi_def_cfa_offset 16

  sw ra, 12(sp)
  .cfi_offset ra, -4

  sw s0, 8(sp)
  .cfi_offset s0, -8

  addi s0, sp, 16
  .cfi_def_cfa s0, 0

  /* function body */

  lw ra, 12(sp)
  .cfi_restore ra
  lw s0, 8(sp)
  .cfi_restore s0

  addi sp, sp, 16
  .cfi_def_cfa sp, 0
  ret

  .cfi_endproc
.size foo, . - foo
```

---

### 二、CFA 是什么

Canonical Frame Address 通常表示调用者进入当前函数前的 stack pointer。

```asm
.cfi_def_cfa sp, 0
```

表示：

```text
CFA = sp + 0
```

执行 `addi sp, sp, -16` 后：

```asm
.cfi_def_cfa_offset 16
```

表示 CFA 仍是当前 `sp + 16`。

```asm
.cfi_offset ra, -4
```

表示旧 `ra` 存放在 `CFA - 4`。

---

### 三、常用 CFI Directive

| Directive | 作用 |
| :--- | :--- |
| `.cfi_startproc` | 开始描述一个函数。 |
| `.cfi_endproc` | 结束函数 CFI。 |
| `.cfi_def_cfa reg, off` | 重新定义 CFA。 |
| `.cfi_def_cfa_offset off` | 修改 CFA offset。 |
| `.cfi_def_cfa_register reg` | 修改 CFA base register。 |
| `.cfi_offset reg, off` | 指定旧寄存器保存于 CFA 相对位置。 |
| `.cfi_restore reg` | 恢复寄存器的默认 unwind rule。 |
| `.cfi_undefined reg` | 表示旧值无法恢复。 |
| `.cfi_remember_state` | 保存当前规则状态。 |
| `.cfi_restore_state` | 恢复之前保存的规则。 |
| `.cfi_signal_frame` | 标记 signal/trap trampoline。 |

---

### 四、`.file` 与 `.loc`

```asm
.file 1 "start.S"
.loc 1 10 0
  addi sp, sp, -16
```

它们建立机器指令到源文件行号的映射。通常 GCC 在 `-g` 编译汇编时会自动生成或管理
相关 DWARF 信息，纯手写 `.s` 时才需要直接控制。

---

### 五、启动代码是否需要 CFI

最早期 `_start` 可能还没有有效 stack，也没有正常调用者，因此不一定适合普通
`.cfi_startproc`。但 trap entry、context switch 和手写 leaf/non-leaf function 若要被
GDB 正确 backtrace，应提供与真实保存行为一致的 CFI。

错误 CFI 比没有 CFI 更危险，因为 debugger 会给出看似合理但错误的调用链。

---

### 六、检查 Unwind 信息

```bash
riscv64-linux-gnu-readelf --debug-dump=frames app.elf
riscv64-linux-gnu-readelf -S app.elf | grep -E 'eh_frame|debug_frame'
```

在 GDB 中：

```gdb
bt
info frame
```

### 参考

- [GNU as CFI Directives](https://sourceware.org/binutils/docs/as/CFI-directives.html)

