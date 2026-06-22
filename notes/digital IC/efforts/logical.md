---
title: Logical effort的推导和近似
description: logical effort的严格推导
slug: logical-effort
topic: 数字集成电路
tags:
  - 数集
  - gate
created: 2026-06-18
draft: false
---

可以。这里推导的是 **N 输入 NAND 的 logical effort**：




## __关键近似__: 输出电容只有并联的，和串联最近的那个diffusion

\[
g_{\text{NAND}N} = \frac{N+2}{3}
\]

核心定义是：

\[
g = \frac{C_{\text{in,gate}}}{C_{\text{in,inv}}}
\]

前提是：**这个 NAND 已经被 sizing 到和单位 inverter 有相同的输出驱动能力。**

---

先定义单位 inverter：

```text
VDD
 |
PMOS, W = 2
 |
Y
 |
NMOS, W = 1
 |
GND
```

一般假设 PMOS 迁移率较低，所以为了让上拉和下拉能力接近，取：

\[
W_p = 2
\]

\[
W_n = 1
\]

因此单位 inverter 的输入电容是：

\[
C_{\text{in,inv}} = C_{g,n} + C_{g,p}
\]

按宽度近似 gate 电容：

\[
C_{\text{in,inv}} = 1 + 2 = 3
\]

所以单位 inverter 的归一化输入电容是 3。

---

现在看 N 输入 NAND：

```text
VDD
 |---- PMOS A ----|
 |---- PMOS B ----|
 |---- PMOS C ----|---- Y
 |      ...       |
 |---- PMOS N ----|

Y -- NMOS A -- NMOS B -- ... -- NMOS N -- GND
```

PUN 是 N 个 PMOS 并联。
PDN 是 N 个 NMOS 串联。

---

要让 NAND 的输出驱动能力和单位 inverter 一样，我们要分别看 worst-case 上拉和下拉。

### 1. 下拉网络 PDN

单位 inverter 的下拉路径只有一个 NMOS：

\[
R_{\text{inv,down}} = R_n
\]

NAND-N 的下拉路径有 N 个 NMOS 串联。

如果每个 NMOS 还是宽度 1，那么总电阻大约是：

\[
R_{\text{down}} = N R_n
\]

太慢。

为了让总下拉电阻回到单位 inverter 的水平，需要把每个 NMOS 宽度放大 N 倍。

因为 MOS 导通电阻近似满足：

\[
R \propto \frac{1}{W}
\]

所以每个 NMOS 取：

\[
W_n = N
\]

于是每个 NMOS 的电阻变成：

\[
\frac{R_n}{N}
\]

N 个串联后：

\[
R_{\text{down}} = N \cdot \frac{R_n}{N} = R_n
\]

这样 NAND 的最坏下拉能力等于单位 inverter。

---

### 2. 上拉网络 PUN

NAND 的 PUN 是 N 个 PMOS 并联。

输出从 0 拉到 1 时，只要有一个输入为 0，对应的 PMOS 打开，就能上拉。

worst-case 上拉路径通常是只有一个 PMOS 导通。

为了让这个 worst-case 上拉能力等于单位 inverter，每个 PMOS 就应该和单位 inverter 的 PMOS 一样大：

\[
W_p = 2
\]

所以 NAND-N 中，每个输入控制：

* 一个 NMOS，宽度是 N；
* 一个 PMOS，宽度是 2。

---

因此，对于 NAND 的任意一个输入，它看到的 gate 电容是：

\[
C_{\text{in,NAND}} = C_{g,n} + C_{g,p}
\]

按宽度近似：

\[
C_{\text{in,NAND}} = N + 2
\]

而单位 inverter 的输入电容是：

\[
C_{\text{in,inv}} = 1 + 2 = 3
\]

所以 logical effort 是：

\[
g_{\text{NAND}N}
= \frac{C_{\text{in,NAND}}}{C_{\text{in,inv}}}
\]

代入：

\[
g_{\text{NAND}N}
= \frac{N+2}{3}
\]

这就是结论。

---

比如 2 输入 NAND：

\[
g_{\text{NAND2}} = \frac{2+2}{3} = \frac{4}{3}
\]

因为每个输入看到：

\[
C_{\text{in}} = 2 + 2 = 4
\]

而单位 inverter 输入电容是：

\[
C_{\text{in,inv}} = 3
\]

---

3 输入 NAND：

\[
g_{\text{NAND3}} = \frac{3+2}{3} = \frac{5}{3}
\]

每个输入看到：

\[
C_{\text{in}} = 3 + 2 = 5
\]

所以：

\[
g = \frac{5}{3}
\]

---

一句话总结：

**NAND-N 为了抵消 N 个串联 NMOS 的电阻，每个 NMOS 要放大到 N；而每个 PMOS 仍是 2。因此每个输入看到的 gate 电容是 N+2，相比单位 inverter 的 3，就得到 g = (N+2)/3。**
