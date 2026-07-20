---
title: "组件案例：AXI Read、Regfile 与 CPU Prototypes"
summary: "分析 HwOS 库组件的输入、内部状态、时序契约、生成逻辑和测试覆盖。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "AXI4", "Regfile", "Case Study"]
entryType: chapter
parentProject: hwos
section: "API 与组件"
order: 50
navTitle: "组件案例"
---

## 案例评价模板

每个组件按五个问题描述：调用输入是什么；组件持有哪些跨周期状态；何时阻塞和完成；最终生成哪些寄存器/组合路径；测试覆盖了哪些协议边界。这样可以把“API 更短”与“RTL 更正确或更高效”分开评价。

## AXI4 Read API

`lib/axi4` 把地址请求、AR channel 握手、R channel 等待和数据捕获封装为 transaction。调用 thread 在完成前保持当前位置；组件保存 outstanding 状态并拥有 ready/valid choreography。

关键测试包括 AR backpressure、延迟 R response、响应只提交一次、reset 清理以及连续调用。该组件实现单次 read transaction；burst、ID、错误响应和乱序返回不在接口范围内。

## Regfile API

Regfile 案例把 reserve、read、writeback 和 publication 作为稳定前端，后端可实现仲裁、前递与 age ordering。reservation 解决多个 caller 对物理资源的竞争；forwarding 允许尚未正式发布的值满足相关读取；ordered publication 保证提交顺序。

AgeOrderedRegfileSpec 用并发请求和不同完成顺序验证“完成可乱序、发布仍按策略”的边界。该 ordering 只约束组件发布策略，不提供完整 CPU 的 precise exception 语义。

## 同步原语

stdlib 提供 mutex、semaphore、waitgroup、scoreboard 和 ordered window 等构件。它们都必须明确等待条件、资源计数更新点和 reset hook，不能仅复用软件并发原语的名称。

## CPU-oriented prototypes

`prototype/cpu` 中的 fetch、decode、arithmetic、load、path 等 service 用于向 API 施加跨组件反压、仲裁和提交压力。ServerInjected 版本探索 service 注入与 wrapper 生成。

![早期 Service-Based Pipeline](/projects/hwos/service-pipeline.png)

*Preprint Fig. 3，第 7 页：指令线程通过 fetch、decode、execute、load 和 commit 服务组成处理路径。*

## 结论边界

这些组件覆盖事务封装、反压、仲裁和提交策略组合。面积、频率和功耗比较需要使用功能等价的手写 RTL 基线。
