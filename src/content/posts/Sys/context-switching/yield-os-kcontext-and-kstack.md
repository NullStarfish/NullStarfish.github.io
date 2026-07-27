---
title: "从 yield-os 推导 RISC-V 上下文切换与内核栈"
published: 2026-07-22
description: "从 AM yield-os 的代码出发，推导 kcontext、trap.S、进程栈与 Context 的内存布局，并解释初始 Context 为什么可以被覆盖。"
tags: ["Operating System", "Context Switch", "RISC-V", "Abstract Machine", "ysyx"]
category: "System"
draft: false
---

下面这段代码来自 `am-kernels/kernels/yield-os`。它创建两个共享地址空间的内核任务，
并通过协作式 `yield()` 在二者之间切换：

```c
#include <am.h>
#include <klib-macros.h>

#define STACK_SIZE (4096 * 8)

typedef union {
  uint8_t stack[STACK_SIZE];
  struct { Context *cp; };
} PCB;

static PCB pcb[2], pcb_boot, *current = &pcb_boot;

static void f(void *arg) {
  while (1) {
    putch("?AB"[(uintptr_t)arg > 2 ? 0 : (uintptr_t)arg]);
    for (int volatile i = 0; i < 100000; i++);
    yield();
  }
}

static Context *schedule(Event ev, Context *prev) {
  current->cp = prev;
  current = (current == &pcb[0] ? &pcb[1] : &pcb[0]);
  return current->cp;
}

int main() {
  cte_init(schedule);
  pcb[0].cp = kcontext(
      (Area) { pcb[0].stack, &pcb[0] + 1 }, f, (void *)1L);
  pcb[1].cp = kcontext(
      (Area) { pcb[1].stack, &pcb[1] + 1 }, f, (void *)2L);
  yield();
  panic("Should not reach here!");
}
```

这段小程序涉及两个容易混淆的问题：

1. 判断 `(uintptr_t)arg > 2` 对两个任务都为假，为什么仍会交替输出 `A` 和 `B`？
2. `Context` 已经保存了 GPR、CSR 和 `pdir`，为什么每个 PCB 还需要 32 KiB 的
   `stack`？`trap.S` 把 Context 压入栈时，会不会覆盖仍然存活的局部变量？

真正需要区分的是三种东西：CPU 的寄存器现场、进程的完整函数调用栈，以及只为第一次
启动而伪造的初始 Context。

---

## 一、`arg > 2` 为假，为什么输出仍然是 A/B

表达式为：

```c
"?AB"[(uintptr_t)arg > 2 ? 0 : (uintptr_t)arg]
```

三目运算符不是返回条件本身，而是根据条件选择两个结果之一：

```c
condition ? value_when_true : value_when_false
```

两个任务收到的参数分别是 `1` 和 `2`。它们确实都不大于 2，因此条件为假，但条件为假
时返回的是冒号右侧的 `(uintptr_t)arg`：

| `arg` | `arg > 2` | 三目表达式结果 | 输出字符 |
| ---: | :---: | ---: | :---: |
| 0 | false | 0 | `?` |
| 1 | false | 1 | `A` |
| 2 | false | 2 | `B` |
| 大于 2 | true | 0 | `?` |

所以两个任务实际执行的是：

```c
"?AB"[1]  // 'A'
"?AB"[2]  // 'B'
```

交替切换则由调度器决定：

```c
current = (current == &pcb[0] ? &pcb[1] : &pcb[0]);
```

输出哪个字符由 `arg` 决定，何时从一个任务换到另一个任务由 `schedule()` 决定。这是两套
互不依赖的逻辑。

---

## 二、Context 只是寄存器现场，不是完整运行栈

RISC-V AM 中的 Context 定义为：

```c
struct Context {
  uintptr_t gpr[NR_REGS], mcause, mstatus, mepc;
  void *pdir;
};
```

它描述任务暂停瞬间的 CPU 状态：

- GPR 保存整数寄存器；
- `mepc` 指出恢复后从哪条指令继续；
- `mstatus` 和 `mcause` 保存异常相关状态；
- `pdir` 用于记录地址空间。

但一个正在运行的 C 函数还可能拥有：

- 尚未返回的多层函数栈帧；
- 局部变量和局部数组；
- 保存的 `ra`、`s0` 等寄存器；
- 传给下层函数的栈参数；
- 编译器无法放进寄存器而 spill 到栈中的值。

这些数据不会全部装进 `Context`，而是留在任务自己的 `stack` 中。上下文切换不需要复制
整块栈；只要恢复 `sp`，原来的栈帧就会重新可见。

例如函数序言可能是：

```asm
addi sp, sp, -32
sw   ra, 28(sp)
sw   s0, 24(sp)
```

RISC-V 栈向低地址增长。函数先降低 `sp`，再通过 `sp + offset` 使用已经分配的栈帧。
因此在任意正常指令边界：

```text
当前 sp 以上：已经分配、仍然存活的栈帧
当前 sp 以下：尚未使用、可继续增长的栈空间
```

RISC-V ABI 没有允许函数随意使用 `sp` 以下空间的 red zone。这一点保证异常入口可以从
当前 `sp` 继续向低地址压入 Context。

---

## 三、trap.S 如何保存运行中的任务

NPC 的异常入口核心逻辑可以简化为：

```asm
__am_asm_trap:
  addi sp, sp, -CONTEXT_SIZE

  # 把 GPR、mcause、mstatus、mepc 保存到以 sp 为首地址的 Context
  ...

  mv   a0, sp
  jal  __am_irq_handle

  # handler 返回要恢复的 Context *
  mv   sp, a0

  # 恢复 CSR 和 GPR
  ...

  addi sp, sp, CONTEXT_SIZE
  mret
```

假设 p1 调用 `yield()` 前的内存布局如下：

```text
高地址
kstack.end
+----------------------------------+
| f() 较早建立的栈帧              |
| 局部变量 i、保存的 ra/s0 等      |
+----------------------------------+ <- yield 前的 sp
|                                  |
| 尚未使用的栈空间                 |
|                                  |
+----------------------------------+
kstack.start
低地址
```

异常入口首先执行：

```asm
addi sp, sp, -CONTEXT_SIZE
```

于是新的 Context 被分配在旧 `sp` 的低地址一侧：

```text
高地址
kstack.end
+----------------------------------+
| f() 的局部变量和活动栈帧        |
+----------------------------------+ <- yield 前的旧 sp
| 新压入的运行时 Context           |
+----------------------------------+ <- trap 后的新 sp
|                                  |
| 剩余空闲栈空间                   |
+----------------------------------+
kstack.start
低地址
```

二者的地址区间可以写成：

```text
活动函数栈帧： [旧 sp, kstack.end)
新 Context：   [旧 sp - CONTEXT_SIZE, 旧 sp)
```

两个区间首尾相接，但没有重叠。因此，正常情况下 trap.S 不会覆盖仍然存活的局部变量。

随后：

```asm
mv a0, sp
jal __am_irq_handle
```

把 Context 指针作为 `prev` 交给调度器：

```c
current->cp = prev;
```

于是 PCB 记住了该任务最新的寄存器现场。切换回 p1 时，调度器返回 `pcb[0].cp`，汇编将
它装入 `sp`，恢复寄存器，再执行：

```asm
addi sp, sp, CONTEXT_SIZE
```

`sp` 便精确回到 p1 调用 `yield()` 之前的位置。局部变量从未被复制；它们一直留在 p1
自己的栈内存中。p2 运行时使用 `pcb[1].stack`，不会占用 `pcb[0].stack`。

---

## 四、真正的疑问：kcontext 为什么偏偏放在 kstack.end

`kcontext()` 的实现是：

```c
Context *kcontext(Area kstack, void (*entry)(void *), void *arg) {
  Context *kctx = (Context *)(kstack.end - sizeof(Context));
  kctx->mepc = (uintptr_t)entry;
  kctx->gpr[10] = (uint32_t)arg;
  kctx->mstatus = 0x1800;
  return kctx;
}
```

第一眼看，它把 Context 放在最容易被向下增长的函数栈覆盖的位置：

```text
低地址
kstack.start
+----------------------------------+
|                                  |
|              空闲                |
|                                  |
+----------------------------------+
| kcontext 创建的初始 Context      | <- kctx
+----------------------------------+ <- kstack.end
高地址
```

这个观察没有错：任务开始执行后，函数栈帧确实可能覆盖这块初始 Context。

关键在于它本来就是一次性的。

刚创建的任务从未真正运行过，所以不存在一个可以由 `trap.S` 保存下来的历史现场。
`kcontext()` 的工作是人工构造一个“看起来像由 trap.S 保存出来”的 Context：

- 把 `mepc` 设置为入口函数 `f`；
- 把 `a0` 设置为入口参数 `arg`；
- 准备首次 `mret` 所需的 `mstatus`。

这样，调度器第一次返回 `pcb[0].cp` 时，统一的 trap 恢复路径就能启动这个新任务，而不必
另外写一套“首次启动任务”的汇编。

---

## 五、初始 Context 是怎样被消费的

第一次选择 p1 时，调度器返回 `kcontext()` 创建的指针。trap.S 执行：

```asm
mv sp, a0
```

此时：

```text
sp = kstack.end - sizeof(Context)
```

trap.S 从这块内存恢复 `a0`、`mepc`、`mstatus` 等内容，然后执行：

```asm
addi sp, sp, CONTEXT_SIZE
mret
```

若 `sizeof(Context)` 与汇编的 `CONTEXT_SIZE` 一致，则：

```text
sp = kstack.end
pc = f
a0 = arg
```

此时的布局是：

```text
低地址
kstack.start
+----------------------------------+
|              空闲                |
+----------------------------------+
| 已经被消费的初始 Context         | <- 内容仍在，但已经失效
+----------------------------------+ <- sp = kstack.end
高地址
```

它和普通函数 `pop` 后留下的旧字节一样：物理内容可能还在，但已经不属于任何有效对象，
后续栈操作可以合法覆盖它。

进入 `f()` 后，函数序言降低 `sp`，新的函数栈帧很可能正好占用初始 Context 原来的地址：

```text
低地址
kstack.start
+----------------------------------+
|              空闲                |
+----------------------------------+ <- f() 建栈帧后的 sp
| f() 的栈帧、局部变量             | <- 覆盖初始 Context，安全
+----------------------------------+ <- kstack.end
高地址
```

这不是 bug，而是栈空间的正常复用。初始 Context 的使命在第一次 `mret` 时已经完成。

当 p1 第一次真正调用 `yield()`，trap.S 会在当时的动态 `sp` 下方压入一个新的运行时
Context，随后调度器执行：

```c
pcb[0].cp = prev;
```

PCB 中原来指向初始 Context 的指针也被新的 Context 指针替换：

```text
创建 p1：       pcb[0].cp -> 初始 Context
第一次进入 p1： 初始 Context 被恢复路径消费
p1 执行 f()：   函数栈可以覆盖初始 Context
p1 首次 yield： pcb[0].cp -> 新的运行时 Context
```

因此必须区分：

```text
初始 Context：kcontext 人工构造，只负责第一次启动，允许随后被覆盖
运行时 Context：trap.S 根据当前 sp 压入，负责暂停和恢复正在运行的任务
```

---

## 六、为什么不能把初始 Context 放在 kstack.start

既然 `kstack.end` 附近最容易被函数栈覆盖，一个自然想法是：

```c
Context *kctx = (Context *)kstack.start;
```

但这不符合当前恢复协议。trap.S 总会在恢复后执行：

```asm
addi sp, sp, CONTEXT_SIZE
```

如果 Context 位于 `kstack.start`，第一次恢复后将得到：

```text
sp = kstack.start + sizeof(Context)
```

而 RISC-V 栈继续向低地址增长。`f()` 只需建立一个小栈帧，就会立刻向 `kstack.start`
靠近并很快越界：

```text
低地址
越界区域
+----------------------------------+ <- kstack.start
| 初始 Context                     |
+----------------------------------+ <- 恢复后的 sp
| 大量无法利用的剩余空间           |
+----------------------------------+ <- kstack.end
高地址
```

对向低地址增长的栈，新任务的初始 `sp` 必须是 `kstack.end`。当前统一恢复路径满足：

```text
恢复后的 sp = Context 地址 + CONTEXT_SIZE
```

所以应反推得到：

```text
Context 地址 = kstack.end - CONTEXT_SIZE
```

这正是 `kcontext()` 把初始 Context 放在栈顶下方的原因。

---

## 七、为什么 STACK_SIZE 是 4096 × 8

32 KiB 并不是单纯用来容纳一个 Context。

以 RV32E 为例，`NR_REGS = 16`，汇编定义：

```c
CONTEXT_SIZE = (NR_REGS + 3 + 1) * 4;
```

因此一个 Context 大约只有：

```text
(16 + 3 + 1) × 4 = 80 bytes
```

RV32I 使用 32 个整数寄存器，也大约只有：

```text
(32 + 3 + 1) × 4 = 144 bytes
```

`STACK_SIZE` 需要覆盖的却是：

```text
最大函数调用深度
+ 所有同时存活的栈帧
+ 局部变量和局部数组
+ 栈上传递的参数
+ 编译器产生的寄存器 spill
+ 异常 Context 与异常处理函数栈帧
+ 对齐和安全余量
```

因此 `4096 * 8` 更像一个保守的实验配置，而不是从 `sizeof(Context)` 精确推导出的数值。
对于当前简单的 `f()`，32 KiB 很可能远大于真实需求；它的好处是能容忍编译选项、库函数
实现和程序修改带来的额外栈消耗。

真正确定合适栈大小时，可以结合：

- 编译器生成的 `.su` 栈使用报告；
- 反汇编中的函数序言和调用关系；
- 在栈中填充固定 pattern 后测量 high-water mark；
- 栈底 guard page 或 canary；
- 最坏调用深度、递归、局部大数组和中断嵌套情况。

---

## 八、PCB 使用 union 的额外风险

PCB 被定义为：

```c
typedef union {
  uint8_t stack[STACK_SIZE];
  struct { Context *cp; };
} PCB;
```

因为它是 union，`cp` 与 `stack` 的最低地址共享内存：

```text
低地址
+----------------------------------+
| cp / stack[0..sizeof(cp)-1]      |
+----------------------------------+
| 可供任务使用的栈空间             |
|                     栈向下增长 ↓ |
+----------------------------------+ <- kstack.end
高地址
```

正常情况下，栈从高地址向下增长，但不会触及最底部的 `cp`。如果任务发生栈溢出，它可能先
覆盖自己的 `cp`，导致调度器取得损坏的 Context 指针。这种紧凑写法适合教学示例，却没有
提供栈溢出保护。

严格来说，可用栈底最好避开 PCB 元数据，例如把传给 `kcontext()` 的 `Area.start` 设置在
`cp` 之后，或者把 `cp` 与栈数组设计为不重叠的 struct 成员，并增加 canary 或 guard。

---

## 九、什么时候 Context 真的可能覆盖数据

前面的安全性依赖若干条件：

1. **没有栈溢出。** 如果当前 `sp` 已经靠近 `kstack.start`，继续压入 Context 或执行异常
   处理函数就会越界。
2. **遵守 RISC-V ABI。** 编译器不能把仍然有效的数据偷偷放在当前 `sp` 以下；RISC-V
   没有可供普通函数使用的 red zone。
3. **`sizeof(Context)` 与 `CONTEXT_SIZE` 一致。** C 结构体布局必须和 trap.S 的槽位、
   XLEN、寄存器数量完全匹配。
4. **每个任务使用独立栈。** 如果两个任务错误地共享同一栈区，切换后当然会互相覆盖。
5. **异常嵌套受控。** 每嵌套一层异常都会继续消耗栈空间，最坏情况必须计入容量预算。

如果把运行时 Context 每次都固定写到 `kstack.end - sizeof(Context)`，而不是从当前动态
`sp` 向下压入，那么它才会真正覆盖活动函数栈帧。当前 trap.S 并没有这样做。

---

## 十、完整时间线

把两个任务的生命周期串起来，过程如下。

### 1. main 创建任务

```text
pcb[0].cp -> pcb[0] 栈顶下方的初始 Context：pc=f, a0=1
pcb[1].cp -> pcb[1] 栈顶下方的初始 Context：pc=f, a0=2
```

### 2. main 调用 yield

trap.S 在 boot stack 上保存 main 的 Context：

```c
pcb_boot.cp = prev;
```

调度器选择 `pcb[0]` 并返回其初始 Context。

### 3. 第一次进入 p1

trap.S 消费 p1 的初始 Context：

```text
sp = pcb[0].stack.end
pc = f
a0 = 1
```

p1 输出 `A`。随后建立的函数栈帧可以覆盖已失效的初始 Context。

### 4. p1 调用 yield

trap.S 在 p1 当前 `sp` 下方压入新的运行时 Context：

```c
pcb[0].cp = prev;
```

调度器选择 p2。

### 5. 第一次进入 p2

p2 的初始 Context 同样被消费：

```text
sp = pcb[1].stack.end
pc = f
a0 = 2
```

p2 输出 `B`。

### 6. p2 调用 yield，恢复 p1

p2 保存自己的运行时 Context；调度器返回 `pcb[0].cp`。trap.S 恢复 p1 的 Context，
使 `sp`、GPR 和 `mepc` 回到 p1 上次 `yield()` 的现场。p1 的局部变量一直保留在
`pcb[0].stack` 中，因此能从原位置继续执行。

此后重复步骤 4～6，于是看到 `A`、`B` 交替输出。

---

## 总结

这段代码最重要的结论不是“Context 保存在栈上”，而是要区分 Context 的两个来源：

```text
kcontext 创建的初始 Context
  - 放在 kstack.end - sizeof(Context)
  - 用来伪造任务第一次启动所需的现场
  - 第一次恢复后即失效
  - 可以被后续函数栈帧覆盖

trap.S 创建的运行时 Context
  - 从任务当前动态 sp 向低地址压入
  - 位于活动函数栈帧下方
  - 保存任务暂停瞬间的寄存器状态
  - 不会覆盖仍然存活的局部变量
```

`Context` 保存的是 CPU 现场，`stack` 保存的是尚未结束的整个计算过程。任务切换时无需搬运
全部局部变量：只要每个任务拥有独立的栈，并正确保存和恢复 `sp`，原来的函数调用链就能
从暂停处继续运行。
