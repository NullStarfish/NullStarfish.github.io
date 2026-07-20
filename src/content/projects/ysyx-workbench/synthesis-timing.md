---
title: "综合与时序：正确解释 55 nm STA 报告"
summary: "记录 Yosys、ICSprout55 工艺库、逻辑面积、关键路径和未收敛约束，避免把约束频率当作实现频率。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["Yosys", "STA", "55nm", "PPA"]
entryType: chapter
parentProject: ysyx-workbench
section: "实现评估"
order: 80
navTitle: "综合与时序"
---

## 工具与条件

当前 `yosys-sta.sh` 先生成 `myCore` SystemVerilog，再调用 Yosys 综合和 iEDA STA。PDK 配置为开源 ICSprout55，标准单元 Liberty 文件是 `typ_tt_1p2_25_nldm.lib`，即 typical-typical、1.2 V、25°C 的 NLDM 条件。

| 项目 | 实现结果 | 说明 |
| --- | ---: | --- |
| 工艺库 | ICSprout55 | 55 nm 开源 PDK |
| PVT | TT / 1.2 V / 25°C | Liberty timing corner |
| 组合与时序单元数 | 39,674 | Yosys mapped cells |
| cell area | 186,452.84 | Liberty area 单位，不等同于布局后芯片面积 |
| sequential area | 127,844.64 | 占 cell area 68.57% |
| 最差 max path | 1.391 ns | 2026-07-14 报告 |
| 报告 Freq | 695.328 MHz | 由该关键路径估算 |

## 5 GHz 的含义

脚本中的 `CLK_FREQ_MHZ=5000` 生成 0.2 ns 时钟约束。它是一次激进的约束扫描，不是设计达成 5 GHz 的声明。报告给出的 required path 约 0.153 ns，而实际 path delay 为 1.391 ns，slack 为 -1.238 ns，明确标记 `VIOLATED`。

因此可严谨陈述为：在上述库与模型下，报告最差数据路径为 1.391 ns，工具给出的对应频率估算为 695.328 MHz；设计没有在 5 GHz 约束下收敛。这个估算也不是流片签核频率，因为当前流程没有包含完整布局布线寄生、跨 corner 签核、IR drop、OCV 和完整 SoC 环境。

## 关键路径解释

最新最差端点位于 I0-I1 之间的 I-Cache response word 寄存器，说明 cache line word 选择和前端寄存器输入是主要组合路径之一。更早的 2026-06-03 报告最差路径为 1.531 ns、工具估算 632.861 MHz；两者对应不同代码快照，正文以日期更新的 2026-07-14 报告为当前结果。

## 后续评估要求

- 固定 Git commit、生成参数、PDK 和 PVT 后再比较优化。
- 分别报告 Core-only 与完整 SoC，避免把外设/IP 排除后的面积称为芯片面积。
- 对可实现目标频率重新运行综合，而不是只用违反约束的路径倒数。
- 补充 worst/slow corner、线延迟和布局后 STA 后，才讨论签核裕量。
