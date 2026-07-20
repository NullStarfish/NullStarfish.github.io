---
title: "SoC 与 FPGA：互连、地址空间和板级闭环"
summary: "分解 AXI4-Full、APB bridge、MMIO 外设与早期五级版本的 FPGA bring-up 路径。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["SoC", "AXI4", "APB", "FPGA"]
entryType: chapter
parentProject: ysyx-workbench
section: "存储与系统"
order: 50
navTitle: "SoC 与 FPGA"
---

## 互连结构

Core 对外暴露 AXI4-Full master。片上互连根据地址将事务送往存储器或 MMIO 区域；低带宽寄存器型外设经 AXI-to-APB bridge 访问。桥接必须保持 AXI 五通道的独立握手，同时把一次 APB transfer 收敛为 setup 和 access 两个阶段。

```text
Core AXI4 master
  ├─ memory path → SRAM/SDRAM controller
  └─ MMIO xbar → AXI-to-APB → UART / GPIO / PS2 / other peripherals
                         └── direct mapped GPU/framebuffer path
```

## 软件可见地址

AM 平台通过以下地址访问 SoC 外设：

| 设备 | 基地址 | 软件能力 | 实现状态 |
| --- | ---: | --- | --- |
| RTC/uptime | `0x0200_0000` | RTC 与 uptime 读取 | AM IOE |
| UART | `0x1000_0000` | 初始化、轮询收发 | 启动日志/IOE |
| GPIO | `0x1000_2000` | 七段数码管位于 `+0x8` | 平台 MMIO |
| PS/2 | `0x1001_1000` | scan code 到 AM key 映射 | 早期 FPGA 输入路径 |
| GPU | `0x2100_0000` | config、framebuffer draw、status | VGA/fceux-am |

## 五级 FPGA 版本

早期五级 Core + SoC 在 FPGA 上完成了从 RTL 到应用的闭环：串口可观察启动，RT-Thread 能进入 shell，VGA 能显示 `fceux-am`，PS/2 键盘形成输入路径。DDR2/MIG 连接解决了片外存储访问。

![DDR2 与 MIG 组成的片外存储路径](/projects/ysyx/pdf-extracts/ddr2-memory-system.png)

*五级 FPGA 版本的 DDR2/MIG 读写结构。*

![五级 FPGA 版本运行 fceux-am](/projects/ysyx/fceux-vga.png)

*五级版本通过 VGA framebuffer 运行 `fceux-am`。*

## 不应混用的参数

- FPGA 时钟应来自对应实现版本的约束和 timing summary；当前材料未给出可核验数值，因此不填写 MHz。
- ICSprout55 的 ASIC 逻辑综合/STA 只针对当前 `myCore`，不包含 FPGA IP、MIG 或完整 SoC。
- “平台具备某外设”不等于“该外设由 Core RTL 实现”；正文分别记录接口、集成和验证状态。
