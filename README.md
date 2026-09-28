<p align="center">
  <img src="site/assets/whale-girl-logo-dynamic.png" width="104" alt="鲸鱼娘标志" />
</p>

<h1 align="center">鲸鱼娘开源资产库</h1>

<p align="center">
  整理角色参考图、生成提示词和社区创作资源，让鲸鱼娘二创更加方便。<br />
  <a href="https://treapgogo.github.io/deepseek-whale-girl/">在线访问</a> ·
  <a href="https://treapgogo.github.io/deepseek-whale-girl/project.html">项目 FAQ</a> ·
  <a href="https://treapgogo.github.io/deepseek-whale-girl/contribute.html">贡献方式</a>
</p>

<p align="center">
  <a href="https://github.com/TreapGoGo/deepseek-whale-girl/actions/workflows/pages.yml"><img src="https://github.com/TreapGoGo/deepseek-whale-girl/actions/workflows/pages.yml/badge.svg" alt="GitHub Pages 部署状态" /></a>
</p>

本项目由社区自发维护，是围绕鲸鱼娘形象整理的非官方资源库，不代表深度求索公司或 DeepSeek 官方立场。鲸鱼娘是社区共同创作、不断变化的形象；本站提供参考，不设定唯一或标准化人设。

## 项目内容

- 角色设定图和可直接复制的生成提示词
- 鲸鱼娘相关的社区项目、工具与参考资料
- 社区二创作品与梗图画廊
- 面向非程序员的作品投稿、资源推荐和反馈入口

## 参与贡献

不需要会写代码，也可以参与共建。欢迎分享作品、推荐相关资源、指出错误或提出建议：

- [分享社区作品](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=community-artwork.yml)
- [推荐相关资源](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=resource-recommendation.yml)
- [反馈、纠错或补充](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=feedback.yml)

如果熟悉网页开发，也欢迎通过 Pull Request 改进网站。提交前请尽量说明改动目的，并在浏览器中检查页面显示和链接。

## 本地预览

需要安装 Python 3。在仓库根目录运行：

```bash
python -m http.server 4173 --directory site
```

然后访问 <http://localhost:4173>。修改 HTML、CSS 或 JavaScript 后刷新浏览器即可查看。

## 仓库结构

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/       # 社区作品、资源推荐和反馈表单
│   └── workflows/pages.yml   # 自动部署到 GitHub Pages
├── characters/               # 角色设定图和品牌素材的原始归档
└── site/                     # 网站源文件与部署目录
    ├── assets/                # 页面图片与社区画廊素材
    ├── index.html             # 首页与资源画廊
    ├── project.html           # 常见问题（FAQ）
    ├── contribute.html        # 贡献方式
    ├── styles.css             # 页面样式
    └── script.js              # 页面交互
```

推送到 `main` 分支后，GitHub Actions 会自动将 `site/` 部署到 GitHub Pages；也可以在仓库的 Actions 页面手动触发部署。

## 内容与许可

网站原创文字与生成提示词按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 共享。角色设定图、社区投稿及外部项目素材遵循各自作者或来源的授权说明；在使用图片前，请先核实对应许可。收录不代表本站拥有相关作品版权，也不代表获得再次使用授权。该许可不自动适用于网站源代码；目前仓库尚未为源代码单独声明许可证。

如认为网站展示的内容涉及侵权，请通过[反馈表单](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=feedback.yml)联系维护者。
