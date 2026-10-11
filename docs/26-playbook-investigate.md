# pstack 拆解 26 · 调查与取证

在动手之前先看清。这一篇讲只读的调查,和两种拿到诊断的方式:从活着的进程插桩,或从已经捕获的产物里读。

## investigation

在弄清问题之前不要动手。理解一个问题的最好方式,是先让证据说话,而不是先改代码:一个误解会在代码里变成一次错误的修复,而在一次重述里纠正它只花一条消息。

`investigation` 处理只读的问题。它回答三种问法:这是怎么运作的,它为什么被造成这样,我们确定吗。

它路由到 `how`。如果是关于动机的问题,再加 `why`。如果是几个选项之间做决定,它返回一个带权衡表的推荐,而不是一个解释。

它有一条很硬的性质:它是只读的,产出的是一个带引用的解释或推荐,不是一次代码改动。没有 PR,没有 babysit。只有一种情况例外,当这次调查是先于一次代码改动的前置,那时候它把结果交回给你,重新路由到 bug-fix 或 feature。它的 throughput checkpoint 只有一行:`n/a, read-only investigation`。

它最值得学的一点,是它逼你把证据和猜测分开。你在 prompt 里加一句"给我你用了什么数据",它就会把两者摆开。

有一个用法特别有效:当一个报告很嘈杂(一长串讨论、一个模糊的 bug),先做一次调查,让结论变成一次重述。

```text
/poteto-mode 读这段讨论。用你自己的话说清底层的问题是什么,用大白话。先不要改任何代码。
```

一个误解会在重述里现形,纠正它只花一条消息。所以当成因不清楚时,先要发现,不要先要修复。

## runtime-forensics

症状和原因分开,诊断和修复也分开。这不是流程洁癖:一旦你把诊断和修复混在一次改动里,就没法判断这个修复是不是真的对着那个原因,也就失去了一次干净的对照。

`runtime-forensics` 处理一个**活着的**症状:内存泄漏、空转的 CPU 占用、一个偶发的视觉 glitch。这类问题的特点是读源码读不出来:它取决于运行时状态、时序和真实负载。所以它的方法不是推理,是**插桩**。它的总纲是:**你拥有这份诊断。插桩那个活着的进程,不要从源码空想。**

它的步骤。

1. **在匹配的 surface 上捕获活信号。** 用一个真产物,不用猜测。空转的进程抓一份 CPU profile,内存泄漏抓一份 heap snapshot,视觉 glitch 抓一份 CDP trace。抓取通过对应的 control skill 完成。
2. **把产物缩减到那枚冒烟的枪。** 对 CPU,是热路径上的那个函数;对泄漏,是从被泄漏对象到 GC root 的 retainer 链;对 glitch,那个在没有输入时仍在触发的循环。大产物交给 subagent 解析,主线程只留缩减后的发现。
3. **在相信它之前,先证明那个机制。** 通过 CDP eval 给运行中的进程注入插桩,或者不重载就热修活代码,用很便宜的方式确认假设。这一步把"看起来是这里"变成"就是这里"。
4. **把发现映射回源码。** 文件、符号、真正分配或调度的那一行。
5. throughput checkpoint 保持一行:`throughput checkpoint: n/a, read-only forensics`。

它交回一份被引用的诊断、捕获的信号、缩减后的发现、你怎么证明的机制、源码位置和产物路径。**没被要求就不修。** 等原因确定了,再交回给 bug-fix 或 perf-issue 去修。它和 `trace-forensics` 是一对:一个从活着的进程出发、插桩取证,一个从已经捕获好的产物出发。

## trace-forensics

`trace-forensics` 处理一份**已经存在**的 profiling 产物:cpuprofile、trace、spindump、heap snapshot。它和 runtime-forensics 的区别在取证对象:那边你面对一个活着的进程,这边捕获已经完成,产物是一份固定的数据集。

它的一句总纲:**你拥有从产物得到的诊断。加载它,整理成能查的形状,收敛到原因,归因到源码。** 既然是固定数据集,就读它,不要重跑它。工具还要保持通用,让这套流程换个环境也能用:DevTools 或 trace parser 读 cpuprofile 和 `.json.gz`,一个文本编辑器读 spindump,heap 工具读 heapsnapshot。

它的六步。

1. **认出格式,用对的工具加载。** 大产物交给 subagent 解析,主线程只留缩减后的发现。
2. **把原始产物转换成能查询的形状。** 把 trace 或 heap snapshot dump 进 sqlite,一行一个样本、一帧、一个节点。先到"能查询",再开始读。
3. **收敛到原因。** 查出占时间最多的帧,沿调用树走到热路径;泄漏就从被泄漏对象沿 retainer 链追到 GC root;spindump 就找出卡在 on-CPU 或被阻塞的那个线程,以及它等待的原因。
4. **归因到源码。** 用产物自带的符号把热帧映射到文件、符号、行号。一个还没有源码映射的帧,不构成诊断:要么把符号解析出来,要么明说这份产物没有带符号。
5. **有配对 capture 就对照确认。** 前后两份产物做 diff。**没有配对时,把发现标成"这份产物支持的最强假设",不是一个已确认的原因。**
6. **交回一份带引用的诊断,没被要求就不修。** 原因确定后,路由到 bug-fix 或 perf-issue。throughput checkpoint 一行:`throughput checkpoint: n/a, read-only forensics`。

它交回:产物和格式、缩减后的发现、源码位置、产物路径,以及配对 capture 有没有确认它。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/investigation.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/investigation.md)
- [`skills/poteto-mode/playbooks/runtime-forensics.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/runtime-forensics.md)
- [`skills/poteto-mode/playbooks/trace-forensics.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/trace-forensics.md)
