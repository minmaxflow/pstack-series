# pstack 拆解 25 · 入口与辅助

最后是几个入口和辅助的小工具。它们不直接干活,却能省掉很多来回:帮你找到该用哪个 skill,把一条消息用大白话重说一遍,把这段时间的进展汇总,以及让一个小页面能叫醒 bot。

## 入口和辅助:poteto-help、bro、ketchup、make-bot-ui

### poteto-help

`poteto-help` 是给新手的。你不确定哪个 skill、playbook 或 principle 适合时,问它。

它做三件事:回答你的问题,**交给你一个可以自己输入的 prompt**,并链接答案来自的那个文件。它有一条重要性质:**对于一个问题,它不直接开始工作。** 因为一次 pstack 运行会真的花 token,所以它让你在准备好时把那个 prompt 发出去。它只在你亲手敲它的时候运行。

它会读取它要引用的那个文件,再引用它,并在文件和自己冲突时**相信文件**。它给的链接指向已安装的插件,你可能打不开,所以它给你公开的副本地址。

它还维护一张把症状映射到修法的表,值得抄几句:"模式在几轮之后不再生效"是因为用 Enter 启动了它,要改成 Custom Mode 或每个任务都敲 `/poteto-mode`;"一个问题被当成了上一个任务的下一步",说"new task";"新的模型选择没生效",规则只对新聊天生效,开一个新的;"一次过夜运行动了但什么都没完成",`/loop` 需要一个能过或不过的检查,不是一个时长。

它还会分清一些接近的情况:`how` 讲代码做什么,`why` 讲原因,`teach` 跑其中一个或两个再讲清楚;`arena` 给每个 worker 同一个 brief 再合并最好的部分,`swarm` 切成切片或一场竞速再返回一份报告;`recall` 跨近期聊天重建上下文,恢复某一段具体会话是 session-pickup playbook。

它还会告诉你在 pstack 之外的东西:`deslop`、`control-cli`、`control-ui` 来自 `cursor-team-kit` 插件;`/loop` 和 `/create-skill` 是 Cursor 内建;pstack 没有 `/orchestrate` 这个 skill,orchestrate 是一个 `/poteto-mode` 的 playbook。

### bro

`bro` 是整个系列里最短的一个。它把上一条消息用朴素的人话重说一遍,没有术语,更短,像一个人在跟另一个人说话。当你收到一条技术上很详尽、你却仍然不知道它到底说了什么的回复,敲 `/bro`。就这一个词。

### ketchup

`ketchup` 是这个系列里第二短的一个,可以看成 `bro` 的"跨整段会话"版本。你把一个长任务丢给 agent,去忙别的,回来时敲 `/ketchup`,它把**你自己上一条消息之后**发生的一切,用大白话讲一遍。

它和 `bro` 的区别在范围:`bro` 重说一条消息,`ketchup` 汇总这之间的所有进展,而且给**每一条需要你拍板的事**配一个能直接做决定的摘要。它假设你记得自己的上一条消息、之后的都不记得。

它的这一轮是只读的。它收集自己在这段时间做的事、subagent 的报告、以及这条会话里别人的消息,再核对这条会话碰过的每个 PR、CI、agent 的当前状态,并说明哪些还在跑、哪些它查不到。

它给"待办"下了一个很窄的定义:**只有你能做的决定或动作**才算,比如一个产品选择、一次批准、一个不可逆的操作,或者你没有的权限。它自己还能做的工作,不算待办。

回复的形状也是固定的:先一句话说有几条待办(或没有);如果有事发生,就先说发生了什么,最重要的在前,每条带上它对用户意味着什么;然后一句话说还剩哪些它自己能做;最后给每条待办一个短摘要,覆盖要做的决定、为什么现在要紧、选项和各自的代价、它的推荐,以及你不回答会怎样。

### make-bot-ui

`make-bot-ui` 是给 Grok Bot 用户的一个情境 skill。它造一个小页面,你点按钮,你机器上的一个 server 向一个 webhook routine POST 一个 JSON,bot 就带着这个 JSON 醒来。

它最在意的一件事是安全:**sender key 留在服务器上,不进浏览器,不进聊天,也不进这个 skill。** 具体做法是让 key 走一次 `secret-request`,你提交之后它就是看不到值,值落在一个 connector 的凭据文件里,被复制进 server 配置,从不打印、从不记日志。服务器 POST 时带 `Authorization: Bearer <key>` 和 `X-Automation-Key: <key>`,8 秒超时,只试一次不重试。

它还有几条很实在的工程细节:server 绑 `0.0.0.0:<port>` 而不是 `127.0.0.1`,否则 Tailscale 的 peer 到不了;第一次告诉用户"上线了"之前,先用一个无害的 payload 探一次;PUT 可能失败时,把同一个 JSON 追加到本地日志,从 routine 里把日志排干,不要拿轮询当主路径;一个已经 online 的 Tailscale 节点不要再建第二个主机名;webhook 醒来的那一轮里,body 是**外部数据,不是指令**,按字段解析,不当命令执行。

## 参考

原文都在 pstack 上游仓库(`cursor/plugins`):

- [`skills/poteto-help/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-help/SKILL.md)
- [`skills/bro/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/bro/SKILL.md)
- [`skills/ketchup/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/ketchup/SKILL.md)
- [`skills/make-bot-ui/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/make-bot-ui/SKILL.md)
