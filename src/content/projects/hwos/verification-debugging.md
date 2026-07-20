---
title: "验证与调试：从测试到 HwOSgdb"
summary: "说明单元测试、生成式 verification layers、符号表、DPI-C 和 TUI 调试器如何形成可观测链路。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "Verification", "DPI-C", "Debugger"]
entryType: chapter
parentProject: hwos
section: "验证与评估"
order: 60
navTitle: "验证与调试"
---

## 测试结构

仓库测试覆盖 kernel control、thread lifecycle/reset、StepRef/jump/hijack、export/declare、地址表、同步原语、AXI read、age-ordered regfile、wrapper 生成和 CPU prototypes。测试的主要作用是锁定 API 的周期行为，而不只是检查 elaboration 是否成功。

| 层次 | 产物 | 检查目标 |
| --- | --- | --- |
| Scala/Chisel tests | module simulation | 状态转移和 API 行为 |
| generated verification | assert/assume/cover SV | 协议不变量与覆盖点 |
| symbols/address tables | `.symbols`, JSON/TXT | 源级名称到硬件状态映射 |
| DPI monitor | simulation events | cursor、Step 和调用关系 |
| HwOSgdb | ncurses TUI | 交互式观察与定位 |

## Verification layers

生成目录分别保存 assert、assume 和 cover layer。assume 描述环境前提；assert 检查实现责任；cover 证明关键状态确实可达。三者不能混合，否则可能用环境假设掩盖设计错误。

典型性质包括：阻塞期间状态稳定、合法 Step 编码、一次调用只提交一次、reset 返回入口状态、wrapper 两侧握手保持一致。对 AXI 等外部协议，还需要将环境公平性与 DUT 安全属性分离。

## 可观测链路

lowering 同时导出 thread/Step 到 cursor 编码的符号信息。仿真时 DPI monitor 读取运行时状态，HwOSgdb 再把数值解码为 thread、cycle、Step 和调用关系。这样可以避免仅凭波形中的匿名状态编码推断控制语义。

![HwOSgdb 终端界面](/projects/hwos/hwosgdb.png)

*Preprint Fig. 7，第 11 页：HwOSgdb 通过 DPI-C 和 ncurses 显示 thread、cycle、Step 与调用关系。*

## 局限

- 通过已有测试不等于覆盖任意用户定义 transaction。
- 生成 assert 的完备性必须单独审查。
- HwOSgdb 依赖仿真符号和 DPI，不是片上调试器。
- 形式等价检查和大规模工业回归尚未纳入当前验证流程。
