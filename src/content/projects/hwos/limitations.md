---
title: "限制与评估计划"
summary: "列出当前没有数据支持的主张、API 稳定性风险、验证缺口和下一步可复现实验。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "Limitations", "Evaluation", "Roadmap"]
entryType: chapter
parentProject: hwos
section: "验证与评估"
order: 80
navTitle: "限制与评估计划"
---

## 当前成立的结论

Thread/Step 控制流可以 lower 为 Chisel/RTL，并同步生成符号表和 verification layer；AXI read、regfile、同步原语与 CPU prototype 覆盖主要 timing-semantic API 组合。

## 当前不能据此推出的结论

- 尚未建立覆盖全部 API 的统一手写 FSM 面积与频率基线。
- 早期 preprint 的归一化 micro-benchmark 不代表当前实现。
- CPU prototypes 不是性能调优后的处理器，不能用于架构性能排名。
- 现有测试与断言不构成对任意用户程序的死锁自由证明。
- HwOS API 仍在演进，不承诺当前所有名字和 lowering 细节长期稳定。

## 主要技术风险

| 风险 | 可能影响 | 评估方法 |
| --- | --- | --- |
| 控制抽象增加 mux depth | 降低 Fmax | 综合与 STA 路径分类 |
| 并发仲裁进入关键路径 | 面积/时序增长 | 不同并发度 sweep |
| reset hook 遗漏 | reservation 泄漏或死锁 | reset injection + assertions |
| API 契约不完整 | 后端替换后行为漂移 | contract tests / trace equivalence |
| 状态编码增长 | 面积线性或更差增长 | Step 数量 sweep |
| debug 元数据耦合实现 | 优化后符号失真 | 生成物一致性检查 |

## 决策完整的评估方案

1. 选取 AXI read、age-ordered regfile、structured control 三类代表组件。
2. 为每类编写功能等价的手写 Chisel/SystemVerilog 基线。
3. 固定 Chisel、综合工具、工艺库、约束和测试向量。
4. 比较寄存器数、组合单元面积、关键路径、动态切换估算和源码/断言规模。
5. 扫描并发 caller 数、Step 数和 backpressure 分布，报告趋势而非单点。
6. 对相同 transaction trace 比较 admission、completion 和 commit 序列。

## 下一步研究问题

- 能否从 API 契约自动生成足够强的安全断言？
- 哪些后端策略可以在不改变调用语义的情况下自动选择？
- 如何对 control lowering 做状态合并，同时保持源级调试映射？
- 如何定义可组合的取消语义，而不重新引入隐式全局 reclaim？

性能评估需要固定版本、工具、约束、基线和随机种子，并保存生成 RTL 与完整报告。
