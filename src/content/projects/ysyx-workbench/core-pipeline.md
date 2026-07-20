---
title: "Core RTL：七级流水、冒险与控制流恢复"
summary: "分析三级取指到写回的 ready/valid 流水、前递、停顿、分支预测和精确清空机制。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["RISC-V", "Pipeline", "Chisel", "Branch Prediction"]
entryType: chapter
parentProject: ysyx-workbench
section: "体系结构"
order: 20
navTitle: "Core 与流水线"
---

## 流水级划分

当前 Core 使用六组级间寄存器形成七个逻辑阶段：IF、I0、I1、ID、EX、MEM 和 WB。前三个阶段把 PC 生成、I-Cache 查询以及取指响应整理分开，使 cache lookup、AXI refill 和后端反压能够通过 ready/valid 接口传播。

| 阶段 | 主要输入 | 主要输出 | 可能阻塞原因 |
| --- | --- | --- | --- |
| IF | 当前 PC、重定向 | fetch request | 下游队列满、重定向 |
| I0/I1 | cache 查询/响应 | 指令与 PC | miss、refill、旧响应丢弃 |
| ID | 指令、寄存器值 | 控制与操作数 | 数据相关、后端反压 |
| EX | ALU/branch/CSR 输入 | 执行结果 | LSU 或写回阻塞 |
| MEM | 地址、store data | load/store 结果 | AXI 延迟与反压 |
| WB | 执行或 load 结果 | 提交、寄存器写回 | 顺序提交边界 |

## 数据相关

寄存器堆支持同周期写回前递；HazardUnit 还比较 ID 源寄存器与后续阶段的目的寄存器。ALU 结果可在可用时直接旁路，load 数据则必须等待 LSU 收到响应。不能前递的 load-use 相关通过停止前端、保持级间状态解决，而不是让消费者读取旧值。

停顿的核心不变量是：valid 数据在 ready 为低时必须保持稳定。流水级既不能丢失请求，也不能在一次握手发生前重复推进。总线等待因此会逐级向取指端传播。

## 控制流恢复

分支预测器由可配置开关启用。取指端先选择预测 PC；EX 阶段得到真实方向和目标后判断预测是否正确。错误预测、异常和 `mret` 都形成重定向请求，并清空年轻指令。

仅清空流水寄存器不足以处理已经发出的取指。AXI 读响应不能被中途取消，因此前端使用代际/epoch 语义区分新旧请求：旧事务仍按协议接收至 `r.last`，但其结果不再进入新的指令流。这同时保护 AXI 协议完整性和架构状态正确性。

## 可验证不变量

- 同一条指令最多提交一次。
- 被 flush 的年轻指令不得写寄存器、CSR 或存储器。
- ready 为低时，valid 与 payload 保持稳定。
- 分支恢复后的第一条有效提交必须位于正确目标路径。
- load-use 停顿不得造成 load 请求重复发送。

## 相关技术笔记

- [RegFile：Chisel 寄存器堆实例](/posts/linux-101/scala-chisel-notes/实战例子/regfile/)
- [BTB](/posts/sys/branchprediction/btb/)
- [(m,n)-bit Counter BHT 与 GShare](/posts/sys/branchprediction/gsharecounter/)
