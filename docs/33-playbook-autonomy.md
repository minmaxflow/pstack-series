# pstack 拆解 33 · 自主运行与自动队列

什么时候能放手?前提是一个能过或不过的谓词,以及"判断的人永远不是写的人"。

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

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/autonomous-run.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/autonomous-run.md)
- [`skills/poteto-mode/playbooks/autopilot-full.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/autopilot-full.md)
- [`skills/poteto-mode/playbooks/autopilot-stack.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/autopilot-stack.md)
