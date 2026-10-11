// 用公众号草稿箱接口建草稿(不群发)。
// 用法: node wechat/publish-draft.mjs <序号> "<标题>" "<作者>" "<摘要>"
// 依赖 wechat/key.md(AppID/AppSecret)、wechat/covers/<序号>.png、wechat/out/<序号-...>.html
import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'node:fs'

const [num, title, author, digest, updateId] = process.argv.slice(2)
if (!num || !title) {
  console.error('usage: node wechat/publish-draft.mjs 01 "标题" "作者" "摘要"')
  process.exit(1)
}

const key = fs.readFileSync('wechat/key.md', 'utf8')
const appid = key.match(/AppID:\s*(\S+)/)[1]
const secret = key.match(/AppSecret:\s*(\S+)/)[1]

const api = async (url, opts) => {
  const res = await fetch(url, opts)
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { raw: text } }
}

// 1. access_token
const tok = await api(
  `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
)
if (!tok.access_token) {
  console.error('token failed:', JSON.stringify(tok))
  process.exit(1)
}
const T = tok.access_token

// 2. 找正文 HTML 与封面
const outFile = globSync(`wechat/out/${num}-*.html`)[0]
if (!outFile) { console.error('no out html for', num); process.exit(1) }
const full = fs.readFileSync(outFile, 'utf8')
const m = full.match(/<section[\s\S]*<\/section>/)
if (!m) { console.error('no <section> in', outFile); process.exit(1) }
const content = m[0]
const cover = `wechat/covers/${num}.png`
if (!fs.existsSync(cover)) { console.error('no cover', cover); process.exit(1) }

// 3. 上传封面为永久缩略图(thumb)
const form = new FormData()
form.append('media', new Blob([fs.readFileSync(cover)], { type: 'image/png' }), `${num}.png`)
const up = await api(`https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${T}&type=thumb`, {
  method: 'POST',
  body: form,
})
if (!up.media_id) { console.error('thumb upload failed:', JSON.stringify(up)); process.exit(1) }

// 4. 建草稿或更新草稿
const article = {
  title,
  author: author || '',
  digest: digest || '',
  content,
  content_source_url: '',
  thumb_media_id: up.media_id,
  need_open_comment: 0,
  only_fans_can_comment: 0,
}
const url = updateId
  ? `https://api.weixin.qq.com/cgi-bin/draft/update?access_token=${T}`
  : `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${T}`
const payload = updateId ? { media_id: updateId, index: 0, articles: article } : { articles: [article] }
const dr = await api(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: Buffer.from(JSON.stringify(payload), 'utf8'),
})
if (dr.media_id || dr.errcode === 0) {
  console.log(updateId ? 'DRAFT UPDATED.' : ('DRAFT OK. media_id: ' + dr.media_id))
  console.log('去后台「草稿箱」查看,确认后自己群发。')
} else {
  console.error('draft failed:', JSON.stringify(dr))
  process.exit(1)
}
