---
title: "扫频与测量：从 ADC 样本到幅频点"
summary: "解释对数扫频、动态采样率、DMA 采集、Flat-top 窗和 FFT 幅值补偿如何共同产生拟合输入。"
published: 2025-08-21
updated: 2026-07-20
status: completed
draft: false
tags: ["DMA", "FFT", "CMSIS-DSP", "Flat-top Window", "Calibration"]
entryType: chapter
parentProject: "nuedc-2025-g"
section: "测量与算法"
order: 4
navTitle: "扫频与测量"
---

## 扫频网格

当前 `app_config.h` 使用 200 个对数间隔频点：

```text
f[i] = 10 ^ (
  log10(f_start)
  + (log10(f_end)-log10(f_start)) * i/(N-1)
)
```

默认 `f_start=100 Hz`、`f_end=200 kHz`。对数网格让每个数量级获得相近的采样密度，比线性扫频更适合同时定位低频转折和高频渐近区。

200 个频点覆盖 100 Hz–200 kHz；对数间隔使每个数量级具有近似一致的采样密度。

## 动态采样率

每个频点都重新计算 ADC 采样率：

```text
Fs_ideal = FFT_SIZE × f / TARGET_CYCLES_IN_BUFFER
Fs = clamp(Fs_ideal, Fs_min, 1 MHz)
```

目标是在 2048 点缓冲区中容纳约 10 个信号周期。低频时避免采样窗口短到看不完整周期，高频时又受到 1 MS/s 上限约束。采样率变化后，FFT 句柄同步更新 `sampling_rate`，保证频率 bin 的物理单位正确。

## 采样和处理时序

```text
设置 DDS
  → 等待 50 ms
  → ADC DMA 收集 2048 点
  → 停止 ADC/定时器
  → 去直流
  → 加窗与 RFFT
  → 幅值归一化/补偿
  → 累积增益
```

ADC DMA 完成中断只把状态推进到 `PROCESS_RESULTS`。FFT 在主循环运行，避免长时间占用中断上下文。

## 幅值估计

`AccurateFFT_Measure()` 使用 CMSIS-DSP：

1. 乘 Flat-top 或 Hann 窗；
2. 执行 `arm_rfft_fast_f32`；
3. 计算复数幅值；
4. 转换为单边谱；
5. 跳过 DC bin 搜索峰值；
6. 用 coherent power gain 与 scalloping loss 常数补偿峰值；
7. 将峰值幅度乘 2 得到 Vpp。

Flat-top 窗牺牲频率分辨能力以换取较低的幅值测量偏差，符合本项目“获取增益”而不是“分离相邻谱线”的目标。

## 校正链

工程保留了 DDS 输出、采样板、输入板、DAC 输出和全链路增益的多组校正表。已知模型控制还可以通过真实输出迭代生成二维 LUT：

```text
Vin_next = Vin_current × Vout_target / Vout_measured
```

这类端到端校正能吸收 DDS 幅值字非线性、运放增益误差和 ADC 比例误差，但它只在校正温度、电源、接线和量程附近有效。

## 已知限制

- 峰值 bin + 固定窗补偿不是任意非相干采样下的无偏估计器。
- ADC/DDS 切换后的固定 50 ms 等待没有根据被测网络时间常数自适应。
- 测试集尚未包含温度、电源和器件容差扫描，参数稳定性没有置信区间。
- 在高频端，1 MS/s 采样上限与模拟前端带宽都会压缩有效裕量。
