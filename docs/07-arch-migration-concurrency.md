# pstack 拆解 07 · 迁移与并发

模型可以并行地改很多东西,但并行也意味着更多共享的写目标和更难追的竞态。

这一篇讲两条:迁移就在同一波里改完并删旧,不留双路径;并发先消除共享,再谈加锁。

## migrate-callers-then-delete-legacy-apis

迁移调用方再删旧 API 的背后是一个判断:**双路径是复杂度的根源。** 一个系统要演化,本该是替换,但默认的惯性总是并存,因为并存最省事。并存之后,每个读者都要同时理解新旧两套,每处改动都要考虑两条路径,而旧路径因为"还有人在用"永远删不掉,代码库于是变成只增不减。

这条原则把清理当成演化本身的一部分:认定新设计是对的,就在同一波里迁移调用方、删掉旧 API,不给兼容层留活口。它只在三个前提同时成立时才用:没有外部用户依赖向后兼容,项目能承受一次协调的破坏性变更,新设计属于一次简化或重构。

它有一句判据:**当我们认定新 API 是对的设计,就在同一波里迁移调用方、删掉旧 API,不要保留兼容层。**

在满足前提时,它的规则很硬。不要因为内部调用方还在就保留旧路径。盘点调用方,迁移它们,立刻删除旧 API。临时适配器是例外,要限时,不是默认架构。测试更新成断言新契约,删掉那些只保护重构前实现细节的测试。

## separate-before-serializing-shared-state

先分离再串行的背后是一个被反复验证的结论:**共享可变状态是并发问题的根。** 当两个 actor 同时读写同一份状态,race condition 就出现了,而且它间歇、难复现、调试昂贵。加锁看起来是标准答案,但它只是把共享强制成串行,代价是复杂度和性能。

更好的做法是先问一个更前面的问题:这两个 actor 真的需要同一个可变对象吗,还是在发布各自独立的事实。多数情况是后者,那就让各自拥有自己的状态,只在读取和报告的边界合并,共享根本不存在。所以"我们需要一把锁"应该被当成一个要检查的设计味道;而且有一条很硬的话:指令和约定不是并发控制。

它有一句判据:**当并发的 actor 可能共享可变状态时,先问他们是否真的需要同一个可变对象。不需要,就消除共享;共享是真的,再用结构强制串行。**

它的做法分三步。

**先识别共享可变状态。** 双方都读写的文件,双方都推的分支,双方既定义又消费的 API。

**默认消除共享写目标。** 问一句:这些 actor 需要一个规范对象,还是在发布各自独立的事实?答案通常是后者。给每个 actor 自己的文件、key、分支、状态目录,只在读取和报告边界合并。这里有个容易混的地方:两个 worker 往同一个 `state.json` 写各自的 `lastX` 字段,仍然是共享变更;而 `indexer-state.json` 加上 `metrics-state.json`,就不是。

**只有当"一个共享写目标"是真实不变式时,才用结构强制串行。** lockfile、顺序阶段、单写者 actor、原子的 compare-and-swap 都算。而且要把"我们需要一把锁"当成一个需要检查的设计味道,不是默认答案。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md)
- [`skills/principle-separate-before-serializing-shared-state/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md)
