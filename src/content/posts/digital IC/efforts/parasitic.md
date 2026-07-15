---
title: "Parasitic effort的推导和近似"
published: 2026-06-18
description: "parasitic effort的严格推导"
tags: ["数集", "gate"]
category: "数字集成电路"
draft: false
---
`p = N` 来自 **输出节点 diffusion capacitance 的归一化估算**。


## 关键近似：out依旧只看PUN和PDN的第一个。但是PDN的第一个电容本身就是N

先记住 parasitic effort 的定义：

\[
p = \frac{C_{\text{par,out}}}{C_{\text{in,inv}}}
\]

其中 `Cpar,out` 是**直接挂在输出节点上的寄生扩散电容**，不是所有内部节点电容。

---

单位 inverter 尺寸：

\[
W_n = 1：
\]

\[
W_p = 2
\]

所以单位 inverter 的输入电容是：

\[
C_{\text{in,inv}} = C_{g,n} + C_{g,p} = 1 + 2 = 3
\]

这里把单位宽度 NMOS 的 gate 电容记成 1。

---

N 输入 NAND 为了和单位 inverter 有相同驱动能力，尺寸是：

\[
W_n = N
\]

\[
W_p = 2
\]

也就是每个串联 NMOS 放大到 `N`，每个 PMOS 仍然是 `2`。

结构上：

```text
VDD
 |---- p1 ----|
 |---- p2 ----|
 |    ...     |---- Y
 |---- pN ----|

Y ---- n1 ---- x1 ---- n2 ---- x2 ---- ... ---- nN ---- GND
```

输出节点 `Y` 直接连着：

1. N 个 PMOS 的 drain diffusion；
2. 最上面那个 NMOS 的 drain diffusion。

所以：

\[
C_{\text{par,out}}
\approx N C_{d,p} + C_{d,n,\text{top}}
\]

按 diffusion capacitance 与晶体管宽度成正比：

\[
C_{d,p} \approx 2
\]

\[
C_{d,n,\text{top}} \approx N
\]

因此：

\[
C_{\text{par,out}} \approx N \cdot 2 + N = 3N
\]

再除以单位 inverter 输入电容：

\[
p_{\text{NAND}N}
= \frac{C_{\text{par,out}}}{C_{\text{in,inv}}}
= \frac{3N}{3}
= N
\]

所以：

\[
p_{\text{NAND}N} = N
\]

---

注意这里**不是**说整个 PDN 的所有 diffusion 电容都并到了输出上。

串联 NMOS 的中间节点电容，比如：

```text
Y ---- n1 ---- x1 ---- n2 ---- x2 ---- n3 ---- GND
```

`x1`、`x2` 上的 diffusion capacitance 没有直接接在输出 `Y`，所以在最基础的 logical effort 估算里没有显式计入 `p`。

它们确实会通过 RC 链影响真实 delay，但经典 logical effort 的 `p = N` 是一个一阶近似，只看输出节点直接挂载的 diffusion capacitance。

---

举个例子，2 输入 NAND：

尺寸：

\[
W_n = 2
\]

\[
W_p = 2
\]

输出节点上有：

\[
2C_{d,p} + C_{d,n}
\]

代入宽度：

\[
2 \cdot 2 + 2 = 6
\]

单位 inverter 输入电容：

\[
3
\]

所以：

\[
p_{\text{NAND2}} = \frac{6}{3} = 2
\]

---

3 输入 NAND：

尺寸：

\[
W_n = 3
\]

\[
W_p = 2
\]

输出节点上有：

\[
3C_{d,p} + C_{d,n}
\]

代入宽度：

\[
3 \cdot 2 + 3 = 9
\]

归一化：

\[
p_{\text{NAND3}} = \frac{9}{3} = 3
\]

---

所以本质就是一句话：

**N 输入 NAND 的输出节点直接挂着 N 个宽度为 2 的 PMOS diffusion，加上 1 个宽度为 N 的 NMOS diffusion，总输出寄生约为 3N；再除以单位 inverter 输入电容 3，所以 p = N。**
