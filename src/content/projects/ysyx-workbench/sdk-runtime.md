---
title: "AM-SDK 与运行时：启动、设备和 RT-Thread"
summary: "沿 start.S、TRM、IOE、CTE、stdlib 和链接脚本追踪从复位到操作系统入口的完整软件路径。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["AM", "Runtime", "RT-Thread", "Bare Metal"]
entryType: chapter
parentProject: ysyx-workbench
section: "软件与验证"
order: 60
navTitle: "SDK 与运行时"
---

## 启动路径

平台启动汇编位于 ysyxsoc AM port。复位入口首先建立 C 代码所需的最小环境，然后调用 `_trm_init`。TRM 初始化串口等基础设施，构造堆区边界，并调用应用的 `main`；应用返回后由 `halt` 结束或报告状态。

当前 TRM 将可用物理内存规模设为 32 MiB。链接脚本、启动地址、SoC 内存译码和 bootloader 装载地址必须一致；任何一处不一致都会在进入 C 前后产生不可预测取指或数据访问。

## AM 分层

| 层 | 接口 | 作用 |
| --- | --- | --- |
| TRM | `_trm_init`, `putch`, `halt` | 最小 C 运行环境 |
| IOE | `ioe_init`, `io_read`, `io_write` | UART、timer、GPU 等设备抽象 |
| CTE | `cte_init`, `yield`, `kcontext` | trap 分发和 Context 构造 |
| stdlib | string/memory/formatting | 上层程序通用运行库 |

IOE 使用函数表把 AM 设备寄存器映射到平台实现。UART 访问 16550 风格寄存器并轮询 LSR；timer 提供 RTC/uptime；GPU 提供配置、framebuffer draw 和同步状态。应用只依赖 AM 类型，不直接传播 MMIO 地址。

## RT-Thread 启动

RT-Thread 在 AM 环境上完成 board initialization、内核对象初始化、调度器启动和设备注册。串口输出是最早的可观察点；能进入 shell 则进一步证明异常/上下文切换、定时基础和 C 运行库可以协同工作。

![RT-Thread 在自研 SoC 上启动](/projects/ysyx/rtthread-boot.png)

*RT-Thread 启动日志：复位入口、AM 初始化、设备注册和内核启动链路已经连通。*

## 软件硬件契约

- `start.S` 与 Context 汇编必须遵守相同寄存器约定。
- MMIO load/store 的访问宽度必须和外设寄存器定义一致。
- `putch` 的轮询必须处理 UART backpressure。
- trap 保存区必须覆盖 C handler 会破坏的调用者/被调用者保存寄存器。
- `fence.i` 在加载或修改可执行代码后建立指令可见性。
