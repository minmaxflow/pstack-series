# pstack 拆解 32 · 看门与落地

绿不等于安全。`babysit` 把 PR 推到 merge-ready 但永不合并;`shipping` 独立验证每一个 PR,只落地从栈底连续的那一段。

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

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/babysit.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/babysit.md)
- [`skills/poteto-mode/playbooks/shipping.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/shipping.md)
