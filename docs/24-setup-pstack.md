# pstack 拆解 24 · 按角色配模型

模型是资源,应该按角色配置,而不是一个模型打天下。

## setup-pstack

`setup-pstack` 配置 pstack 用哪些模型,以及每个角色的推理预算。模型是资源,应该按角色配置:把最强、最贵的判断力用在最需要判断的地方,把便宜和快用在机械的地方。"一个模型打天下"既贵又浪费它擅长的部分。

它枚举你这一会话里能传给 subagent 的模型 slug,这是它可靠的信息源(如果你不用这种枚举,它会让你把 slugs 贴进来,而且**绝不写一个没确认可用的 slug**)。它读现有的配置,把 `# budget` 行和各角色的值当作当前选择,顺便丢掉已经退休的角色行。

它问你一个预算档位,给四个选项:`unlimited`、`large`、`medium`、`small`,并说明 `large` 匹配 skill 默认值。档位是在改每个真实 slug 的**推理力度 token**:`unlimited` 提到 `max`,`large` 是 `xhigh`,`medium` 是 `high`,`small` 是 `medium`。它会给出一个不在可用集合里的 slug,标成"需要一个选择",然后给每个角色写一行。

它只覆盖你在意的角色。一个没有写进规则的角色,保持 skill 的默认值。写文件时它整份覆盖,让重跑保持幂等。Cursor 写到 `~/.cursor/rules/pstack-models.mdc`,其余 harness 写到 `~/.agents/pstack-models.md`。

你可能会踩的一个坑:把一个角色设成 `auto` 或 `inherit-parent`,它的意思不是某个模型 slug,而是"就用在跑父聊天的那个模型"。这正是 Auto 用户能一直待在 Auto 上的方式。对面板角色,值是**一个列表**,每一条起一个 subagent,所以列表长度就是面板大小。

它最后还有一步:检查你的项目有没有一个能驱动真实应用来取证的方式(一个 `verify-*` skill,或者一个已有的 harness)。如果没有,它就问一次要不要用 `create-verification-skill` 生成一个。说不,它就走,不推销。

## 参考

本篇拆解对照的原文,都在 pstack 上游仓库里(`github.com/cursor/plugins/tree/main/pstack`):

- [`skills/setup-pstack/SKILL.md`](https://github.com/cursor/plugins/blob/main/pstack/skills/setup-pstack/SKILL.md)
