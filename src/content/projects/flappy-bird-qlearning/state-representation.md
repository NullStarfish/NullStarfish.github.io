---
title: "状态表示：最近管道、离散化与状态规模"
summary: "从 12 维连续观测提取三维决策状态，并用量化倍率在状态混叠与经验稀疏之间折中。"
published: 2026-06-01
updated: 2026-07-20
status: completed
draft: false
tags: ["State Representation", "Discretization", "Ablation"]
entryType: chapter
parentProject: "flappy-bird-qlearning"
section: "算法实现"
order: 3
navTitle: "状态表示"
---

## 三维离散状态

全量 12 维观测的笛卡尔积会快速超过表格型方法可覆盖的规模。最终状态为：

$$
s = (d_x, d_{\mathrm{bottom}}, v_y),
$$

分别表示小鸟到最近管道的水平距离、小鸟到最近下方管道的垂直距离与垂直速度。小鸟横坐标固定为 `0.2`，管道归一化宽度为 `52 / 288`；小鸟越过上一根管道右边界后，代码切换到下一根管道作为“最近管道”。

```python
if bird_x > obs[0] + pipe_width:
    first_pipe_x, first_bottom_pipe_y = obs[3], obs[5]
else:
    first_pipe_x, first_bottom_pipe_y = obs[0], obs[2]

state = (
    int(m * (first_pipe_x - bird_x)),
    int(m * (first_bottom_pipe_y - obs[9])),
    int(m * obs[10]),
)
```

## 离散倍率

连续变量先乘量化倍率 `m` 再取整。`m` 较小时，不同物理局面映射到同一个 key，产生状态混叠；`m` 过大时，同一局面的经验被拆分到大量稀疏条目。

参数扫描固定其他条件，比较 `m = 10, 20, 30, 50`：

| `m` | 测试平均分 | Q-table 条目数 |
| ---: | ---: | ---: |
| 10 | 0.52 | 1,489 |
| 20 | 2.23 | 5,562 |
| 30 | 10.64 | 11,551 |
| 50 | 10.88 | 20,946 |

`m = 50` 相对 `m = 30` 仅提高 0.24 分，却增加约 81% 条目数；因此最终状态编码选择 `m = 30`。

![离散倍率扫描：状态粒度、测试平均分与 Q-table 规模](/projects/flappy-bird-qlearning/discretization-sweep.png)

*离散倍率实验的测试分数。该图对应单次训练轨迹，主要用于比较状态规模与数据效率，不应用于推断跨随机种子的显著性。*
