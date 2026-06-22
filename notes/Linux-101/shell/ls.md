---
title: "ls"
description: "基础：altdR"
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---
基础：altdR


-d：
首先单独使用ls -d，只会输出当前目录：`.`
可以比较`ls -d .*/`和`ls .*/`前者列出当前目录下所有目录，但是后者会进入所有目录来ls文件

（文件夹的名字可以加上/)

-r：reverse，排序反向



ls -l的问题：
首先是被链接的次数：
普通文件是1次。对于目录是目录下子目录数量+2
自己指向自己，以及父目录指向他

还有mtime的问题。
mtime是modified time
另外还有access time和create time，都存放在 inode中 [[inode， superblock]]

