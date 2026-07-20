---
title: "系统架构：从指令执行到 RT-Thread"
summary: "界定七级 Core、AXI SoC、AM 运行时与应用之间的系统边界，并区分当前实现与早期 FPGA 版本。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["一生一芯", "RISC-V", "SoC", "Chisel"]
entryType: chapter
parentProject: ysyx-workbench
section: "体系结构"
order: 10
navTitle: "系统架构"
---

## 系统边界

当前工程由处理器、片上互连、平台外设、AM 运行时和应用五层组成。处理器和缓存位于 `npc`，通过统一 AXI4 master 端口访问外部地址空间；SoC 侧完成 AXI4 路由及 AXI-to-APB 转换；AM-SDK 将启动、异常和设备访问整理成稳定的软件接口；RT-Thread 与测试程序位于最上层。

| 层次 | 主要职责 | 实现状态 |
| --- | --- | --- |
| Core | 取指、译码、执行、访存、写回和机器态 CSR | 当前 RTL |
| Cache/Memory | I-Cache、burst refill、IFU/LSU 仲裁 | 当前 RTL |
| SoC | AXI4-Full、APB bridge、地址译码和外设连接 | RTL 与平台集成 |
| AM-SDK | 启动、TRM、IOE、CTE、stdlib | 当前软件实现 |
| Workloads | MicroBench、功能测试、RT-Thread | 仿真或板级运行 |

```text
application / RT-Thread
        ↓ AM API
start.S → TRM / IOE / CTE
        ↓ MMIO
AXI4 interconnect → APB bridge → peripherals
        ↑
I-Cache / IFU ─┐
               ├→ AXI4 master
LSU ───────────┘
        ↑
seven-stage in-order core
```

## 当前 Core 与早期 FPGA 版本

当前 B5 Core 是七级、单发射、顺序提交结构：三级取指、一级译码、一级执行、一级 LSU 和一级写回。寄存器堆包含 32 个 32-bit 通用寄存器，因此架构定义为“RV32 指令实现子集”，而不是只有 16 个寄存器的 RV32E。

早期版本是另一套五级 Core + SoC，已在 FPGA 上完成 UART、RT-Thread 和 VGA / `fceux-am` 联调。当前七级版本与早期五级 FPGA 版本分别维护实现参数。

![早期五级 Core 与 SoC 架构](/projects/ysyx/pdf-extracts/cpu-architecture.png)

*五级 FPGA 版本的 CPU/SoC 架构：IFU 与 LSU 经仲裁器和 Xbar 访问存储与外设。*

## 启动主线

复位后，启动汇编建立栈和必要的执行环境，再进入 `_trm_init`。TRM 完成基础运行时初始化并调用用户入口；`ioe_init`/`dev_init` 建立设备抽象；CTE 写入 `mtvec` 并安装 trap 入口。RT-Thread 随后使用这些底层能力完成内核和设备初始化。

系统是否“能启动”必须同时满足：取指和访存协议无死锁、MMIO 地址映射一致、异常保存/恢复正确、链接地址与物理存储一致。任何一层错误都可能表现为同一类现象，例如串口没有输出，因此验证必须跨越软硬件边界。

## 限制

- 当前七级版本的仿真性能数据不能替代 FPGA 实测频率。
- 五级 FPGA 结果不用于推导七级版本的频率、面积或时序。
- 外设是否“存在”、是否“由本人实现”、是否“在目标板验证”在 SoC 章节分别列示。
