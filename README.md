# NullStarfish.github.io

一个使用 [Astro](https://astro.build/) 构建的个人主页与 Markdown 学习笔记站点。

## 本地开发

```bash
pnpm install
pnpm dev
```

构建生产站点与 Pagefind 搜索索引：

```bash
pnpm build
pnpm preview
```

## 添加笔记

Markdown 文件统一放在 `notes/` 下，子目录只用于本地整理，不决定网页 URL。

```yaml
---
title: 笔记标题
description: 一句话摘要
slug: stable-note-slug
topic: programming
tags:
  - javascript
created: 2026-06-22
updated: 2026-06-22
featured: false
draft: false
---
```

- 没有 frontmatter 的旧笔记仍可被递归读取并自动发布。
- 只有明确设置 `draft: true` 的笔记才会隐藏。
- `slug` 一经发布应保持稳定，移动 Markdown 文件不会改变链接。
- 重复的 `slug` 会使构建失败并给出错误。

`notes/` 下可以任意嵌套目录，例如：

```text
notes/
└── digital IC/
    └── efforts/
        ├── logical.md
        └── parasitic.md
```

目录仅用于整理；未指定 `slug` 时，完整相对路径会用于生成稳定且唯一的页面路径标识。

数学公式支持以下写法：

```md
行内公式：$E = mc^2$ 或 \(E = mc^2\)

块级公式：

$$
g = \frac{N+2}{3}
$$

也可以使用：

\[
g = \frac{N+2}{3}
\]
```

## 部署

推送到 `main` 后，GitHub Actions 会自动构建并部署到 GitHub Pages。仓库的 Pages Source 需要选择 **GitHub Actions**。
