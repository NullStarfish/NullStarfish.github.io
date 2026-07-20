---
title: "2025 全国大学生电子设计竞赛 G 题：电路模型探究装置"
summary: "以 STM32F407、AD9910、同步 ADC/DAC、幅值谱测量和二阶系统辨识构建电路模型探究装置；获全国一等奖和 TI 杯。"
published: 2025-08-21
updated: 2026-07-20
status: completed
featured: true
draft: false
tags: ["NUEDC", "STM32F407", "AD9910", "CMSIS-DSP", "System Identification", "IIR"]
image: "/projects/nuedc-2025-g/hardware-overview.png"
repository: "https://github.com/xw-Soleil/ModelProbe-25G"
demo: "https://res.nuedc-training.com.cn/topic/2025/topic_126.html"
entryType: project
navTitle: "2025 电赛 G 题"
---

## 项目概览

电路模型探究装置包含两条工作路径：

- 已知模型控制：根据目标频率和目标输出峰峰值反算 DDS 激励，并通过校正表补偿模型电路与测量链误差。
- 未知模型学习：自动扫频采集幅频响应，识别二阶低通、高通、带通或带阻模型，拟合 `k`、`f0`、`Q`，再生成实时 IIR 模拟其响应。

系统以 STM32F407ZGT6 为控制与数字信号处理核心，AD9910 提供扫频激励，片上 ADC/DAC 与定时器、DMA 构成同步采集和输出链路。

![装置整体电路、主控、DDS、调理板和串口屏](/projects/nuedc-2025-g/hardware-overview.png)

*整机由 STM32F407 主控、AD9910 DDS、模型与调理电路、采样/输出接口和串口屏组成。*

## 技术文档树

1. [题目与指标：功能接口与验收指标](/projects/nuedc-2025-g/problem-specification/)
2. [系统架构：已知模型控制与未知模型学习](/projects/nuedc-2025-g/system-architecture/)
3. [硬件链路：信号发生、采集、调理与切换](/projects/nuedc-2025-g/hardware-signal-chain/)
4. [扫频与测量：从 ADC 样本到幅频点](/projects/nuedc-2025-g/sweep-measurement/)
5. [模型辨识：特征初始化、竞争拟合与 LM](/projects/nuedc-2025-g/model-identification/)
6. [实时仿真：连续模型到同步 ADC/DAC](/projects/nuedc-2025-g/realtime-emulation/)
7. [验证与获奖：测试结果和工程限制](/projects/nuedc-2025-g/verification-awards/)

## 系统数据流

```text
AD9910 扫频
    │
未知 RLC 网络 ── 调理 ── ADC + DMA
                          │
               去直流 + Flat-top FFT
                          │
                 (frequency, gain)
                          │
       LPF / HPF / BPF / BSF 竞争拟合
                          │
                     k, f0, Q
                          │
                双线性变换 → biquad
                          │
外部输入 ── ADC ping-pong ── IIR ── DAC ping-pong ── 模拟输出
```

## 实现参数

| 参数 | 配置 |
| --- | --- |
| 主控 | STM32F407ZGT6 |
| 激励 | AD9910 DDS |
| ADC / DAC | 片上 12 bit，量化范围 0–4095 |
| 扫频 | 100 Hz–200 kHz，200 个对数频点 |
| FFT | 2048 点 RFFT，Flat-top 窗，单边谱幅值补偿 |
| 动态采样 | 上限 1 MS/s，目标每缓冲区约 10 个信号周期 |
| 系统辨识 | LPF / HPF / BPF / BSF 四模型竞争 |
| LM | double，最多 100 次迭代 |
| 实时滤波 | 500 kS/s，128 点半缓冲，256 点 ping-pong |
| UI | 串口屏模式控制与参数显示 |

## 模块划分

| 模块 | 功能 |
| --- | --- |
| `dataProcess` | 已知模型传递函数反算与二维校正表 |
| `System_IDentify` | 对数扫频、动态采样与测量状态机 |
| `FFT` | Flat-top 窗、RFFT、峰值和幅值补偿 |
| `Expert_fitter` | 特征初值、四模型竞争与双精度 LM |
| `IIRDesigner` | 连续二阶模型到 biquad 系数 |
| `RealTimeFilter` | 同步 ADC/DAC 与 ping-pong DMA |
| `errorFilter` | DDS、ADC、DAC 和全链路校正 |
| `Screen` | 基础输出、学习和模拟模式控制 |

## 测试结果

| 项目 | 结果 |
| --- | --- |
| 已知模型控制范围 | 100 Hz–3 kHz，1–2 Vpp |
| 已知模型控制最大误差 | 4.7% |
| 未知模型学习时间 | 40 s 内 |
| 实时模拟频带 | 1–50 kHz |
| 模拟输出幅值误差 | 10% 内 |
| 最大不失真正弦频率 | 1.5 MHz |
| 最大输出峰峰值 | 4.5 V |
| 输出不低于 3 Vpp 的最高频率 | 2 MHz |

## 竞赛结果

项目获得 2025 年全国大学生电子设计竞赛全国一等奖，并获得浙江赛区唯一的 TI 杯。

![2025 全国大学生电子设计竞赛 TI 杯](/projects/nuedc-2025-g/ti-cup.jpg)

*2025 全国大学生电子设计竞赛 TI 杯。*
