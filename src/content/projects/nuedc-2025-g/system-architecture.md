---
title: "系统架构：已知模型控制与未知模型学习"
summary: "说明系统的硬件边界、两条功能路径、主状态机以及学习结果如何进入实时输出阶段。"
published: 2025-08-21
updated: 2026-07-20
status: completed
draft: false
tags: ["STM32F407", "Architecture", "State Machine"]
entryType: chapter
parentProject: "nuedc-2025-g"
section: "系统实现"
order: 2
navTitle: "系统架构"
---

## 系统组成

![DDS 激励、模型电路、采样、辨识和实时输出组成的系统框图](/projects/nuedc-2025-g/system-block-diagram.png)

*系统框图：已知模型控制与未知模型学习共享 DDS、采样和信号调理基础设施。*

系统以 STM32F407ZGT6 为控制与数字信号处理中心，外部 AD9910 负责宽频扫频激励，片上 ADC/DAC 承担采样与同步输出，串口屏提供模式选择与结果显示。模拟板完成已知模型、未知模型接入、幅度调理、偏置和输出切换。

## 路径 A：已知模型控制

```text
目标 (frequency, Vout)
        │
    |H(jω)| 反算
        │
校正表 / 闭环修正
        │
 AD9910 频率与幅度字
        │
  已知模型实际 Vout
```

`VinVpp_KnownModel()` 在无校正表时使用理论传递函数；生成二维 LUT 后，控制路径按频率和目标 Vpp 查询校正输入。这种设计允许基础功能不依赖学习算法，同时保留端到端校正能力。

## 路径 B：未知模型学习与模拟

学习阶段由 `SysId_RunStateMachine()` 驱动：

```text
IDLE
  → START_SWEEP
  → MEASURING
  → PROCESS_RESULTS
  → 下一频点 / IDENTIFY_AND_FIT
  → DONE
```

每个频点先配置 DDS 和 ADC 采样率，等待模拟链稳定，再启动 DMA。中断只改变状态，FFT 和拟合留在主循环执行，避免在 ISR 内运行长计算。

学习完成后，主程序读取：

- 初步竞争拟合类型；
- 由拟合曲线特征再次判断的最终类型；
- `k`、`ω0`、`Q`；
- SSE。

随后用拟合参数生成 biquad，并切换到实时滤波模式。

## 模式切换

`main.c` 将应用状态分为辨识和滤波两类，串口屏进一步给出基础输出、学习、学习完成和性能输出状态。进入实时输出前只初始化一次滤波器；离开该模式时先停止定时器，再停止 ADC/DAC DMA，避免外设仍在触发时更改缓冲区状态。

## 边界与所有权

| 层次 | 负责内容 | 不负责内容 |
| --- | --- | --- |
| AD9910 驱动 | 频率字、幅度字、模式更新 | 被测网络增益 |
| 系统辨识 | 扫频调度、测量点、拟合 | 实时逐样本输出 |
| IIR Designer | 连续模型到 biquad 系数 | DMA 时序 |
| Realtime Filter | 双缓冲、逐样本滤波、限幅 | 模型参数拟合 |
| Screen | 用户命令和结果呈现 | 算法状态的隐式修改 |

这种分层是后续排查问题的基础：测量错误、拟合错误和输出错误可以分别定位，而不是把所有行为堆在一个主循环里。
