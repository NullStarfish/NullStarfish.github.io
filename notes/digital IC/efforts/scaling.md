---
title: effort 归一化和scaling
description: effort 归一化和scaling
slug: effort-scaling
topic: 数字集成电路
tags:
  - 数集
  - gate
created: 2026-06-23
draft: false
---

你这个困惑很正常，因为 **logical effort 里面的 `p`、`g` 都是“归一化”的量**，不是直接拿绝对电容比。

对于一串 inverter：

```text
In -> inv1 -> inv2 -> ... -> invN -> CL
```

每一级 inverter 尺寸都不同，但每一级仍然可以写成：

```text
d_i = g_i h_i + p_i
```

其中：

```text
h_i = C_out_i / C_in_i
```

对 inverter：

```text
g_i = 1
p_i ≈ 1
```

即使每个 inverter 大小不同，这两个仍然成立。

关键在于：**`h_i` 才负责描述“这一极驱动了多大的下一级”**；`g` 和 `p` 是描述这个门本身的结构性质。

---

### 1. 为什么每一级 inverter 的 `g` 还是 1？

logical effort 的定义是：

```text
g = C_in_gate / C_in_inv
```

这里的 `C_in_inv` 指的是：**在相同输出驱动能力下，一个标准 inverter 的输入电容**。

而当前这个门自己就是 inverter，所以无论它放大到多大，它和“同等驱动能力的 inverter”相比，当然就是自己比自己：

```text
g_inv = 1
```

比如：

```text
inv1 输入电容 = 2.5 fF
inv2 输入电容 = 9 fF
inv3 输入电容 = 32 fF
```

它们尺寸不同，但每一个都是 inverter。对每一级来说：

```text
g_1 = g_2 = g_3 = 1
```

尺寸变大只会让它的输入电容变大，也让它的驱动能力变强。**这不是 logical effort 变了，而是 electrical effort `h` 变了。**

---

### 2. 那每一级输入电容不同，体现在哪里？

体现在前一级的负载里。

假设：

```text
C1 = inv1 input capacitance
C2 = inv2 input capacitance
C3 = inv3 input capacitance
...
CL = final load
```

那么各级的 electrical effort 是：

```text
h_1 = C2 / C1
h_2 = C3 / C2
...
h_N = CL / CN
```

所以 inverter chain 的总延迟是：

```text
D = (h_1 + p) + (h_2 + p) + ... + (h_N + p)
```

因为 inverter 的 `g = 1`，所以：

```text
D = h_1 + h_2 + ... + h_N + Np
```

如果每一级都按相同比例放大，令：

```text
h_1 = h_2 = ... = h_N = f
```

那么：

```text
D = N(f + p)
```

对 inverter 取：

```text
p = 1
```

于是：

```text
D = N(f + 1)
```

这就是 slide 里用的式子。

---

### 3. parasitic `p` 到底怎么算？

直觉上，inverter 的输出节点有扩散电容：

```text
C_par = drain diffusion capacitance of PMOS + NMOS
```

这个电容会拖慢输出，所以它贡献 parasitic delay。

但是在 logical effort 里，`p` 不是直接写绝对电容，而是归一化到该门自己的输入电容和单位 inverter 延迟尺度上。

对一个尺寸为 `s` 的 inverter：

```text
C_in = s C_in0
C_par = s C_par0
```

因为输入栅电容和输出扩散电容都会随尺寸线性放大，所以比例近似不变：

```text
C_par / C_in ≈ C_par0 / C_in0
```

所以：

```text
p_inv ≈ constant
```

通常一阶模型直接取：

```text
p_inv = 1
```

这就是为什么虽然每一级 inverter 尺寸不同，但是每一级的 parasitic effort 仍然都近似是 1。

---

### 4. 你问的 “这里的 inv 到底算哪个？”

可以这么理解：

**不是拿整条 chain 里面某一个具体 inverter 当 reference。**

而是对每一级门，各自使用一个“同等驱动能力的 inverter”作为 reference。

因为当前门本身就是 inverter，所以：

```text
g = 1
p ≈ 1
```

对每一级都成立。

比如第 5 级 inverter 很大，它的 reference 不是第 1 级那个最小 inverter，而是：

```text
一个和第 5 级有相同驱动能力的 inverter
```

但它自己就是这个东西，所以 `g = 1`。

---

### 5. 更物理一点的写法

某一级 inverter 的输出延迟可以粗略写成：

```text
t_i ≈ R_i (C_load_i + C_par_i)
```

如果 inverter 尺寸放大 `s_i` 倍：

```text
R_i ≈ R_0 / s_i
C_par_i ≈ s_i C_par0
C_in_i ≈ s_i C_in0
```

于是：

```text
t_i ≈ (R_0 / s_i) C_load_i + (R_0 / s_i)(s_i C_par0)
```

也就是：

```text
t_i ≈ R_0 C_load_i / s_i + R_0 C_par0
```

第一项对应 effort delay：

```text
g h
```

第二项对应 parasitic delay：

```text
p
```

注意第二项里面 `s_i` 抵消了，所以 parasitic delay 对尺寸一阶近似不变。

这就是为什么 inverter 越做越大，虽然它自己的寄生电容也变大，但它的电阻也变小，两者乘积基本保持常数。

---

### 6. 回到这页 slide

它隐含假设是：

```text
每一级都是 inverter
g = 1
p = 1
```

然后选择每一级电气努力相等：

```text
h_i = f
```

因此：

```text
F = h_1 h_2 ... h_N = f^N
```

已知：

```text
F = CL / Cin = 8000
```

所以：

```text
f = F^(1/N)
```

总延迟：

```text
D = N(f + 1)
```

优化后得到：

```text
fopt ≈ 3.6
N ≈ log_3.6(8000) ≈ 7
```

所以它没有逐级重新算不同的 `g` 和 `p`，因为在这个模型下，每一级 inverter 的结构相同，只是缩放尺寸不同：

```text
g_i = 1
p_i = 1
h_i = C_{i+1} / C_i
```

真正变化的是 `h_i`，不是 `g_i`。
