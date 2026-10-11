# pstack 拆解 13 · 交付与自主

你的栈全绿了。CI 绿,一个 bot approve,你点了 merge。第二天发现其中一个 PR 其实从没被真正验证过,而它底下还压着三个。

这就是这一篇的第一句话:**绿不等于安全。**

开 PR 不是终点,是第二段的开始。这一组背后的想法,就是把第 04 篇那条"生成和评判分开"从一次改动放大到队列和程序:**写代码的人永远不判自己。** 一个 PR 的绿只是输入,一个没写过这段代码的 agent 的判决才是答案。规模越大,这条越重要,因为一个漏掉的验证在队列里会被放大成一片带病的地基。

它们处理从"代码能跑"到"它安全地合并"和"它自主地跑完"之间的路,从最小的一步一直排到最重的一台机器。

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

## babysit

停在人的界线前。babysit 把栈推到 merge-ready,但永不合并:合并是另一个决定,需要另一层独立验证。把"绿"和"落地"分成两个动作,是为了不让一个自动化的循环替你把那个不可逆的按钮按下去。

`babysit` 驱动一个 PR 或一个栈走到 merge-ready:冲突、review 线程、CI。它明确取代 Cursor 内建的同名 skill。

它一开始就要求**先声明模式**,在任何轮询之前。

- `drive`:把循环跑到 merge-ready,对应"babysit this""get it green""merge-ready"。这是默认。
- `background`:不阻塞地分诊,适合一个还在执行的计划。
- `threads-only`:只回 review 评论,别的不碰,对应"address the bugbot comments"。
- `check`:一次状态检查和一份报告,对应"check on X""is it green"。

没声明就默认 `drive`。小 PR 或纯文档 PR 给 `check`,不给 `drive`。

几条结构性约束很关键。

**只工作 merge frontier,不碰它上面。** 最低的那个未合并 PR 是唯一重要的,直到它合并。上游的线程只读、只批量处理,绝不以重启 frontier 的检查为代价去修。

**一个栈一个 babysitter。** 开始之前先检查有没有别的已经在上面。

**绝不改动栈的拓扑。** 一次 babysit 里不做 base retarget、不做 rebase、不做 stack-wide submit、不 force-push。在所属分支上修,把 rebase 形状的东西往上报告,让 owner 去做。

**顺序是冲突、review 线程、CI。** 所有已知的修复攒成**一次 push 波**。一个冲突是这个 playbook 唯一**报告而不解决**的阻塞:说清哪个分支需要 rebase,然后停。它特意警告:不要在 frontier 红着的时候跑上去看上游,也不要为了让 check 有活的假象而掉到 CI 那一步。

**相信 forge 的判决,不是一个绿的检查列表。** 在 GitHub 上状态来自 `scripts/watch-pr/watch-pr`;在 Origin 上用 `origin pr view`、`origin pr thread list`、`origin pr checks --watch`。停止条件按 forge 分:Origin 上,frontier merge-ready(检查绿、可合并、没有未解决阻塞线程)就停;GitHub 上单/栈模式停在 `READY`,queued 模式不会发 `READY`,一个无阻塞的 frontier 是非终态的 `WAITING`,理由是 `merge-queue`,这时报告 merge-ready 并停掉 watcher。它特别说明:**watcher 重新武装从来不授权合并**,除非用户明确要求 merge、land、ship 或 merge when ready,那要路由到 `shipping`。

**CI 重试之前先分类。** 一个 flake 或基础设施问题,赏它**一次**新构建,绝不重试单个 job。同一次失败再来一遍说明它从来不是 flake,重新分类,去读子日志,而不是盲重试。一个 diff 从没碰过的代码里的失败,说明 base stale,先用 `git merge-base --is-ancestor` 查,报告成需要 rebase,不要烧重试。

**Bugbot 永远以怀疑姿态分诊。** 每一条声明对着代码验证。真的发现修掉,带一个"先红"的证明,在**拥有那段代码的最低那个 PR** 里修。噪声用一个具体的反驳贴在对应线程上驳回。从第 3 遍起,倾向于驳回已记录的噪声模式,但任何碰到安全、鉴权、计费、数据、迁移的,仍然升级,不自己驳回。**绝不为了哄安静一个 bot 而搅动代码。**

**停在人的界线前。** owner 的 approve 是**等待**,不是要修的阻塞。babysit **永不授权合并**。只有在 GitHub 报告 `READY`、queued 的 `WAITING/merge-queue` 停止、或 `COMPLETE`,或者 Origin 报告 frontier merge-ready 之后,它把这次运行的分诊决定扫一遍,把任何对团队有用的驳回模式提成一个共享 rubric 的候选条目和它自己的 PR。

`drive` 在 merge-ready 结束。落地是 `shipping`。

## shipping

`shipping` 处理 babysit 之后的半程,它有一句和这一篇开头呼应的话:**green is not safe。**

它的九步。

1. **先解析 forge,再独立验证每一个 PR。** GitHub CLI(`gh`)是默认;Origin 可用时用 `origin pr ...`。**一个 PR 一个 subagent,不批量**,每个是一个云 agent,用匹配的 control skill 在真实 surface 上跑 parent 对 head。每个返回 `PASS`、`PASS+NOTES` 或 `FAIL`,把判决贴在自己的 PR 上。判据是:**safe 意味着判决来自一个没有写这段代码的 agent。** CI 绿不是判决,一个 approving 的 bot review 也不是判决。
2. **只落地从栈底连续的已验证的一段。** 从最低的未合并 PR 往上走,停在第一个没有通过判决的地方。一个已验证的 PR 坐在一个未验证的 PR 上面,不可落地。
3. **re-check 每个判决是否仍然描述这个 patch。** 记下判决时的 head SHA、base SHA,以及那个 PR base 到 head 的稳定 `git patch-id`。一次 rebase 或 base retarget 会重写 SHA,可能在没有任何检查变化的情况下让判决静默失效。落地之前,拿记录的 patch-id 和当前的比。patch 变了就重新验证;patch 没变就保留代码判决,在当前的 head 上重跑可合并性和 CI。它特别说:**绝不用匹配的 commit message 或一个更老 SHA 上的绿勾来替代这个检查。**
4. **只准备最底下那个 PR。** 取当前 trunk,需要时把最低的已验证分支 rebase 到确切的 trunk tip,推上去,只把那个 PR retarget 到 trunk。推完再跑一次第 3 步。**不要**动它的后代。
5. **一次落地一个 PR。** 底部 PR 现在可合并,就 squash 合并;如果需求还在跑而用户要求 merge-when-ready,就只给那一个 arm。
6. **不要把 GitHub 的 `autoMergeRequest` 当成栈的就绪。** 它顶多说"有人为某个 GitHub PR 请求过 auto-merge",它不证明一个后代被排上队、一个 patch 判决是当前的、或者连续的一段是安全的。
7. **每次合并之后重算。** 取 trunk,确认合并的 SHA 在,把那个 PR 从冻结的列表里去掉,检查新的底部 PR 的 base、head、检查和 patch-id,对那一个 PR 重复第 3 到 6 步。
8. **盯住当前的 frontier,直到它合并或失败,不要绕着它改队列。** 只有在 `state` 是 `CLOSED` 且没有 `mergedAt`,或者一个必需的检查以 FAILURE 或 CANCELLED 结束且不再有 pending 的 auto-merge,或者 `mergeStateStatus` 是 `UNSTABLE` 或 `DIRTY` 且没有 pending 的 auto-merge 时,才硬失败。`BLOCKED` 而检查还在跑或 auto-merge 已经 arm,不是失败。
9. **在 ceiling 停。** 已验证的那一段合并完之后,报告落地了什么、下一个未验证的 PR 是什么、验证它需要什么。把这一段延长是一次新的、从第 1 步开始的 pass。

## autonomous-run

自主的前提是一个能过或不过的谓词。没有它,"做完"就没有定义,循环只会更快地产出没人检查的活;而平台期也不是停止的信号,是换方法的信号。这一节把"自动驾驶"和"无人看管的漂移"区分开:前者有一个不变的判据,后者只有一个时长。

`autonomous-run` 处理"一个长任务,不停,驱动到完成"。

它先做一件事:把退出条件写成一个**可检查的谓词**,在第一次迭代之前。然后选唤醒机制:有什么事件可看(CI、一次 merge、一个 ref 前进),就派一个 watcher subagent,事件来的时候唤醒你,带一个长时间的心跳做兜底;没有事件,就定一个固定间隔的心跳,间隔按"结果值不值得再看一次"来定。

每一次迭代做证据支持的**最小改动**,对着谓词验证,前进了就 commit,没前进就丢弃。它要的是 sequence-verifiable-units 的纪律:每个单元验证过再开始下一个,不是把检查攒到最后。中途发现的问题,它能自己修的用 poteto-mode 自己修掉,放进它自己的 PR,不要为了一个可逆的工作停下来问人,也不要用 `AskQuestion`。

它有一条关于停的纪律:**平台期不是停止。** 换方法继续推。只有真正走进死路,才浮出来(而且要浮出来,不是空转),而且**永远不放松谓词来宣布胜利**。它每轮用 `show-me-your-work` 打一个 checkpoint。

## autopilot-full

`autopilot-full` 把一串**独立的 PR** 跑到 merged,完全自主。它的总纲一句:**你拥有判决,不拥有 PR。**

**一个 PR 一个 owner,承担完整生命周期。** 一个云 agent 拥有:构建、第一次 push、开好 PR、在真实产物上自证、怀疑地分诊 Bugbot、`deslop`、`no-comments`、rebase 到当前 trunk、babysit 到绿、以及**合并本身**。在约 15 分钟内,每个 owner 要起一份 `decisions.tsv` 轨迹、推第一个分支快照、把 PR 开成 ready(不是 draft)。**先开 PR,再自证**,这样 URL、决定和检查形成一条持久的轨迹。它还维护一份 `children.tsv`,记下每个起过的 subagent 的 ID、预期运行时长和状态。

**owner 之间真正并行,绝不堆叠。** PR 自包含时多个 owner 同时跑:一个分支一个写者,不相干的文件,跨 PR 的漂移靠 rebase 吸收。只有真正重叠的工作串行。

**每一轮在合并之前 swarm 验证。** 一轮从 owner 的 code-ready head SHA 开始,之后每次改变 patch 的 push 再开始一轮。在那个 SHA 上扇出一组独立 verifier,合成一个判决。泳道包括:在那个 SHA 上重跑 gates;在真实 surface 上实机证明承载行为;两到以上审查泳道读 diff 和收据、不信任 PR 正文;以及一条**对 trunk 的回归泳道**,在 trunk 上跑同一个承载场景。**实机泳道是地板,没有它的判决不算干净。没有 root 的干净判决就不合并。**

**干净判决之后,owner 自己合并,然后一个新 owner 接下一个。** owner 只从一个刚 rebase 到 trunk 的 head 合并。合并 prep 绝不在某一轮的泳道开始之前,它在合并前以一次 rebase 到当前 trunk 结束。合并前再查一次 `git merge-tree` 干净、以及没有路径和 CI 配置冲突。**一个新的 head 会让判决失效**,除非 patch-id 没变。

**root 层。** 一个对固定 gate 或预算值的真正新抬升(CI 只允许收紧的那种限制)需要 root 的新 countersign,只在 verifier 证明之后给出。root 每小时跑一次审计 tick,重新从 trunk 读这个 playbook,对着它审计整个操作,用通用的存活检查探每个 owner,只把**副作用**算成进展(commit、push、PR 或检查的增量、store 报告),把过了预期运行时长却没有副作用的泳道判成卡住,立刻停掉并派一个替代。

## autopilot-stack

`autopilot-stack` 是 `autopilot-full` 的孪生。它的总纲一句:**你拥有栈,不拥有落地。**

它的 owner 循环和 `autopilot-full` 一样,但它**什么都不发**。

- 每一轮照样验证(`STACK-READY` 替代 `merge-ready`)。
- **干净判决之后只是把 PR 追加进那条线性的 base-branch 栈**,不 merge、不 arm auto-merge、不 close。
- **拓扑只有一个写者**:owner 只推自己的分支,root 是唯一的拓扑写者,把子分支 rebase 到父分支的确切 tip,再设 base。
- root 从底到顶吸收 trunk 的漂移,rebase 会让上面的每个 SHA 都变、让旧 SHA 上的判决失效,按 patch-id 规则处理,交付前把不再有效的重新走一遍验证。
- 交付物是一条线性的、已验证的 PR 链,每一环带着自己的 verifier 判决,由你审阅并落地。

选择哪个 autopilot:`full` 用于 PR 独立、且落地权已授予;`stack` 用于你想在落地前审阅、工作是有序或耦合的、或者合并权被保留。

## orchestrate

`orchestrate` 处理一个比任何单个 agent 都活得久的**程序**:多天,很多堆叠的 PR,几十到几百个 subagent,人一天查一两次。

**协调者永不自己写代码。** 它框定、写 brief、排空收件箱、拥有给人看的报告、做判断。冲突的合并、restack、代码改动,永远是任务。

它有清楚的角色分层。协调者是本地的那一个聊天。sub-coordinator 是本地、持久、一个 track 一个,只在程序超过一个协调者能排空的量时才加。worker 和 verifier **默认在云端**,除非任务需要这台机器上的东西(control skill 的实机验证、本地 transcript、模拟器、只在这里有的鉴权)。

它有三条规则扛住其余所有。

- **完成是队列事件,不是 interrupt。** 收到完成通知,推进收件箱,回到你正在做的事,**绝不在排空时深审一个 diff**,需要审的就变成一个 verifier 单元。
- **每一次 spawn 和每一次 resume 都逐字带上 standing orders。** 指令会在 resume 之间衰减,每丢一条都要一个人工回合。当你发现自己在重述一条指令,先把它追加进 register 再行动。
- **brief 就是产品。** 一个含糊的 brief 会静默失败,因为 worker 没法问你。它的字段是固定的:GOAL、SCOPE、CONTEXT、ACCEPTANCE、VERIFY、TIMEBOX、FORBIDDEN、REPORT、STANDING。

它的 store 每个文件**恰好一个写者**,拥有者发布事实,读者在读取时聚合。它的验证用一本 ledger,键是 PR 号加 head SHA,判决有分级:`live-ui-verified`、`unit-test-verified`、`type-check-only`、`verifier-blocked`、`verifier-failed`。**CI 绿是一个判决的输入,不是一个判决。** 一个新的 head SHA 会让那一行作废。

它的存活和失败处理也很具体:绝不 resume 一个 agent 来"看一眼它";要探就读 ledger、`units.tsv`、`gh`、推上来的分支。一个悄悄死了的 agent 得到一条合成的事后记录行。重试按模式分:cap-hit 或 OOM 就缩小范围重派,网络断就原样重试,工具错误就换模型重试,未知的重试一次。两次之后放弃这个单元,重新规划绕开它。一个几小时后才回来的僵尸,先对着当前 frontier 和 ledger 对齐再接受。

## 把七个连起来看

这一组把验证从单次任务放大到队列和程序。在这里,绿色只是输入,判决才是答案。

有三对关系。`babysit` 和 `shipping` 是一对:前半把栈弄到 merge-ready,后半把它落地。`autopilot-full` 和 `autopilot-stack` 是一对:一个直接合并,一个只建栈交给你。`autonomous-run` 和 `orchestrate` 是一对:一个把一个任务驱动到一个谓词,一个运转一个跨多天的程序,前者的准入线是"一个 agent 一个会话能做完了",那就别上后者。

边界也说清。`shipping` 只落地连续验证的那一段。`orchestrate` 是重机械,一台机器一个会话能做完就别用它。`babysit` 永远不合并,`opening-a-pr` 永远不 babysit。

这一篇的几句判据值得背下来。green is not safe。CI green is not a verdict。判断一个改动的人,永远不是写它的人。**完成是队列事件,不是 interrupt。**

## 今天就做一件事

下一次你要 merge 一个栈之前,先做一次 shipping 的第一步:给每一个 PR 起一个 fresh agent,让它对着 parent 和 head 各跑一遍真实行为,把判决贴在 PR 上。你会发现至少有一个 PR 的"绿",和你以为的不是一回事。

## 参考

本篇拆解对照的原文,都在 pstack 仓库里(仓库地址 `github.com/backnotprop/pstack`):

- [`skills/poteto-mode/playbooks/opening-a-pr.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/opening-a-pr.md)
- [`skills/poteto-mode/playbooks/babysit.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/babysit.md)
- [`skills/poteto-mode/playbooks/shipping.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/shipping.md)
- [`skills/poteto-mode/playbooks/autonomous-run.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/autonomous-run.md)
- [`skills/poteto-mode/playbooks/autopilot-full.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/autopilot-full.md)
- [`skills/poteto-mode/playbooks/autopilot-stack.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/autopilot-stack.md)
- [`skills/poteto-mode/playbooks/orchestrate.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/orchestrate.md)
