# pstack 拆解

一套面向资深工程师的精读系列。把 pstack 从原则到调度,整台机器拆开讲清楚。

## 为什么会有 pstack

AI coding 把这套工作的前提拿掉了。

以前,写代码和读代码的是同一群人,理解在写作过程中自然发生;评审靠人,状态靠人的记忆,质量靠人的手速和耐心。现在代码由模型大量生成,速度、规模、数量级都变了,那些旧默认一个个失效:你不是每一行的作者,你没法读完所有产出,你不能假定干活的人记得上下文,你也不能靠"它说做好了"来判断对错。

于是问题从"怎么写得更多"变成了一组新的问题:

- 我怎么在不满读每一行的情况下,确认这份代码是对的?
- 我怎么让几个 agent 同时干活,而不互相踩、不一起漂移?
- 我怎么把脑子里的意图,变成机器能持续遵守的东西?
- 我怎么在这样高的节奏下,还敢对结果负责?

pstack 是对这组问题的系统回答。它同时做两件事:把模型的长处(速度、广度、不知疲倦)放大到极致,再用一道道结构把它的短处(自信地写错、自我评审无信息量、只照抄最近的形状、没有持久记忆)挡住。

这个系列把它拆开讲清楚。

## pstack 的来历

pstack 的作者是 poteto([X](https://x.com/poteto) / [GitHub](https://github.com/backnotprop))。她在 Meta、Netflix、Cursor 写过几百万行代码,同时在 React 核心团队,参与 React Compiler 的构建和维护。她的技术背景偏函数式,这一点在整套原则里看得很清楚:总和类型、纯函数、状态纪律这些母题反复出现。

她做这套东西的起点是一个判断:AI 正在写太多 slop,注水、低质的代码。而"跑得快但质量差"不是一个值得追求的目标。原文里有一句话被反复引用:

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
| Skills | 能力。how / why / arena / swarm / tdd 这些 | 28 |
| Playbooks | 程序。按任务类别编排 skill 的步骤 | 23 |
| poteto-mode | 调度。匹配任务、拷步骤、路由 skill | 1 |

## 这个系列是什么

这个系列把这四层逐层拆开。每个节点回答同样的三个问题:它解决什么问题,为什么非有它不可,它怎么调用下一层。

读完你能做到一件事:翻开任何一份 `SKILL.md`,都能反推出它为什么长成这个样子,并且精确地控制 agent 的行为。

## 怎么读

- **第一次**,按顺序从头读。第一部分是原则,是后面所有内容共用的词汇表,跳过后面的会吃力。
- **已经用过 pstack**,可以先看 [37 · poteto-mode 与运行时](./37-poteto-mode-runtime),看四层合起来怎么跑,再回头补原则。
- **只想尽快上手**,读 [01](./01-principles-restraint)、[08](./08-verify-proof)、[31](./31-playbook-opening-pr)、[37](./37-poteto-mode-runtime),再按需翻其他章节。

其中第 08、09 篇是全系列的承重柱:整台机器能在并行、自主里安全地跑,都建立在"什么才算证明"上。

## 目录

### 第一部分 · 原则(10 篇)

地基。24 条原则按仓库自己的分类组织,是后面每一章共用的词汇。

- [01 · 少即是多(上)](./01-principles-restraint) — 默认删、先减、用读者的负担衡量少。
- [02 · 重画与终态](./02-principles-reshape) — 新需求不硬贴,迁移朝终态收敛。
- [03 · 基础与体验](./03-core-basics-experience) — 先定数据结构,为使用者而建。
- [04 · 探索与杠杆](./04-core-explore-leverage) — 没先例就造原型,把工作做成杠杆,反复失败就质疑前提。
- [05 · 领域与边界](./05-arch-domain-boundary) — 领域进结构,校验进边界。
- [06 · 类型与状态](./06-arch-types-state) — 让非法状态无法表达,让操作幂等收敛。
- [07 · 迁移与并发](./07-arch-migration-concurrency) — 迁移即删除,先消除共享。
- [08 · 验证(上):真实产物与根因](./08-verify-proof) — 对真实产物验证,追到根因。
- [09 · 验证(下):单元、行为与数字](./09-verify-units) — 小步可验证,测行为,解释数字。
- [10 · 委托与元](./10-delegation-meta) — 打破一个人的上限。

### 第二部分 · 能力(15 篇)

skill 是什么:一种具名的能力,由原则组合而成,带触发、输出和契约。

- [11 · 理解(上):它怎么运作](./11-understand-how) — 它现在怎么运作。
- [12 · 理解(下):它为什么长成这样](./12-understand-why) — 它为什么长成这样。
- [13 · 理解(下):讲清楚、找回来、看波及](./13-understand-teach-context) — 讲清楚、找回来、看波及。
- [14 · 设计:先把形状摆出来](./14-design-architect-arena) — 先把形状摆出来,而且设计两次。
- [15 · 对抗:让模型互相挑错](./15-design-adversarial) — 让模型互相挑错。
- [16 · 验证机械(上):测试与数字](./16-verify-tdd-benchmark) — 先红后绿的测试,审数字的问题。
- [17 · 让 agent 能在应用里自证](./17-verify-create-skill) — 让 agent 能在应用里自证。
- [18 · 让验证技能保持诚实](./18-verify-maintain-skill) — 让验证技能保持诚实。
- [19 · 文体(上):去掉 AI 味](./19-prose-unslop) — 去掉 AI 味。
- [20 · 文体(下):文档标准](./20-prose-technical-writing) — 文档标准。
- [21 · 文体(下):注释与语言](./21-code-hygiene) — 注释交给没写它的人,语言规则。
- [22 · 自我改进:改仓库、改技能、生成入口](./22-self-improve) — 改仓库、改技能、生成入口。
- [23 · 可审计与定制流程](./23-audit-figure) — 决策轨迹,为任务定制流程。
- [24 · 按角色配模型](./24-setup-pstack) — 按角色配模型。
- [25 · 入口与辅助](./25-entry-helpers) — 帮助、白话、汇总、小页面。

### 第三部分 · 程序(11 篇)

playbook 是什么:一段程序,编排 skill,带步骤、证据契约和完成契约。

- [26 · 调查与取证](./26-playbook-investigate) — 先看清,再动手。
- [27 · 技能元:写技能与测技能](./27-playbook-skill-meta) — 写技能与测技能。
- [28 · 构建:加行为、改结构、修缺陷](./28-playbook-build) — 加行为、改结构、修缺陷。
- [29 · 性能与持续改进](./29-playbook-perf-hillclimb) — 性能与持续改进。
- [30 · 探路与对齐](./30-playbook-prototype-parity) — 探路与对齐。
- [31 · 开 PR:把工作变成 briefing](./31-playbook-opening-pr) — 把工作变成 briefing。
- [32 · 看门与落地](./32-playbook-babysit-shipping) — 看门与落地。
- [33 · 自主运行与自动队列](./33-playbook-autonomy) — 自主运行与自动队列。
- [34 · 治理:把整个项目交给一个协调者](./34-playbook-orchestrate) — 把整个项目交给一个协调者。
- [35 · 接续与挂起](./35-playbook-continuity) — 接续与挂起。
- [36 · 计划与清理](./36-playbook-plan-cleanup) — 计划与清理。

### 第四部分 · 调度(2 篇)

- [37 · poteto-mode 与运行时](./37-poteto-mode-runtime) — 四层怎么合起来。
- [38 · 取舍与上手](./38-tradeoffs-adoption) — 成本、边界,长出你自己的 mode。

## 一句话

这一整套东西,从头到尾只讲了一件事:**可信。**

生成变便宜了,可信没有。pstack 把"可信"这件昂贵的事拆成 24 个名字,组织成能力,组织成程序,再交给一个调度器,让 agent 能自己对着一件真实的东西证明自己的工作。信任一旦成立,委托、并行、自主才安全。

---

本系列的源码在 [GitHub](https://github.com/minmaxflow/pstack-series)。pstack 的上游在 [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack),独立镜像在 [backnotprop/pstack](https://github.com/backnotprop/pstack)。
