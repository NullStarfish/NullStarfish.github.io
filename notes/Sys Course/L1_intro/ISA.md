---
title: ISA
description: ISA 知识点
slug: isa-arch-course
topic: System
tags:
  - 计组
  - system
  - Course
created: 2026-07-01
draft: false
---
# RISCV：

RV32 I:整数，x0-x31 (gpr)
E：嵌入式：x0-x15
M: 乘除法扩展

常见的+
ecall, mret, fence.i, fence, csr bundle
组成I


# assembly:
汇编语言
寄存器没有类型
操作(Operation)来解释寄存器内容

opecode 和 operands


# memory:
byte addressed
but usually 4 bytes aligned

store没有u后缀。
只有对于cpu，才有unsigned和signed的含义。
而且store没有bit 扩展
load需要扩展到32bits



# 编写assembly:
while, for, if要会写




add x9, x8, x0 # x9=&A[0]
add x10, x0, x0 # sum=0
add x11, x0, x0 # i=0
Loop:
  lw x12, 0(x9) # x12=A[i]
  add x10,x10,x12 # sum+=
  addi x9,x9,4  # &A[i++]
  addi x11,x11,1 # i++
  addi x13,x0,20 # x13=20
  blt x11,x13,Loop 



# function call:
caller 侧：
  1. 准备参数：a0-a7，超过 8 个放栈上
  2. 必要时保存 caller-saved registers
  3. jal / jalr 调用函数

callee 侧：
  1. prologue：建立栈帧，保存 ra / s0-s11 等需要保存的寄存器
  2. function body
  3. epilogue：恢复寄存器，释放栈帧，ret


注意一下caller saved和callee saved
prologue和epilogue完全讲的是一个callee应该怎么做

# 几个比较容易搞错的Inst：
1. 注意一下I-type：
虽然imm只有12位，但是大部分全部都要sign ext

2. auipc:
rd = pc + imm << 12。不改变pc
配合jalr： rd = pc + 4; pc = rs1 + offset。能够长距离跳转

3. b-type和s-type唯一的区别在于imm的编码方式
b-type imm[0]固定为0
首先大部分inst都是4-bytes aligned。
这里之所以imm[1]依旧被编码。是因为还有短指令的存在


