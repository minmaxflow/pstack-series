# pstack 拆解

一套面向资深工程师的精读系列。把 pstack 从原则到调度,整台机器拆开讲清楚。

## pstack 的来历

pstack 的作者是 poteto([X](https://x.com/poteto) / [GitHub](https://github.com/backnotprop))。他在 Meta、Netflix、Cursor 写过几百万行代码,同时在 React 核心团队,参与 React Compiler 的构建和维护。

他做这套东西的起点是一个判断:AI 正在写太多 slop,注水、低质的代码。而"跑得快但质量差"不是一个值得追求的目标。原文里有一句话被反复引用:

> if you want to go fast, go deep first.
>
> 想快,先深。

pstack 就是他对这件事的回答。它不是什么新工具,而是他本人在 Cursor 每天用来交付高质量代码的那一套 skill 和原则。目标不是最大化代码量,恰恰相反,它帮你写得更少,但质量更高。

它最初是 Cursor 官方插件仓库 [`cursor/plugins`](https://github.com/cursor/plugins/tree/main/pstack) 里的一个插件。后来有人在独立仓库 [`backnotprop/pstack`](https://github.com/backnotprop/pstack) 维护了一份镜像,让它能用在 Cursor 之外的 harness 里,比如 Claude Code、Codex、Pi、OpenCode。它现在是一个有一千五百多颗星的独立项目。

顺带一提,pstack 里那个把上一条消息用大白话重说一遍的 `/bro`,来自作者的另一个仓库 [`backnotprop/bro`](https://github.com/backnotprop/bro)。

## 它的结构

pstack 是一台分层搭起来的机器。

| 层 | 是什么 | 数量 |
|---|---|---|
| Principles | 公理。每条是一个"何时适用"的不变式 | 24 |
| Skills | 能力。how / why / arena / swarm / tdd 这些 | 27 |
| Playbooks | 程序。按任务类别编排 skill 的步骤 | 23 |
| poteto-mode | 调度。匹配任务、拷步骤、路由 skill | 1 |

## 这个系列是什么

这个系列把这四层逐层拆开。每个节点回答同样的三个问题:它解决什么问题,为什么非有它不可,它怎么调用下一层。

读完你能做到一件事:翻开任何一份 `SKILL.md`,都能反推出它为什么长成这个样子,并且精确地控制 agent 的行为。

## 怎么读

- **第一次**,按顺序从头读。前五篇是原则,是后面所有内容共用的词汇表,跳过后面的会吃力。
- **已经用过 pstack**,可以先看 [15 · poteto-mode 与运行时](./15-poteto-mode-runtime),看四层合起来怎么跑,再回头补原则。
- **只想尽快上手**,读 [01](./01-core-restraint)、[04](./04-verification)、[15](./15-poteto-mode-runtime) 这三篇,再按需翻其他章节。

其中第 04 篇是全系列的承重柱。整台机器能在并行、自主里安全地跑,都建立在这一篇讲的"什么才算证明"上。如果只读一篇,读它。

## 目录

### 第一部分 · 原则

地基。24 条原则按仓库自己的分类组织,是后面每一章共用的词汇。

- [01 · 决定与克制](./01-core-restraint) — 这次改动该有多大。能删就删,做也先减,用读者的负担而不是行数来衡量"少"。
- [02 · 基础、体验与探索](./02-core-investment) — 力气该往哪里花。先定数据结构,为用户而建,没先例就造原型,把工作做成杠杆,反复失败就回头质疑前提。
- [03 · Architecture](./03-architecture) — 把规则从人的记忆搬进结构。领域进结构,校验进边界,约束进类型,重启安全进操作,并发所有权进状态划分。
- [04 · Verification](./04-verification) — 什么才算证明。真实产物、追到根因、小步可验证、测行为不测实现、数字要能解释。全系列的承重柱。
- [05 · Delegation & Meta](./05-delegation-meta) — 打破一个人的上限。上下文是稀缺资源,可逆的工作不阻塞人,把重复的教训编码成结构。

### 第二部分 · 能力

skill 是什么:一种具名的能力,由原则组合而成,带触发、输出和契约。

- [06 · 理解](./06-understanding) — 在改之前把系统装进脑子。how / why / teach / recall / blast-radius。
- [07 · 设计与对抗](./07-design-adversarial) — 对抗"第一个想到的形状"。architect / arena / swarm / interrogate,用并行和模型差异。
- [08 · 验证机械](./08-verification-machinery) — 把"什么算证明"变成能跑的工具。tdd、benchmark-checklist、验证技能的建与守。
- [09 · 交付与文体](./09-delivery-prose) — 让产物读起来像人做的。散文、文档、注释、语言的规则。
- [10 · 元、支撑与入口](./10-meta-support-entry) — 系统的底座。自我改进、可审计、定制流程、配置、入口和辅助。

### 第三部分 · 程序

playbook 是什么:一段程序,编排 skill,带步骤、证据契约和完成契约。

- [11 · 理解、诊断与技能元](./11-understanding-diagnosis-skillmeta) — 交付物是答案或诊断,不是代码。调查、两种取证,以及 skill 的编写与评估。
- [12 · 构建循环](./12-build-loop) — 说清你观察到了什么,让 playbook 去要证据。feature / refactoring / bug-fix / perf / hillclimb / prototype / visual-parity。
- [13 · 交付与自主](./13-delivery-autonomy) — 绿不等于安全。开 PR、babysit、shipping、自主运行、autopilot、orchestrate。
- [14 · 连续性与维护](./14-continuity-maintenance) — 处理时间和中断。接续、挂起、多阶段计划、worktree 清理。

### 第四部分 · 调度

- [15 · poteto-mode 与运行时](./15-poteto-mode-runtime) — 四层怎么合起来。构造自下而上,执行自上而下,一句话如何带这么多 rigor。
- [16 · 取舍与上手](./16-tradeoffs-adoption) — 成本、边界,以及怎么长出你自己的 mode。

## 一句话

这一整套东西,从头到尾只讲了一件事:**可信。**

生成变便宜了,可信没有。pstack 把"可信"这件昂贵的事拆成 24 个名字,组织成能力,组织成程序,再交给一个调度器,让 agent 能自己对着一件真实的东西证明自己的工作。信任一旦成立,委托、并行、自主才安全。

---

本系列的源码在 [GitHub](https://github.com/minmaxflow/pstack-series)。pstack 本体的仓库在 [backnotprop/pstack](https://github.com/backnotprop/pstack)。
