# pstack 拆解 27 · 技能元:写技能与测技能

技能是基础设施,改它要像改代码一样走流程、做实验。

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

## 参考

原文都在 pstack 上游仓库(`cursor/plugins`):

- [`skills/poteto-mode/playbooks/authoring-a-skill.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/authoring-a-skill.md)
- [`skills/poteto-mode/playbooks/eval.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/eval.md)
