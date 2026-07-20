---
title: "Git Rebase 与 Cherry-pick"
published: 2026-07-20
description: "理解提交重放、交互式整理历史、冲突处理和安全强推。"
tags: ["Git", "Rebase", "Cherry-pick"]
category: "Git"
series: { name: "Git 版本控制", order: 7 }
draft: false
---
rebase 和 cherry-pick 都会把已有提交的变化重新应用到新基点，并创建新的 commit。即使
文件内容相同，新提交的 parent 或 metadata 改变后，object ID 也会改变。

---

### 一、Rebase 一个功能分支

```bash
git switch feature/login
git fetch origin
git rebase origin/main
```

原历史：

```text
A---B---C  main
     \
      D---E  feature
```

rebase 后：

```text
A---B---C  main
         \
          D'---E'  feature
```

`D'`、`E'` 是新提交，旧提交仍可能暂时通过 reflog 找到。

---

### 二、处理 Rebase 冲突

```bash
git status
# 编辑冲突文件
git add path/to/file
git rebase --continue
```

其他选择：

```bash
git rebase --skip
git rebase --abort
```

`--skip` 会丢弃当前正在重放的提交效果，只有确认变化已经存在或确实不需要时才能使用。

---

### 三、交互式整理本地提交

```bash
git rebase -i HEAD~5
```

常用动作：

| 动作 | 作用 |
| :--- | :--- |
| `pick` | 保留提交 |
| `reword` | 修改提交消息 |
| `edit` | 暂停以修改提交内容 |
| `squash` | 合入前一提交并编辑消息 |
| `fixup` | 合入前一提交并通常丢弃当前消息 |
| `drop` | 删除提交 |

不要 rebase 已被多人基于其继续开发的公共提交，除非团队明确协调历史重写。

---

### 四、Cherry-pick 单个提交

```bash
git cherry-pick COMMIT
git cherry-pick A B C
git cherry-pick --no-commit COMMIT
```

它适合把独立修复移植到维护分支。`--no-commit` 只把变化放入工作区和 index，方便合并
多个提交后统一提交。

冲突处理：

```bash
git add path/to/file
git cherry-pick --continue
git cherry-pick --abort
```

---

### 五、推送重写后的分支

如果该分支之前已经由自己推送：

```bash
git push --force-with-lease
```

先 fetch 可以减少 lease 基于过时信息做判断的风险。强推前还应确认远程没有其他人的
新提交。

### 参考

- [git-rebase](https://git-scm.com/docs/git-rebase)
- [git-cherry-pick](https://git-scm.com/docs/git-cherry-pick)
