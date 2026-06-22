---
title: "快速定义Bundle类型"
description: "关于“快速定义Bundle类型”的学习笔记。"
topic: "Scala 与 Chisel"
tags:
  - "Scala"
  - "Chisel"
featured: false
draft: false
---
```scala
	def Op(addr: UInt, wdata: UInt, write: Bool = true.B, strb: UInt = "hF".U) = {
        val res = Wire(new Bundle {
          val addr = UInt(32.W)
          val wdata = UInt(32.W)
          val write = Bool()
          val strb = UInt(4.W)
        })
        res.addr := addr
        res.wdata := wdata
        res.write := write
        res.strb := strb
        res
      }
```
