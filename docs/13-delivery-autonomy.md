# 13 · 交付与自主

你的栈全绿了。CI 绿,一个 bot approve,你点了 merge。第二天发现其中一个 PR 其实从没被真正验证过,而它底下还压着三个。

这就是这一篇的第一句话:**绿不等于安全。**

开 PR 不是终点,是第二段的开始。这一组 playbook 处理从"代码能跑"到"它安全地合并"和"它自主地跑完"之间的路。

## opening-a-pr

`opening-a-pr` 是每个其他 playbook 结尾都会调用的那一个。

它从 git worktree 工作,subagent 继承同一个 worktree。它把工作 rebase 成小而有顺序的 commit,因为每个 commit 都是一个未来的 PR:可落地,顺序本身在讲一个故事。

PR 描述是 briefing,不是 lab notebook。它假设读者手里已经有 diff,要在**一分钟内**学到四件事:为什么这个改动存在,它故意不做什么,它可能弄坏什么,你怎么证明它管用。所以它有固定的小节:Why、What changed、Scope、Tradeoffs、Blast Radius、Verification,每节一段到三句,用 `##` 标题分开,没话说的节直接删。

标题走 Conventional Commits。每个 PR 开成 ready,不开 draft。

它还有一条容易忽略的纪律:**开一个 PR 不启动 babysit。** 先把整个栈建完,再单独跑一次 babysit。为每个新 PR 各跑一次 babysit,会让构建停下,把检查浪费在之后某一波会重启的 commit 上。

## babysit

`babysit` 驱动一个 PR 或一个栈走到 merge-ready:冲突、review 线程、CI。

它按固定顺序处理阻塞:先冲突,再 review 线程,最后 CI。所有已知的修复攒成**一次 push**,这样检查只重启一次,而不是每修一个都重启一遍。

评论的处理是怀疑姿态。人和 bot 会把真实发现和噪声放进同一个列表,所以它逐条按自己的价值判断:真的发现去修,噪声用一个具体的反驳贴在对应的线程上,而不是默默忽略。如果一个 bot 或安全审查提了意见,它以同样的怀疑态度看每一条。

它停在 merge-ready,**永不 merge**,即使一切都绿。因为 merge 是另一个决定,属于另一个 playbook。

## shipping

`shipping` 处理 babysit 之后的半程。它有一句和这一篇开头呼应的话:green is not safe。

它先独立验证每一个 PR。一个 PR 一个 fresh agent,不批量,每个在真实的 surface 上跑 parent 对 head,通过 matching control skill 驱动。每个返回 `PASS`、`PASS+NOTES` 或 `FAIL`,把判决贴在自己的 PR 上。这里的关键判据是:**safe 意味着判决来自一个没有写这段代码的 agent。** CI 绿不是判决,一个 approving 的 bot review 也不是判决。

然后它只落地**从栈底连续的、已验证的那一段**。从最低的未合并 PR 往上走,停在第一个没有通过判决的地方。一个已验证的 PR 坐在一个未验证的 PR 上面,是不可落地的,因为落地它会把它下面那个缺口一起带进来。

它还有一步很细的反作弊。落地之前,它 re-check 每个判决是否仍然描述这个 patch。记下判决时的 head SHA、base SHA,以及 base 到 head 这个 diff 的稳定 patch-id。一次 rebase 或者 base retarget 会重写 SHA,可能在没有任何检查变化的情况下,让一个判决静默失效。所以落地之前,拿记录的 patch-id 和当前的比。patch 变了就重新验证,patch 没变就保留代码判决,在当前的 head 上重跑可合并性和 CI。

最后它一次落地一个 PR,每落地一个就重算一次栈。它把落在哪里、下一个未验证的 PR 是什么、验证它需要什么,报出来。

## autonomous-run

`autonomous-run` 处理"一个长任务,不停,驱动到完成"。

它先做一件事:把退出条件写成一个可检查的谓词,在第一次迭代之前。然后选唤醒机制:有什么事件可看(CI、一次 merge、一个 ref 前进),就派一个 watcher subagent,事件来的时候唤醒你,带一个长时间的心跳做兜底;没有事件,就定一个固定间隔的心跳,间隔按"结果值不值得再看一次"来定。

每一次迭代做证据支持的最小改动,对着谓词验证,前进了就 commit,没前进就丢弃。中途发现的问题,它能自己修的用 poteto-mode 自己修掉,放进它自己的 PR,不要为了一个可逆的工作停下来问人。

它有一条关于停的纪律:平台期不是停止。换方法继续推。只有真正走进死路,才浮出来,而且永远不放松谓词来宣布胜利。

轮询和调度的具体机制,在仓库里叫 `orchestrate`,它是这一节的放大版。

## autopilot-full

`autopilot-full` 把一串**独立的 PR** 跑到 merged,完全自主。

每个 PR 有一个 owner,从 build 一路带到 merge。但有一条硬规矩:**没有 owner 能凭自己的判决 merge。** 一个刚起的 verifier swarm 在 owner 的 code-ready head 开始一轮,之后每次改变 patch 的 push,再开始新的一轮。只有对"将要 merge 的那个 patch"的干净判决,才授权这次 merge。

这条规矩把"独立验证"从可选变成了流程的结构。写的人永远不是判断的人,判断的人永远不看旧版本。

## autopilot-stack

`autopilot-stack` 是同一个 owner 循环,但**什么都不发**。

你早上醒来,看到的是一条线性的 base-branch 栈,每一环都有 verifier 的判决,你自己审阅并落地。当改动之间是耦合的,或者你就是想在 merge 前亲眼看一遍,选它,而不是 full。

它和 `autopilot-full` 是一对。一个把独立改动直接合并,一个只把改动堆成栈交给你落地。选哪个,取决于改动是否耦合,以及你想在合并前保留多少控制权。

## orchestrate

`orchestrate` 处理一个比任何单个 agent 都活得久的**程序**:多天,很多堆叠的 PR,几十到几百个 subagent,人一天查一两次。

协调者写 brief,收结果,保持最低的未合并 PR 绿,**永不自己写代码**。它有一条很清楚的准入线:一个 agent 在一个会话预算内就能做完的工作,路由去 `autonomous-run`,不是这里。听起来像程序,但一台机器今天能做完,就不是程序。

它有三条规则扛住其余所有。completions 是队列事件,不是 interrupt。每一次 spawn 和每一次 resume 都逐字带上 standing orders,因为指令会在 resume 之间衰减。brief 就是产品,一个含糊的 brief 会静默失败,因为 worker 没法问你。

## 把七个连起来看

这一组把验证从单次任务放大到队列和程序。在这里,绿色只是输入,判决才是答案。

有两对关系。`babysit` 和 `shipping` 是一对:前半把栈弄到 merge-ready,后半把它落地。`autopilot-full` 和 `autopilot-stack` 是一对:一个直接合并,一个只建栈交给你。

边界也说清。`shipping` 只落地连续验证的那一段,一个已验证 PR 坐在未验证 PR 上面要等。`orchestrate` 是重机械,一台机器一个会话能做完就别用它。

这一篇的几句判据值得背下来。green is not safe。CI green is not a verdict。判断一个改动的人,永远不是写它的人。

## 今天就做一件事

下一次你要 merge 一个栈之前,先做一次 shipping 的第一步:给每一个 PR 起一个 fresh agent,让它对着 parent 和 head 各跑一遍真实行为,把判决贴在 PR 上。你会发现至少有一个 PR 的"绿",和你以为的不是一回事。
