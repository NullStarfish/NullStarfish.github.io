---
title: "Flappy Bird Q-Learning：表格型强化学习与可复现实验"
summary: "以三维离散状态和表格型 Q-Learning 训练 Flappy Bird 智能体；完成参数扫描、状态消融、固定种子评估与最终模型复测。"
published: 2026-06-01
updated: 2026-07-20
status: completed
featured: true
draft: false
tags: ["Reinforcement Learning", "Q-Learning", "Gymnasium", "Python", "Experiment"]
image: "/projects/flappy-bird-qlearning/parameter-comparison.png"
entryType: project
navTitle: "Flappy Bird Q-Learning"
---

## 项目概览

本项目以 `flappy-bird-gymnasium` 为环境，实现表格型 Q-Learning 智能体，并围绕状态设计、奖励尺度、探索策略和可复现评估建立完整实验流程。目标不是把连续观测直接堆入 Q 表，而是在有限训练预算下，构造能够共享经验的紧凑状态表示。

环境返回 12 维归一化观测。最终策略只保留最近管道的水平距离、小鸟相对下方管道的垂直距离和小鸟垂直速度，量化为三维整数状态；动作空间为“保持”与“flap”。

## 技术文档树

1. [任务与训练接口：环境、动作和奖励](/projects/flappy-bird-qlearning/environment-task/)
2. [Q-Learning 实现：更新、探索与并列动作](/projects/flappy-bird-qlearning/q-learning-agent/)
3. [状态表示：最近管道、离散化与状态规模](/projects/flappy-bird-qlearning/state-representation/)
4. [实验设计：参数扫描、评估协议与训练曲线](/projects/flappy-bird-qlearning/experiment-protocol/)
5. [结果与复现：状态消融、最终模型与限制](/projects/flappy-bird-qlearning/results-reproducibility/)

## 算法链路

```text
12 维连续 observation
          │
最近管道选择 + 三维特征提取
          │
离散化 (m = 30) → tuple state
          │
ε-greedy action (保持 / flap)
          │
environment step → reward / next state
          │
TD update: Q(s, a) ← (1 − α)Q + α[r + γ max Q(s', ·)]
```

## 实现与实验矩阵

| 模块 | 实现 | 验证口径 |
| --- | --- | --- |
| 环境接口 | Gymnasium `FlappyBird-v0`，关闭 LIDAR、使用归一化观测 | 环境返回 12 维观测、两动作控制 |
| 值函数 | Python `dict` 保存稀疏 `(state, action) → Q` | 未访问条目初始化为 0 |
| 策略 | ε-greedy；Q 值相等时随机打破并列 | 避免未知状态固定 flap 偏置 |
| 状态 | `(dx, dy_bottom, vy)` 三维离散状态 | 状态定义对比实验 |
| 参数实验 | 单因素扫描 `α`、`γ`、`ε`、量化倍率、死亡奖励 | 每组训练 50,000 局、固定种子评估 100 局 |
| 模型复测 | 保存三个 Q-table 里程碑 | 原始连续播放流程各 100 局 |

## 关键结果

| 结果 | 数值 | 测量条件 |
| --- | ---: | --- |
| 参数扫描最佳平均分 | 444.12 | `γ = 0.95`；50,000 局训练；固定独立种子 100 局，无探索，单局上限 1000 |
| 最终提交模型平均分 | 663.73 | 原始连续播放流程 100 局，无单局 1000 分上限 |
| 最终模型中位数 / 最高分 | 436 / 6514 | 同上；标准差 818.16，反映不同局面的波动 |
| 最终 Q 表条目 | 11,202 | `q_best.pkl`，与 `QValues/q_663.pkl` 一致 |

这些结果来自两种不同评估协议，因此分别报告，不将受 1000 分截断的参数扫描分数与最终连续播放分数混为同一统计量。

![单因素参数扫描：学习率、折扣因子、探索率和死亡奖励对测试平均分的影响](/projects/flappy-bird-qlearning/parameter-comparison.png)

*单因素参数扫描。误差棒为同一模型 100 局测试分数的总体标准差，而非多次独立训练的置信区间。*

## 代码与实验产物

项目包含 Q-Learning 实现、参数扫描、状态定义消融、训练曲线、每局分数 CSV 与保存的 Q-table。重现实验的入口是 `src/parameter_sweep.py` 和 `src/state_sweep.py`；章节页说明参数、随机种子和分数上限等口径。
