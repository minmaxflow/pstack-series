# pstack 拆解 34 · 治理:把整个项目交给一个协调者

一个比任何单个 agent 都活得久的程序,需要一台更重的机器:一个只写 brief、不写代码的协调者。

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

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/orchestrate.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/orchestrate.md)
