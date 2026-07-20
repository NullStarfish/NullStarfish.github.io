---
title: "任务与训练接口：环境、动作和奖励"
summary: "定义 Flappy Bird 环境接口、12 维观测、二元动作、奖励语义与训练时的终止处理。"
published: 2026-06-01
updated: 2026-07-20
status: completed
draft: false
tags: ["Gymnasium", "MDP", "Reward"]
entryType: chapter
parentProject: "flappy-bird-qlearning"
section: "建模"
order: 1
navTitle: "任务与环境"
---

## 环境配置

训练使用 `flappy-bird-gymnasium` 的 `FlappyBird-v0`。创建环境时显式设置 `use_lidar=False`，避免使用默认的 LIDAR 观测；同时设置 `normalize_obs=True`，使坐标与速度以归一化数值输出。

```python
env = gymnasium.make(
    "FlappyBird-v0",
    render_mode=None,
    use_lidar=False,
    normalize_obs=True,
)
```

每一步动作 `a ∈ {0, 1}`：`0` 表示不拍翅，`1` 表示 flap。环境原始观测包含最近三组管道坐标、小鸟纵坐标、垂直速度和旋转角，共 12 维；后续状态编码只选择其中与当前决策直接相关的部分。

## 奖励处理

环境的基础反馈同时含有逐帧存活、过管道和终止事件。训练代码将死亡对应的 `-1` 替换为可配置的大负奖励 `death_reward`，基线为 `-1000`：

```python
next_obs, reward, terminated, truncated, info = env.step(action)
if reward == -1:
    reward = death_reward
```

这是奖励尺度设计而非环境规则修改：密集的存活奖励会累积，而终止只出现一次。若死亡惩罚过小，碰撞风险难以沿 TD 更新回传到提前修正轨迹的状态。该设计的对比结果见[实验设计](/projects/flappy-bird-qlearning/experiment-protocol/)。

## 训练与评估的边界

训练阶段使用 ε-greedy 策略；评估阶段关闭探索，仅执行当前 Q 表的贪心动作。参数扫描的每个实验训练 50,000 局、评估 100 局，并设置 `score_limit=1000` 限制单局长度；最终模型复测使用原始连续播放流程且不使用这一分数上限。两类统计量在项目中始终分开呈现。
