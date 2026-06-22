---
title: "ELF"
description: "ELF（Executable and Linkable Format）文件的结构设计得非常精妙，它同时兼顾了编译链接阶段（静态存放）和程序运行阶段（动态加载）的需求。"
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---
ELF（Executable and Linkable Format）文件的结构设计得非常精妙，它同时兼顾了**编译链接阶段**（静态存放）和**程序运行阶段**（动态加载）的需求。

简单来说，一个 ELF 文件由 **1 个文件头**、**2 个索引表**（Header Tables）和 **N 个实际数据块**（Sections/Segments）组成。

我们可以把它想象成一本书：
1.  **ELF Header**：书的**封面和版权页**（基本信息）。
2.  **Program Header Table**：**阅读指南**（告诉操作系统怎么读这本书）。
3.  **Section Header Table**：**详细目录**（告诉编译器/调试器每一章每一节具体是什么）。
4.  **Data (Sections/Segments)**：**正文内容**（代码、数据、符号表等）。

---

### 1. ELF Header（文件头）
位于文件的最开始（前 64 字节，64位系统下）。它是整个文件的“身份证”。
*   **魔数 (Magic Number)**：`0x7F 'E' 'L' 'F'`。操作系统读取文件的前4个字节，一看是这个，就知道是 ELF 文件。
*   **机器架构**：是 x86-64 还是 ARM？
*   **字节序**：大端 (Big Endian) 还是小端 (Little Endian)？
*   **类型**：是 `.o` (Relocatable)、可执行文件 (Executable) 还是 `.so` (Shared Object)？
*   **入口地址 (Entry Point)**：程序运行时的第一行代码地址（即 `_start` 的地址）。如果是 `.o` 文件，这里是 0。
*   **索引表的位置**：记录了 Program Header Table 和 Section Header Table 在文件中的偏移量。

### 2. 两个视角的“索引表”
ELF 文件最核心的概念是**“双重视角”**。同样的数据，链接器和操作系统看到的结构是不一样的。

#### A. Linking View（链接视角） -> Section Header Table
*   **使用者**：编译器 (`gcc`)、链接器 (`ld`)、调试器 (`gdb`)、分析工具 (`objdump`)。
*   **核心结构**：**Section (节)**。
*   **Section Header Table**：这是一张表，列出了文件中所有 Section 的名字、大小、位置、权限等。
*   **作用**：在编译和链接阶段，我们需要精细地管理代码、数据、符号表、调试信息。

#### B. Execution View（执行视角） -> Program Header Table
*   **使用者**：操作系统加载器 (OS Loader)。
*   **核心结构**：**Segment (段)**。
*   **Program Header Table**：这是一张表，告诉 OS：“请把文件中的 0x100 到 0x500 字节，映射到内存的 0x400000 位置，并赋予‘可读可执行’权限”。
*   **作用**：OS 不关心代码里哪里是 `main` 函数，哪里是 `printf`。它只关心哪一大块数据需要加载到内存里，以及这块内存是只读的还是可写的。
    *   *注：一个 Segment 通常包含多个 Section（比如 Text Segment 可能包含了 `.text` 和 `.rodata` 两个 Section）。*

---

### 3. 核心数据块 (Common Sections)
这是文件里体积最大的部分，存放了真正的代码和数据。以下是你在 ELF 中最常遇见的 Section：

#### 代码与数据
*   **`.text`**：**代码段**。你写的 C 代码编译后的机器指令都存放在这。通常是“只读+可执行”。
*   **`.data`**：**已初始化的全局变量**。比如 `int count = 10;`。
*   **`.rodata`**：**只读数据**。比如 `const` 变量，或者字符串常量 `"Hello World"`。
*   **`.bss`**：**未初始化的全局变量**。比如 `int buffer[1024];`。
    *   *特殊点*：它在 ELF 文件里**不占空间**（或者只占极少空间）。因为它全是 0，文件里只需要记录“这里需要预留 4KB 空间”即可，不需要真的存 4096 个 0 进去，从而节省磁盘空间。

#### 符号与重定位（回答你上一个问题的地方）
*   **`.symtab`**：**符号表**。存放函数名、变量名及其对应的地址。Object file 必须有，Executable file 可以被 strip 掉。
*   **`.strtab`**：**字符串表**。`.symtab` 里存的其实是索引，真正的名字字符串（如 "main", "count"）都连着存在这里。
*   **`.rel.text` / `.rela.text`**：**代码重定位表**。仅存在于 Object File (`.o`) 中。记录了代码段中哪些地方引用了外部符号，需要链接器去修改。

#### 调试信息
*   **`.debug_*`**：如果你编译时加了 `-g`，会有大量以 `.debug` 开头的 Section。里面包含了源代码行号与机器码的对应关系、变量类型定义等。这部分通常比代码本身还大。

---

### 总结：文件差异对比

回到你之前的疑问，用 ELF 结构来看 `.o` 和 `Executable` 的区别：

1.  **Object File (`.o`)**：
    *   **有** Section Header Table（为了让链接器看）。
    *   **没有** Program Header Table（因为它不需要被执行，OS 根本不认它）。
    *   **有** `.rel.text`（重定位表）。

2.  **Executable File**：
    *   **有** Program Header Table（为了让 OS 加载运行）。
    *   **有** Section Header Table（为了调试和工具分析，虽非运行必须，但通常保留）。
    *   **没有** `.rel.text`（链接器已经处理完了，删掉了）。

### 自己动手看一眼
你可以用 Linux 自带的 `readelf` 工具亲自验证这些结构：

1.  看文件头：
    ```bash
    readelf -h a.out
    ```
2.  看 Section 列表（链接视角）：
    ```bash
    readelf -S a.out
    ```
3.  看 Segment 列表（执行视角）：
    ```bash
    readelf -l a.out
    ```
4.  看符号表：
    ```bash
    readelf -s a.out
    ```