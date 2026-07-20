---
title: "结果与复现：状态消融、最终模型与限制"
summary: "汇总状态定义对比、三个保存模型的统一复测，以及可复现命令、随机性边界和后续改进方向。"
published: 2026-06-01
updated: 2026-07-20
status: completed
draft: false
tags: ["Ablation", "Results", "Reproducibility"]
entryType: chapter
parentProject: "flappy-bird-qlearning"
section: "实验"
order: 5
navTitle: "结果与复现"
---

## 状态定义消融

状态扩展实验固定 `α = 0.5`、`γ = 0.95`、`ε = 0.1`、`m = 30`，每种状态训练 10,000 局、评估 30 局。三维基线状态平均分 9.60；加入上下边界、旋转角、下一根管道或组合成七维状态后，Q-table 条目增多，但在该训练预算下没有提高得分。

| 状态 | 维度 | 平均分 | Q-table 条目 |
| --- | ---: | ---: | ---: |
| `baseline3` | 3 | 9.60 | 10,015 |
| `boundaries4` | 4 | 1.83 | 12,920 |
| `angle4` | 4 | 0.63 | 11,464 |
| `next_pipe5` | 5 | 0.00 | 20,501 |
| `rich7` | 7 | 0.00 | 28,657 |

![状态定义实验的测试平均分](/projects/flappy-bird-qlearning/state-comparison.png)

![状态定义的 Q-table 规模与测试平均分关系](/projects/flappy-bird-qlearning/state-size-vs-score.png)

这组实验的结论是：对于表格型方法，新增变量需要带来足够的信息增益，才能抵消状态空间扩大所造成的经验稀疏；更多传感器输入并不自动提高策略质量。

## 最终模型复测

参数扫描之后，项目保留了三个 Q-table 里程碑，并按同一连续播放流程各复测 100 局：

| 模型 | 平均分 | 中位数 | 标准差 | 最低分 | 最高分 | 条目数 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `q_396.pkl` | 396.41 | 291.0 | 342.37 | 8 | 1457 | 11,731 |
| `q_547.pkl` | 547.46 | 391.5 | 519.25 | 8 | 3098 | 12,009 |
| `q_663.pkl` | **663.73** | **436.0** | 818.16 | 7 | **6514** | 11,202 |

根目录的 `q_best.pkl` 与 `q_663.pkl` 内容一致，因此最终提交选用后者。高标准差说明不同游戏序列间仍存在显著波动，故项目同时给出平均分、中位数、完整测试局数和最高分。

## 复现入口

```bash
cd src
python3 parameter_sweep.py       # 50,000 局参数扫描
python3 state_sweep.py --quick   # 10,000 局状态定义快速实验
python3 train_ai_or_play.py      # 加载 q_best.pkl，连续测试 100 局
```

需要 Python、NumPy、Matplotlib、Gymnasium、Pygame 和 `flappy-bird-gymnasium`。实验输出保存为 CSV、PNG 和 pickle；评估脚本使用显式种子，便于复核同一协议。

## 当前限制

- 每组参数扫描只训练一个模型，不能将单次训练差异完全与随机训练轨迹分离；
- 参数扫描的单局上限造成高分样本右删失；
- 表格型 Q-Learning 不共享相邻连续状态的参数，加入高维观测后样本效率迅速下降。

后续可在多个训练种子上重复候选配置，并报告跨模型均值与置信区间；若需要利用更多连续观测，则可转向 tile coding 或函数近似。
