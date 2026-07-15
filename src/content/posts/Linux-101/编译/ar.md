---
title: "ar"
published: 2026-06-22
description: "ar（archive）是Linux下用于创建、修改和提取静态库归档文件的工具。它是GNU Binutils工具集的一部分，主要用于管理.a静态库文件。"
tags: ["Linux", "编译"]
category: "编译工具"
draft: false
---
`ar`（archive）是Linux下用于创建、修改和提取静态库归档文件的工具。它是GNU Binutils工具集的一部分，主要用于管理`.a`静态库文件。

## 一、基本语法

```bash
ar [选项] <归档文件> [成员文件...]
```

## 二、常用操作模式

### 1. **创建归档文件**
```bash
# 创建归档文件并添加文件
ar rcs libexample.a file1.o file2.o file3.o
```

### 2. **添加文件到归档**
```bash
# 添加/替换文件
ar r libexample.a newfile.o

# 追加文件到末尾
ar q libexample.a additional.o

# 插入文件到指定位置
ar ra existing.o libexample.a newfile.o  # 插入到existing.o之后
```

### 3. **删除文件**
```bash
# 从归档中删除文件
ar d libexample.a obsolete.o
```

### 4. **提取文件**
```bash
# 提取所有文件
ar x libexample.a

# 提取特定文件
ar x libexample.a specific.o

# 保留原始时间戳
ar xo libexample.a
```

### 5. **查看内容**
```bash
# 列出归档内容
ar t libexample.a

# 显示详细信息（v=详细模式）
ar tv libexample.a
```

## 三、主要选项详解

### 操作修饰符：
- `r` - 插入文件（替换已存在的）
- `q` - 快速追加到末尾
- `d` - 删除文件
- `t` - 列出内容
- `x` - 提取文件
- `m` - 移动/重新排序文件

### 修饰符选项：
- `c` - 不显示创建消息
- `s` - 创建或更新索引（相当于ranlib）
- `u` - 只更新比归档内更新的文件
- `v` - 详细模式
- `o` - 保留原始时间戳
- `N` - 使用指定实例（当文件重名时）

## 四、实用示例

### 1. **创建静态库**
```bash
# 编译目标文件
gcc -c file1.c file2.c file3.c

# 创建静态库
ar rcs libmylib.a file1.o file2.o file3.o
```

### 2. **更新库中的文件**
```bash
# 重新编译更新的源文件
gcc -c updated.c -o updated.o

# 更新库中的文件
ar rus libmylib.a updated.o
```

### 3. **查看库内容详细信息**
```bash
ar tv libmylib.a
# 输出示例：
# rw-r--r-- 1000/1000   1234 Jan  1 12:00 2025 file1.o
# rw-r--r-- 1000/1000   5678 Jan  1 12:00 2025 file2.o
```

### 4. **从库中提取特定文件**
```bash
# 提取单个文件用于调试
ar x libmylib.a file1.o
```

### 5. **组合多个库**
```bash
# 方法1：提取后重新打包
mkdir tmp
cd tmp
ar x ../lib1.a
ar x ../lib2.a
ar rcs ../libcombined.a *.o

# 方法2：使用MRI脚本
echo "CREATE libcombined.a" > combine.mri
echo "ADDLIB lib1.a" >> combine.mri
echo "ADDLIB lib2.a" >> combine.mri
echo "SAVE" >> combine.mri
echo "END" >> combine.mri
ar -M < combine.mri
```

## 五、特殊功能

### 1. **使用MRI脚本**
```bash
# 创建控制脚本
cat > script.mri << EOF
CREATE libnew.a
ADDLIB libexisting.a
ADDMOD newfile.o
DELETE oldfile.o
SAVE
END
EOF

# 执行脚本
ar -M < script.mri
```

### 2. **生成符号表索引**
```bash
# 为库生成索引（加速链接）
ranlib libexample.a
# 或使用ar s
ar s libexample.a
```

## 六、使用技巧和注意事项

1. **文件顺序重要**
   ```bash
   # 链接器搜索顺序与归档中顺序一致
   # 将常用文件放在前面可以提高链接速度
   ```

2. **避免重复符号**
   ```bash
   # 检查重复符号
   nm -s libexample.a | grep "duplicate"
   ```

3. **查看库中符号**
   ```bash
   nm libexample.a      # 查看所有符号
   nm -s libexample.a   # 仅显示索引符号
   ```

4. **与链接器配合**
   ```bash
   # 链接时使用静态库
   gcc main.c -L. -lmylib -o program
   ```

5. **处理大型库**
   ```bash
   # 分拆大型库
   ar x liblarge.a
   # 处理目标文件后重新打包
   ```

## 七、常见问题

1. **"no archive members specified"**
   - 确保提供了正确的成员文件名

2. **文件顺序问题**
   - 使用`ar m`重新排序归档中的文件

3. **符号冲突**
   - 使用`objdump`或`nm`检查重复符号

4. **版本兼容性**
   - 使用`ar -V`检查版本
   - 确保使用相同工具链创建和使用的库

## 八、替代工具

对于更复杂的归档需求，可以考虑：
- `tar` - 通用归档工具
- `libtool` - 库管理高级工具
- CMake/autotools - 构建系统中的库管理

`ar`虽然功能相对基础，但在静态库管理中仍然是标准且高效的工具，特别是在嵌入式开发和系统编程中广泛使用。