---
title: "netstat"
published: 2026-06-22
description: "net statistics netstat（网络统计）是一个用于显示网络连接、路由表、接口统计等信息的命令行工具。虽然在新系统中逐渐被 ss 命令取代，但它在许多环境中仍然广泛使用。"
tags: ["Linux", "操作系统"]
category: "Linux"
draft: false
---
net statistics
`netstat`（网络统计）是一个用于显示网络连接、路由表、接口统计等信息的命令行工具。虽然在新系统中逐渐被 `ss` 命令取代，但它在许多环境中仍然广泛使用。

## 基本语法
```bash
netstat [选项]
```

## 常用选项和用法

### 1. **显示所有连接**
```bash
netstat -a          # 显示所有连接（包括监听和非监听）
netstat -at         # 显示所有TCP连接
netstat -au         # 显示所有UDP连接
```


### 2. **显示监听端口**
```bash
netstat -l          # 显示所有监听端口
netstat -lt         # 显示监听TCP端口
netstat -lu         # 显示监听UDP端口
netstat -lx         # 显示监听UNIX域套接字
```

### 3. **显示带进程信息**
```bash
netstat -p          # 显示PID和程序名（需要sudo）
netstat -tp         # 显示TCP连接及进程
netstat -lp         # 显示监听端口及进程
```

### 4. **显示网络接口统计**
```bash
netstat -i          # 显示网络接口信息
netstat -ie         # 显示扩展接口信息（类似ifconfig）
```

### 5. **显示路由表**
```bash
netstat -r          # 显示路由表（等同route命令）
netstat -rn         # 显示路由表（不解析主机名）
```

### 6. **显示统计信息**
```bash
netstat -s          # 显示协议统计信息
netstat -st         # 显示TCP统计
netstat -su         # 显示UDP统计
```

## 实用组合示例

### 查看所有TCP监听端口及进程：
```bash
sudo netstat -tlnp
```
输出示例：
```
Proto Recv-Q Send-Q Local Address  Foreign Address  State    PID/Program name
tcp   0      0      0.0.0.0:22     0.0.0.0:*        LISTEN   1234/sshd
tcp   0      0      127.0.0.1:3306 0.0.0.0:*        LISTEN   5678/mysqld
```

### 查看ESTABLISHED连接：
```bash
netstat -an | grep ESTABLISHED
```

### 按端口号排序显示：
```bash
netstat -tunl | sort -n -k4
```

### 查看特定端口使用情况：
```bash
netstat -anp | grep :80
```

### 持续监控网络连接：
```bash
watch -n 1 netstat -at
```

## 输出字段说明

| 字段 | 说明 |
|------|------|
| Proto | 协议类型（tcp/udp） |
| Recv-Q | 接收队列大小 |
| Send-Q | 发送队列大小 |
| Local Address | 本地地址:端口 |
| Foreign Address | 远程地址:端口 |
| State | 连接状态 |
| PID/Program name | 进程ID和程序名 |

## 常见连接状态

| 状态 | 说明 |
|------|------|
| LISTEN | 监听连接请求 |
| ESTABLISHED | 已建立的连接 |
| SYN_SENT | 主动发起连接 |
| SYN_RECV | 接收到SYN请求 |
| TIME_WAIT | 等待足够时间确保远程TCP接收到连接中断请求 |
| CLOSE_WAIT | 等待从本地用户发来的连接中断请求 |

## 替代命令 ss
```bash
# netstat 与 ss 命令对比
netstat -tlnp      # 等同于
ss -tlnp

# ss 通常更快，因为它直接从内核获取信息
ss -a              # 显示所有套接字
ss -s              # 显示摘要统计
ss -o state established  # 显示已建立连接
```

## 注意事项
1. 查看进程信息需要root权限
2. 对于大量连接，建议使用 `ss` 命令（速度更快）
3. 输出结果可以通过管道进行过滤和分析

这个命令是网络故障排查、安全审计和性能监控的重要工具。