---
title: "LD VMA 与 LMA"
published: 2026-07-16
description: "区分 section 的运行地址与加载地址，并实现从 ROM 搬运 data、清零 bss 的裸机启动布局。"
tags: ["LD", "Linker Script", "VMA", "LMA"]
category: "LD"
draft: false
---
每个可加载输出段都可能有两个地址：

- **VMA，Virtual Memory Address**：程序运行时访问该段的地址。
- **LMA，Load Memory Address**：程序镜像最初存放该段内容的地址。

对于直接从 RAM 运行的程序，两者通常相同；对于从 Flash 启动、把 `.data` 搬到 RAM
运行的固件，两者不同。

---

### 一、典型 ROM/RAM 布局

```ld
MEMORY
{
  FLASH (rx)  : ORIGIN = 0x30000000, LENGTH = 16M
  RAM   (rwx) : ORIGIN = 0x80000000, LENGTH = 4M
}

SECTIONS
{
  .text : {
    *(.text .text.*)
    *(.rodata .rodata.*)
  } > FLASH

  .data : {
    _data_start = .;
    *(.data .data.*)
    _data_end = .;
  } > RAM AT> FLASH

  _data_load_start = LOADADDR(.data);

  .bss (NOLOAD) : {
    _bss_start = .;
    *(.bss .bss.*)
    *(COMMON)
    _bss_end = .;
  } > RAM
}
```

此时 `.data`：

```text
LMA 位于 FLASH：初始化值存储在固件镜像中
VMA 位于 RAM：程序运行时按 RAM 地址访问变量
```

---

### 二、`AT>` 和 `AT(address)`

```ld
.data : { *(.data .data.*) } > RAM AT> FLASH
```

表示 VMA 分配到 `RAM`，LMA 按顺序分配到 `FLASH`。

也可以精确指定加载地址：

```ld
.data : AT(ADDR(.text) + SIZEOF(.text)) {
  *(.data .data.*)
} > RAM
```

`AT>` 更适合 region 驱动的脚本；`AT(expression)` 适合需要精确计算 image layout 的
场景。

---

### 三、启动代码搬运 `.data`

链接器只描述布局，不会自动执行复制。启动代码需要完成：

```c
extern unsigned char _data_load_start[];
extern unsigned char _data_start[];
extern unsigned char _data_end[];

for (size_t i = 0; i < (size_t)(_data_end - _data_start); ++i) {
  _data_start[i] = _data_load_start[i];
}
```

如果硬件或 bootloader 已经根据 ELF program header 把各 segment 放到目标地址，就不
一定需要软件复制。必须先明确镜像加载协议。

---

### 四、`.bss` 与 `NOLOAD`

`.bss` 只需要运行时空间，不需要在镜像中保存一串零：

```ld
.bss (NOLOAD) : {
  _bss_start = .;
  *(.bss .bss.*)
  *(COMMON)
  _bss_end = .;
} > RAM
```

启动代码负责清零：

```c
for (unsigned char *p = _bss_start; p < _bss_end; ++p) {
  *p = 0;
}
```

`NOLOAD` 表示该段在程序运行时占地址空间，但不要求 loader 从文件装载内容。

---

### 五、如何观察 VMA 和 LMA

```bash
readelf -S app.elf
readelf -l app.elf
objdump -h app.elf
```

`objdump -h` 会分别显示 VMA 和 LMA。`readelf -l` 显示 program header，其中：

- `VirtAddr` 通常对应 segment 的运行地址。
- `PhysAddr` 常被用于表达加载地址。
- `FileSiz` 与 `MemSiz` 的差值常对应 `.bss` 等不占文件内容的空间。

### 参考

- [GNU ld Basic Linker Script Concepts](https://sourceware.org/binutils/docs/ld/Basic-Script-Concepts.html)
- [GNU ld Output Section LMA](https://sourceware.org/binutils/docs/ld/Output-Section-LMA.html)

