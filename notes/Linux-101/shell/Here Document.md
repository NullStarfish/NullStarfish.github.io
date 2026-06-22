---
title: "Here Document"
description: "在 Linux Shell（如 Bash, Zsh）中，Here Document（通常称为 Heredoc）是一种特殊的重定向方式，它允许你在脚本中直接输入多行文本并传递给某个命令。"
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---
在 Linux Shell（如 Bash, Zsh）中，**Here Document**（通常称为 **Heredoc**）是一种特殊的重定向方式，它允许你在脚本中直接输入多行文本并传递给某个命令。

简单来说，它就像是在脚本中直接“打字”输入一段内容交给程序处理。

---

### 1. 基本语法
```bash
命令 << 终止符
内容...
内容...
终止符
```
*   `<<`：Heredoc 的操作符。
*   `终止符`：由你定义的一个标识字符串（常用 `EOF`、`END`、`STOP` 等）。当 Shell 遇到独占一行的终止符时，就会停止读取输入。

---

### 2. 常见用法示例

#### (1) 直接输出多行文本
最常用的方式是配合 `cat` 命令：
```bash
cat << EOF
Hello, World!
这是第二行。
这是第三行。
EOF
```

#### (2) 将多行文本写入文件
这种方式非常适合在脚本中生成配置文件：
```bash
cat << EOF > config.txt
server_name: my_server
port: 8080
timeout: 30
EOF
```

#### (3) 传递给变量
```bash
VAR=$(cat << EOF
这是存入变量的
多行内容
EOF
)
echo "$VAR"
```

---

### 3. 进阶技巧

#### (1) 变量替换 (Variable Expansion)
默认情况下，Heredoc 会解析其中的变量：
```bash
NAME="Linux"
cat << EOF
Welcome to $NAME environment.
Current path: $PWD
EOF
# 输出：Welcome to Linux environment.
# 输出：Current path: /home/user...
```

#### (2) 禁止变量替换 (引用终止符)
如果你不希望变量被解析（例如在生成另一个脚本或保存 `$PATH` 字符串时），只需要用**引号**包围起始终止符：
```bash
cat << 'EOF'
这里的 $NAME 不会被替换，会原样输出。
EOF
```

#### (3) 忽略制表符 (Tab) (`<<-`)
在编写脚本时，为了代码整齐，我们通常会缩进。默认情况下，Heredoc 会保留行首的空格或制表符。如果你使用 `<<-`，Shell 会自动**删除行首的所有制表符 (Tab)**（注意：只针对 Tab，不针对空格）。
```bash
if true; then
    cat <<- EOF
	这一行前面的 Tab 会被删除
	方便代码对齐
	EOF
fi
```

#### (4) 结合管道 (Pipe)
你可以将 Heredoc 的输出通过管道传给另一个命令：
```bash
cat << EOF | grep "important"
This is a normal line.
This is an important message.
EOF
```

---

### 4. 注意事项
1.  **结束符位置**：结束用的终止符（如 `EOF`）必须**单独占用一行**，且**前面不能有任何空格**（除非使用了 `<<-` 且前面是 Tab）。
2.  **终止符的选择**：虽然常用 `EOF`，但你可以使用任何字符串（如 `MY_DATA`），只要起始和结束一致即可。
3.  **大文本处理**：如果文本极其巨大（数 GB），Heredoc 可能会占用较多内存，因为它是先在内存或临时文件中缓冲的。

### 总结
*   `cat << EOF`：开始输入。
*   `EOF`：结束输入。
*   `cat << 'EOF'`：禁止变量解析。
*   `cat <<- EOF`：忽略行首 Tab。