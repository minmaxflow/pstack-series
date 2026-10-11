// 生成公众号封面图(2.35:1,900x383)。用法: node wechat/cover.mjs <序号> "<小标签>" "<标题>" "<副标题>"
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'

const [num, label, title, sub] = process.argv.slice(2)
if (!num || !title) {
  console.error('usage: node wechat/cover.mjs 01 "pstack 拆解 01" "标题" "副标题"')
  process.exit(1)
}
const outDir = path.resolve('wechat/covers')
fs.mkdirSync(outDir, { recursive: true })

const html = `<!doctype html><meta charset="utf-8">
<body style="margin:0">
<div style="width:900px;height:383px;box-sizing:border-box;background:#0f172a;color:#f8fafc;
  font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;
  display:flex;flex-direction:column;justify-content:center;padding:64px 72px;position:relative">
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:#4a6b8a"></div>
  <div style="font-size:24px;letter-spacing:2px;color:#94a3b8;margin-bottom:22px">${label || 'pstack 拆解 ' + num}</div>
  <div style="font-size:52px;font-weight:800;line-height:1.25;letter-spacing:-1px">${title}</div>
  ${sub ? `<div style="font-size:24px;color:#cbd5e1;margin-top:22px">${sub}</div>` : ''}
</div>
</body>`

const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 900, height: 383, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle0' })
const out = path.join(outDir, `${num}.png`)
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 900, height: 383 } })
await b.close()
console.log('cover saved:', out)
