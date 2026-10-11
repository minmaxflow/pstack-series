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
.wx { font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif; font-size: 16px; color: #1f2328; line-height: 1.9; word-break: break-word; }
.wx h2 { font-size: 18px; font-weight: 700; line-height: 1.5; margin: 2.2em 0 0.9em; text-align: center; color: #111827; }
.wx h3 { font-size: 16.5px; font-weight: 700; line-height: 1.5; margin: 1.6em 0 0.5em; color: #33475b; }
.wx p { margin: 1.1em 0; }
.wx a { color: #33475b; text-decoration: none; }
.wx strong { font-weight: 700; color: #111827; }
.wx code { font-family: "SFMono-Regular", Consolas, Menlo, monospace; font-size: 88%; background: #f0f1f3; color: #24292f; padding: 2px 6px; border-radius: 4px; }
.wx pre { background: #f6f7f9; border: 1px solid #e4e7eb; border-radius: 8px; padding: 16px 18px; margin: 1.3em 0; overflow-x: auto; }
.wx pre code { background: none; color: #24292f; padding: 0; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.wx ul, .wx ol { margin: 1.1em 0; padding-left: 1.5em; }
.wx li { margin: 0.4em 0; }
.wx blockquote { margin: 1.3em 0; padding: 0.7em 1em; background: #f2f4f7; border-left: 3px solid #c3ccd6; color: #4b5563; border-radius: 0 6px 6px 0; }
.wx blockquote p { margin: 0.4em 0; }
.wx table { border-collapse: collapse; width: 100%; margin: 1.3em 0; font-size: 14px; }
.wx th, .wx td { border: 1px solid #e4e7eb; padding: 9px 11px; text-align: left; vertical-align: top; line-height: 1.6; }
.wx th { background: #f2f4f7; color: #33475b; font-weight: 700; }
.wx tr:nth-child(even) td { background: #f8f9fb; }
.wx hr { border: none; border-top: 1px solid #e4e7eb; margin: 2em 0; }
.wx img { max-width: 100%; display: block; margin: 1.3em auto; border-radius: 6px; }
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
// 清掉上次构建的产物,避免改名后残留旧文件。
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith('.html')) fs.unlinkSync(path.join(outDir, f))
}

const only = process.argv[2]
const files = fs
  .readdirSync(docsDir)
  .filter((f) => /^[0-9]{2}-.*\.md$/.test(f) && (!only || f === only || f.startsWith(only)))
  .sort()
const built = []

for (const file of files) {
  const md = fs.readFileSync(path.join(docsDir, file), 'utf8')
  const body = marked.parse(toWechatMarkdown(md.replace(/^#\s+.*\r?\n/, '')))
  const section = juice(`<style>${css}</style><section class="wx">${body}</section>`)
  const h1 = (md.match(/^#\s+(.+)$/m) || [, file.replace(/\.md$/, '')])[1].trim()
  // 完整 HTML5 文档,带 viewport,手机浏览器才按设备宽度渲染,不会横向滑动。
  const html = `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${h1}</title>\n<style>html { -webkit-text-size-adjust: 100%; } body { margin: 0; }</style>\n</head>\n<body>\n${section}\n</body>\n</html>\n`
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
