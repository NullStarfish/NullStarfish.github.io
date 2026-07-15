---
title: "ssh"
published: 2026-06-22
description: "使用配置简化连接："
tags: ["Linux", "Shell"]
category: "Shell"
draft: false
---
# SSH 最常用选项及实践指南

## 一、基础连接选项

### 1. **指定端口** `-p`
```bash
# 连接非标准端口（默认22）
ssh -p 2222 username@server.com

# 常用场景：云服务器、容器、跳板机
ssh -p 2222 ubuntu@192.168.1.100
```

### 2. **指定密钥** `-i`
```bash
# 使用特定私钥文件连接
ssh -i ~/.ssh/id_rsa_work username@server.com

# 多密钥管理示例
ssh -i ~/.ssh/aws_key.pem ec2-user@ec2-instance.com
ssh -i ~/.ssh/github_key git@github.com
```

### 3. **指定用户** `-l` 或 `user@host` 格式
```bash
# 方式1：使用-l参数
ssh -l username server.com

# 方式2：直接包含用户名（更常用）
ssh username@server.com

# 常用用户示例
ssh root@192.168.1.1        # 管理员登录
ssh ubuntu@ec2-instance     # AWS Ubuntu实例
ssh git@github.com          # Git服务
```

## 二、高级功能选项

### 4. **端口转发** `-L` / `-R` / `-D`
```bash
# 本地端口转发（最常用）
ssh -L 本地端口:目标主机:目标端口 跳板机用户@跳板机
ssh -L 3306:localhost:3306 username@jumpserver  # 转发MySQL

# 远程端口转发
ssh -R 远程端口:本地主机:本地端口 远程用户@远程主机
ssh -R 8080:localhost:80 username@remoteserver  # 暴露本地Web服务

# 动态SOCKS代理
ssh -D 1080 username@proxy-server  # 创建SOCKS5代理
```

### 5. **X11图形转发** `-X` / `-Y`
```bash
# 启用X11转发（运行GUI程序）
ssh -X username@server.com
# 然后在远程执行：
firefox &  # 在本地显示Firefox窗口

# 可信X11转发（性能更好但安全性稍低）
ssh -Y username@server.com
```

### 6. **压缩传输** `-C`
```bash
# 对慢速网络特别有用
ssh -C username@remote-server

# 组合使用
ssh -C -X username@server  # 压缩+图形转发
```

## 三、认证和安全选项

### 7. **代理转发** `-A`
```bash
# 转发本地SSH密钥到远程，用于链式连接
ssh -A username@jumpserver
# 然后在跳板机上可以直接访问内网机器
ssh internal-server
```

### 8. **严格主机检查** `-o`
```bash
# 跳过主机密钥检查（首次连接或自动化脚本）
ssh -o "StrictHostKeyChecking=no" username@server

# 忽略已知主机文件
ssh -o "UserKnownHostsFile=/dev/null" -o "StrictHostKeyChecking=no" user@host

# 连接超时设置
ssh -o "ConnectTimeout=10" username@server
ssh -o "ServerAliveInterval=60" username@server  # 每60秒保活
```

## 四、执行命令相关

### 9. **远程执行命令**
```bash
# 执行单条命令后退出
ssh username@server "ls -la /tmp"

# 执行多条命令
ssh username@server "cd /var/log && tail -f syslog"

# 执行脚本
ssh username@server < local_script.sh
ssh username@server "bash -s" < local_script.sh

# 带变量的命令
ssh username@server "TZ=Asia/Shanghai date"
```

## 五、实用组合示例

### 示例1：**开发环境连接**
```bash
# 连接开发服务器，启用图形和代理
ssh -X -A -C developer@dev-server

# 本地开发端口转发
ssh -L 3000:localhost:3000 -L 5432:localhost:5432 dev@server
# 访问本地3000端口即访问远程3000（前端）
# 访问本地5432端口即访问远程PostgreSQL
```

### 示例2：**跳板机连接内网**
```bash
# 通过跳板机连接数据库
ssh -L 3306:db.internal:3306 -J jumpserver@gateway.com user@jumpserver

# 或分两步
ssh -A -t jumpserver@gateway.com ssh db.internal
```

### 示例3：**自动化运维**
```bash
#!/bin/bash
# 批量执行命令
servers=("server1" "server2" "server3")

for server in "${servers[@]}"; do
    echo "=== $server ==="
    ssh -o ConnectTimeout=5 -o BatchMode=yes ubuntu@$server "
        uptime
        df -h /
        free -m
    "
done
```

### 示例4：**安全隧道**
```bash
# 创建安全浏览隧道
ssh -D 1080 -C -N -f user@proxy-server
# -D: SOCKS代理
# -N: 不执行命令
# -f: 后台运行
# 然后浏览器设置SOCKS代理 localhost:1080
```

### 示例5：**文件传输替代方案**
```bash
# 使用ssh直接复制文件
ssh user@server "tar czf - /path/to/dir" | tar xzf - -C /local/dir

# 反向操作
tar czf - /local/dir | ssh user@server "tar xzf - -C /remote/dir"
```

## 六、配置文件优化

### `~/.ssh/config` 示例：
```bash
Host dev
    HostName dev-server.company.com
    User developer
    Port 2222
    IdentityFile ~/.ssh/dev_key
    ForwardAgent yes
    ServerAliveInterval 60
    LocalForward 3000 localhost:3000
    LocalForward 5432 localhost:5432

Host prod
    HostName 192.168.1.100
    User root
    Port 22
    IdentityFile ~/.ssh/prod_key
    StrictHostKeyChecking no

Host github.com
    User git
    IdentityFile ~/.ssh/github_key
    IdentitiesOnly yes
```

使用配置简化连接：
```bash
ssh dev      # 代替完整命令
ssh prod     # 自动使用配置
```

## 七、常用场景总结

| 场景   | 命令示例                                   | 说明       |
| ---- | -------------------------------------- | -------- |
| 标准连接 | `ssh user@host`                        | 基本用法     |
| 非标端口 | `ssh -p 2222 user@host`                | 修改SSH端口时 |
| 密钥登录 | `ssh -i key.pem user@host`             | AWS/云服务器 |
| 端口转发 | `ssh -L 3306:localhost:3306 user@host` | 访问远程数据库  |
| 跳板连接 | `ssh -J jump@host user@target`         | 通过跳板机    |
| 执行命令 | `ssh user@host "cmd"`                  | 远程命令执行   |
| 代理隧道 | `ssh -D 1080 user@host`                | 科学上网     |
| 图形应用 | `ssh -X user@host`                     | 运行GUI程序  |
| 后台隧道 | `ssh -f -N -L ...`                     | 建立后台隧道   |

## 八、安全注意事项

1. **密钥保护**：私钥设置600权限，使用密码保护
2. **禁用root登录**：生产环境建议禁用 `PermitRootLogin no`
3. **使用强密码**：或完全使用密钥认证
4. **限制用户**：`AllowUsers` 限制可登录用户
5. **日志监控**：检查 `/var/log/auth.log` 或 `journalctl -u ssh`

这些选项涵盖了SSH 90%的日常使用场景，掌握后可以高效进行远程管理和开发工作。