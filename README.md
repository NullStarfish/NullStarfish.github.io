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

- 没有 frontmatter 的旧笔记仍可被读取。
- `draft` 默认是 `true`，只有明确设为 `false` 才会发布。
- `slug` 一经发布应保持稳定，移动 Markdown 文件不会改变链接。
- 重复的 `slug` 会使构建失败并给出错误。

## 部署

推送到 `main` 后，GitHub Actions 会自动构建并部署到 GitHub Pages。仓库的 Pages Source 需要选择 **GitHub Actions**。
