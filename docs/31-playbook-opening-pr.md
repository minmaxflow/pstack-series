# pstack 拆解 31 · 开 PR:把工作变成 briefing

开 PR 不是终点,是把工作变成一个能在几分钟内读完的 briefing。

## opening-a-pr

PR 是给一个人一分钟读完的 briefing,不是实验记录。它要让手里已经有 diff 的人,快速学到这个改动为什么存在、故意不做什么、可能弄坏什么、以及你怎么证明它管用。

`opening-a-pr` 是每个其他 playbook 结尾都会调用的那一个。它管的是把工作变成一个可审查的 PR。

**工作区。** 它从 git worktree 工作,subagent 继承同一个 worktree。同一个分支上多次 `Task` 调用,每个要自己的 worktree,或者在两次之间 `git fetch && git reset --hard origin/<branch>`。一个脏分支上混着无关工作,先 patch 出来,开新 worktree,再应用。

**提交。** 提交要勤,但在开 PR 之前 rebase 成小而有顺序的 commit。**每个 commit 都是一个未来的 PR**:可落地,顺序本身在讲一个故事。修复属于某一个刚做的 commit 时用 amend;是可分离的就新开一个。

**清理。** 提交之前,先把 diff 过一遍 `deslop`(来自 `cursor-team-kit`);review 之前过一遍 `no-comments`。

**标题。** 用 Conventional Commits,形如 `type(scope): subject`。type 用 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`perf`。scope 是改动的区域。主题短、祈使句,能带真实符号就带,不点句号。

**描述。** 这是最有信息量的一节。它把 PR 正文定义成 **briefing,不是 lab notebook**。它假设读者手里已经有 diff,要在**一分钟内**学到四件事:为什么这个改动存在、它故意不做什么、它可能弄坏什么、你怎么证明它管用。所以它有固定的小节:

- `## Why`:问题和做法,一到三句。不列 SHA,不讲 rebase 家谱,不写"基于 main"。
- `## What changed`:一到三条短 bullet,只在承载改动时点真实符号或路径。
- `## Scope`:这次覆盖什么、故意留出什么。
- `## Tradeoffs`:只写那种 reviewer 否则一定会问的被否决的备选。没有真的选择就跳过这一节。
- `## Blast Radius`:一到两句,这个改动触碰到谁或什么,为什么安全或为什么有风险。
- `## Verification`:一到三条,每条点一个真实运行路径和它的结果。性能改动给一个主数字,`before → after` 形式。

它明确说不要写什么:完整 SHA、swarm 或 arena 的泳道流水账、杠杆修正的长文、逐文件清单、"CLEAN"判决。这些细节放进一个链接的产物。还有一个硬约束:如果正文会让 squash commit 超过约 40 行,砍正文。

**forge。** 在做第一个 PR 操作之前就解析好用哪个 forge,并且**全程保持同一个**:创建、编辑、查看、watch、合并。GitHub CLI(`gh`)是默认;如果 `command -v origin` 成功且 Origin 能解析仓库,优先 `origin pr ...`;否则留在 `gh` 并记录 fallback。**绝不要求 Graphite(`gt`)。** 如果这次运行提供了内建的 PR 工具,就用它做创建、编辑、retarget、标记 ready,不走 forge CLI。

**大小与栈。** 五个窄 PR 好过一个胖 PR。一个栈是一条 base-branch 链:根 PR 指向 trunk,每个子分支 rebase 到父分支的确切 tip,它的 PR 指向父分支。

**就绪。** 每个 PR 都开成 ready,永远不开 draft。

**babysit。** 开一个 PR **不启动 babysit**。先把整个栈建完,再单独跑一次 babysit。为每个新 PR 各跑一次 babysit,会让构建停下,把检查浪费在之后某一波会重启的 commit 上。一个开 PR 的 subagent 会跑 `interrogate`、`deslop`、`no-comments`,贴上 URL,然后返回——除非它是一个 autopilot owner,那种情况另说。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/opening-a-pr.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/opening-a-pr.md)
