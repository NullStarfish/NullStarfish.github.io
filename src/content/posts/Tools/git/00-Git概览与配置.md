---
title: "Git 概览与基础配置"
published: 2026-07-20
description: "理解 Git 的分布式模型，完成身份、默认分支、换行符和常用别名配置。"
tags: ["Git", "Version Control"]
category: "Git"
series: { name: "Git 版本控制", order: 1 }
draft: false
---
Git 是分布式版本控制系统。每个 clone 通常都包含完整的提交历史，因此查看历史、创建
分支和提交不依赖远程服务器；GitHub、GitLab 等平台负责托管与协作，但它们不是 Git
本身。

```text
工作区 -> 暂存区 -> 本地仓库 -> 远程仓库
       add        commit       push
```

---

### 一、安装与检查

```bash
git --version
git help config
git help revisions
```

`git help COMMAND` 是最可靠的本地手册入口。只想快速查看参数时使用：

```bash
git COMMAND -h
```

---

### 二、身份配置

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

配置分为三个常用层级：

| 层级 | 文件 | 作用范围 |
| :--- | :--- | :--- |
| system | `/etc/gitconfig` | 当前系统所有用户 |
| global | `~/.gitconfig` | 当前用户所有仓库 |
| local | `.git/config` | 当前仓库，优先级最高 |

查看配置值及其来源：

```bash
git config --list --show-origin
git config --get user.email
```

工作和个人项目可以在仓库内覆盖身份：

```bash
git config user.name "Work Name"
git config user.email "work@example.com"
```

---

### 三、换行符配置

Linux/macOS 通常使用：

```bash
git config --global core.autocrlf input
```

Windows 原生工具链通常使用：

```bash
git config --global core.autocrlf true
```

团队项目更适合用仓库内的 `.gitattributes` 明确规则，例如：

```gitattributes
* text=auto
*.sh text eol=lf
*.bat text eol=crlf
```

---

### 四、创建与克隆仓库

```bash
mkdir demo && cd demo
git init

git clone https://example.com/user/project.git
git clone --depth 1 https://example.com/user/project.git
```

`git init` 在当前目录创建 `.git`；`clone` 则创建目录、复制对象和引用，并配置名为
`origin` 的远程。浅克隆只有有限历史，不适合所有历史分析和发布流程。

### 参考

- [Git Reference](https://git-scm.com/docs)
- [Pro Git](https://git-scm.com/book/zh/v2)
