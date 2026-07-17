---
title: "RISC-V 裸机 LD 脚本完整示例"
published: 2026-07-16
description: "将 MEMORY、SECTIONS、VMA/LMA、运行时符号和安全断言组合为一份完整 RISC-V 裸机链接脚本。"
tags: ["LD", "RISC-V", "Bare Metal"]
category: "LD"
series: { name: "GNU LD 与链接脚本", order: 9 }
draft: false
---
下面是一份从 Flash 启动、在 RAM 中维护 `.data`、`.bss`、heap 和 stack 的完整示例。
地址和容量只是示意，需要替换成实际 SoC memory map。

---

### 一、完整链接脚本

```ld
OUTPUT_ARCH(riscv)
ENTRY(_start)

MEMORY
{
  FLASH (rx)  : ORIGIN = 0x30000000, LENGTH = 16M
  RAM   (rwx) : ORIGIN = 0x80000000, LENGTH = 4M
}

_stack_size = 16K;

SECTIONS
{
  .text : ALIGN(4)
  {
    _text_start = .;
    KEEP(*(.text.entry))
    KEEP(*(.vectors))
    *(.text .text.*)
    _text_end = .;
  } > FLASH

  .rodata : ALIGN(4)
  {
    _rodata_start = .;
    *(.srodata .srodata.*)
    *(.rodata .rodata.*)
    _rodata_end = .;
  } > FLASH

  .init_array : ALIGN(4)
  {
    PROVIDE_HIDDEN(__init_array_start = .);
    KEEP(*(SORT_BY_INIT_PRIORITY(.init_array.*)))
    KEEP(*(.init_array))
    PROVIDE_HIDDEN(__init_array_end = .);
  } > FLASH

  .data : ALIGN(4)
  {
    _data_start = .;
    *(.sdata .sdata.*)
    *(.data .data.*)
    _data_end = .;
  } > RAM AT> FLASH

  _data_load_start = LOADADDR(.data);

  .bss (NOLOAD) : ALIGN(8)
  {
    _bss_start = .;
    *(.sbss .sbss.*)
    *(.bss .bss.*)
    *(COMMON)
    _bss_end = .;
  } > RAM

  . = ALIGN(16);
  _heap_start = .;
  _heap_end = ORIGIN(RAM) + LENGTH(RAM) - _stack_size;

  .stack _heap_end (NOLOAD) : ALIGN(16)
  {
    _stack_bottom = .;
    . += _stack_size;
    _stack_top = .;
  } > RAM

  _image_end = LOADADDR(.data) + SIZEOF(.data);

  ASSERT(_heap_start <= _heap_end, "RAM overflow: heap overlaps stack")
  ASSERT(_stack_top <= ORIGIN(RAM) + LENGTH(RAM), "stack exceeds RAM")

  /DISCARD/ :
  {
    *(.comment)
    *(.note.GNU-stack)
  }
}
```

---

### 二、启动代码职责

链接脚本只生成地址和符号。`_start` 至少需要：

1. 把 `sp` 设置为 `_stack_top`。
2. 将 `[_data_load_start, ...]` 复制到 `[_data_start, _data_end)`。
3. 将 `[_bss_start, _bss_end)` 清零。
4. 如果使用 C++ 或 constructor，遍历 `.init_array`。
5. 调用 `main`。

伪汇编：

```asm
.section .text.entry
.globl _start
_start:
  la sp, _stack_top

  /* copy .data */
  la t0, _data_load_start
  la t1, _data_start
  la t2, _data_end
1:
  beq t1, t2, 2f
  lbu t3, 0(t0)
  sb t3, 0(t1)
  addi t0, t0, 1
  addi t1, t1, 1
  j 1b

2:
  /* clear .bss */
  la t0, _bss_start
  la t1, _bss_end
3:
  beq t0, t1, 4f
  sb zero, 0(t0)
  addi t0, t0, 1
  j 3b

4:
  call main
5:
  j 5b
```

---

### 三、编译与链接

```bash
CROSS=riscv64-linux-gnu-

${CROSS}gcc -march=rv32e -mabi=ilp32e \
  -ffreestanding -fno-builtin \
  -ffunction-sections -fdata-sections \
  -c start.S main.c

${CROSS}gcc -march=rv32e -mabi=ilp32e \
  -nostdlib -nostartfiles \
  -T link.ld \
  -Wl,--gc-sections \
  -Wl,--orphan-handling=warn \
  -Wl,-Map=app.map \
  -o app.elf start.o main.o

${CROSS}objcopy -O binary app.elf app.bin
```

---

### 四、验证清单

```bash
${CROSS}readelf -h app.elf
${CROSS}readelf -S app.elf
${CROSS}readelf -l app.elf
${CROSS}nm -n app.elf
${CROSS}objdump -h app.elf
${CROSS}objdump -dr app.elf
```

确认：

- Entry point 等于 `_start`。
- `.text` 和 `.rodata` 位于 FLASH。
- `.data` 的 VMA 位于 RAM，LMA 位于 FLASH。
- `.bss` 的文件大小不会使 binary 保存大量零。
- `_heap_start <= _heap_end < _stack_top`。
- `.text.entry` 没有被 `--gc-sections` 删除。

如果程序由仿真器直接把 flat binary 装到单一地址，而不是从 Flash 启动，就不应直接
照搬这份双地址脚本。此时通常让 VMA=LMA，或让 loader 按 ELF program header 分段
装载。

### 参考

- [GNU ld 官方手册](https://sourceware.org/binutils/docs/ld.html)
