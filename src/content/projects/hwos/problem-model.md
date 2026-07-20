---
title: "问题模型：把时序语义纳入硬件 API"
summary: "定义 transaction、阻塞、完成、提交和副作用，说明 HwOS 试图替代哪类重复协议控制。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "RTL", "API", "Timing Semantics"]
entryType: chapter
parentProject: hwos
section: "模型与内核"
order: 10
navTitle: "问题模型"
---

## 目标不是隐藏时钟

HwOS 的当前问题定义是：如何把重复的协议编排和局部 FSM glue 收入可复用接口，同时保留硬件操作的周期语义。普通软件函数通常只描述参数和返回值；硬件 transaction 还必须说明请求何时被接受、调用者是否阻塞、结果何时稳定、副作用在哪个边界提交，以及 reset/abort 如何处理未完成状态。

一个 timing-semantic API 至少包含以下契约：

| 维度 | 必须回答的问题 |
| --- | --- |
| admission | 请求在哪个 guard/ready 条件下被接受 |
| blocking | 调用 thread 是否停留在当前 Step |
| completion | 哪个事件允许控制流继续 |
| result | 返回值在哪些周期有效并由谁保存 |
| commit | 写回、队列入项或外部握手何时成为可见副作用 |
| reset | 未完成 transaction 的局部状态如何清理 |

![Timing-semantic API 构建视图](/projects/hwos/timing-semantic-api.png)

*OSCAR Fig. 1，第 1 页：调用侧事务接口与组件内部协议状态机。*

## Transaction 作为前端单元

Transaction 不是 AXI transaction 的同义词，而是更一般的硬件操作单元。AXI read、寄存器堆 reservation/writeback、channel transfer 和同步原语都可以具有 transaction 语义。调用侧表达“执行哪项操作”，被调用组件拥有握手、仲裁、前递或有序发布策略。

这一区分带来两个边界：API 不能承诺后端无法实现的时序；调用侧也不应重新展开已经由 API 所有的握手细节。若一个 API 会阻塞，就必须通过控制流停留表达，而不是依赖调用者猜测固定延迟。

## 与局部 FSM 的关系

HwOS 不消除 FSM。Thread/Step 程序最终仍 lower 为状态寄存器和组合 next-state 逻辑。区别在于状态转移首先由 transaction 和控制语义组织，再由统一 lowering 生成，而不是每个模块手写一套相似的 `idle/request/wait/commit` 状态机。

## 可证伪条件

如果 API 无法精确定义阻塞与提交边界、生成逻辑不能保持 ready/valid 不变量，或抽象开销无法被测量，则该模型没有达到目标。因此项目评价应基于生成 RTL、协议断言、等价行为和 PPA 数据，而不是仅比较 Scala 源码行数。
