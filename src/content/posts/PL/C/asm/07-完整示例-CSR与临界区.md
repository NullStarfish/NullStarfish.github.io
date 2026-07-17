---
title: "完整示例：RISC-V CSR 与临界区"
published: 2026-07-17
description: "将 CSR inline asm 封装成可复用接口，并分析 interrupt critical section 中的编译器与硬件语义。"
tags: ["C", "Inline Assembly", "CSR"]
category: "C"
draft: false
---

下面构建一个 M-mode local interrupt critical section。目标是保存 `mstatus`，清除 MIE，
执行临界区，最后恢复原值。

---

### 一、固定 CSR helper

```c
#include <stdint.h>

static inline uintptr_t mstatus_read(void) {
  uintptr_t value;
  asm volatile("csrr %0, mstatus" : "=r"(value));
  return value;
}

static inline void mstatus_write(uintptr_t value) {
  asm volatile("csrw mstatus, %0" :: "r"(value) : "memory");
}

static inline uintptr_t mstatus_read_clear(uintptr_t mask) {
  uintptr_t old;
  asm volatile("csrrc %0, mstatus, %1"
               : "=r"(old)
               : "r"(mask)
               : "memory");
  return old;
}
```

`uintptr_t` 与 XLEN 一致。read-only helper 没有 `"memory"`，因为它只采样 CSR；修改 MIE
的 helper 带 `"memory"`，防止 compiler 将临界区 memory access 移出边界。

---

### 二、进入和退出临界区

```c
enum { MSTATUS_MIE = 1u << 3 };

typedef uintptr_t irq_state_t;

static inline irq_state_t irq_save(void) {
  return mstatus_read_clear(MSTATUS_MIE);
}

static inline void irq_restore(irq_state_t state) {
  mstatus_write(state);
}
```

使用方式：

```c
irq_state_t state = irq_save();

shared_queue_head = shared_queue_head->next;

irq_restore(state);
```

保存并恢复整个 `mstatus` 只是教学用接口。真实 kernel 需要考虑：允许调用者修改哪些 bit、
nested critical section、current privilege、trap context，以及恢复整个 CSR 是否会覆盖期间
发生的合法状态变化。

---

### 三、为什么不是两个独立操作

错误写法可能先读再清：

```c
uintptr_t old = mstatus_read();
/* interrupt 可能在这里发生 */
clear_mie();
```

`csrrc` 在单条 instruction 中同时返回旧值并清除 bit，避免 read-modify-write 窗口。
inline asm 的价值在这里不是“比 C 快”，而是准确表达 ISA 提供的 atomic CSR operation。

---

### 四、Compiler barrier 与 hart 间同步

这里的 `"memory"` 只保证 compiler 不跨越 wrapper 移动普通 memory access。关闭当前 hart
的 local interrupt，也不自动构成多 hart lock，更不替代针对 device、DMA 或 shared-memory
protocol 所需的 RISC-V fence/atomic ordering。

因此必须分别回答：

1. 要阻止 compiler 做什么？由 operand 和 clobber 表达。
2. 要阻止 CPU/interconnect 做什么？由 ISA fence、atomic acquire/release 表达。
3. 要阻止哪个并发参与者？interrupt、other hart、device 和 DMA 的机制不同。

---

### 五、检查生成代码

```bash
riscv64-linux-gnu-gcc \
  -march=rv32im_zicsr -mabi=ilp32 \
  -O2 -ffreestanding -S critical.c -o critical.s
```

预期关键路径包含 `csrrc` 和 `csrw`，临界区内的 C memory access 位于两者之间。不能只在
`-O0` 下检查，因为那时大量额外 load/store 会掩盖 constraint 问题。

### 参考

- [GCC: Extended Asm](https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html)
- [RISC-V Privileged Architecture](https://github.com/riscv/riscv-isa-manual)

