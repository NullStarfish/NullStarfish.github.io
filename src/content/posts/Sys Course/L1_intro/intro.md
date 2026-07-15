---
title: "intro"
published: 2026-07-01
description: "intro 知识点"
tags: ["计组", "system", "Course"]
category: "System"
draft: false
---
## 1 历史：
第一代：
Vacuum tube真空管
第二代：
Transistor
第三代：
Small/Medium scale integration
第四代：
LSI VLSI
Very Large Scale Integration

## 2 Component：
- CPU
- I/O dev
- Memory
- ROM


## 3 处理器：
Adaptive Compute Acceleration Platform ACPC xilinx
一堆CPU+fpga+npu。NoC：network of chips

DSA:数据流控的



## 4
x86 ISA: 
MMX: 多媒体扩展
SSE: 流媒体扩展
AVX: 向量扩展

tick-tock
tick:制程
tock:架构

## 5 重要思想：
### 摩尔定律：Design for Moore’s Law


### 抽象表示：Use abstraction to simplify design
1. soft-hard codesign
2. interface: ISA， driver...
3. memory: addr+data



### 服务常态：Make the common case fast
1. 从单周期到pipeline
2. cache locality


### 并行：Performance via parallelism
1. data 
2. inst
3. thread

### ILP墙：instruction level parallelism

amdal's law


### 流水线：Performance via pipelining
1. aync 通信

### 预测：Performance via prediction
branch predict
prefetch
...

### 层次化：Hierarchy of memories


### 可靠：Dependability via redundancy
RAID盘




## 6 performance
Performance = 1 / Execution time
CPI: clock per instructoin
MIPS: Millions of Instructions per Second

1 GHz的处理器执行一个程序需要100秒，同时消耗70w的动态功耗和30w的漏电功耗。当频率增加到1.2 GHz时，程序在Turbo boost模式下消耗的能量是否更少?
  
  正常模式下的能量= 100 W x 100 s = 10,000 J
  涡轮模式下的能量= (70 x 1.2 + 30) x 100/1.2 = 9,500 J

注意一下P = alpha C Vdd^2 f