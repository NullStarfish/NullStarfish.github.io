---
title: "scp"
description: "SCP（Secure Copy Protocol）是基于 SSH 的安全文件传输工具。"
topic: "Shell"
tags:
  - "Linux"
  - "Shell"
featured: false
draft: false
---
# SCP 常见用法速查

SCP（Secure Copy Protocol）是基于 SSH 的安全文件传输工具。

## 基本语法
```bash
scp [选项] 源文件 目标文件
```

---

## 一、最常用场景

### 1. **本地 → 远程**
```bash
# 复制文件到远程
scp file.txt username@remote:/path/to/destination/

# 复制目录到远程（-r 递归）
scp -r folder/ username@remote:/path/to/destination/
```

### 2. **远程 → 本地**
```bash
# 从远程复制文件到本地
scp username@remote:/path/to/file.txt .

# 从远程复制目录到本地
scp -r username@remote:/path/to/folder/ .
```

### 3. **远程 → 远程**
```bash
# 在两个远程服务器间复制
scp user1@server1:/path/file user2@server2:/path/
```

---

## 二、常用选项

```bash
# 指定端口（非标准22端口时）
scp -P 2222 file.txt user@host:/path/

# 使用特定密钥
scp -i ~/.ssh/id_rsa_aws file.pem user@host:/path/

# 显示进度（大文件时有用）
scp -v file.iso user@host:/path/

# 压缩传输（适合文本文件）
scp -C data.log user@host:/path/

# 保留文件属性（时间、权限）
scp -p file.txt user@host:/path/

# 限制带宽（单位 Kbit/s）
scp -l 1024 largefile.iso user@host:/path/  # 限制1Mbps
```

---

## 三、实用示例

### 示例1：基本文件传输
```bash
# 上传文件到服务器家目录
scp resume.pdf john@server.com:~/

# 下载文件到当前目录
scp john@server.com:~/report.csv .

# 重命名文件传输
scp data.txt john@server.com:~/backup_data.txt
```

### 示例2：目录操作
```bash
# 上传整个项目目录
scp -r myproject/ john@server.com:~/projects/

# 下载日志目录
scp -r john@server.com:/var/log/nginx/ ./logs/

# 排除某些文件（结合tar）
tar czf - --exclude='*.tmp' logs/ | ssh john@server.com "tar xzf - -C /backup"
```

### 示例3：端口和密钥
```bash
# 通过非标准端口传输
scp -P 2222 -i ~/.ssh/vps_key server_backup.tar.gz root@vps:/backup/

# AWS EC2 实例文件传输
scp -i ~/.ssh/aws-key.pem -r ./website/ ec2-user@ec2-xxx.compute.amazonaws.com:/var/www/
```

### 示例4：批量操作
```bash
# 上传多个文件
scp file1.txt file2.jpg file3.pdf john@server.com:~/uploads/

# 使用通配符
scp *.log john@server.com:~/logs/
scp data_2024*.csv john@server.com:~/archive/

# 从列表文件读取
cat filelist.txt | xargs -I {} scp {} john@server.com:~/backup/
```

### 示例5：监控和调试
```bash
# 显示详细进度
scp -v largefile.iso john@server.com:~/  # -v 显示详细信息

# 安静模式（脚本中使用）
scp -q file.txt john@server.com:~/  # -q 安静模式
```

---

## 四、快捷写法

### 使用 SSH 配置别名
在 `~/.ssh/config` 中配置：
```bash
Host myserver
    HostName server.com
    User john
    Port 2222
    IdentityFile ~/.ssh/server_key
```

然后简化命令：
```bash
# 原来：scp -P 2222 -i ~/.ssh/server_key file.txt john@server.com:~
scp file.txt myserver:~/  # 直接使用别名
scp -r ./data/ myserver:/var/www/
```

---

## 五、常见问题解决

### 1. **权限被拒绝**
```bash
# 确保有写入权限
scp file.txt user@host:/tmp/  # 先传到/tmp，再移动
```

### 2. **大文件传输**
```bash
# 压缩传输
scp -C bigfile.iso user@host:~/  # 启用压缩

# 后台传输
nohup scp largefile.iso user@host:~/ &
```

### 3. **断点续传**
SCP 不支持断点续传，大文件建议用 rsync：
```bash
rsync -P --rsh=ssh largefile.iso user@host:~/  # -P 显示进度并支持断点
```

### 4. **传输速度慢**
```bash
# 使用更快加密算法
scp -c aes128-ctr file.txt user@host:~

# 禁用压缩（已经是压缩文件时）
scp -o "Compression=no" archive.zip user@host:~
```

---

## 六、SCP vs Rsync

| 场景 | 推荐工具 | 理由 |
|------|----------|------|
| 简单文件传输 | SCP | 语法简单，快速 |
| 大文件/目录 | Rsync | 支持断点续传、增量 |
| 频繁同步 | Rsync | 只传输变化部分 |
| 保持权限 | 两者都可 | SCP用 `-p`，Rsync用 `-a` |
| 第一次备份 | Rsync | 验证文件完整性 |

### Rsync 示例（SCP 替代方案）
```bash
# 类似 scp 的基本用法
rsync -avz file.txt user@host:~/  # -a归档 -v详细 -z压缩

# 断点续传大文件
rsync -P --rsh=ssh movie.mkv user@host:~/  # -P=--progress --partial
```

---

## 七、速查表

```bash
# 上传文件
scp local.txt user@host:~/             → 远程家目录
scp local.txt user@host:/tmp/          → 远程/tmp目录

# 下载文件  
scp user@host:~/remote.txt .           → 当前目录
scp user@host:/var/log/app.log ./logs/ → 指定目录

# 目录操作
scp -r ./project/ user@host:~/         → 上传目录
scp -r user@host:~/data/ ./backup/     → 下载目录

# 选项组合
scp -rP 2222 -i key.pem ./www/ user@host:/var/www/
# -r 递归  -P 端口  -i 密钥
```

**记住核心模式**：
- `scp 本地路径 远程路径` = 上传
- `scp 远程路径 本地路径` = 下载  
- 加 `-r` 传目录
- 路径格式：`用户名@主机:路径`