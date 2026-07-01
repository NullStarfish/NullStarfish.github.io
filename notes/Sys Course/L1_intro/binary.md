---
title: binary
description: binary 知识点
slug: binary-arch-course
topic: System
tags:
  - 计组
  - binary
  - encoding
  - system
  - Course
created: 2026-07-01
draft: false
---

# variable and its size:
注意：long就是位宽
pointer也是位宽（总线宽度）

# 运算

operand: 操作数
operator: 算子

& | ^ ~
注意^：对称差：
{0, 3, 5, 6} ^ {0, 2, 4, 6} = {2, 3, 4, 5}
01101001 ^ 01010101 = 00111100


<< 和>>
运算优先级比较低，建议加括号
有logic & arith


# 编码

unsigned & signed（有很多编码）
two's complement: 二进制补码


# 符号扩展
一个例子：
short int y = -15213;
int      iy = (int) y;

y最高位是1,被扩展了

# CSD编码和Booth编码

SD: 0, 1, -1
booth: -2 -1 0 1 2

# 加法：
需要注意的是：
正溢出和负溢出

最关键的是，Signed和Unsigned的回绕方式不同。
Signed的回绕点是max到min
max + 1 = min
当然unsigned也是这样。



floating相关内容请搜索IEEE754