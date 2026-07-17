---
title: "volatile、Clobber 与内存顺序"
published: 2026-07-17
description: "区分 asm volatile、memory clobber、compiler barrier 和 CPU fence，并正确声明副作用。"
tags: ["C", "Inline Assembly", "Memory Ordering"]
category: "C"
series: { name: "C 与 RISC-V 内联汇编", order: 4 }
draft: false
---

内联汇编中最常见的错误，是把 `volatile`、`"memory"` 和 hardware fence 当成同一件事。
它们约束的是不同层次。

---

### 一、`asm volatile`

```c
asm volatile("nop");
```

`volatile` 告诉 compiler：即使 output 未被 C 代码使用，这段 asm 仍有不可删除的副作用。
它适用于 CSR 写入、MMIO、fence 和 timing-sensitive instruction。

但 `volatile` 不等于：

- 周围普通 memory access 不能被 compiler 重排。
- asm 一定与相邻 asm 保持紧邻。
- CPU 或总线不会重排 memory transaction。

若 asm 只有纯计算 output，通常不应加 `volatile`。允许 compiler 删除或移动它，反而能
产生更好的代码。

---

### 二、普通 register clobber

若模板修改了未列作 output 的 register，必须写入 clobber list：

```c
asm volatile("/* modifies t0 */" ::: "t0");
```

compiler 不会把 live value 分配到 clobbered register。更推荐把 scratch register 建模成
early-clobber output，让 allocator 自己选：

```c
uintptr_t tmp;
asm volatile("..." : [tmp] "=&r"(tmp) : ...);
```

不要列出 stack pointer。asm 前后 stack pointer 必须保持 compiler 预期的值。

`"cc"` 表示 condition-code register 被修改，常见于 x86、ARM 等有 flags 的架构。
RISC-V integer instruction 没有统一 condition-code register，通常不需要它。

---

### 三、`"memory"` clobber

```c
asm volatile("" ::: "memory");
```

这是 compiler barrier。它告诉 optimizer：asm 可能读取或写入未在 operand 中明确列出的
memory，因此 asm 两侧的 memory value 不能仅凭寄存器缓存或随意跨越。

它不会生成 RISC-V `fence`，也不会直接阻止 CPU、cache 或 interconnect 重排访问。

空模板加 `"memory"` 只构成 compiler barrier：

```c
static inline void compiler_barrier(void) {
  asm volatile("" ::: "memory");
}
```

---

### 四、Hardware fence

需要 RISC-V hardware memory ordering 时，应实际发出 `fence`：

```c
static inline void fence_rw_rw(void) {
  asm volatile("fence rw, rw" ::: "memory");
}
```

这里同时有两层作用：

- 模板中的 `fence rw, rw` 约束 hardware observable memory order。
- `"memory"` 防止 compiler 把 C memory access 越过这条 instruction。

只有其中任意一个，都不能完整表达这段 C wrapper 想要的顺序。

`fence.i` 负责 instruction-fetch 与先前写入 instruction memory 的同步，其使用条件还受
执行环境、hart 间同步方式和 RISC-V `Zifencei` 规范约束。

---

### 五、精确 memory operand 优于全局屏障

如果 asm 只访问一个已知 C object，应把 object 列为 `m` operand，而不是一律使用
`"memory"` 让 compiler 忘掉所有 memory knowledge：

```c
static inline uint32_t load_word(const uint32_t *p) {
  uint32_t value;
  asm("lw %[v], %[mem]"
      : [v] "=r"(value)
      : [mem] "m"(*p));
  return value;
}
```

模板中的 memory operand syntax 依赖 target。对于 MMIO 或访问范围无法准确列举的 asm，
`volatile` 与 `"memory"` 往往仍然必要。

### 参考

- [GCC: Volatile and Clobbers](https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html)
- [RISC-V ISA Manual](https://github.com/riscv/riscv-isa-manual)
