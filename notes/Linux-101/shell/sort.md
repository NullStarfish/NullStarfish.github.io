---
title: "sort"
description: "-r：reverse -n：数值排序："
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---

-r：reverse
-n：数值排序：
```
# 错误：字母顺序（1, 10, 2, 20）
echo -e "10\n2\n20\n1" | sort

# 正确：数值排序
echo -e "10\n2\n20\n1" | sort -n
# 输出：1 2 10 20
```





-k --key 指定排序字段
-t 指定分割字符

```
# CSV文件排序
cat > data.csv << EOF
Smith,John,35
Doe,Jane,28
Brown,Bob,42
EOF

# 按第3列（年龄）排序，使用逗号分隔符
sort -t',' -n -k3 data.csv
```

当有多个排序（有优先级）
```
# 先按第2列降序，再按第1列升序
sort -k2,2rn -k1,1 data.txt

# 更复杂的例子
sort -t',' -k2,2n -k1,1r data.csv
```



-h 人类可读排序：
```
# 按文件大小排序（K, M, G等单位）
ls -lh | tail -n +2 | sort -hr -k5
```
(注，-h是配合-l的，使得size field输出的都是B, K，G)


