---
title: "异常与 CSR：机器态控制转移的软硬件边界"
summary: "说明异常识别、CSR 更新、流水线清空、mret 返回以及 AM CTE trap 入口之间的契约。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["RISC-V", "CSR", "Exception", "AM"]
entryType: chapter
parentProject: ysyx-workbench
section: "体系结构"
order: 30
navTitle: "异常与 CSR"
---

## 支持范围

当前译码路径识别 `ecall`、非法指令、`ebreak`、`mret`、`fence.i` 和六类 CSR 读改写指令。机器态 CSR 模块实现 `mstatus`、`mtvec`、`mepc`、`mcause` 的读写与 trap/mret 状态变换。

| 操作 | 硬件动作 | 控制流目标 |
| --- | --- | --- |
| `ecall` | 写入 `mepc`、`mcause`，更新 `mstatus` | `mtvec` |
| 非法指令 | 记录异常原因并禁止普通副作用 | `mtvec` |
| `mret` | 恢复 MIE/MPIE/MPP 相关状态 | `mepc` |
| CSR R/W/S/C | 读取旧值并执行 write/set/clear | 顺序下一条 |
| `fence.i` | 使指令缓存状态失效并清理前端 | 顺序下一条重新取指 |

## 精确异常边界

异常在指令携带的元数据中向后传播，并在能够保证顺序性的控制点执行架构状态更新。发生异常的指令不产生普通寄存器或存储器副作用；更年轻的流水级被清空；更老指令已经形成的合法结果不被撤销。

`mepc` 保存可恢复的异常 PC，`mcause` 保存原因编码，`mtvec` 给出机器态入口。进入 trap 时，`mstatus.MPIE` 保存原 MIE、MIE 被清零、MPP 被设置为机器态；执行 `mret` 时完成逆向恢复。CSR 范围限定为当前机器态异常路径所需字段，不覆盖完整 privileged specification。

## 与 AM CTE 的接口

AM 的 CTE 初始化函数安装 trap handler 并写入 `mtvec`。汇编入口保存通用寄存器和必要的机器态现场，C 侧根据 `mcause` 将事件分类为 syscall、yield 或错误，再返回新的 Context。恢复路径最终执行 `mret`。

这条链路有三个必须一致的 ABI：Context 内字段顺序与汇编保存顺序一致；异常号解释与硬件编码一致；返回 Context 中的 PC 与通用寄存器必须在 `mret` 前恢复。

## 验证重点

- `ecall` 前后的 `mepc/mcause/mstatus` 与参考模型一致。
- 异常指令和年轻指令没有可见副作用。
- trap handler 修改 Context 后能够返回新的执行位置。
- 连续 CSR 指令的读旧值、写新值语义正确。
- `fence.i` 后不使用失效前已经返回的旧取指数据。

## 相关技术笔记

- [RISC-V CSR 与临界区](/posts/pl/c/asm/07-完整示例-csr与临界区/)
