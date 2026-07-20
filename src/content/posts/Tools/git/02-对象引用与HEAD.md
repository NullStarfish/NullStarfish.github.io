---
title: "Git 对象、引用与 HEAD"
published: 2026-07-20
description: "理解 blob、tree、commit、tag 对象，以及 branch、HEAD 和 revision 的关系。"
tags: ["Git", "Object", "HEAD"]
category: "Git"
series: { name: "Git 版本控制", order: 3 }
draft: false
---
Git 底层是内容寻址的对象数据库。理解对象和引用后，branch、tag、reset 和 rebase 就不再
是互不相关的命令。

---

### 一、四类对象

| 对象 | 保存内容 |
| :--- | :--- |
| blob | 文件内容，不包含文件名 |
| tree | 文件名、权限以及指向 blob 或子 tree 的引用 |
| commit | 根 tree、parent、作者、提交者和消息 |
| annotated tag | tag 名、目标、创建者和说明 |

检查对象：

```bash
git cat-file -t HEAD
git cat-file -p HEAD
git ls-tree -r HEAD
```

一个普通提交指向一棵 tree，并指向零个、一个或多个 parent。初始提交没有 parent，普通
提交有一个，merge commit 通常有两个。

---

### 二、Branch 只是可移动引用

`refs/heads/main` 保存 `main` 当前指向的 commit ID。产生新提交时，当前 branch 引用向
前移动。

```text
A <- B <- C  main
```

创建 `feature` 后提交一次：

```text
A <- B <- C  main
          \
           D  feature, HEAD
```

branch 本身不复制文件和提交，因此创建、切换通常非常快。

---

### 三、HEAD 表示当前位置

正常情况下，`.git/HEAD` 间接指向当前 branch：

```text
ref: refs/heads/main
```

直接 checkout 某个 commit 时会进入 detached HEAD：

```bash
git switch --detach HEAD~2
```

此时可以查看、构建和提交，但新提交不属于任何 branch。若要保留它：

```bash
git switch -c investigation
```

---

### 四、Revision 写法

```bash
git show HEAD^       # 第一个 parent
git show HEAD~3      # 连续沿第一个 parent 走三次
git show main^{tree} # main 对应提交的 tree
git log A..B         # B 可达但 A 不可达的提交
git log A...B        # 两边各自独有的提交
```

merge commit 的 `HEAD^1` 和 `HEAD^2` 表示不同 parent；`HEAD~2` 始终沿第一个 parent。

---

### 五、短哈希不是永久标识

```bash
git rev-parse HEAD
git rev-parse --short HEAD
git show-ref --heads --tags
```

短哈希长度只需在当前对象集合中唯一。脚本和长期记录应优先保存完整 object ID，或使用
稳定 tag 表达发布版本。

### 参考

- [Git Internals](https://git-scm.com/book/zh/v2/Git-内部原理-Git-对象)
- [gitrevisions](https://git-scm.com/docs/gitrevisions)
