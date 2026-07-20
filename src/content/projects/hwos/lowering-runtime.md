---
title: "Lowering：从控制程序到可综合 RTL"
summary: "沿 ThreadIR、预分析、ThreadLayout 和 ThreadRuntimeLogic 追踪控制描述如何变成状态寄存器与组合逻辑。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "Lowering", "IR", "Chisel"]
entryType: chapter
parentProject: hwos
section: "模型与内核"
order: 30
navTitle: "Lowering 与运行时"
---

## 编译路径

HwOS 的 thread DSL 在 Chisel elaboration 期间构建内部控制表示。它不是在目标硬件上解释执行的虚拟机。完整路径可以分成收集、分析、布局和发射四步：

1. `ThreadCore` 调用 `ThreadDef.define`，收集 entry、Step、jump、wait 和 hijack。
2. `ThreadIR` 保存动作、边和符号 StepRef；PreLoweringAnalysis 检查结构并形成 compile plan。
3. `ThreadLayout` 为独立 Step 或 splice 后的控制段分配 cursor 编码，解析 `Next` 和命名引用。
4. `ThreadRuntimeLogic` 生成 cursor/stateReg、每个状态的动作、guard 与 next-state 选择。

```text
Scala control program
  → ThreadIR
  → pre-lowering analysis / edge patch
  → ThreadLayout
  → runtime allocation
  → Chisel mux/register logic
  → SystemVerilog
```

## `hijack` 的准确语义

`hijack(stepRef)` 是编译期 splice。它改变控制图展开和布局，不在运行时保存 continuation，也不是任意 jump。运行时 jump 由 cursor 的 next value 表达；hijack 则在分配 cursor 前改变哪些动作属于当前控制段。

这一约束很重要：若把 hijack 当作 runtime continuation，面积、时序和可重入性都会被错误推断。当前实现只承诺源码与 lowering 中实际存在的 splice 行为。

## 结构检查

PreLoweringAnalysis 和 ThreadDebugValidation 应在生成 RTL 前拒绝无法解析的引用、非法布局和不完整控制段。compile plan 保存 lowering 所需的稳定顺序，避免 Scala collection 遍历顺序影响状态编码。

## 生成物

生成目录包含顶层 SystemVerilog、filelist、地址表、符号文件和 verification layers。符号文件将 cursor 编码映射回 thread/Step 名称，使仿真器和 HwOSgdb 能以源级对象解释硬件状态。

## 限制

当前 lowering 不证明任意用户程序无死锁，也不自动优化为最小状态机。结构合法、协议正确和 PPA 优化是三个不同问题，必须分别验证。
