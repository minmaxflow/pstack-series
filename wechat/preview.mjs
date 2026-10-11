// 把构建出的公众号 HTML 渲染成 PNG 预览图(仅用于看排版,不参与发布)。
// 用法: node wechat/preview.mjs [文件名,默认 06-understanding.html]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'

const name = process.argv[2] || '06-understanding.html'
const src = path.resolve('wechat/out', name)
const outDir = path.resolve('wechat/preview')
fs.mkdirSync(outDir, { recursive: true })

const b = await puppeteer.launch()
const p = await b.newPage()
await p.setViewport({ width: 400, height: 1400, deviceScaleFactor: 2 })
await p.goto('file://' + src, { waitUntil: 'networkidle0' })
const out = path.join(outDir, name.replace(/\.html$/, '.png'))
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('preview saved:', out)
