---
title: "tar"
published: 2026-06-22
description: "tar（Tape Archive）是 Linux 中最强大的工具之一。要用好它，最重要的一点是理清 “打包” 和 “压缩” 的区别："
tags: ["Linux", "Shell"]
category: "Shell"
draft: false
---
`tar`（Tape Archive）是 Linux 中最强大的工具之一。要用好它，最重要的一点是理清 **“打包”** 和 **“压缩”** 的区别：

*   **打包（Archive）**：把一堆文件（和它们的权限、目录结构）捆成一个大文件。
*   **压缩（Compression）**：通过算法减小大文件的体积。

---

### 一、 参数大汇总（组合拳）

你可以把 `tar` 的参数分为三个维度：

#### 1. 核心动作（必选其一）
| 参数       | 功能          | 描述           |
| :------- | :---------- | :----------- |
| **`-c`** | **C**reate  | 创建一个新的存档（打包） |
| **`-x`** | e**X**tract | 解压/提取存档内容    |
| **`-t`** | Lis**t**    | 查看内容清单，不解压   |

#### 2. 压缩方式（可选）
| 参数       | 格式                 | 描述                         |
| :------- | :----------------- | :------------------------- |
| **`-z`** | `.tar.gz` / `.tgz` | **Gzip**：速度最快，最常用          |
| **`-j`** | `.tar.bz2`         | **Bzip2**：压缩率比 gzip 高，速度稍慢 |
| **`-J`** | `.tar.xz`          | **XZ**：压缩率最高，速度最慢          |
| (无)      | `.tar`             | 只打包，不压缩                    |

#### 3. 辅助参数（必选其一或可选）
| 参数       | 功能             | 描述                |
| :------- | :------------- | :---------------- |
| **`-f`** | **F**ile       | **必须项**。后面紧跟存档文件名 |
| **`-v`** | **V**erbose    | 可视化，打印出正在处理的文件名   |
| **`-C`** | **C**hange Dir | 指定解压的目标目录         |

---

### 二、 经典实战例子

#### 1. 创建备份（打包并压缩）
最常用的命令，将 `my_project` 文件夹变成一个压缩包：
```bash
# 使用 gzip 压缩
tar -czvf project.tar.gz ./my_project
```

#### 2. 解压到当前目录
现在的 `tar` 非常智能，你**不需要**告诉它是 `z` 还是 `j`，它会自动识别：
```bash
# 万能解压命令
tar -xvf project.tar.gz
```

#### 3. 解压到指定目录
如果你想把文件解压到 `/tmp/test` 下（注意：目录必须提前存在）：
```bash
mkdir -p /tmp/test
tar -xvf project.tar.gz -C /tmp/test
```

#### 4. 只查看不解压
在解压一个超大压缩包之前，先看看里面有什么：
```bash
tar -tvf project.tar.gz
```

#### 5. 只提取压缩包里的某一个文件
不需要解压整个包，只把其中一个文件拿出来：
```bash
tar -xvf project.tar.gz path/to/important_file.txt
```

#### 6. 排除特定目录（打包时使用）
比如打包项目但不想带上巨大的 `node_modules` 或 `.git`：
```bash
tar --exclude='./node_modules' -czvf project.tar.gz .
```

---

### 三、 避坑指南（针对你的报错）

#### 1. `f` 参数的顺序（死律）
`f` 后面必须立刻接文件名。
*   ✅ 正确：`tar -czvf backup.tar.gz`
*   ❌ 错误：`tar -czfv backup.tar.gz`（这会让 tar 认为文件名是 `v`）

#### 2. 别被后缀名骗了
在 Linux 里，后缀名是给人看的，不是给系统看的。
如果你创建时用了 `tar -cvf test.tar.gz`（漏掉了 `z`），这个文件本质上只是一个 `tar` 打包文件。
*   **诊断命令**：`file your_file.tar.gz`
*   **解决方法**：如果显示是 `tar archive`，就用 `tar -xvf`；如果显示是 `gzip compressed`，才用 `tar -xzvf`。

#### 3. 路径问题
解压时，`tar` 默认会保留打包时的相对路径。
*   如果在打包时用了绝对路径 `/home/user/data`，有些系统在解压时会强行解压到原来的绝对路径，这很危险。
*   **最佳实践**：打包时切换到目标目录内部，使用**相对路径**（`.` 或 `filename`）。

---

### 四、 总结：我的常用快捷组合

*   **打包一个大项目**：`tar -czvf name.tar.gz path`
*   **解压任何包**：`tar -xvf name.tar.gz`
*   **解压到别处**：`tar -xvf name.tar.gz -C /target/path`
*   **查看包里有啥**：`tar -tvf name.tar.gz | less`

你之前的报错大概率是因为创建时没加 `-z`，或者下载的文件损坏了。下次遇到类似问题，先 `file` 一下那个文件。




这张 PPT 介绍了 Linux 下最常用的打包工具 **`tar`** (Tape Archive)。

我们可以把 `tar` 命令拆解为两部分：**“动作”**和**“格式”**。

### 1. PPT 中的参数拆解

*   **动作参数**：
    *   `c` (Create): **创建**一个新的存档文件（打包）。
    *   `x` (eXtract): **解压/提取**存档文件。
    *   `t` (List): **查看**存档内容，不解压。
*   **格式/辅助参数**：
    *   **`z`**: 使用 **gzip** 压缩（通常后缀是 `.tar.gz` 或 `.tgz`）。
    *   `v` (Verbose): 过程可视化，列出正在处理的文件名。
    *   `f` (File): 指定文件名。**注意：`f` 必须放在所有参数的最后，后面紧跟文件名。**

---

### 2. 为什么你错了？

你的报错信息是：`gzip: stdin: not in gzip format`。

#### 原因 A：文件名“骗”了你（最可能的原因）
这个报错意味着：你命令里加了 `-z`，告诉 `tar` 用 gzip 算法去解压。但 `tar` 检查了 `new.tar.gz` 文件后，发现它**根本不是一个 gzip 压缩文件**。

*   **场景回放**：你之前在创建这个文件时，可能只用了 `tar -cvf new.tar.gz ...`，虽然你手动加了 `.gz` 后缀，但**漏掉了 `-z` 参数**。
*   **结果**：这个文件本质上只是一个普通的 `.tar` 打包文件，没有任何压缩。
*   **解决方法**：去掉 `z` 参数，直接用 `xf`：
    ```bash
    tar -xvf new.tar.gz
    ```

#### 原因 B：目标目录的语法错误
在你的命令 `tar -xzvf new.tar.gz ./new` 中：
*   `tar` 会认为你要从压缩包里**只提取**一个名叫 `./new` 的文件或文件夹。
*   如果你是想把压缩包里的所有内容**解压到** `./new` 这个目录下，你应该使用 **`-C`** 参数（大写 C）：
    ```bash
    # 必须先创建目录
    mkdir new 
    tar -xvf new.tar.gz -C ./new
    ```

---

### 3. 如何排查？

你可以执行这个神奇的命令来查看这个文件的“真身”：
```bash
file new.tar.gz
```
*   如果显示 `POSIX tar archive`：说明它只是打包了，没压缩。用 `tar -xvf` 解压。
*   如果显示 `gzip compressed data`：说明它是正常的压缩包。
*   如果显示 `bzip2 compressed data`：说明是用 `-j` 压缩的，解压要用 `tar -xjvf`。

### 总结建议
1.  **创建压缩包**：一定要带 `z`，例如 `tar -czvf test.tar.gz folder`。
2.  **解压压缩包**：如果不确定格式，可以**直接不写格式参数**。现代版本的 Linux `tar` 命令非常智能，你直接输入 `tar -xvf filename`，它会自动识别是 gzip 还是普通 tar，并帮你解开。