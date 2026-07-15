---
title: "C"
published: 2026-07-01
description: "C 知识点"
tags: ["计组", "system", "Course"]
category: "System"
draft: false
---
# Compilation & Interpretation:
没什么好说的


# enum
typedef enum {r, g, b} Color;

# struct & union
这里有一个alignment问题

一个聚合类型的对齐要求，通常等于它内部所有成员中“最大对齐要求”的那个。
```c
struct S {
    char c;    // align 1
    int  x;    // align 4
};
```
offset 0: char c
offset 1~3: padding
offset 4~7: int x

sizeof(struct T) == 8

同样：
struct T {
    int x;     // 4 bytes, align 4
    char c;    // 1 byte
};
末尾也要加padding


# Constant：
int x = 123456
这种直接编译的时候硬编码了

const int a = 1234;
这种在引用a的时候，可能会放.rodata

enum类型本身也是不会占用空间，是编译期状态
甚至不占rodata



# pointer:
void*不允许+ - 1指针运算。



# array：
注意退化：a变成第一个元素的指针
数组退化：大部分请况下退化：
Sizeof(a) = 数组大小
&a = int (*)[10]。数组指针
Int a[3][4]退化一层，变成int(*)[4]

# 内存空间：

本质上section和sp, heap都是在share同一个空间





| Section                                             | 内容                            | 典型属性     | 通常放在哪里            |
| --------------------------------------------------- | ----------------------------- | -------- | ----------------- |
| `.text`                                             | 程序代码、函数机器指令                   | 可执行、只读   | Flash / ROM / RAM |
| `.rodata`                                           | 只读数据，比如字符串常量、`const` 全局变量、跳转表 | 只读       | Flash / ROM       |
| `.data`                                             | 已初始化的全局变量、静态变量                | 可读写，有初值  | 运行时在 RAM，初值存在 ROM |
| `.bss`                                              | 未初始化或初始化为 0 的全局变量、静态变量        | 可读写，零初始化 | RAM               |
| `.sdata`                                            | small data，较小的已初始化全局变量        | 可读写      | RAM               |
| `.sbss`                                             | small bss，较小的零初始化全局变量         | 可读写      | RAM               |
| `.stack`                                            | 栈空间                           | 可读写      | RAM               |
| `.heap`                                             | 堆空间，`malloc/free` 使用          | 可读写      | RAM               |
| `.init` / `.fini`                                   | 初始化/结束代码                      | 可执行      | ROM / RAM         |
| `.ctors` / `.dtors` 或 `.init_array` / `.fini_array` | C++ 全局对象构造/析构函数表              | 只读表      | ROM               |
| `.got`                                              | Global Offset Table，位置无关代码用   | 可读写或只读   | RAM / ROM         |
| `.plt`                                              | Procedure Linkage Table，动态链接用 | 可执行      | 通常裸机不用            |
| `.eh_frame`                                         | 异常处理、栈展开信息                    | 只读       | 通常裸机可去掉           |
| `.debug_*`                                          | 调试信息                          | 不参与运行    | ELF 文件中，烧录时通常去掉   |
| `.comment`                                          | 编译器版本等注释信息                    | 不参与运行    | ELF 文件中           |
| `.riscv.attributes`                                 | RISC-V ABI / ISA 属性信息         | 元数据      | ELF 文件中           |



# stack & heap
stack:支撑函数栈，自动内存管理

内存泄漏：malloc > free

# segfault
需要OS和MMU
