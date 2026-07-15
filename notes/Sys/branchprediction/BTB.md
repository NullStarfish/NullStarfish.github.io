---
title: BTB
description: branch prediction中的BTB
slug: btb
topic: System
tags:
  - 计组
  - branch-prediction
  - system
created: 2026-07-15
draft: false
---


## 作用
BTB：查询当前指令是否是一个分支指令，并得到可能的跳转地址
BHT: 判断当前到底跳不跳


## BHT和BTB的阶段归属：

都属于Fetch阶段
假如我们在Decode才知道，那就浪费一拍了

## Fetch的动作顺序：
1. 查询BTB
2. 查询BHT


ICache查询并行发生


## BTB查询过程：

- 典型BTB line：
```
valid bit
tag
target PC
branch type
```
branch type:记录jal-jalr跳转或者beq跳转
jal-jalr可以直接跳
beq需要经过BHT




- 过程：
```
当前取指 PC
    ↓
用 PC index 查 BTB
    ↓
比较 tag
    ↓
hit：说明这个 PC 可能是一条已见过的分支
miss：当普通顺序指令处理
```



## 更新：
用后端信息更新：
需要更新：
1. 当前pc是否是一个跳转
2. 当前pc的type
3. 当前pc的跳转target



