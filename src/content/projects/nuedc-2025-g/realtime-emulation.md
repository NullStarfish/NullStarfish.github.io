---
title: "实时仿真：连续模型到同步 ADC/DAC"
summary: "将辨识到的连续时间二阶模型转换为 biquad，并用定时器同步的 ADC/DAC 双缓冲执行逐样本滤波。"
published: 2025-08-21
updated: 2026-07-20
status: completed
draft: false
tags: ["IIR", "Biquad", "DMA", "Real-time DSP"]
entryType: chapter
parentProject: "nuedc-2025-g"
section: "测量与算法"
order: 6
navTitle: "实时仿真"
---

## 从连续模型到离散滤波器

学习阶段得到 `type, k, f0, Q` 后，`design_biquad_filter()` 先构造对应的连续时间分子/分母，再以

```text
s = 2Fs · (1-z⁻¹)/(1+z⁻¹)
```

执行双线性变换，最后将分母首项归一化，生成

```text
y[n] = b0 x[n] + b1 x[n-1] + b2 x[n-2]
       - a1 y[n-1] - a2 y[n-2]
```

若类型未知或归一化分母接近零，代码退化为直通滤波器，避免产生未定义系数。

## 同步 ADC/DAC 管线

当前默认配置：

| 项目 | 数值 |
| --- | --- |
| 实时采样率 | 500 kS/s |
| 半缓冲 | 128 samples |
| 总 ping-pong 缓冲 | 256 samples |
| 输入 | ADC3，DMA |
| 输出 | DAC channel 1，DMA |
| 数值格式 | float biquad；另保留 Q15 分支 |
| 直流中点 | 2048 |
| 输出限幅 | 0–4095 |

TIM2 触发 ADC，TIM6 触发 DAC，两者使用同一目标采样率计算 ARR。启动时先准备 DAC 缓冲、启动 ADC/DAC DMA，最后启动定时器；停止时反向执行，先切断触发源。

## Ping-pong 回调

```text
ADC DMA [ping | pong]
           │
 half callback / full callback
           │
  去偏置 → biquad → 增益校正 → 限幅
           │
DAC DMA [ping | pong]
```

半传输回调处理前 128 点，完成回调处理后 128 点。这样 DAC 正在播放一半缓冲区时，CPU 更新另一半，避免整块采集完成后才输出造成的长间断。

ADC overrun 时，错误回调停止并重启 ADC DMA。它提供恢复路径，但没有记录丢失样本数量；因此“恢复后继续运行”不意味着相位连续。

## 同频问题

DDS 适合快速扫频，但它有独立时钟。若直接用 DDS 作为实时预测输出，外部输入与输出之间可能因晶振偏差缓慢漂移。实时模拟改用同一 MCU 时钟域内的 ADC、定时器和 DAC，消除了两个独立振荡器之间的长期频差，这是选择片上 DAC 的主要系统理由。

## 可验证范围

1–50 kHz 测试区间内，实时模拟输出与未知模型输出的 Vpp 差保持在 10% 内。测试未覆盖模型族之外的高阶网络。
