---
title: "head tail"
description: "-n，指定行数： 支持格式 N, +N, -N"
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---
-n，指定行数：
支持格式 N, +N, -N

```
# 三种格式：
command -n N      # 标准格式
command -n +N     # 从第N行开始
command -n -N     # 最后N行（默认行为）
```

```
# head: 前N行
head -n 5 file.txt    # 显示前5行
head -5 file.txt      # 简写，同上

# tail: 最后N行  
tail -n 5 file.txt    # 显示最后5行
tail -5 file.txt      # 简写，同上
```


```
# tail -n +N：从第N行到文件末尾
tail -n +5 file.txt    # 显示第5行到最后一行
# 等价于：跳过前4行

# head -n +N：标准head不支持这种格式！
head -n +5 file.txt    # 错误或非标准行为
```

```
# tail -n -N：最后N行（默认）
tail -n -5 file.txt    # 显示最后5行（与 tail -n 5 相同）
tail -5 file.txt       # 简写

# head -n -N：排除最后N行
head -n -5 file.txt    # 显示除最后5行外的所有行
```