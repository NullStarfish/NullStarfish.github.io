---
title: "cat"
description: "cat的本质是链接文件和标准输出"
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---
cat的本质是链接文件和标准输出
```
# 这个命令的意思是：
# 1. 创建一个Here Document（多行文本）
# 2. 把这个文本作为 cat 的输入
# 3. cat 读取这个输入并输出
# 4. > 把这个输出重定向到 test.txt

cat > test.txt << EOF
apple 10 red
banana 5 yellow
cherry 8 red
date 12 brown
EOF
```



cat -n:显示行号
