# pstack 拆解 11 · 理解、诊断与技能元

一个 agent 报了个 bug,顺手就开始改。改到一半你才发现,它连问题的成因都判断错了。

这一篇的五个 playbook 有个共同点:**交付物是答案、诊断或一次被验证过的 skill 改动,不是代码。** 它们要防的,就是这种"手比脑子快"。

它们还共享一个很具体的执行约定:匹配上一个 playbook 时,poteto-mode 会把它的步骤**原样拷贝**进 todo list,一个你决定不做的步骤不删除,留在列表里标一条 `skip: <原因>`,所以你永远能看到它选择不做什么。

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

## authoring-a-skill

面向 agent 的散文就是行为。一句含糊的话,在这里不是让人皱眉,而是被某个未来的 agent 真的执行。所以它比人的文档门槛更高,也更值得当成一次有审查的正常改动。

`authoring-a-skill` 是写或改一个 `SKILL.md` 的 playbook。它的总纲很短:**你拥有这个 skill 的措辞。**

它的步骤。

1. 用它所在的 harness 的 skill-authoring 流程:Cursor 里是内建的 **create-skill**,其他环境是 Anthropic 的 `skill-creator`;两者都没有,就按 agentskills.io 的 Agent Skills 格式来。
2. **校验。** frontmatter 里有 `name` 和 `description`;被引用的文件真实存在;跨 skill 的链接解析得开。
3. **结构性改动配测试用例**,主观改动跳过。
4. 走 opening-a-pr。

它给了一套很具体的写作规矩,本质上都是"能删就删":拿不准就删;只留会改变某个决定的散文;直接说让它做什么,跳过原因;只有某条规则不看解释就会让人困惑时,才加解释;语气和范围匹配;把结构性的来源(类型、README、配置)指出来,而不是重述一遍;用路径委派给别的 skill,不要复制;一个你反复遇到、还没被捕获的工作流,提成一个新 skill。

它的回复:这个 skill 的摘要、关键设计决定、校验笔记。它还单独处理一种特例:如果一个 skill 的职责是驱动你的应用并证明行为,那它是验证 skill,应该走 `create-verification-skill` 和 `maintain-verification-skill`,而不是普通的手写流程。

## eval

观察者效应:一个知道自己被评估的 agent,行为会不一样。所以测试必须是盲的,候选不能知道自己被观察、也不能知道彼此存在。而且判断要靠它实际读了哪些文件,不靠它自己声称读了什么。

`eval` 测的是一个 skill、结构或 prompt 的改动会不会改变 agent 的行为,在它被推广之前。它的总纲:**你拥有这个实验的设计。规划、设盲、运行、综合。**

它有一套"盲"的硬规定,针对的正是上面那个失败模式:候选看到的任何目录、文件、prompt 里,都不许出现 `eval`、`test`、`judge`、`experiment`、`rubric`、`score`、`compare`、`benchmark`、`candidate`、`arena` 这些词;候选拿到的 prompt 要像一个真实的用户请求,只说目标、不说元信息;不许有任何"提示链条"的问法(比如问它用了哪些 skill、原则、文件),链条跟随要从代码形态去判,不从它的自述;目录和 slug 要清理成用户可能取的项目名;不告诉候选还有别的候选存在;judge 可以知道自己在评判,但只看打了匿名标签的输出、永远看不到模型名;比较两个变体时,一个 judge 在一趟里用同一把尺子给两组都打分,且不知道哪组来自哪。

它的步骤。

1. **Frame。** 说清被测的变体是什么、什么行为算成功。把 rubric(三到六条具体标准)写给 judge 看,对候选取走。
2. **搭清理过的环境。** 每个候选一个工作目录,变体装好,并把一个真实任务会有的上下文种进去(项目骨架、候选自然会读的 skill)。
3. **写一个有机的 prompt。** 就是用户会打的那种,不泄露你在测什么。
4. **并行起 N 个候选**,不同模型,每个在自己的清理目录里,拿到同一个 prompt。
5. **起一个设盲的 judge**,用不同模型族,只看匿名标签和 rubric。
6. **从 transcript 验证链条,不从自述。** 读每个候选在本地会话目录里的 transcript,看它实际打开了哪些文件,链条跟随从"真读了什么加代码形态"去判。
7. **自己把每个候选输出读一遍。** 和 judge 的判决对比;不一致说明某个模型有偏见,或者 rubric 含糊。然后综合。

它有一条给你的规矩:接受判决之前,自己读一遍每一个输出。如果你不认同 judge,先怀疑 rubric,再怀疑自己的判断。它的回复是:被测的变体、rubric、每个候选的笔记、judge 的判决、你的综合,以及要不要推广这个变体的建议。

这说明一个 skill 改动不是小事。一次 skill 编辑影响之后每一个会话,所以在它被信之前,要像对待一个实验那样对它。

## 把五个连起来看

这五个 playbook 的交付物都是答案、诊断,或者一次被验证过的 skill 改动,不是代码。

它们的价值在于防止"手比脑子快"。investigation 防止你在弄清问题之前就改代码。两个 forensics 防止你在找到原因之前就改代码。authoring-a-skill 和 eval 防止你在验证之前就改一个会影响所有会话的 skill。

边界在这一篇里反复出现,值得单独收一句。对抗性审查用在 diff 上,不用在计划上。诊断和修复分开,先拿诊断。eval 的判决,自己先读一遍输出再接受。

## 今天就做一件事

下次碰到一个"这是怎么回事"的问题,先走 `investigation`,让 agent 只给发现,不给修复。等发现指向一个确切的原因,再开一次新的任务去修它。

## 参考

本篇拆解对照的原文,都在 pstack 仓库里(仓库地址 `github.com/backnotprop/pstack`):

- [`skills/poteto-mode/playbooks/investigation.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/investigation.md)
- [`skills/poteto-mode/playbooks/runtime-forensics.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/runtime-forensics.md)
- [`skills/poteto-mode/playbooks/trace-forensics.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/trace-forensics.md)
- [`skills/poteto-mode/playbooks/authoring-a-skill.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/authoring-a-skill.md)
- [`skills/poteto-mode/playbooks/eval.md`](https://github.com/backnotprop/pstack/blob/main/skills/poteto-mode/playbooks/eval.md)
