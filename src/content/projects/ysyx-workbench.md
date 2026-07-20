---
title: "一生一芯：从 Chisel CPU 到可运行 RT-Thread 的 SoC"
summary: "第六期 B5 阶段成果：用 Chisel 构建七级流水 RV32 处理器，接入 AXI4-Full / APB 总线与 AM 软件栈，并推进到 RT-Thread 启动。"
published: 2026-07-20
updated: 2026-07-20
status: active
featured: true
draft: false
tags: ["一生一芯", "Chisel", "RISC-V", "AXI4", "SoC", "RT-Thread"]
image: "/projects/ysyx/rtthread-boot.png"
repository: "https://github.com/NullStarfish/personal-ysyx-workbench"
entryType: project
navTitle: "一生一芯"
---

## 项目概览

该项目实现一套从处理器 RTL、片上互连、外设到 AM 运行时的完整计算机系统。当前主线为 Chisel 编写的七级单发射顺序流水处理器；早期五级版本已在 FPGA 上完成 DDR2、UART、VGA、PS/2 与 RT-Thread 的板级联调。

```text
应用与系统软件
RT-Thread / MicroBench / fceux-am
                 │
AM 运行时
TRM / IOE / CTE / stdlib
                 │
AXI4-Full / APB SoC
Memory / UART / Timer / GPIO / VGA / PS/2
                 │
七级流水 Core
IF / I0 / I1 / ID / EX / MEM / WB
```

## 技术文档树

1. [系统架构：当前七级 Core 与早期 FPGA 版本](/projects/ysyx-workbench/architecture/)
2. [Core RTL：七级流水、冒险与控制流恢复](/projects/ysyx-workbench/core-pipeline/)
3. [异常与 CSR：机器态控制转移](/projects/ysyx-workbench/exception-csr/)
4. [Cache 与访存：命中、refill 与 AXI](/projects/ysyx-workbench/cache-memory/)
5. [SoC 与 FPGA：互连、外设和板级闭环](/projects/ysyx-workbench/soc-fpga/)
6. [AM-SDK 与运行时：启动到 RT-Thread](/projects/ysyx-workbench/sdk-runtime/)
7. [验证与性能：difftest 与 MicroBench](/projects/ysyx-workbench/verification-performance/)
8. [综合与时序：55 nm 实现结果](/projects/ysyx-workbench/synthesis-timing/)

## 实现参数

| 项目 | 配置 |
| --- | --- |
| RTL | Chisel，32-bit 数据通路，32 个通用寄存器 |
| 流水线 | IF / I0 / I1 / ID / EX / MEM / WB，单发射、顺序提交 |
| I-Cache | 2 KiB，2-way，32 B cache line，LRU |
| 总线 | Core AXI4-Full master，SoC 通过 bridge 连接 APB 外设 |
| 软件栈 | start.S、TRM、IOE、CTE、stdlib、RT-Thread |
| MMIO | RTC、UART、GPIO、PS/2、GPU/framebuffer |
| 验证 | NEMU difftest、SDB、trace、波形与性能计数器 |
| 综合 | Yosys + ICSprout55，TT / 1.2 V / 25°C |
| FPGA | 五级历史版本完成 RT-Thread 与 VGA / fceux-am |

寄存器堆包含 32 个通用寄存器，因此架构描述统一为“RV32 指令实现子集”，不再使用仅含 16 个通用寄存器的 RV32E 标识。

## 工作范围

| 模块 | 实现内容 |
| --- | --- |
| Core RTL | 取指、译码、执行、LSU、写回、冒险处理和控制流恢复 |
| Cache | tag/data array、LRU、burst refill、flush 与 `fence.i` |
| SoC | AXI/APB、地址译码、外设与 FPGA 集成 |
| AM-SDK | 启动、设备抽象、异常 Context 和 C runtime |
| 验证 | NEMU difftest、trace、waveform、workload 与计数器 |
| 实现评估 | 逻辑综合、面积统计、STA 与关键路径分析 |

## 性能与实现结果

| 项目 | 结果 |
| --- | --- |
| MicroBench 指令数 | 195,206,488 |
| MicroBench 周期数 | 1,288,434,556 |
| IPC | 0.151507 |
| I-Cache 命中率 | 99.947987% |
| 标准单元数量 | 39,674 |
| 标准单元面积总和 | 186,452.84 |
| 最新关键路径 | 1.391 ns |
| STA 报告频率 | 约 695.328 MHz |

MicroBench 数字来自 RTL 仿真计数器。综合与 STA 结果为 Core-only、55 nm 典型角条件下的前端实现结果；5 GHz 是未满足的输入约束，不是工作频率。

![RT-Thread 在自研 SoC 上启动](/projects/ysyx/rtthread-boot.png)

*RT-Thread 启动日志覆盖处理器执行、访存、MMIO、AM 初始化和系统软件入口。*
