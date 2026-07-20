---
title: "验证与性能：差分测试、计数器和 MicroBench"
summary: "给出功能验证层次、性能计数器定义以及 MicroBench train 的测量条件与结果。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["Verification", "Difftest", "MicroBench", "Performance"]
entryType: chapter
parentProject: ysyx-workbench
section: "软件与验证"
order: 70
navTitle: "验证与性能"
---

## 验证层次

功能验证以退休指令为主要比较边界。仿真器在每条有效提交后把 PC、指令、通用寄存器和关键 CSR 与 NEMU 参考模型比较；MMIO 等非确定访问必须采用 skip/refill 规则，避免把设备时间差误判为 ISA 错误。

| 手段 | 观察范围 | 主要用途 |
| --- | --- | --- |
| 单元测试 | ALU、cache、arbiter 等局部模块 | 快速验证边界条件 |
| NEMU difftest | 架构状态 | 捕获指令语义与提交错误 |
| SDB/trace | 指令、访存、函数调用 | 缩小首次分歧位置 |
| VCD/FST 波形 | ready/valid 与内部状态 | 调试周期级协议问题 |
| 断言/形式检查 | 局部不变量 | 覆盖随机仿真难达状态 |
| workload | AM tests、MicroBench、RT-Thread | 系统级回归 |

## MicroBench train 结果

以下数据来自一次完整的 MicroBench train 运行，10 个 benchmark 全部通过。它是 RTL 仿真下的工作负载测量，不是 FPGA 或硅后测试。

| 指标 | 数值 |
| --- | ---: |
| 周期 | 1,288,434,556 |
| 退休指令 | 195,206,488 |
| IPC | 0.151507 |
| I-Cache accesses | 237,672,907 |
| I-Cache hits | 237,549,287 |
| I-Cache miss outputs | 123,620 |
| I-Cache hit rate | 99.947987% |
| LSU requests | 22,596,180 |
| loads / stores | 15,582,467 / 7,013,713 |
| LSU cycles/request | 41.478913 |

IPC 按退休指令数除以总周期计算。I-Cache 指标中的 `miss outputs` 是实现计数器定义的 miss 输出次数；它不应在没有说明的情况下直接等同于所有内部 tag miss 尝试。

## 流水占用率

该次运行记录的主要级间 valid 占用率为：IF-I0 25.045064%、I0-I1 93.403738%、I1-ID 88.471702%、ID-EX 61.542078%、EX-MEM 70.080802%、MEM-WB 15.150672%。低 IPC 与高 I-Cache 命中率可以同时成立，因为 LSU 平均服务时间、load-use 停顿和总线等待仍会限制退休吞吐。

性能优化采用相同 workload、编译选项、内存模型和计数器边界进行前后对照；计数器用于区分前端、存储和控制流瓶颈。
