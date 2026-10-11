# 公众号构建

把 `docs/` 下的 38 篇 Markdown 转成能在微信公众号里用的内容。

## 为什么需要这一步

公众号编辑器只保留**内联样式**的富文本,会丢掉 `<style>` 标签和 `class`;正文里的**外链点不开**;不会渲染 mermaid 流程图。所以直接粘 Markdown 会掉样式,直接粘网页 HTML 会掉格式。

脚本处理四件事:渲染 Markdown、把样式内联到每个标签、把外链降级成纯文本、把流程图换成预渲染的 PNG。另外正文里**不含 H1**(公众号标题栏已经有标题),`.wx` 也**不带背景和额外 padding**(公众号自己会加)。

## 三种做法

### 路一:用公众号排版工具(最快)

把 `docs/NN-*.md` 的内容粘进这类工具,选定主题,再复制到公众号:

- doocs/md(https://md.doocs.org)
- mdnice(https://mdnice.com)

### 路二:用本仓库的脚本,手动粘(可复现)

```bash
npm run wechat:build
```

产物在 `wechat/out/`。打开 `wechat/out/index.html`,点进任意一篇,**全选(⌘A)复制,粘进公众号编辑器**。样式已内联,会保留。

### 路三:用官方草稿 API 直接建草稿(不用手动粘)

在 `wechat/key.md` 放好 AppID / AppSecret(该文件已加入 `.gitignore`),并把调用机器的公网 IP 加进后台「设置与开发 → 基本配置 → IP 白名单」。

```bash
node wechat/cover.mjs 01 "pstack 拆解 01" "标题" "副标题"
node wechat/publish-draft.mjs 01 "标题" "作者" "摘要"
```

它会换 `access_token`、上传封面为缩略图、用 `draft/add` 建草稿(**不群发**)。更新已有草稿再加一个 `media_id`:

```bash
node wechat/publish-draft.mjs 01 "标题" "作者" "摘要" <media_id>
```

两个坑已处理:`draft/update` 的 `articles` 是**对象**,`draft/add` 的是**数组**;正文里的 `<section>` 已去掉 H1、背景和内边距。

## 封面

用 `cover.mjs` 生成(900×383,公众号主封面比例):

```bash
node wechat/cover.mjs 01 "pstack 拆解 01" "AI 代码为什么总是越写越多" "默认能删就删,加之前先减"
```

产物在 `wechat/covers/`,不入版本控制。

## 图片

- 第 37 篇(`poteto-mode`)的两张流程图,脚本已通过 `wechat/mermaid/diagram-*.png` 嵌入;重出用 `npm run wechat:mermaid`。
- 从浏览器复制粘贴时图片通常会被公众号自动上传;走 API 时正文图片需要另用 `media/uploadimg` 上传,目前第 37 篇的图是本地路径,走 API 前要改成微信域名。

## 标题、摘要

见 [`公众号发布清单.md`](./公众号发布清单.md),每篇的标题(带 pstack 和系列号)和摘要都在里面。

## 已知限制

- 外链被降级成纯文本,所以文末「参考」显示的是文件路径,读者需到 `github.com/cursor/plugins/tree/main/pstack` 自行查找。
- 表格在公众号编辑器里可能需要微调列宽。
- 输出目录 `wechat/out/`、`wechat/covers/`、`wechat/preview/` 都是构建产物,不入版本控制。
