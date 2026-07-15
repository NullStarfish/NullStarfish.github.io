---
title: "Makefile debugging"
description: "利用 GNU Make 的 dry-run、trace、变量检查和规则数据库定位变量覆盖、错误依赖与意外重建。"
topic: "Makefile"
tags:
  - "Makefile"
  - "Debugging"
featured: false
draft: false
---
调试 Makefile 时，最重要的是先确定问题属于哪一类：

1. 变量的值或来源不符合预期。
2. 某条规则没有命中，或者命中了错误的规则。
3. 目标被意外重建，或者应该重建却没有重建。
4. Make 已经生成了正确命令，但 Shell 命令自身执行失败。

---

### 一、只查看命令，不实际执行

```bash
make -n TARGET
make --just-print TARGET
make --dry-run TARGET
```

这三个写法等价。它们适合检查编译器参数、链接顺序和最终展开后的路径。

强制假设所有目标都需要重建，同时仍不执行：

```bash
make -Bn TARGET
```

`-B` 可以避免“目标已经是最新的，所以看不到命令”。

---

### 二、查看规则为什么执行

```bash
make --trace TARGET
```

输出会指出规则所在的 Makefile 和行号，并列出触发更新的依赖。它通常是分析“为什么
这个目标又编译了”的首选工具。

更详细的依赖搜索过程：

```bash
make -d TARGET
```

`-d` 会输出大量隐式规则搜索信息，只建议在 `--trace` 不足以定位问题时使用。

---

### 三、打印变量

可以在 Makefile 解析阶段临时加入：

```makefile
$(info SIM_TARGET=$(SIM_TARGET))
$(warning VERILOG_SRCS=$(VERILOG_SRCS))
```

需要立刻停止并显示信息时：

```makefile
$(error unexpected target: $(SIM_TARGET))
```

推荐加入一个通用查询目标：

```makefile
.PHONY: print-%
print-%:
	@echo '$*=$($*)'
	@echo 'origin=$(origin $*)'
	@echo 'flavor=$(flavor $*)'
	@echo 'raw=$(value $*)'
```

使用：

```bash
make print-SIM_BUILD_DIR
make print-SIM_BUILD_TAG SIM_TARGET=ysyxsoc BOARD=1
```

三个检查函数的含义：

| 函数 | 含义 |
| :--- | :--- |
| `origin` | 变量来自 Makefile、命令行、环境变量、默认值还是 `override`。 |
| `flavor` | 变量是 `recursive`（通常由 `=` 定义）还是 `simple`（通常由 `:=` 定义）。 |
| `value` | 获取变量保存的原始文本，不继续展开其中的变量引用。 |

---

### 四、检查未定义变量

```bash
make --warn-undefined-variables TARGET
```

它可以发现变量拼写错误，但某些 Makefile 会故意读取未定义变量，因此大型工程中可能
产生噪声。常用组合是：

```bash
make --trace --warn-undefined-variables TARGET
```

---

### 五、查看 Make 的完整数据库

```bash
make -pRrq : > make-db.txt
```

参数含义：

- `-p`：打印变量和规则数据库。
- `-R`：关闭内置变量。
- `-r`：关闭内置隐式规则。
- `-q`：只检查，不执行 recipe。
- `:`：使用一个永远成功的空目标。

然后可以搜索变量或目标最终采用的定义：

```bash
grep '^CSRC_LIBS[[:space:]]*[:?+]*=' make-db.txt
grep -n '^build/sim/npc/csrc/libcsrc\.a:' make-db.txt
```

需要注意：变量展开和目标依赖展开是两套机制。一个变量最终展开为 `libfoo.a`，并不
会自动继续展开为该 archive 的 `.o` 和 `.cpp` 依赖。

---

### 六、调试 Shell recipe

如果 Make 展开的命令正确，但执行行为异常，可以启用 Shell trace：

```makefile
target:
	set -euxo pipefail; \
	echo "target=$@"; \
	some-command
```

也可以临时为整个构建指定带 trace 的 Shell：

```bash
make SHELL=/bin/bash .SHELLFLAGS='-x -c' TARGET
```

每个 recipe 逻辑行默认由独立 Shell 执行。下面的 `cd` 不会影响下一行：

```makefile
bad:
	cd build
	pwd
```

应写成同一个逻辑行：

```makefile
good:
	cd build && pwd
```

或启用 GNU Make 的 `.ONESHELL`。

---

### 七、判断目标是否最新

```bash
make -q TARGET
echo $?
```

返回值通常为：

- `0`：目标已经是最新的。
- `1`：目标需要更新。
- `2`：发生错误。

配合 `stat` 和 `--trace` 可以定位时间戳问题：

```bash
stat TARGET PREREQUISITE
make --trace TARGET
```

### 推荐排查顺序

```text
make -n
  -> make --trace
  -> print-% / info / origin / flavor / value
  -> make -pRrq
  -> make -d
```

先缩小目标范围，再增加日志详细程度，通常比从完整构建日志中逐行搜索高效得多。
