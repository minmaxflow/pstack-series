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
        { text: '原则', link: '/01-principles-restraint' },
        { text: '能力', link: '/11-understand-how' },
        { text: '程序', link: '/26-playbook-investigate' },
        { text: '调度', link: '/37-poteto-mode-runtime' }
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/minmaxflow/pstack-series' }
      ],
      sidebar: [
        {
          text: '第一部分 · 原则(10)',
          collapsed: false,
          items: [
            { text: '01 少即是多(上)', link: '/01-principles-restraint' },
            { text: '02 重画与终态', link: '/02-principles-reshape' },
            { text: '03 基础与体验', link: '/03-core-basics-experience' },
            { text: '04 探索与杠杆', link: '/04-core-explore-leverage' },
            { text: '05 领域与边界', link: '/05-arch-domain-boundary' },
            { text: '06 类型与状态', link: '/06-arch-types-state' },
            { text: '07 迁移与并发', link: '/07-arch-migration-concurrency' },
            { text: '08 验证(上):真实产物与根因', link: '/08-verify-proof' },
            { text: '09 验证(下):单元、行为与数字', link: '/09-verify-units' },
            { text: '10 委托与元', link: '/10-delegation-meta' }
          ]
        },
        {
          text: '第二部分 · 能力(15)',
          collapsed: false,
          items: [
            { text: '11 理解(上):它怎么运作', link: '/11-understand-how' },
            { text: '12 理解(下):它为什么长成这样', link: '/12-understand-why' },
            { text: '13 理解(下):讲清楚、找回来、看波及', link: '/13-understand-teach-context' },
            { text: '14 设计:先把形状摆出来', link: '/14-design-architect-arena' },
            { text: '15 对抗:让模型互相挑错', link: '/15-design-adversarial' },
            { text: '16 验证机械(上):测试与数字', link: '/16-verify-tdd-benchmark' },
            { text: '17 让 agent 能在应用里自证', link: '/17-verify-create-skill' },
            { text: '18 让验证技能保持诚实', link: '/18-verify-maintain-skill' },
            { text: '19 文体(上):去掉 AI 味', link: '/19-prose-unslop' },
            { text: '20 文体(下):文档标准', link: '/20-prose-technical-writing' },
            { text: '21 文体(下):注释与语言', link: '/21-code-hygiene' },
            { text: '22 自我改进:改仓库、改技能、生成入口', link: '/22-self-improve' },
            { text: '23 可审计与定制流程', link: '/23-audit-figure' },
            { text: '24 按角色配模型', link: '/24-setup-pstack' },
            { text: '25 入口与辅助', link: '/25-entry-helpers' }
          ]
        },
        {
          text: '第三部分 · 程序(11)',
          collapsed: false,
          items: [
            { text: '26 调查与取证', link: '/26-playbook-investigate' },
            { text: '27 技能元:写技能与测技能', link: '/27-playbook-skill-meta' },
            { text: '28 构建:加行为、改结构、修缺陷', link: '/28-playbook-build' },
            { text: '29 性能与持续改进', link: '/29-playbook-perf-hillclimb' },
            { text: '30 探路与对齐', link: '/30-playbook-prototype-parity' },
            { text: '31 开 PR:把工作变成 briefing', link: '/31-playbook-opening-pr' },
            { text: '32 看门与落地', link: '/32-playbook-babysit-shipping' },
            { text: '33 自主运行与自动队列', link: '/33-playbook-autonomy' },
            { text: '34 治理:把整个项目交给一个协调者', link: '/34-playbook-orchestrate' },
            { text: '35 接续与挂起', link: '/35-playbook-continuity' },
            { text: '36 计划与清理', link: '/36-playbook-plan-cleanup' }
          ]
        },
        {
          text: '第四部分 · 调度(2)',
          collapsed: false,
          items: [
            { text: '37 poteto-mode 与运行时', link: '/37-poteto-mode-runtime' },
            { text: '38 取舍与上手', link: '/38-tradeoffs-adoption' }
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
