---
title: "HwOS：把硬件事务写成具有时序语义的 API"
summary: "基于 Chisel/Scala 的实验性 RTL 构建框架：用 thread 承载控制流，用 timing-semantic API 封装握手、阻塞与提交。"
published: 2026-02-20
updated: 2026-07-20
status: active
featured: true
draft: false
tags: ["HwOS", "Chisel", "RTL", "Hardware DSL", "EDA", "Research"]
image: "/projects/hwos/timing-semantic-api.png"
repository: "https://github.com/NullStarfish/HwOS"
entryType: project
navTitle: "HwOS"
---

## 项目概览

HwOS 是一个 transaction-oriented RTL construction framework。它用 `HardwareThread`、`Step` 和 timing-semantic API 表达多周期硬件事务，再将控制程序 lower 为寄存器、组合逻辑和状态机。

框架不在硬件上运行软件操作系统，也不隐藏 RTL 时序。它解决的是协议调用在多个模块中重复展开的问题：请求何时发起、何时阻塞、握手由谁持有、结果在哪里提交，都由 API 契约集中定义。

![Timing-semantic API 将调用接口与协议实现分离](/projects/hwos/timing-semantic-api.png)

*Timing-semantic API：调用侧表达事务，组件侧实现握手、阻塞和提交。*

## 技术文档树

1. [问题模型：为什么时序属于 API](/projects/hwos/problem-model/)
2. [执行模型：Process、Thread、Step 与 Context](/projects/hwos/execution-model/)
3. [Lowering：从控制程序到 RTL](/projects/hwos/lowering-runtime/)
4. [Timing-Semantic API：调用契约与后端策略](/projects/hwos/timing-semantic-api/)
5. [组件案例：AXI Read、Regfile 与 CPU prototypes](/projects/hwos/library-cases/)
6. [验证与调试：verification layers 与 HwOSgdb](/projects/hwos/verification-debugging/)
7. [研究演进：preprint、tech report、OSCAR 与当前实现](/projects/hwos/research-evolution/)
8. [限制与评估计划](/projects/hwos/limitations/)

## 执行模型

```text
Process / Hardware component
            │
       HardwareThread
            │
      ThreadDef / Step
            │
   ThreadIR + analysis
            │
 ThreadLayout / RuntimeLogic
            │
       Chisel / RTL
```

`ThreadDef` 定义控制程序，`Step` 表示可保持的控制位置，`waitCondition` 让当前 Step 持续驱动输出直到条件成立，`jump` 与 call/return 构造控制转移。`hijack` 在编译阶段拼接控制片段，不是运行时跳转。

## 实现矩阵

| 子系统 | 实现 |
| --- | --- |
| Kernel | `KernelAddressSpace`、code/state/export 表 |
| Thread | `HardwareThread`、`ThreadCore`、`ThreadDef`、`Step/StepRef` |
| Lowering | `ThreadIR`、预分析、`ThreadLayout`、`RuntimeLogic` |
| Control | `jump`、`waitCondition`、compile-time `hijack`、structured control |
| Library | AXI4 read、regfile、mutex、semaphore、waitgroup |
| Prototypes | fetch、decode、arithmetic、load 和 path services |
| Verification | assert/assume/cover layers、symbols、address tables |
| Debug | DPI-C monitor、ncurses HwOSgdb |

## Timing-semantic API

普通函数接口只描述值的输入和输出；硬件事务还需要定义调用期间的信号所有权、反压行为和提交边界。以 AXI read 为例：

```scala
def axi_read(bus: Axi4ReadOnly, addr: UInt): HwInline[UInt] =
  HwInline.thread("axi_read") { t =>
    t.Step("IssueAddr") {
      bus.ar.valid := true.B
      bus.ar.addr := addr
      t.waitCondition(bus.ar.ready)
    }
    t.Step("WaitData") {
      bus.r.ready := true.B
      t.waitCondition(bus.r.valid)
      SysCall.Return(bus.r.bits.data)
    }
  }
```

调用侧只发起一次事务；地址通道、数据通道和返回值提交由组件实现。Regfile API 采用相同结构，将 reservation、forwarding、ordered publication 和仲裁策略放在稳定调用接口之后。

## 生成物

```text
generated/
├─ TopModule.sv
├─ state / code / binding / export / dependency tables
├─ hwos.symbols
└─ assertion / assumption / cover layers
```

符号表把生成后的状态地址映射回 thread、Step 和调用关系。DPI-C monitor 与 HwOSgdb 使用这些映射显示周期、活动线程、当前 Step 和完成状态。

## 适用范围

HwOS 当前用于研究事务级控制抽象、协议封装、后端策略替换和语义级调试。CPU-oriented prototypes 用于覆盖反压、仲裁、依赖和提交组合，不作为高性能处理器实现。

当前限制包括 API 与 lowering 仍在演进、组合事务的死锁性质尚无完备证明、缺少固定版本的完整 PPA 对比。历史论文中的微基准只描述对应版本，研究演进和评估边界在独立章节中展开。
