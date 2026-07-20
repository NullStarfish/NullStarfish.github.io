---
title: "研究演进：从 Thread-Level RTL 到 Timing-Semantic API"
summary: "比较 preprint、technical report、OSCAR 稿件和当前实现中的核心抽象，说明保留、修订与移除的机制。"
published: 2026-02-20
updated: 2026-07-20
status: active
draft: false
tags: ["HwOS", "Research", "Architecture", "API Design"]
entryType: chapter
parentProject: "hwos"
section: "验证与评估"
order: 7
navTitle: "研究演进"
---

## 四个阶段

| 阶段 | 核心模型 | 主要机制 |
| --- | --- | --- |
| Preprint | Thread-Level RTL | Fork-Join、service-based pipeline、语义级可观测性 |
| Technical report | HwOS 1.1 系统模型 | ownership、lease、reaper、dual-track CallStack |
| OSCAR 稿件 | Transaction-Oriented RTL Construction | timing-semantic API、AXI read、regfile policy factoring |
| 当前实现 | 统一 Thread/IR/lowering | `ThreadCore`、compile-time splice、reset hook、组件库 |

## Preprint：Thread-Level RTL

早期模型把独立控制流作为 RTL 组织单位。指令线程通过调用 fetch、decode、execute、load 和 commit 服务组成处理器数据流，Fork-Join 用于表达并行事务。

![Service-Based Pipeline 中的指令线程和功能服务](/projects/hwos/service-pipeline.png)

*Preprint Fig. 3，第 7 页：Service-Based Pipeline。*

该阶段保留下来的机制包括：

- thread 与显式 Step；
- 服务调用和同步；
- 生成符号表；
- 从 thread/Step 层观察仿真状态。

固定的 OS 类比和宽泛的性能结论不再作为当前 API 的定义。

## Technical report：资源与生命周期

HwOS 1.1 扩展了资源所有权和线程生命周期，加入 `HwFunction`、`HwLease`、reaper、ownership/ACL 与 dual-track CallStack。该模型试图让异常终止后的资源回收成为通用运行时能力。

当前实现将生命周期机制收缩为显式 reset hook。组件可在 thread reset 时释放 reservation、锁或局部状态，但 Kernel 不提供隐式系统级 reclaim；资源回收策略由组件接口定义。

`hijack` 也固定为编译期 splice：lowering 阶段把控制片段插入目标位置，不生成运行时控制转移。

## OSCAR 稿件：事务接口

Timing-semantic API 将研究对象缩小到可复用硬件事务。AXI read 示例封装地址和返回通道握手；Regfile 示例将 reservation、forwarding、仲裁与 ordered publication 放在稳定调用接口之后。

![Timing-semantic API 的调用与实现边界](/projects/hwos/timing-semantic-api.png)

*OSCAR Fig. 1，第 1 页：transaction API 与协议实现的边界。*

## 当前实现

当前代码统一使用 `ThreadCore`、`ThreadDef`、`Step/StepRef`、`ThreadIR`、`ThreadLayout` 和 `RuntimeLogic`。主要变化如下：

| 机制 | 状态 |
| --- | --- |
| HardwareThread / Step | 保留 |
| timing-semantic API | 保留并作为组件接口 |
| compile-time hijack | 保留，定义为 splice |
| verification layers / symbols | 保留 |
| ownership / ACL | 移除出基础模型 |
| automatic reaper / reclaim | 改为显式 reset hook |
| dual-track CallStack | 不再作为统一运行模型 |
| CPU prototype | 用作协议与组合压力测试 |

## 微基准

![早期实现相对手写 RTL 的归一化开销](/projects/hwos/normalized-overhead.png)

*Preprint Fig. 4，第 9 页：早期 micro-benchmark 的归一化面积与关键路径。*

图中的数值对应早期实现和小型 benchmark。当前版本需要在固定工具、工艺约束和功能等价基线下重新测量，不能直接沿用该图作为当前 PPA。
