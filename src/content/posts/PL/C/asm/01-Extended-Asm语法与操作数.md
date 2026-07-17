---
title: "Extended asm 语法与操作数"
published: 2026-07-17
description: "掌握 extended asm 的五段结构、命名操作数、输入输出和读写操作数。"
tags: ["C", "Inline Assembly", "Operand"]
category: "C"
series: { name: "C 与 RISC-V 内联汇编", order: 2 }
draft: false
---

GNU extended asm 的完整形态是：

```c
asm qualifiers (
  "AssemblerTemplate"
  : OutputOperands
  : InputOperands
  : Clobbers
  : GotoLabels
);
```

普通 extended asm 没有最后的 label 部分；只有 `asm goto` 使用五段形式。某一段为空时，
分隔它的冒号仍然要保留。

---

### 一、汇编模板

多条指令通常写成相邻字符串：

```c
asm("add  %[dst], %[lhs], %[rhs]\n\t"
    "xori %[dst], %[dst], 1"
    : [dst] "=r"(result)
    : [lhs] "r"(a), [rhs] "r"(b));
```

`\n` 换行，`\t` 便于生成的 `.s` 阅读。C 编译器拼接相邻 string literal 后，再把
`%[dst]` 替换为实际寄存器或 operand syntax。

模板中的 `%0`、`%1` 按 operand 顺序编号：先列全部 output，再列 input。修改列表容易
使编号错位，因此较长的 asm 应使用 `%[name]`。

`%%` 表示传给 assembler 的单个 `%`。这在 x86 register name 中常见；RISC-V register
通常不带 `%`。

---

### 二、Output operand

格式为：

```c
[name] "constraint"(C_lvalue)
```

`=` 表示只写：

```c
uint32_t value;
asm("csrr %[out], cycle" : [out] "=r"(value));
```

编译器认为旧 `value` 不会被 asm 读取。output expression 必须是可写的 lvalue。

`+` 表示先读后写：

```c
uint32_t increment(uint32_t value) {
  asm("addi %[x], %[x], 1" : [x] "+r"(value));
  return value;
}
```

不要把读写 operand 错写为 `=r`。否则编译器没有义务把原值放进分配的 register。

---

### 三、Input operand

Input 可以是一般 C expression：

```c
asm("sll %[dst], %[src], %[shamt]"
    : [dst] "=r"(result)
    : [src] "r"(value), [shamt] "r"(shift));
```

模板不得偷偷修改 input-only operand。若指令会覆盖它，应改成 `+` output，或者把它与
单独 output 绑定。

编译器不会解析 instruction 来检查 C type 是否合理。宽度、signedness、alignment 和
instruction operand class 都由作者负责。

---

### 四、匹配操作数

数字 constraint 可以要求 input 与某个 output 使用同一位置：

```c
uint32_t result;
asm("addi %0, %1, 7"
    : "=r"(result)
    : "0"(source));
```

`"0"(source)` 表示 input 必须与 output 0 位于同一 register。对这个例子，直接使用
`+r` 临时变量往往更清晰；匹配 constraint 更适合输入和输出是不同 C expression，但
instruction 要求它们共用 operand 的情况。

---

### 五、多个输出

```c
static inline void divrem_u32(uint32_t a, uint32_t b,
                              uint32_t *q, uint32_t *r) {
  uint32_t quotient, remainder;
  asm("divu %[q], %[a], %[b]\n\t"
      "remu %[r], %[a], %[b]"
      : [q] "=&r"(quotient), [r] "=&r"(remainder)
      : [a] "r"(a), [b] "r"(b));
  *q = quotient;
  *r = remainder;
}
```

这里使用 early-clobber，防止第一个 output 与后面仍要读取的 input 重叠。`&` 的完整
原因将在约束一章展开。

### 参考

- [GCC: Extended Asm](https://gcc.gnu.org/onlinedocs/gcc/Extended-Asm.html)
