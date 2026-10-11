# 公众号构建

把 `docs/` 下的 16 篇 Markdown 转成能直接粘进微信公众号编辑器的 HTML。

## 为什么需要这一步

公众号编辑器只保留**内联样式**的富文本,会丢掉 `<style>` 标签和 `class`;正文里的**外链点不开**;不会渲染 mermaid 流程图。所以直接粘 Markdown 会掉样式,直接粘网页 HTML 会掉格式。

这个目录里的脚本处理这三件事:渲染 Markdown、把样式内联到每个标签、把外链降级成纯文本、把流程图换成预渲染的 PNG。

## 两条路,任选

### 路一:用一个公众号排版工具(最快)

把 `docs/NN-*.md` 的内容粘进这类工具,选定主题,再复制到公众号:

- doocs/md(https://md.doocs.org)
- mdnice(https://mdnice.com)

它们会自动处理内联样式和图片。适合想手动调主题的情况。

### 路二:用本仓库的脚本(可复现)

```bash
npm run wechat:build
```

产物在 `wechat/out/`,打开 `wechat/out/index.html`,点进任意一篇。

发布时:**在浏览器里打开那一篇,全选(⌘A)复制,粘进公众号编辑器**。样式已经内联,会保留。

## 图片

- 第 15 篇的两张流程图,脚本已通过 `wechat/mermaid/diagram-*.png` 嵌入。这些 PNG 用下面的命令重新生成:

  ```bash
  npm run wechat:mermaid
  ```

- 从浏览器复制粘贴到公众号时,图片通常会被公众号自动上传。如果没上传,就在公众号编辑器里手动插入 `wechat/mermaid/` 里的 PNG。

## 标题、摘要、开头

见 [`公众号发布清单.md`](./公众号发布清单.md),每篇的标题(带 pstack 和系列号)、摘要、开头钩子都在里面。

## 已知限制

- 脚本把外链降级成纯文本,所以文末「参考」显示的是文件路径,公众号读者需要到 `github.com/cursor/plugins/tree/main/pstack` 自行查找。
- 表格在公众号编辑器里可能需要微调列宽。
- 输出目录 `wechat/out/` 是构建产物,不入版本控制。
