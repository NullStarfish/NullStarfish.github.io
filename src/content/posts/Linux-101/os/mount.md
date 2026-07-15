---
title: "mount"
published: 2026-06-22
description: "挂载（Mount）是 Linux 的基本操作。由于 Linux 将所有硬件都视为文件，所以“挂载”本质上就是把磁盘分区的内容映射到一个文件夹里的过程。"
tags: ["Linux", "操作系统"]
category: "Linux"
draft: false
---
挂载（Mount）是 Linux 的基本操作。由于 Linux 将所有硬件都视为文件，所以“挂载”本质上就是**把磁盘分区的内容映射到一个文件夹里**的过程。

如果你要挂载一个“不同文件系统”的磁盘（比如 Windows 的 NTFS、大容量 U 盘的 exFAT，或者 Linux 另一种常用的 XFS），请参考以下完整详细的教程。

---

### 第一步：准备工作（识别磁盘）

在挂载之前，你必须先知道这块盘叫什么，以及它的文件系统是什么。

**执行命令：**
```bash
lsblk -f
```
*   **看什么：** 找到你的设备名（如 `sdb2`），观察 `FSTYPE` 这一列。
*   **常见类型：** `ext4` (Linux), `vfat` (FAT32), `ntfs` (Windows), `exfat` (U盘), `xfs` (高性能Linux)。

---

### 第二步：创建挂载点

挂载点只是一个普通的文件夹。建议在 `/mnt` 或 `/media` 下创建。

```bash
sudo mkdir -p /mnt/mydisk
```

---

### 第三步：正式挂载

#### 1. 自动识别挂载（最常用）
大多数现代 Linux 内核能自动识别文件系统。
```bash
sudo mount /dev/sdb2 /mnt/mydisk
```

#### 2. 手动指定文件系统类型（当你需要精准控制时）
使用 `-t` 参数指定类型：
*   **NTFS (Windows)**: `sudo mount -t ntfs-3g /dev/sdb2 /mnt/mydisk` (或者新内核用 `-t ntfs3`)
*   **FAT32**: `sudo mount -t vfat /dev/sdb2 /mnt/mydisk`
*   **exFAT**: `sudo mount -t exfat /dev/sdb2 /mnt/mydisk`
*   **XFS**: `sudo mount -t xfs /dev/sdb2 /mnt/mydisk`

---

### 第四步：进阶技巧——不同文件系统的权限处理

这是最容易踩坑的地方！
**注意：** NTFS、FAT32、exFAT 这种 Windows 系的文件系统**不支持** Linux 的权限（即它们没有 Inode 记录 rwx 权限）。

如果你挂载后发现只有 root 能读写，你需要通过 **Mount Options** 手动指定权限归属：

```bash
# 获取你的 UID (通常是 1000)
id

# 挂载并指定：这块盘里的所有文件都属于我(uid=1000)，权限是 755
sudo mount -o uid=1000,gid=1000,dmask=022,fmask=133 /dev/sdb2 /mnt/mydisk
```
*   `uid/gid`：指定文件的拥有者。
*   `dmask/fmask`：控制目录和文件的默认权限（反向掩码）。

---

### 第五步：常用挂载参数 (Options) 汇总

你可以用 `-o` 后面跟多个参数，用逗号隔开：

| 参数 | 功能 |
| :--- | :--- |
| **`ro`** | 只读挂载（防止误删，常用于数据恢复）。 |
| **`rw`** | 读写挂载（默认）。 |
| **`noexec`** | 禁止在该盘执行二进制程序（提高安全性）。 |
| **`iocharset=utf8`** | 防止 Windows 磁盘下的中文文件名乱码。 |
| **`remount`** | 在不卸载的情况下更改模式（如 `sudo mount -o remount,ro /mnt/mydisk`）。 |

---

### 第六步：永久挂载（修改 `/etc/fstab`）

如果你希望开机时磁盘自动挂载，必须修改 `/etc/fstab` 文件。**千万不要直接写 `/dev/sdb2`**，因为插拔 U 盘后设备名可能会变。我们要用 **UUID**。

1.  **查询 UUID：**
    ```bash
    lsblk -f
    # 或者
    sudo blkid /dev/sdb2
    ```
2.  **编辑文件：**
    ```bash
    sudo nano /etc/fstab
    ```
3.  **在最后添加一行：**
    ```text
    # <device UUID>          <mount point>  <type>  <options>       <dump> <pass>
    UUID=586C-2423           /mnt/mydisk    vfat    defaults,uid=1000  0      2
    ```
4.  **测试配置是否正确（非常重要）：**
    修改完后千万别直接重启，先执行：
    ```bash
    sudo mount -a
    ```
    *如果没报错，说明配置正确，下次重启会自动挂载。*

---

### 常见故障排除

1.  **报错：`target is busy`**
    *   原因：你（或者某个程序如终端、文件管理器）正处于挂载点目录里。
    *   解决：`cd /` 退出该目录再卸载；或者用 `fuser -m /mnt/mydisk` 查看谁在占用。
2.  **报错：`unknown filesystem type 'ntfs'`**
    *   解决：安装驱动。Ubuntu/Debian 运行 `sudo apt install ntfs-3g`。
3.  **Windows 磁盘挂载失败（Read-only）**
    *   原因：Windows 开启了“快速启动”（Fast Boot），磁盘处于休眠锁定状态。
    *   解决：进入 Windows 关闭快速启动，或者在 Linux 下执行 `ntfsfix /dev/sdb2` 强制清理标记（有风险）。

### 总结
*   **临时用**：`lsblk -f` 查名字 -> `mkdir` -> `mount`。
*   **权限不对**：加 `-o uid=1000`。
*   **长期用**：写进 `/etc/fstab` 并用 `UUID`。