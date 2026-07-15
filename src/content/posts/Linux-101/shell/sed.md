---
title: "sed"
published: 2026-06-22
description: "sed 是 Linux/Unix 系统中极其强大的流编辑器（Stream Editor）。它主要用于对文本进行查找、替换、删除、插入等自动化操作，而无需手动打开文件。"
tags: ["Linux", "Shell"]
category: "Shell"
draft: false
---
`sed` 是 Linux/Unix 系统中极其强大的**流编辑器**（Stream Editor）。它主要用于对文本进行查找、替换、删除、插入等自动化操作，而无需手动打开文件。

与 `vi` 或 `nano` 不同，`sed` 是**非交互式**的。它按行读取内容，处理后输出，非常适合在脚本和自动化流程中使用。

---

### 1. 基本语法
```bash
sed [选项] '命令' 文件名
```

*   **工作机制**：`sed` 每次从输入读取一行，放入临时的“模式空间”（Pattern Space），执行命令后，默认将结果打印到屏幕，然后处理下一行。

---

### 2. 核心功能：替换（Substitution）
这是 `sed` 最常用的场景。命令格式为 `s/模式/替换内容/标记`。

*   **基本替换**（只替换每行第一个匹配项）：
    ```bash
    sed 's/linux/unix/' file.txt
    ```
*   **全局替换**（加上 `g` 标记）：
    ```bash
    sed 's/linux/unix/g' file.txt
    ```
*   **忽略大小写**（加上 `i` 标记）：
    ```bash
    sed 's/linux/unix/gi' file.txt
    ```
*   **指定行号**（只替换第 3 行）：
    ```bash
    sed '3s/linux/unix/' file.txt
    ```

---

### 3. 常用选项（Flags）

| 选项 | 说明 | 示例 |
| :--- | :--- | :--- |
| **`-i`** | **直接修改文件**。默认 `sed` 只是打印结果，不改原文件。 | `sed -i 's/A/B/g' file.txt` |
| **`-n`** | **取消默认输出**。通常与 `p` 命令配合，只打印匹配行。 | `sed -n '5p' file.txt` (只看第5行) |
| **`-e`** | **执行多个命令**。 | `sed -e 's/A/B/g' -e 's/C/D/g' file` |
| **`-r`** | **使用扩展正则**。支持 `+`, `?`, `()` 等符号。 | `sed -r 's/[0-9]+/NUM/g' file` |

---

### 4. 常见操作示例

#### (1) 删除行 (`d`)
*   删除第 2 行：`sed '2d' file.txt`
*   删除 2 到 5 行：`sed '2,5d' file.txt`
*   删除包含 "error" 的所有行：`sed '/error/d' file.txt`
*   删除空行：`sed '/^$/d' file.txt`

#### (2) 打印特定行 (`p`)
*   打印第 10 行：`sed -n '10p' file.txt`
*   打印包含 "Warning" 的行：`sed -n '/Warning/p' file.txt`

#### (3) 插入与追加 (`i` / `a`)
*   在第 1 行**之前**插入文本：`sed '1i\Hello World' file.txt`
*   在最后一行**之后**追加文本：`sed '$a\The End' file.txt`

#### (4) 引用变量
如果在 `sed` 命令中需要使用 Shell 变量，请将单引号改为**双引号**：
```bash
old_word="apple"
new_word="orange"
sed "s/$old_word/$new_word/g" file.txt
```

---

### 5. 高级技巧：分界符
默认情况下 `sed` 使用 `/` 作为分隔符。但如果要处理包含路径的内容（如 `/etc/passwd`），斜杠太多会很难看：
*   **坏写法**：`sed 's/\/usr\/bin/\/usr\/local\/bin/g'`
*   **好写法**：`sed` 允许你使用任何字符作为分隔符（如 `#` 或 `|`）：
    ```bash
    sed 's#/usr/bin#/usr/local/bin#g' file.txt
    ```

### 总结
*   如果你只想**查看**并修改输出结果，直接用 `sed '...'`。
*   如果你想**真正修改**文件内容，务必加上 `-i`。
*   如果正则表达式比较复杂，记得加上 `-r` (或 `-E`)。