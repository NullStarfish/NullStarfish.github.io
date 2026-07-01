重新按变量消元顺序：

$
T \rightarrow H \rightarrow I
$

求：

$
P(+u\mid +e)
$

联合分布：

$
P(i,h,t,u,e)=P(i)P(h)P(t\mid i)P(u\mid i,h)P(e\mid t,u)
$

所以：

$
P(+u\mid +e)=\alpha \sum_i\sum_h\sum_t P(i)P(h)P(t\mid i)P(+u\mid i,h)P(+e\mid t,+u)
$

为了归一化，也要求 (-u) 的未归一化值。

---

## 1. 消去 (T)

定义：

$
f_T(i,u)=\sum_t P(t\mid i)P(+e\mid t,u)
$

计算：

$
f_T(+i,+u)=0.8\cdot0.9+0.2\cdot0.7=0.86
$

$
f_T(+i,-u)=0.8\cdot0.5+0.2\cdot0.3=0.46
$

$
f_T(-i,+u)=0.5\cdot0.9+0.5\cdot0.7=0.80
$

$
f_T(-i,-u)=0.5\cdot0.5+0.5\cdot0.3=0.40
$

得到：

$
f_T(i,u)
$

| (i)  |  (u) | (f_T(i,u)) |
| ---- | ---: | ---------: |
| (+i) | (+u) |       0.86 |
| (+i) | (-u) |       0.46 |
| (-i) | (+u) |       0.80 |
| (-i) | (-u) |       0.40 |

---

## 2. 消去 (H)

定义：

$
f_H(i,u)=\sum_h P(h)P(u\mid i,h)
$

计算：

$
f_H(+i,+u)=0.6\cdot0.9+0.4\cdot0.3=0.66
$

$
f_H(+i,-u)=0.6\cdot0.1+0.4\cdot0.7=0.34
$

$
f_H(-i,+u)=0.6\cdot0.6+0.4\cdot0.1=0.40
$

$
f_H(-i,-u)=0.6\cdot0.4+0.4\cdot0.9=0.60
$

得到：

| (i)  |  (u) | (f_H(i,u)) |
| ---- | ---: | ---------: |
| (+i) | (+u) |       0.66 |
| (+i) | (-u) |       0.34 |
| (-i) | (+u) |       0.40 |
| (-i) | (-u) |       0.60 |

---

## 3. 消去 (I)

现在剩下：

$
P(i),\quad f_T(i,u),\quad f_H(i,u)
$

定义：

$
g(u)=\sum_i P(i)f_T(i,u)f_H(i,u)
$

### 对 (+u)

$
g(+u)=0.7\cdot0.86\cdot0.66+0.3\cdot0.80\cdot0.40
$

$
g(+u)=0.39732+0.096=0.49332
$

### 对 (-u)

$
g(-u)=0.7\cdot0.46\cdot0.34+0.3\cdot0.40\cdot0.60
$

$
g(-u)=0.10948+0.072=0.18148
$

---

## 4. 归一化

$
P(+u\mid +e)=\frac{g(+u)}{g(+u)+g(-u)}
$

$
=\frac{0.49332}{0.49332+0.18148}
$

$
=\frac{0.49332}{0.67480}
$

$
\boxed{P(+u\mid +e)\approx 0.731}
$

最终答案：

$
\boxed{P(+u\mid +e)=0.731}
$
