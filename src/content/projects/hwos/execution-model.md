---
title: "执行模型：Process、Thread、Step 与 Context"
summary: "明确当前 HwOS 中各核心对象的职责、生命周期、地址空间与控制边界。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "Thread", "Process", "Control Flow"]
entryType: chapter
parentProject: hwos
section: "模型与内核"
order: 20
navTitle: "执行模型"
---

## 对象关系

当前主线以 `HwProcess` 表示 service、environment 或具有物理意义的组件，以 `HardwareThread + ThreadCore` 作为唯一正式控制流执行宿主。它们不是软件进程和 CPU 线程的直接模拟，而是用于组织最终 RTL 的 elaboration-time 对象。

```text
Kernel / KernelAddressSpace
  └─ HwProcess
       ├─ Context / exported resources
       └─ HardwareThread + ThreadCore
            └─ ThreadDef
                 └─ Step / StepRef / jump / hijack
```

| 概念 | 当前职责 | 明确不负责 |
| --- | --- | --- |
| Process | 组件边界、资源导出、thread 创建 | 不调度软件线程 |
| Context | 环境对象和跨边界可见资源 | 不是 ACL/ownership 系统 |
| HardwareThread | 控制流宿主和 runtime 状态 | 不是主要代码复用单元 |
| ThreadDef | definition-first 的 thread code | 不表示运行时实例跳转 |
| Step | 一个控制状态及其动作/退出条件 | 不保证单周期完成 |
| StepRef | lowering 前的符号控制目标 | 不是物理寄存器地址 |
| RuntimeContext | cursor/state 等运行时承载 | 不自动 reclaim 任意状态 |

## 控制语义

`entry { ... }` 定义入口程序；`Step` 描述在当前 cursor 下执行的动作；`waitCondition` 让 cursor 保持到条件成立；`jump(ref)` 生成运行时控制转移；`hijack(ref)` 则在 elaboration/lowering 阶段把目标控制段 splice 到当前位置。两者不能互换描述。

`reset()` 的基础语义是复位 thread cursor/stateReg。组件若持有 reservation、lease 或其他局部状态，必须通过 `registerReset` 显式接入清理动作。当前实现因此没有全局隐式 reclaim 机制。

## 地址与绑定

KernelAddressSpace 记录 code/state/exported memory 等对象。export/declare 建立跨 Process 边界的稳定引用，binding table 在 elaboration 时解析提供方和使用方。该机制解决连接和名称问题，但不会自动创造运行时访问权限。

## 设计不变量

- 一个 thread 只有统一的 ThreadCore runtime 主线。
- StepRef 在 lowering 完成前必须可解析。
- reset 的基础效果可预测；额外资源清理由局部策略声明。
- Process/Context/Thread 的边界不能由历史 ownership 术语重新解释。
