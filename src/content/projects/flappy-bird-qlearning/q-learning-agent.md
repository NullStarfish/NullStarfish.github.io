---
title: "Q-Learning 实现：更新、探索与并列动作"
summary: "说明稀疏 Q-table、TD 更新和 ε-greedy 策略，以及未知状态下随机并列打破的实现原因。"
published: 2026-06-01
updated: 2026-07-20
status: completed
draft: false
tags: ["Q-Learning", "TD Learning", "Exploration"]
entryType: chapter
parentProject: "flappy-bird-qlearning"
section: "算法实现"
order: 2
navTitle: "Q-Learning 智能体"
---

## 稀疏 Q-table

值函数用 Python 字典表示：键为可哈希的 `(state, action)`，值为对应的动作价值。未访问条目返回 0，因此不需要预分配完整状态空间。

对样本 `(s, a, s', r)`，实现使用标准一阶 TD 更新：

$$
Q(s, a) \leftarrow (1 - \alpha)Q(s, a) + \alpha [r + \gamma \max_{a'} Q(s', a')].
$$

其中 `alpha` 是学习率、`gamma` 是折扣因子。动作集合固定为 `{0, 1}`。

## ε-greedy 与并列打破

训练时以概率 `epsilon` 随机采样动作，否则选择 Q 值最大的动作。未访问状态通常有 `Q(s, 0) = Q(s, 1) = 0`；若在此处固定选择 flap，会让大量未知状态产生系统性向上偏置。

实现改为随机打破 Q 值并列：

```python
if q0 == q1:
    optimal_action = random.choice([0, 1])
elif q0 > q1:
    optimal_action = 0
else:
    optimal_action = 1
```

这个规则与 ε-greedy 的随机探索互补：即使没有触发 ε 分支，价值完全未知的两个动作仍保持对称。报告中的对照表明，仅修正该并列规则即可显著减轻策略的动作偏置；它被保留为最终训练版本的一部分。

## 终止状态

当前实现将 `next_state` 传入统一的更新接口，`best_future_reward()` 对未访问状态返回 0；在游戏终止后的下一状态尚无条目时，等价于终止 bootstrap 项为 0。更显式的实现可以在 `terminated` 时直接使用 `r` 作为 TD target，但这不会改变当前记录实验的实现口径。
