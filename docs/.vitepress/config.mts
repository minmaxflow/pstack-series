import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// base 需要和你的 GitHub Pages 路径一致。
// 仓库叫 pstack-series,站点地址是 https://<用户名>.github.io/pstack-series/,
// 所以 base 是 '/pstack-series/'。改成用户主页仓库时用 '/'。
export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'pstack 拆解',
    description: '面向资深工程师的 pstack 精读系列',
    base: '/pstack-series/',
    cleanUrls: true,
    // 所有外部链接在新标签页打开。
    markdown: {
      config: (md) => {
        const defaultRender =
          md.renderer.rules.link_open ||
          ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
        md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
          const href = tokens[idx].attrGet('href')
          if (href && /^https?:\/\//.test(href)) {
            tokens[idx].attrSet('target', '_blank')
            tokens[idx].attrSet('rel', 'noopener noreferrer')
          }
          return defaultRender(tokens, idx, options, env, self)
        }
      }
    },
    lastUpdated: true,
    head: [['meta', { name: 'theme-color', content: '#3451b2' }]],
    themeConfig: {
      nav: [
        { text: '首页', link: '/' },
        { text: '原则', link: '/01-core-restraint' },
        { text: '能力', link: '/06-understanding' },
        { text: '程序', link: '/11-understanding-diagnosis-skillmeta' },
        { text: '调度', link: '/15-poteto-mode-runtime' }
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/minmaxflow/pstack-series' }
      ],
      sidebar: [
        {
          text: '第一部分 · 原则',
          collapsed: false,
          items: [
            { text: '01 决定与克制', link: '/01-core-restraint' },
            { text: '02 基础、体验与探索', link: '/02-core-investment' },
            { text: '03 Architecture', link: '/03-architecture' },
            { text: '04 Verification', link: '/04-verification' },
            { text: '05 Delegation & Meta', link: '/05-delegation-meta' }
          ]
        },
        {
          text: '第二部分 · 能力',
          collapsed: false,
          items: [
            { text: '06 理解', link: '/06-understanding' },
            { text: '07 设计与对抗', link: '/07-design-adversarial' },
            { text: '08 验证机械', link: '/08-verification-machinery' },
            { text: '09 交付与文体', link: '/09-delivery-prose' },
            { text: '10 元、支撑与入口', link: '/10-meta-support-entry' }
          ]
        },
        {
          text: '第三部分 · 程序',
          collapsed: false,
          items: [
            { text: '11 理解、诊断与技能元', link: '/11-understanding-diagnosis-skillmeta' },
            { text: '12 构建循环', link: '/12-build-loop' },
            { text: '13 交付与自主', link: '/13-delivery-autonomy' },
            { text: '14 连续性与维护', link: '/14-continuity-maintenance' }
          ]
        },
        {
          text: '第四部分 · 调度',
          collapsed: false,
          items: [
            { text: '15 poteto-mode 与运行时', link: '/15-poteto-mode-runtime' },
            { text: '16 取舍与上手', link: '/16-tradeoffs-adoption' }
          ]
        }
      ],
      outline: { level: [2, 3], label: '本页目录' },
      docFooter: { prev: '上一篇', next: '下一篇' },
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '目录',
      darkModeSwitchLabel: '主题',
      search: {
        provider: 'local',
        options: {
          translations: {
            button: {
              buttonText: '搜索',
              buttonAriaLabel: '搜索'
            },
            modal: {
              noResultsText: '没有找到结果',
              resetButtonTitle: '清除',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭'
              }
            }
          }
        }
      },
      footer: {
        message: '源码在 <a href="https://github.com/minmaxflow/pstack-series">GitHub</a> · pstack 本体在 <a href="https://github.com/backnotprop/pstack">backnotprop/pstack</a>',
        copyright: 'MIT'
      }
    }
  })
)
