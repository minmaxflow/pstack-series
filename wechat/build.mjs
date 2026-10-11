// 把 docs/ 下的 Markdown 构建成可直接粘进微信公众号编辑器的 HTML。
//
// 公众号编辑器只保留带内联样式的富文本,会丢掉 <style> 和 class,
// 所以这里用 juice 把样式内联到每个标签上;外链在公众号里点不了,
// 所以统一降级成纯文本(第 15 篇的 mermaid 图需要另出图片,见 README)。

import { marked } from 'marked'
import juice from 'juice'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const docsDir = path.join(root, 'docs')
const outDir = path.join(root, 'wechat', 'out')

const css = `
.wx { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; font-size: 16px; color: #24292f; line-height: 1.85; word-break: break-word; }
.wx h1 { font-size: 23px; font-weight: 700; line-height: 1.4; margin: 1.2em 0 0.4em; letter-spacing: -0.3px; }
.wx h2 { font-size: 19px; font-weight: 700; line-height: 1.5; margin: 1.9em 0 0.7em; padding-left: 11px; border-left: 3px solid #0b7a4b; }
.wx h3 { font-size: 17px; font-weight: 700; line-height: 1.5; margin: 1.5em 0 0.5em; color: #0b7a4b; }
.wx p { margin: 1.05em 0; }
.wx a { color: #0b7a4b; text-decoration: none; }
.wx strong { font-weight: 700; color: #111418; }
.wx code { font-family: "SFMono-Regular", Consolas, Menlo, monospace; font-size: 87%; background: #f2f4f6; color: #0b7a4b; padding: 2px 5px; border-radius: 4px; }
.wx pre { background: #0d1117; border-radius: 8px; padding: 16px 18px; margin: 1.2em 0; overflow-x: auto; }
.wx pre code { background: none; color: #c9d1d9; padding: 0; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.wx ul, .wx ol { margin: 1.05em 0; padding-left: 1.5em; }
.wx li { margin: 0.35em 0; }
.wx blockquote { margin: 1.2em 0; padding: 0.5em 1em; border-left: 3px solid #d0d7de; background: #f6f8fa; color: #57606a; }
.wx blockquote p { margin: 0.4em 0; }
.wx table { border-collapse: collapse; width: 100%; margin: 1.2em 0; font-size: 14px; }
.wx th, .wx td { border: 1px solid #d8dee4; padding: 8px 10px; text-align: left; vertical-align: top; line-height: 1.6; }
.wx th { background: #f6f8fa; font-weight: 700; }
.wx hr { border: none; border-top: 1px solid #eaecef; margin: 1.8em 0; }
.wx img { max-width: 100%; display: block; margin: 1.2em auto; }
`

marked.setOptions({ gfm: true, breaks: false })

// 外链在公众号点不了,把 [文字](url) 降级成"文字"。
// mermaid 代码块换成预渲染好的 PNG(见 wechat/mermaid/)。
function toWechatMarkdown(md) {
  let i = 0
  return md
    .replace(/```mermaid\n[\s\S]*?```/g, () => `\n![图 ${++i}](../mermaid/diagram-${i}.png)\n`)
    .replace(/(?<!!)\[([^\]]+)\]\([^)]+\)/g, '$1')
}

fs.mkdirSync(outDir, { recursive: true })

const files = fs.readdirSync(docsDir).filter((f) => /^[0-9]{2}-.*\.md$/.test(f)).sort()
const built = []

for (const file of files) {
  const md = fs.readFileSync(path.join(docsDir, file), 'utf8')
  const body = marked.parse(toWechatMarkdown(md))
  const html = juice(`<style>${css}</style><section class="wx">${body}</section>`)
  const out = file.replace(/\.md$/, '.html')
  fs.writeFileSync(path.join(outDir, out), html, 'utf8')
  built.push(out)
}

const index = `<!doctype html><meta charset="utf-8"><title>公众号构建产物</title>
<body style="font-family:-apple-system,sans-serif;max-width:720px;margin:40px auto;line-height:1.8">
<h1>公众号构建产物</h1>
<p>打开下面任意一篇,在浏览器里全选复制,粘进微信公众号编辑器即可(样式已内联,图片需单独上传)。</p>
<ul>${built.map((f) => `<li><a href="./${f}">${f}</a></li>`).join('')}</ul>
</body>`
fs.writeFileSync(path.join(outDir, 'index.html'), index, 'utf8')

console.log(`built ${built.length} files into wechat/out/`)
