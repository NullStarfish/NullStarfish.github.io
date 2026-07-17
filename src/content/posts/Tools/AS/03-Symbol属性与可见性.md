---
title: "GNU AS Symbol 属性与可见性"
published: 2026-07-16
description: "理解 label、global、weak、hidden、type、size、equ 和 common symbol 如何进入 ELF 符号表。"
tags: ["AS", "ELF", "Symbol"]
category: "AS"
series: { name: "GNU AS 汇编器", order: 4 }
draft: false
---
Symbol 是 assembler、linker 和 debugger 之间的重要接口。一个 ELF symbol 主要包含：

- 名称。
- 值或地址。
- 所属 section。
- binding，例如 LOCAL、GLOBAL、WEAK。
- type，例如 FUNC、OBJECT、NOTYPE。
- visibility。
- size。

---

### 一、Label 负责定义 Symbol

```asm
foo:
  nop
```

`foo:` 把 symbol `foo` 定义为当前位置。默认 binding 通常是 local，type 通常是
`NOTYPE`。

---

### 二、Global Symbol

```asm
.globl foo
.type foo, @function
foo:
  ret
.size foo, . - foo
```

`.globl` 与 `.global` 等价，使 symbol 对其他 `.o` 和 linker 可见。它不负责定义
symbol；真正定义仍然来自 `foo:`。

如果只有：

```asm
.globl external_func
call external_func
```

那么 `external_func` 在当前 `.o` 中是 undefined global symbol，等待 linker 从其他
输入文件解析。

---

### 三、Symbol Type 与 Size

```asm
.type foo, @function
.type global_data, @object
```

它们分别生成 ELF `STT_FUNC` 和 `STT_OBJECT`。这不会改变机器执行，只影响 linker、
debugger、disassembler 和 profiler 对 symbol 的理解。

```asm
.size foo, . - foo
.size global_data, 4
```

`.size` 设置 ELF `st_size`。函数通常用 label 差值计算，object 通常使用实际存储大小。

---

### 四、Weak Symbol

```asm
.weak platform_init
.type platform_init, @function
platform_init:
  ret
```

Weak definition 可以被同名 strong definition 覆盖，常用于提供默认 hook。多个 strong
definition 通常会导致 duplicate symbol error。

仅声明 weak undefined symbol：

```asm
.weak optional_hook
```

链接后若仍未定义，其地址在 ELF 环境中通常解析为 0，但使用前必须结合 ABI 和链接
方式确认。

---

### 五、Visibility

```asm
.globl internal_helper
.hidden internal_helper
```

`.hidden` 将 symbol visibility 设置为 hidden。它仍可能是 GLOBAL binding，但不会被
其他动态组件正常 preempt。静态裸机程序中 visibility 影响较小，在 shared object 和
动态链接中更重要。

还有 `.protected` 和 `.internal`，语义依赖 ELF 动态链接模型。

---

### 六、常量 Symbol

```asm
.equ UART_BASE, 0x10000000
.set UART_TX, UART_BASE
```

`.equ` 和 `.set` 为 symbol 赋表达式值。常见区别是 `.set` 允许后续重新赋值；需要禁止
重复定义时可以使用 `.equiv`。

```asm
.equiv XLEN_BYTES, 4
```

如果 `XLEN_BYTES` 已定义，`.equiv` 会报错。

---

### 七、Common Symbol

```asm
.comm buffer, 256, 16
```

声明一个大小为 256 byte、alignment 为 16 的 common symbol。linker 通常把它分配到
`.bss`。现代 C 工具链更倾向直接生成明确的 `.bss` definition，但旧目标文件和手写
汇编中仍可能遇到 `COMMON`。

局部 common symbol 使用：

```asm
.lcomm local_buffer, 64
```

---

### 八、检查 Symbol Table

```bash
riscv64-linux-gnu-readelf -sW file.o
riscv64-linux-gnu-nm -S file.o
riscv64-linux-gnu-objdump -t file.o
```

检查 `Bind`、`Type`、`Vis`、`Ndx`、`Value` 和 `Size`。

### 参考

- [GNU as Symbols](https://sourceware.org/binutils/docs/as/Symbols.html)
- [GNU as .global](https://sourceware.org/binutils/docs/as/Global.html)
- [GNU as .type](https://sourceware.org/binutils/docs/as/Type.html)
- [GNU as .size](https://sourceware.org/binutils/docs/as/Size.html)
- [GNU as .weak](https://sourceware.org/binutils/docs/as/Weak.html)
