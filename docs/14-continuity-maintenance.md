# pstack 拆解 14 · 连续性与维护

昨天你让 agent 做了一半的活。今天换了个会话,你说"接着做"。它从零开始,把昨天已经做完的部分又做了一遍。

这一组处理的正是"时间":工作很少在一次会话里干净地开始和结束,它会被打断,被接手,被分成很多阶段,事后还会留下一堆需要清理的东西。它背后的想法是:工作会跨会话、跨时间、跨机器,所以"接续"和"退场"不是意外,是系统的一等公民。一个不能被安全中断的系统,你就不敢让它跑长;一个不清理战场的系统,铺开几次就会把自己拖垮。把这两件事各给一套明确流程,是长时间运行的前提,而不是事后补救。

四个 playbook,两两成对。`session-pickup` 和 `pause-safely` 是一对,一个接续,一个挂起。`multi-phase-plan` 和 `worktree-cleanup` 是一对,一个规划长工作,一个回收它留下的东西。

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

## multi-phase-plan

`multi-phase-plan` 处理跨阶段或者跨堆叠 PR 的工作。它的总纲:**你拥有计划,不拥有代码。计划是一个 owner 逐格跑、operator 从证据审计的检查清单。计划是交付物,不实现它。**

它的步骤。

1. **该跳过就跳过。** 改动是一两个文件、做法显然时,跳过计划,说一声,停。
2. **写之前,先用原型把开放问题解决掉。** 每个问题跑一次 `playbook/prototype.md`,保留分支、SHA 和截图给 Appendix A。只有一个人工的产品或偏好决定,才去问 operator,而且要**给选项**。这一点把 never-block-on-the-human 落得很实:能由一次运行解决的分歧,用运行解决。
3. **在 subagent 里探索。** 用 `subagent_type: "poteto-agent"` 加显式的模型,每个返回文件指针、约定、测试命令、入口点,**不要内联 dump**。这是 guard-the-context-window。
4. **把骨架拷进计划文件,填满每个占位符。** 一个 PR 一节。**一个 PR 就是一次改动,带它自己的证据。** 在"How to read this"里点名执行用的 playbook,并在 `autopilot-full` 和 `autopilot-stack` 之间选一个。一个长期的程序走 `orchestrate`。
5. **完整地按 `technical-writing` 写,再过 `unslop`。** 正文是单一的一种 Diátaxis 模式:how-to。解释和参考放进附录。每个标题陈述任务或发现。
6. **跑 `check-plan.mjs`**,把它打印的每一行都修掉。这是 encode-lessons-in-structure 在计划上的应用:与其反复叮嘱格式,不如用一个脚本强制它。
7. **交回。** 贴上计划路径和脚本输出,然后停。执行从 operator 明确的 go 开始。

它有一条验证规则,反复出现在每个验证块的开头:**光有测试不算充分验证。一个 PR 只有在它的 unit、live、perf 三个框都被勾选时才算验证。** live 块是强制的,十条泳道在 PR head 上通过 control skill 驱动真实 surface。**perf 门是双侧的**:trunk 和 head 都必须产出那个具名指标;trunk 没有这个功能时,改为给 diff 新增的工作和一个用户等待的终态设绝对预算,不要在不相似的场景之间声称一个比值。改动了一个交互的 PR 是**评审门控**的,operator 要在合并前看截图和视频。

它还有一条关于 control skill 的选择规则:浏览器、Electron、web UI 用 `control-ui`,CLI 和 TUI 用 `control-cli`(都来自 `cursor-team-kit`),原生移动用仓库自带的模拟器驱动 skill。一个碰了两个 surface 的 PR,两个都要有泳道。没有 control skill 的 surface 是 Appendix C 里的一个风险。

## worktree-cleanup

`worktree-cleanup` 回收本地磁盘:清理已合并或已废弃的 git worktree,以及过期的 iOS 模拟器。它的总纲:**你拥有磁盘和安全门。**

它有一句很实在的理由:这是唯一一个**会删除用户状态、却没有代码审查兜底**的 playbook,所以上面那些门就是它的审查。它的步骤。

1. **快照并审计。** 记下 `df -h /`,然后跑 `scripts/worktree-audit.sh`。这个脚本从 `git worktree list` 读路径,**绝不手工输入**。为什么较真这一点:一个手工敲的 `myrepo-worktrees/x` 会漏掉一个住在 `.cursor/worktrees/myrepo/x` 的,这是 encode-lessons-in-structure 的又一例。脚本给每个 worktree 按大小、年龄、合并状态、未提交工作、PR 状态、以及最近碰过它的聊天分类,然后建议一个桶。transcript 扫描很慢,所以后台跑。
2. **桶是建议,不是许可。** 被 pin 的、活跃的聊天才是真正的证据。那个集合从用户或侧边栏拿,和每个候选交叉核对。脚本曾经把用户 pin 过的一个 worktree 标成 `safe`,所以**被 pin 的集合说了算**。
3. **删之前先验证使用。** 对每个 `verify-recent-chat` 行、或者任何你怀疑的,扇出 subagent 去读 transcript,报告那个聊天是不是被 pin 或正在进行、碰了哪些 worktree。一个被 pin 的聊天会通过后台 subagent 往兄弟 worktree 里派生 arena 和 repro 树,那些就是在用,哪怕它们的名字从没出现在侧边栏。
4. **在不可逆的丢失前停一下。** `wip:N` 是 N 个已跟踪的未提交编辑,要先把 diff 给你看、拿到决定;移除一个干净的 worktree 可以从分支恢复,未提交的工作却没了。`scratch:N` 是未跟踪的一次性产物,可以丢,但要点名那些文件。
5. **清理确认过的集合。** 逐个 `git worktree remove --force <path>`;如果目录因为被忽略的构建产物还在,`rm -rf` 它,再 `git worktree prune`。**分支引用会活下来,所以没有 commit 会丢。** 最后用 `df -h /` 确认,再列一次。
6. **模拟器和其他回收项。** 模拟器通常是下一个最大的收益:`xcrun simctl delete all`、`xcrun simctl delete unavailable`、删旧 runtime,再往后是 Xcode 的 `DerivedData` 和 `DeviceSupport`、Cursor 的 `state.vscdb.backup` 和 `snapshots/`、以及包缓存(pnpm、uv、brew、yarn)。只清用户没说要留的那些。

回复要点名:前后的 `df -h /` 和回收的空间、清理掉的 worktree、以及每个被留下的东西一行理由(被哪个聊天在用,或者有未提交的工作)。

## 把四个连起来看

`session-pickup` 和 `pause-safely` 是一对。一个接续,一个挂起。它们让中断变得便宜:你可以放心地停,因为停这件事有自己的流程,而且"继续"这种话绝不会误触发它。

`multi-phase-plan` 和 `worktree-cleanup` 是一对。一个规划长工作,一个回收它留下的东西。它们让长工作变得可控:你可以放心地铺开,因为铺开的东西有退场机制。`multi-phase-plan` 甚至把"不实现"写进了总纲,它只产出计划,执行交给别人。

这一组的共同假设是:工作会跨会话、跨时间、跨机器。既然会,那就把"接续"和"退场"都当成一等公民,给它们各自明确的流程,而不是指望一切顺利。一个系统只有在它能被安全地中断和恢复、并且能自己清理战场时,才谈得上长时间运行。

## 今天就做一件事

如果你今天要下线,而手上有在飞的活,别只是关掉。让 agent 走一次 pause,提交 checkpoint,写一份 resume note。明天你会感谢今天这五分钟。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/session-pickup.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/session-pickup.md)
- [`skills/poteto-mode/playbooks/pause-safely.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/pause-safely.md)
- [`skills/poteto-mode/playbooks/multi-phase-plan.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md)
- [`skills/poteto-mode/playbooks/worktree-cleanup.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md)
