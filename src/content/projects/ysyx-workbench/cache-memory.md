---
title: "Cache 与访存：从命中查询到 AXI burst refill"
summary: "记录当前 I-Cache 参数、LRU 替换、miss refill、fence.i 以及 IFU/LSU 共享 AXI4 的控制约束。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["Cache", "AXI4", "Memory", "Chisel"]
entryType: chapter
parentProject: ysyx-workbench
section: "存储与系统"
order: 40
navTitle: "Cache 与访存"
---

## I-Cache 参数

当前 `Core.scala` 选择 `SimpICache` 配置，而不是课程目录中保留的 8 KiB 配置。

| 参数 | 当前值 | 推导 |
| --- | ---: | --- |
| 容量 | 2 KiB | 32 B × 32 sets × 2 ways |
| 相联度 | 2-way | `ways = 2` |
| cache line | 32 B | 8 个 32-bit word |
| 组数 | 32 | 5-bit index |
| 替换 | 精确 LRU | 每组一个 LRU way 状态 |
| refill | AXI burst | 以整条 line 为单位 |

访问地址拆分为 tag、set index、word offset 和 byte offset。两路 tag/valid 并行比较；命中后按 word offset 选择 32-bit 指令。miss 时选择无效路或 LRU victim，并以 line base 发起 refill。

## Miss 和 refill 状态机

一次 miss 只能拥有一条活动 refill。控制器保存 miss 地址、victim way 和返回 beat 位置；每次 `r.valid && r.ready` 接收一个 beat；只有看到 `r.last` 后，新的 tag、data line 和 valid 位才作为完整 cache line 对外可见。

分支或异常可能在 refill 尚未结束时改变 PC。AXI 事务仍必须被完整排空，因此控制器不能简单撤销 ready。实现通过记录应丢弃的旧响应，使总线继续完成，同时阻止旧 line 或旧 instruction 污染新路径。

## `fence.i`

`fence.i` 用于建立此前数据写入和后续指令获取之间的可见性。当前实现清理 I-Cache 有效状态并刷新前端。若总线上已有未完成读事务，必须先处理其协议生命周期，再允许新的取指结果提交。

## IFU/LSU 仲裁

MemoryController 向外提供一个 AXI4 master。IFU 发出只读、可能 burst 的 refill；LSU 发出 byte/half/word load/store。读仲裁器必须记录响应归属，不能根据响应到达时的请求电平重新判断 owner。写地址、写数据和写响应三个 AXI channel 则由 LSU 状态机分别握手。

验证集中在以下边界：随机 backpressure、连续 hit/miss、refill 中 flush、`fence.i` 与 miss 并发、IFU/LSU 竞争以及不同访问宽度的字节掩码。

## 相关技术笔记

- [Interconnect](/posts/linux-101/scala-chisel-notes/interconnect/)
- [Arbiter：Chisel 仲裁器实例](/posts/linux-101/scala-chisel-notes/实战例子/arbiter/)
