# pstack 拆解 21 · 文体(下):注释与语言

注释交给一个没写它的人,语言规则交给语言本身。

## no-comments

作者会替自己辩护,所以清洗要由一个没写它的人做。这不是不信任,是一个结构事实:你替自己的注释辩护,和你替自己的代码辩护,是同一种偏见。所以它把"生成与评判分开"用在注释上,而且更进一步:一条声称了约束的注释,要么被编码成类型、测试或 lint,要么被删掉。

`no-comments` 把注释交给一个**没写它的** reviewer,再处理被接受的发现。

这个 reviewer 叫 Comment Sicko,只读,手上有一份很短的 keep 清单:license 头,公共 API 上的 doc comment,解释代码说不清楚的 why 的链接,以及由你无法改的外部依赖强制出来的行为。除此之外都走。你自己代码里蹦出来的意外,没有这种豁免。那条注释会作为一次重构信号回来。

它的步骤里有一条很细的分辨:**要把一次删除和一个错误判断分开。** 它检查 Comment Sicko 的报告和 diff,拒掉那些跑到应用代码里的编辑、越出范围的编辑、被例外条款保护的删除、写错了的"必须删"理由,以及把故意保留的代码当成有罪的标记。一个 keep 要活下来,必须带着"这是我们改不了的东西"的证明。对一个薄的"重要"或"不要删"的标记,它先跑一遍 `how` 或 `why` 去查那个符号;判断不了的时候,一个删除不恢复,一个 keep 被驳倒就删掉。

它的收尾动作很好。当一个注释声称一个约束,写着"不要删""不要改这段文案""改之前先问 X",`no-comments` 会提供一个把这个约束**编码**成类型、测试或 lint 的方案。要么编码它,要么删掉它。这其实是 encode-lessons-in-structure 在注释上的应用:一条约束如果值得写下来,就值得让某个东西去强制它。

分工值得记清楚。`deslop` 清代码里的 slop,`unslop` 清散文里的 slop,`no-comments` 把注释交给一个没写它的人。

## typescript-best-practices

原则是语言无关的,落到具体语言就需要一套可查的语法规则。否则"让非法状态无法表达"这句话在真实的 TypeScript 里到底长什么样,每个人都有自己的理解。它补的就是这一步:把方向翻译成可以照着写的语法。

`typescript-best-practices` 把 type-system-discipline 落成具体的语法规则。

它一开始就说明:**先应用 type-system-discipline 那条原则 skill**,它负责方向,这个 skill 负责语法。它的 frontmatter 里带 `paths: ["**/*.ts", "**/*.tsx"]`,所以当任务碰到 `.ts` 或 `.tsx` 文件时,要显式敲一下它才会进入上下文。

规则是一条条具体可查的。

- **可辨识联合。** 用一个 `kind` 字面量判别式建模变体,让非法状态无法表达。不要用可选字段的袋子。
- **品牌类型。** 用 `& { readonly __brand: "X" }` 给原始类型打品牌,让它们不能互换。在边界处校验一次。
- **构造式建模。** 把形状建成让非法值无法被构造。非空列表用 `[T, ...T[]]`,偶数长度用 `[T, T][]`,时间区间用 `start` 加 `duration`。不是运行时守卫,不是指望一个 refinement type。
- **最简单的全函数类型。** 只要上面的每个操作都保持全函数,就留着 `T[]`。只有松类型逼出 `!`、一个 cast,或一句"这不该发生"的 throw 时,才收紧成 `NonEmpty<T>`。
- **`unknown` 优于 `any`。** 外部数据是 `unknown`。
- **schema 先于守卫。** 在手写一个逐属性的类型守卫之前,先用仓库的运行时 schema 库,并从 schema 推出类型,比如 `z.infer`。
- **不用 `as`。** 每一个 `as` 都是一次等待发生的运行时崩溃。只在校验之后才 cast。
- **收窄的层级。** 判别式 switch > `in` 操作符 > `typeof`/`instanceof` > 自定义类型守卫 > `as`。
- **类型守卫必须真的验证它的声明。** 一个撒谎的守卫比 `as` 更糟,因为 bug 藏在一个说它安全的名字后面。命名成 `isX` 或 `hasX`。
- **穷尽性。** 在 default 分支里内联 `const _exhaustive: never = x;`,让编译器在新增变体时报错。
- **`satisfies` 优于 `as`。** 它校验值,又不放宽字面量类型。
- **边界校验。** 数据进来的时候把它解析成一个命名的领域类型,`Record<string, unknown>`(无论怎么拼写)到那个解析为止。内部信任类型。
- **从 schema 派生类型。** 在声明一个新 interface 之前,先想 `Pick`、`Omit`、`Parameters`、`ReturnType`、`Awaited`、`typeof`。
- **对象参数。** 传对象,不传位置参数,让参数顺序自解释。热路径跳过(每帧渲染、分词器、解析器)。
- **真实的测试。** 能跑的不要 mock。优先用框架真实的测试原语加泄漏和释放检查,UI 在运行中的构建里验证。只 mock 本地跑不了的东西。
- **结构化的遥测。** 优先用结构化日志诊断,带足够从一个 id 调出问题的上下文。发布代码里不留 `console.log`。

它还有一份 `references/patterns.md`,放具体例子。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/no-comments/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/no-comments/SKILL.md)
- [`skills/typescript-best-practices/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/typescript-best-practices/SKILL.md)
