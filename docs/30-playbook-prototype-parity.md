# pstack 拆解 30 · 探路与对齐

有些决定该先看见再拍:原型用便宜的方式探路,像素对齐把"看起来一样"变成一个可以量化的零。

## prototype

`prototype` 是一次性的草图,用来便宜地做一个设计或行为决定,或者用观察去解决一个经验分歧,而不是去问人。

它的总纲里有一句很关键:**它是唯一一个 playbook,让 Laziness Protocol 的"最小改动"和验证的门槛同时反转。** 速度优先于打磨,代码质量无所谓,不做规划。这里的 rigor,在于**便宜地选对设计**。它鼓励你提出用户没要求的变体,扔掉一个方向再试另一个。

它的步骤。

1. **界定这个原型存在的目的**:要做的决定是哪个布局、哪个交互、哪个密度,还是对一个经验分歧,哪种行为、哪种时序、哪种做法。**没有决定就没有原型**,路由到 feature。
2. 设计空间开放时,先收集参考:找找有没有先例,总结一版主题、配色、布局的 moodboard,让用户在动手之前先挑方向。方向已定就跳过。
3. **在隔离的 scratch 目录里建一次性版本**,和产品源码分开。视觉决定用原生 HTML/CSS/JS,或者能渲染出这个想法的最轻的栈,用 CDN 依赖,一个带热重载的 dev server。行为或时序决定用能验证那个问题的最小脚本。不用生产框架,不写测试,不做抽象。
4. **对比备选时,把它们放在一个 switcher 后面**(按钮或按键),每个变体有标签。这是 exhaust-the-design-space 的廉价实现。
5. **在匹配的 surface 上验证。** 视觉决定:通过 control skill 给每个变体截图,并驱动那个交互。行为或时序决定:通过记录时序、打印输出、或者观察渲染,来观察你正在决定的那件事。**在这里,观察就是测试,不是一个断言。**
6. 呈现备选、权衡和一个推荐。输出是**决定加那个一次性产物,不是可发布的代码**。把选定的方向交给 feature(或形状问题交给 `architect`)去做真正的构建。

回复要点明:探索了哪些变体、证据(视觉决定给截图,行为决定给观察到的输出或时序)、权衡、你的推荐、scratch 路径,并且**明说这个原型是一次性的**。

## visual-parity

等价不是一个感觉,是一个可以量化的差。眼睛会适应、会疲劳、会被期望欺骗,所以它不能当裁判;截图对比可以。这也是为什么 baseline 本身就是规范:先冻结一份当前行为的截图,之后每个改动都对它做 diff,非零就是失败。

`visual-parity` 做像素级的 UI 等价:匹配两个实现,或者迁移一个 styling 系统。它的总纲是:**你拥有像素级等价。baseline 就是规范。你不碰它。**

它的步骤。

1. **在任何迁移之前,先建立 baseline**:一个视觉回归 harness,给当前组件在它的各种状态下截图;匹配两个实现时,也给目标截图。**没有 baseline,就没有等价声明。** 这是一个阻塞性前置,不是后续工作。
2. **声明并守住反捷径条款**:不修改 harness,不动 baseline,不为了 diff 通过而重构组件。如果 baseline 看起来是错的,**停下来问,不要编辑它**。
3. **一次迁移一个组件。** 跨 worktree 并行,一个组件一个 owner。共享原语作为阻塞阶段**先迁移**。
4. 通过 control skill,在匹配的 surface 上,用图像 diff 验证每个组件对它的 baseline。**非零 diff 就是失败。** 调查那个像素差。用 `/loop` 按组件驱动,直到 diff 为零。
5. 走 opening-a-pr,按组件或按安全的批次。

迁移的时候有一条要主动声明"**bugs included**"。别让迁移顺手修东西,否则新旧输出就没法比较了,等价这件事本身就失去了意义。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/poteto-mode/playbooks/prototype.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/prototype.md)
- [`skills/poteto-mode/playbooks/visual-parity.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/visual-parity.md)
