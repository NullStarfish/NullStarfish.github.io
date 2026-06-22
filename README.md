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

批量加入旧笔记后，可以预览或写入缺失的 frontmatter：

```bash
pnpm notes:frontmatter:dry
pnpm notes:frontmatter
```

脚本只处理尚无 frontmatter 的 Markdown，不会覆盖已经人工整理过的元数据。

## PDF 书架

只有 `books/**/*.pdf` 会进入书架；`notes/` 中的 PDF 仅作为笔记附件，不会生成书籍条目。

书架支持递归目录。为 PDF 添加同名 JSON 即可设置标签和展示信息：

```text
books/
└── digital-ic/
    ├── cmos-design.pdf
    └── cmos-design.json
```

```json
{
  "title": "CMOS Digital Integrated Circuits",
  "author": "作者",
  "description": "数字集成电路教材",
  "tags": ["数字电路", "教材"],
  "featured": false
}
```

没有 JSON 时使用文件名作为书名，父目录会自动成为标签。

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
