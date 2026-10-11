# pstack 拆解

面向资深工程师的 pstack 精读系列。把 pstack 从原则到调度整台机器拆开讲清楚。

正文在 [`docs/`](./docs),用 VitePress 构建成一个静态站点,通过 GitHub Pages 发布。

## 本地预览

```bash
npm install
npm run docs:dev
```

打开终端里给出的本地地址即可。

## 构建

```bash
npm run docs:build
```

产物在 `docs/.vitepress/dist`。

## 发布

仓库推到 GitHub 后,在 Settings → Pages 里把 Source 设为 **GitHub Actions**。之后每次推送到 `main`,`.github/workflows/deploy.yml` 会自动构建并发布。

站点地址是 `https://<用户名>.github.io/<仓库名>/`。如果仓库名不是 `pstack-series`,记得把 `docs/.vitepress/config.mts` 里的 `base` 改成 `/<仓库名>/`;如果发布在用户主页仓库(`<用户名>.github.io`),改回 `'/'`。

## 写作约定

给继续写这个系列的人看,在 [`STYLE.md`](./STYLE.md)。读者可以略过。
