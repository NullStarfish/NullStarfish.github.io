# Books

将需要出现在网站书架中的 PDF 放在此目录或任意子目录。

可以为 `example.pdf` 添加同名的 `example.json`：

```json
{
  "title": "书名",
  "author": "作者",
  "description": "书籍简介",
  "tags": ["教材", "数字电路"],
  "featured": false
}
```

JSON 完全可选。没有元数据时，网站会使用 PDF 文件名作为书名、父目录作为标签。
