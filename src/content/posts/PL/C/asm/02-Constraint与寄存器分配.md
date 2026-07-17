---
title: "Constraint 与寄存器分配"
published: 2026-07-17
description: "理解 r、m、i、匹配约束、alternative 和 early-clobber 如何参与寄存器分配。"
tags: ["C", "Inline Assembly", "Constraint"]
category: "C"
draft: false
---

Constraint 不是对 assembler 的要求，而是 C compiler 与 asm template 之间的契约。
它告诉 register allocator 每个 operand 可以放在哪里、何时被读写、能否与其他 operand
重叠。

---

### 一、常用通用 constraint

| Constraint | 含义 |
| :--- | :--- |
| `r` | general-purpose register。 |
| `m` | memory operand，模板必须按 target memory syntax 使用它。 |
| `i` | compile-time immediate。 |
| `g` | register、memory 或 immediate 中的通用 operand。 |
| `0`、`1` | 与指定序号 operand 匹配。 |

constraint 应尽量描述 instruction 真正接受的范围。若 instruction 同时接受 register 和
memory，可写 `"rm"`，让编译器选择成本更低的形式。

不能因为某个 C expression 当前是常量，就用 `i` 接收任何调用者传入的值。`i` 要求该
次编译时确实可求值，否则会出现 `impossible constraint`。

---

### 二、`=`、`+` 与 `&`

| Modifier | 含义 |
| :--- | :--- |
| `=` | write-only output。 |
| `+` | read-write output。 |
| `&` | early-clobber output，在所有 input 使用完之前就可能被写。 |

编译器默认假设：所有 input 先被消费，然后才产生 output。因此它可以让 output 与一个
值相同的 input，甚至某些已经“死亡”的 input 共用 register。

多指令模板可能违背这个假设：

```c
asm("add %[tmp], %[a], %[b]\n\t"
    "xor %[dst], %[tmp], %[a]"
    : [tmp] "=&r"(tmp), [dst] "=r"(dst)
    : [a] "r"(a), [b] "r"(b));
```

第一条 instruction 已经覆盖 `tmp`，第二条才再次读取 `a`，所以 `tmp` 不能与 `a`
重叠。`=&r` 正是在表达这个事实。

clobber list 中写死一个临时 register 通常更差；early-clobber output 能让 allocator 自由
挑选任何可用 register。

---

### 三、Alternative constraint

逗号分隔 alternative，每个 operand 的 alternative 数量必须一致：

```c
asm("/* target-specific template */"
    : "=r,m"(out)
    : "r,m"(in));
```

这表示存在两套可行组合，而不是简单地允许任意交叉组合。实际项目中只有 instruction
确实具有多种 operand form 时才使用，避免为了“灵活”写出无法编码的组合。

---

### 四、RISC-V machine constraint

除通用 constraint 外，GCC RISC-V backend 还定义了：

| Constraint | RISC-V 含义 |
| :--- | :--- |
| `f` | floating-point register，目标支持时可用。 |
| `I` | I-type 12-bit signed immediate。 |
| `J` | integer zero。 |
| `K` | CSR instruction 的 5-bit unsigned immediate。 |
| `A` | address held in a general-purpose register。 |
| `S` | absolute symbolic address。 |
| `vr` | vector register。 |
| `vd` | 除 `v0` 外的 vector register。 |
| `vm` | `v0` vector register。 |

`K` 匹配的是 `csrrwi/csrrsi/csrrci` 的 5-bit `zimm`，不是 12-bit CSR address。

```c
#define csr_set_bits_imm(mask) \
  asm volatile("csrrsi zero, mstatus, %0" :: "K"(mask) : "memory")
```

调用参数必须是编译期常量且落在 0 到 31；若需要 runtime mask，应改用 register 形式
`csrrs zero, mstatus, reg`。

---

### 五、不要轻易绑死 register

优先写 `r`，由 compiler 根据周围代码选择 register。只有 instruction 或 ABI 明确要求
固定 register 时，才考虑 target-specific hard register constraint 或 register variable。
绑死 register 会增加 register pressure，也更容易与 calling convention 冲突。

### 参考

- [GCC: Constraints for asm Operands](https://gcc.gnu.org/onlinedocs/gcc/Constraints.html)
- [GCC: Machine Constraints](https://gcc.gnu.org/onlinedocs/gcc/Machine-Constraints.html)

