# pstack 拆解 36 · 计划与清理

长工作要能铺开,也要能收回。计划负责前者,worktree 清理负责后者。

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

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/multi-phase-plan.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md)
- [`skills/poteto-mode/playbooks/worktree-cleanup.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md)
