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

## 编写文章

文章及其相邻图片、PDF 等资源统一保存在 `src/content/posts/`。新文章可以直接编辑该目录，或通过以下命令创建：

```sh
pnpm new-post <filename>
```

如需统一旧式数学公式定界符，可以运行：

```sh
node scripts/normalize-math-delimiters.mjs
```
