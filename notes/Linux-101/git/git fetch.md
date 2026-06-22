---
title: "git fetch"
description: "简单来说，git fetch 和 git pull 的核心区别在于：fetch 是“看看更新了啥”，而 pull 是“直接把更新拿过来并合并”。"
topic: "Git"
tags:
  - "Linux"
  - "Git"
featured: false
draft: false
---
简单来说，`git fetch` 和 `git pull` 的核心区别在于：**`fetch` 是“看看更新了啥”，而 `pull` 是“直接把更新拿过来并合并”。**

---

### 一、 `git pull` vs `git fetch` 的区别

可以用一个公式来理解：
**`git pull` = `git fetch` + `git merge`**

| 维度 | `git fetch` | `git pull` |
| :--- | :--- | :--- |
| **动作** | 仅下载远程仓库的最新内容，不修改本地代码。 | 下载远程内容并**立即尝试合并**到当前分支。 |
| **本地分支指针** | 本地分支（如 `main`）不动，只更新远程跟踪分支（如 `origin/main`）。 | 本地分支指针（如 `main`）会向前移动。 |
| **安全性** | **安全**。不会产生冲突，你可以查看后再决定怎么做。 | **有风险**。如果本地有修改，可能会直接触发冲突。 |
| **使用场景** | 想看同事写了什么代码，或者想对比远程和本地差异时。 | 确认远程代码没问题，想快速同步到最新版本时。 |

---

### 二、 详细讲讲 `git fetch` 的用法

`git fetch` 是 Git 中最安全的命令之一，因为它**绝对不会破坏你当前的工作进度**。它只是把远程的“快照”下载到本地的缓存区。

#### 1. 基础用法
*   **获取远程所有分支更新：**
    ```bash
    git fetch origin
    ```
    这会更新本地所有的远程跟踪分支（即 `origin/*`）。

*   **获取特定分支的更新：**
    ```bash
    git fetch origin dev
    ```
    只下载远程 `dev` 分支的最新提交。

#### 2. 常用进阶参数
*   **`git fetch --all`**：如果你的项目有多个远程仓库（比如 `origin` 和 `upstream`），这个命令会一次性拉取所有仓库的更新。
*   **`git fetch --prune` (或 `-p`)**：**非常推荐使用**。如果远程仓库已经删除了某个分支，这个命令会同步删除你本地过时的远程跟踪分支（如 `origin/old-feature`），保持列表整洁。
*   **`git fetch --tags`**：专门拉取远程的所有标签（Tags）。

#### 3. Fetch 之后该做什么？（关键步骤）
执行完 `fetch` 后，由于代码还没合并，你需要手动查看或操作：

*   **查看远程比本地多了哪些提交：**
    ```bash
    git log main..origin/main
    ```
*   **查看具体的文件差异：**
    ```bash
    git diff main origin/main
    ```
*   **手动合并（如果你觉得没问题）：**
    ```bash
    git merge origin/main
    ```
*   **或者像你之前问的，强制覆盖本地：**
    ```bash
    git reset --hard origin/main
    ```

#### 4. 高级技巧：直接 Fetch 到本地分支
如果你想在不切换分支的情况下，更新另一个本地分支（假设该分支没有被 checkout）：
```bash
# 将远程 dev 的更新直接同步到本地 dev 分支（前提是没冲突）
git fetch origin dev:dev
```

### 总结建议
*   如果你是 **Git 新手**：可以先习惯用 `git pull`，遇到冲突再处理。
*   如果你是 **专业开发者**：建议养成先 `git fetch` 查看改动，再手动 `merge` 或 `rebase` 的习惯。这样可以避免不必要的自动合并产生混乱的提交记录。