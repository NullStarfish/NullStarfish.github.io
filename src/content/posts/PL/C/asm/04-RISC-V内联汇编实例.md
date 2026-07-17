---
title: "RISC-V 内联汇编实例"
published: 2026-07-17
description: "通过 CSR、cycle counter、fence、MMIO 和原子交换实例练习 RISC-V inline asm。"
tags: ["C", "Inline Assembly", "RISC-V"]
category: "C"
draft: false
---

本章示例采用 GNU extended asm。编译时必须启用对应 ISA extension，例如 CSR instruction
通常需要 `zicsr`，atomic instruction 需要 `a`。

---

### 一、读取 CSR

```c
#include <stdint.h>

static inline uintptr_t read_mstatus(void) {
  uintptr_t value;
  asm volatile("csrr %[value], mstatus"
               : [value] "=r"(value));
  return value;
}
```

`mstatus` 写在 template 中，是 assembler 认识的 CSR name。output 使用 XLEN 宽度的
`uintptr_t`。

用宏生成多个固定 CSR wrapper：

```c
#define read_csr(csr) ({                    \
  uintptr_t __value;                        \
  asm volatile("csrr %0, " #csr            \
               : "=r"(__value));           \
  __value;                                  \
})

uintptr_t cause = read_csr(mcause);
```

statement expression `({ ... })` 和 inline asm 一样属于 GNU extension。

---

### 二、交换 CSR

```c
static inline uintptr_t swap_mstatus(uintptr_t value) {
  uintptr_t old;
  asm volatile("csrrw %[old], mstatus, %[new]"
               : [old] "=r"(old)
               : [new] "r"(value)
               : "memory");
  return old;
}
```

这里的 `"memory"` 是 wrapper 的软件语义选择：修改 interrupt/status state 时，通常不希望
compiler 把临界区内的 memory access 移到边界外。它不是 `csrrw` instruction 自动要求的
固定写法。

---

### 三、读取 cycle counter

```c
static inline uint32_t read_cycle32(void) {
  uint32_t value;
  asm volatile("rdcycle %0" : "=r"(value));
  return value;
}
```

RV32 上读取完整 64-bit counter 不能简单地先读低位再读高位，否则低位溢出时会得到撕裂
值。应使用 high-low-high retry：

```c
static inline uint64_t read_cycle64(void) {
  uint32_t hi0, lo, hi1;
  do {
    asm volatile("rdcycleh %0" : "=r"(hi0));
    asm volatile("rdcycle  %0" : "=r"(lo));
    asm volatile("rdcycleh %0" : "=r"(hi1));
  } while (hi0 != hi1);
  return ((uint64_t)hi1 << 32) | lo;
}
```

counter 是否允许当前 privilege mode 读取，由对应 CSR 配置和执行环境决定。

---

### 四、MMIO load/store

普通设备寄存器优先使用 volatile-qualified C pointer：

```c
static inline void mmio_write32(uintptr_t addr, uint32_t value) {
  *(volatile uint32_t *)addr = value;
}
```

必须显式控制 instruction 时可写：

```c
static inline void mmio_write32_asm(uintptr_t addr, uint32_t value) {
  asm volatile("sw %[value], 0(%[addr])"
               :
               : [value] "r"(value), [addr] "r"(addr)
               : "memory");
}
```

`volatile` 保留这次 asm，`"memory"` 告诉 compiler 它具有 memory side effect。设备要求的
访问顺序仍可能需要额外 `fence`。

---

### 五、Atomic swap

```c
static inline uint32_t atomic_swap_u32(volatile uint32_t *p,
                                       uint32_t value) {
  uint32_t old;
  asm volatile("amoswap.w.aqrl %[old], %[value], (%[addr])"
               : [old] "=r"(old)
               : [value] "r"(value), [addr] "r"(p)
               : "memory");
  return old;
}
```

此例要求 A extension。实际同步代码优先使用 C11 `<stdatomic.h>`；compiler builtin 能根据
memory order 和 target 正确选择 instruction，并让 sanitizer 理解同步关系。

### 参考

- [GCC: RISC-V Machine Constraints](https://gcc.gnu.org/onlinedocs/gcc/Machine-Constraints.html)
- [RISC-V Assembly Programmer's Manual](https://github.com/riscv-non-isa/riscv-asm-manual)

