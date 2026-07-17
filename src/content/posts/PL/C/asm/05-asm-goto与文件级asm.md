---
title: "asm goto、Basic asm 与文件级 asm"
published: 2026-07-17
description: "理解内联汇编中的控制流出口，以及 basic asm、top-level asm 和 naked function 的边界。"
tags: ["C", "Inline Assembly", "Control Flow"]
category: "C"
series: { name: "C 与 RISC-V 内联汇编", order: 6 }
draft: false
---

普通 extended asm 被 compiler 当作从上到下执行的一条 opaque operation。若汇编可能跳到
C label，必须使用 `asm goto` 明确列出所有控制流出口。

---

### 一、`asm goto`

```c
bool is_zero(uint32_t value) {
  asm goto("beqz %[value], %l[zero]"
           :
           : [value] "r"(value)
           :
           : zero);
  return false;

zero:
  return true;
}
```

`%l[zero]` 引用 goto label。最后一段的 `zero` 告诉 compiler 这段 asm 可能跳转到该 C
label，因此 control-flow graph、寄存器活跃性和优化才能保持正确。

`asm goto` 被隐式视为 volatile。compiler 同时假设它可以 fall through；若模板绝不会
fall through，应在 asm 后使用合适的 unreachable 表达，但前提是所有实际路径都已正确
声明。

带 output 的 `asm goto` 在较新的 GCC 和 Clang 中可用，但历史版本语义存在差异。为了
可移植性，应优先使用 symbolic operand 和 feature/version 检查。

---

### 二、为什么不能普通 asm 直接跳 C label

```c
/* 错误思路：compiler 不知道这里存在另一条控制流边。 */
asm volatile("beqz a0, somewhere");
```

即使 assembler 和 linker 能找到 `somewhere`，compiler 仍可能认为某些变量在该路径上
已经初始化，或把目标 basic block 删除、复制和重排。汇编可链接不代表 C abstract
machine 层面的控制流正确。

---

### 三、Basic asm

```c
asm("nop");
```

basic asm 没有 operand 和 clobber，compiler 看不到模板读写了哪些 register 或 memory。
因此它不适合函数中与 C local variable 混合。固定 register name 还可能破坏 compiler
正在维护的 live value。

它主要用于不依赖 C register allocation 的场景，例如文件级 directive，或 compiler
文档明确要求 basic asm 的特殊 function。

---

### 四、文件级 asm

```c
__asm__(
  ".section .rodata\n"
  ".globl build_marker\n"
  "build_marker:\n"
  ".asciz \"npc\"\n"
  ".previous\n"
);
```

top-level extended asm 受到严格限制，不能像函数内部一样自由使用 register operand、
clobber 和 qualifier。较长的 function、复杂 `.cfi`、条件汇编和 section layout 更适合
独立 `.S` 文件。

---

### 五、Naked function

部分 target 支持 `__attribute__((naked))`，compiler 不生成常规 prologue/epilogue。GCC
要求 naked function 中只安全使用 basic asm；普通 C statement 和 extended asm 可能
依赖尚未建立的 stack frame 或 register state。

此属性高度 target-specific。trap entry、context switch 等代码通常放入 `.S`，能更清楚
地控制 ABI、CFI 和 symbol size。

### 参考

- [GCC: Goto Labels](https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html)
- [Clang Language Extensions: asm goto](https://clang.llvm.org/docs/LanguageExtensions.html#asm-goto-with-output-constraints)
