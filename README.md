# Null Starfish Blog

Null Starfish 的个人博客与学习笔记，界面基于 [Fuwari](https://github.com/saicaca/fuwari)（MIT License）。

## 本地开发

```sh
pnpm install
pnpm dev
```

构建与检查：

```sh
pnpm check
pnpm build
```

## 笔记迁移

原始笔记保存在 `notes/`。需要重新生成 Fuwari 内容集合时运行：

```sh
node scripts/migrate-notes-to-fuwari.mjs
```

迁移脚本会将笔记连同相邻图片和 PDF 复制到 `src/content/posts/`，并把旧的 `created/topic` 元数据转换为 Fuwari 使用的 `published/category`。

新文章也可以直接通过以下命令创建：

```sh
pnpm new-post <filename>
```
