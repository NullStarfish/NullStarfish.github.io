---
title: "Timing-Semantic API：调用契约与后端策略"
summary: "定义 API 的握手所有权、阻塞、提交、反压和 reset 语义，并说明稳定前端如何隔离可替换后端。"
published: 2026-07-20
status: active
featured: false
draft: false
tags: ["HwOS", "API", "Handshake", "Backpressure"]
entryType: chapter
parentProject: hwos
section: "API 与组件"
order: 40
navTitle: "时序语义 API"
---

## 契约组成

Timing-semantic API 的类型签名只是契约的一部分。实现和调用者还必须共享状态机级语义：什么时候允许调用、调用后是否阻塞、结果在哪个事件后有效、谁拥有 ready/valid、什么时候可以提交副作用。

以阻塞 read 为例，抽象接口可以表现为“提交地址并等待数据”，但实现必须保证：地址只握手一次；等待期间调用 thread 不前进；返回数据只在响应握手后捕获；reset 不留下虚假的 outstanding 标记。

| 所有权 | 调用侧 | API/组件侧 |
| --- | --- | --- |
| intent | 提供参数并选择调用点 | 不重解释调用意图 |
| protocol | 不手写内部 channel choreography | 驱动并保持 valid/payload |
| blocking | 接受 thread 停留 | 给出唯一完成条件 |
| policy | 不依赖固定仲裁实现 | 可替换仲裁/前递/发布策略 |
| reset | 触发 thread reset | 显式清理所拥有的局部状态 |

## 后端策略隔离

Regfile API 可以保持 reserve/read/writeback 的前端语义，同时替换后端为简单寄存器堆、带前递实现或 age-ordered publication。AXI read API 可以保持调用形状，同时内部处理 channel timing 和 backpressure。可替换性成立的前提是不同后端满足同一可观察契约，而不是仅具有同名 Scala 方法。

## 提交边界

HwOS 区分“操作已经开始”“结果已经产生”和“结果已经公开”。例如算术服务可能很早得到结果，但 age-ordered regfile 只有在顺序策略允许时才发布写回。API 必须明确 commit 点，否则调用者无法判断 reset、重试或并发调用是否会重复副作用。

## Reset 与 reclaim

当前主线不把 ownership/ACL 或系统级 reclaim 放进基础模型。thread reset 只复位基础 runtime；组件通过 `registerReset` 注册其 reservation、semaphore 或 lease 清理。这种显式策略增加了一项声明责任，但避免隐藏的全局回收逻辑改变普通 API 的时序。

## 验证要求

- valid 被 backpressure 阻塞时 payload 稳定。
- 每次 admission 对应至多一次 commit。
- reset 后不存在幽灵响应或永久占用 reservation。
- 替换后端不改变前端可观察的阻塞和提交语义。
