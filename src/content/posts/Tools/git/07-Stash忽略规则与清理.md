---
title: "Git Stash、忽略规则与工作区清理"
published: 2026-07-20
description: "管理临时修改、.gitignore 规则、未跟踪文件和仓库清洁状态。"
tags: ["Git", "Stash", "Gitignore"]
category: "Git"
series: { name: "Git 版本控制", order: 8 }
draft: false
---
工作区管理的目标不是盲目追求 `git status` 为空，而是区分需要提交的源码、临时修改、
生成文件和本地配置。

---

### 一、暂存未完成工作

```bash
git stash push -m "WIP: parser experiment"
git stash list
git stash show -p stash@{0}
```

默认 stash 保存已跟踪文件的工作区和 index 变化，不包含未跟踪文件。需要包含时：

```bash
git stash push -u -m "WIP with new files"
```

恢复方式：

```bash
git stash apply stash@{0} # 保留 stash
git stash pop             # 应用成功后删除 stash
git stash branch rescue stash@{0}
```

stash 适合短期切换任务，不应代替有意义的 WIP branch 和提交。

---

### 二、`.gitignore` 规则

```gitignore
# 任意层级的构建目录
build/

# 所有日志，但保留示例
*.log
!example.log

# 只匹配仓库根目录
/dist/

# 本地密钥
.env
.env.*
```

检查一条规则来自哪里：

```bash
git check-ignore -v path/to/file
```

`.gitignore` 只影响未跟踪文件。已经被跟踪的文件需要从 index 移除：

```bash
git rm --cached path/to/file
```

不要把真实密码或 token 提交后仅用 ignore 隐藏；它们仍存在于历史中，应立即吊销并按
仓库安全流程清理历史。

---

### 三、本地专用忽略

不希望修改项目 `.gitignore` 时：

```bash
printf '%s\n' '.local-notes/' >> .git/info/exclude
git config --global core.excludesFile ~/.config/git/ignore
```

`.git/info/exclude` 只对当前 clone 生效；global ignore 适合编辑器和操作系统产生的通用
文件。

---

### 四、预览并清理未跟踪文件

```bash
git clean -nd
git clean -ndX
```

- `-n` 只预览，执行清理前必须先使用。
- `-d` 包含目录。
- `-X` 只选择被 ignore 的文件。
- `-x` 连 ignored 文件也选择，风险更高。

确认预览目标无误后才使用对应的 `-f`。对于大型构建目录，直接让构建系统提供 clean
目标通常更清晰。

### 参考

- [git-stash](https://git-scm.com/docs/git-stash)
- [gitignore](https://git-scm.com/docs/gitignore)
- [git-clean](https://git-scm.com/docs/git-clean)
