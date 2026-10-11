# pstack 拆解 35 · 接续与挂起

工作会跨会话。一个能被安全中断、又被干净接手的系统,才敢长时间运行。

## session-pickup

`session-pickup` 处理恢复或接管一个新前 agent 在飞的工作。它的总纲一句:**你拥有 resume 点。读之前的轨迹,不要重做它。**

它的步骤。

1. **定位之前的轨迹。** 可能是当前工作区会话目录里的一份本地 transcript(在 Cursor 里是系统提示给的 `agent-transcripts/` 目录),一个 cloud-agent 的 URL,或者一个推上来的分支。先读元数据概览和最后几条消息,再往回扫那些决策点。一份很长的 transcript 交给一个 subagent 去解析,**主线程只留精简过的时间线**,这是 guard-the-context-window 的直接应用。它也提醒:绝不跨项目全局扫描,那会越过 workspace 边界、读到无关项目的私密聊天。
2. **重建运行状态。** 分支和 worktree 在哪,什么已经落地(`git log`、对着 base 的 `git diff`),还开着哪些 todo,做过哪些决定。**之前的轨迹是权威输入**,要抵抗重新推导它的冲动。
3. **对比已做与待做。** 把已发布的计划和实际交付对比,命名 resume 点,不重跑之前的 repro,不重做已经完成的工作。它特意点了一个反模式:一次"让我从零验证一遍"的 pass,等于你把一份权威的轨迹当成了不可信的东西。
4. **把剩下的工作路由到匹配的 playbook,并选一个判决**:继续执行、交付一份已完成的推荐、批准或推翻之前的一个结论、或者对一次失败的运行做事后复盘。pickup 到这里就结束,**后面归那个被路由到的 playbook 管**。
5. **对着原始目标在真实产物上验证继承来的声明。** 一句来自上一个 agent 的"通过了"的自述,不是证明。

回复要点名:上一个 agent 停在哪、你继承了什么、重做了什么(理想情况下什么都没重做)、resume 点在哪、结局如何。

## pause-safely

`pause-safely` 是 `session-pickup` 的补集。它的总纲:**你拥有一次干净的停止。留下一份冷启动 agent 能接续的 checkpoint。**

它有一条很硬的触发规则:**只在你明确要求时触发。** "继续""去睡了,继续""别停",这些都**不**触发暂停。暂停只由明确的信号触发:你要暂停、你要下线、harness 要重启,或者上下文即将被压缩。

它的步骤。

1. **停在一个安全的边界。** 要么做完当前这一原子步骤,要么干净地退出它。不开始任何新东西,取消所有嵌套的 subagent。
2. **为了暂停,不做任何不可逆的动作。** 不开 PR,不 push,除非你本来就已经有一个在外面。
3. **让工作变得持久。** 把未提交的编辑提交成一个清晰的 `wip:` commit,放在当前分支上,这样什么都不丢。如果工作树是坏的,在 commit body 里用一行说清楚。
4. **把 resume note 写在上下文之外。** 记下:意图、你正在做什么、进度和哪些已经验证、当前状态、下一步、关键文件、以及坑。为上下文压缩触发时,把它写到一个文件里,比如 `/tmp/<slug>-resume.md`。如果已经有一份 `show-me-your-work` 的轨迹,**指向它,不要复制它**。

它的回复是一份暂停报告,不是最终报告:你在循环的哪一步、磁盘上有什么 versus 还在你脑子里的(给路径,不要贴 diff)、你做了哪些 commit、工作树是否干净、以及 resume 时的第一个动作。

这一对合起来说明一件事:一个可接续的系统,必须**显式地支持中断**。中断不是失败,它是常态,所以它要有自己的处理流程,而不是靠运气留下一堆半成品。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/session-pickup.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/session-pickup.md)
- [`skills/poteto-mode/playbooks/pause-safely.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/pause-safely.md)
