---
title: "flash"
published: 2026-07-01
description: "你记得的“每个管子都是一个单元”基本对，但后面要改一下："
tags: []
category: "digital IC"
draft: false
---
你记得的“每个管子都是一个单元”基本对，但后面要改一下：

**不是每个单元都有一根独立 bitline。**
更准确地说：

**一个单元 = 一个浮栅/电荷俘获 MOS 管，位于某一根 Word Line 和某一根 Bit Line 的交点附近。**

二维阵列可以想成这样：

```text
          BL0      BL1      BL2      BL3
WL0     cell     cell     cell     cell
WL1     cell     cell     cell     cell
WL2     cell     cell     cell     cell
WL3     cell     cell     cell     cell
```

所以：

**Word Line 横着走，一整行 cell 共用一根 WL。**
**Bit Line 竖着走，一整列 cell 共用一根 BL。**

图里画的不是完整二维阵列，而是**抽出一根 bitline 对应的一列结构**来看。

---

## NAND Flash：一根 BL 下挂一串 cell

左边 NAND Flash 画的是：

```text
BL
 |
select gate
 |
cell WL7
 |
cell WL6
 |
cell WL5
 |
...
 |
cell WL0
 |
select gate
 |
GND
```

也就是说，**同一根 bitline 上的一组 cell 是串联的**。

读取某一个 cell，比如 WL3 时：

```text
BL
 |
WL7  pass
 |
WL6  pass
 |
WL5  pass
 |
WL4  pass
 |
WL3  read   <- 真正被读取的 cell
 |
WL2  pass
 |
WL1  pass
 |
WL0  pass
 |
GND
```

未被选择的 WL0、WL1、WL2、WL4...WL7 会加一个比较高的 pass voltage，让它们无论存的是 0 还是 1 都尽量导通。真正要判断的是 WL3 这个 cell 在 read voltage 下导不导通。

所以 NAND Flash 的逻辑意义是：

**只有整串都导通，BL 才能被拉低。**

这就像 NAND 结构里一串 NMOS 串联，所以叫 NAND Flash。

---

## NOR Flash：每个 cell 单独把 BL 拉到 GND

右边 NOR Flash 结构更像传统 ROM / NOR 阵列：

```text
BL
 |
 +--- cell WL0 --- GND
 |
 +--- cell WL1 --- GND
 |
 +--- cell WL2 --- GND
 |
 +--- cell WL3 --- GND
 |
...
```

每个 cell 的 drain 接 bitline，source 接 ground，gate 接 wordline。

读取 WL3 时，只开 WL3：

```text
BL
 |
 +--- WL0 off
 |
 +--- WL1 off
 |
 +--- WL2 off
 |
 +--- WL3 selected
 |
 +--- WL4 off
```

如果 WL3 对应的 cell 在当前阈值下导通，bitline 被拉低；如果不导通，bitline 保持高电平。

所以 NOR Flash 的意义是：

**任意一个被选中的 cell 导通，就能把 BL 拉低。**

这就像 NOR 阵列里并联 NMOS 的结构，所以叫 NOR Flash。

---

## 这张图“化成这样”的意义

它不是在说完整 layout 长这样，而是在强调两种 Flash 的**连接拓扑**：

| 类型         | 同一根 BL 下 cell 的连接方式 | 读出特点           | 面积 | 随机读取速度 |
| ---------- | ------------------- | -------------- | -- | ------ |
| NAND Flash | 串联                  | 要经过一串 cell     | 小  | 慢      |
| NOR Flash  | 并联                  | 单个 cell 直接拉 BL | 大  | 快      |

NAND 里面很多 cell 串起来，共用上下选择管和扩散区，所以面积非常省，适合 SSD、U 盘、eMMC、手机存储。

NOR 里面每个 cell 都能比较直接地连到 bitline，因此随机读取快，适合代码执行，也就是 XIP，常用于 BIOS、Boot ROM、嵌入式 Flash。

---

## 你原来的疑惑可以这样修正

你说：

> 每个这个管子都是一个单元。

对。

> bitline 事实上每个单元都有一个 bitline？

不对。应该是：

**每一列共享一根 bitline。一个 bitline 下面挂很多 cell。**

> wordline 也是每个管子一个 line？

也不完全对。应该是：

**每一行共享一根 wordline。一个 wordline 同时控制很多列上的 cell。**

所以一个 cell 由：

```text
某根 WL 选择行
某根 BL 读出列
```

共同定位。

---

最核心的一句话是：

**Flash cell 是二维阵列里的交点；这张图只是抽出一根 bitline 的纵向结构，展示 NAND 是串联 cell string，NOR 是并联 cell 到 bitline。**
