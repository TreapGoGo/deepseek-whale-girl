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
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>

本项目由社区自发维护，是围绕鲸鱼娘形象整理的非官方资源库，不代表深度求索公司或 DeepSeek 官方立场。鲸鱼娘是社区共同创作、不断变化的形象；本站提供参考，不设定唯一或标准化人设。

## 项目内容

- 角色设定图和可直接复制的生成提示词
- 鲸鱼娘相关的社区项目、工具与参考资料
- 社区二创作品与梗图画廊
- 面向非程序员的作品投稿、资源推荐和反馈入口
- [社区 ComfyUI 工作流](https://treapgogo.github.io/deepseek-whale-girl/workflows.html)：6 份文生图任务、依赖说明与投稿测试图
- 纯人工作品的“能工智人古法手搓专区”，保留作者署名

## 参与贡献

不需要会写代码，也可以参与共建。欢迎分享作品、推荐相关资源、指出错误或提出建议：

- [分享社区作品](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=community-artwork.yml)
- [推荐相关资源](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=resource-recommendation.yml)
- [反馈、纠错或补充](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=feedback.yml)

如果熟悉网页开发，也欢迎通过 Pull Request 改进网站。提交前请尽量说明改动目的，并在浏览器中检查页面显示和链接。

作品请直接上传图片附件，不要只提供聊天分享链接。投稿由维护者整理后随网站发布，不会即时自动出现；收录结果或需要补充的信息会在原 issue 回复。转载请填写原作者，未知时如实标注。

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
    ├── workflows.html         # 社区工作流下载与说明
    ├── styles.css             # 页面样式
    └── script.js              # 页面交互
```

推送到 `main` 分支后，GitHub Actions 会自动将 `site/` 部署到 GitHub Pages；也可以在仓库的 Actions 页面手动触发部署。

画廊的作品信息集中保存在 [`site/assets/gallery/manifest.json`](site/assets/gallery/manifest.json)，包含作者、来源、创作类型、尺寸和投稿链接。预览图与完整尺寸下载分开加载；没有 JavaScript 时仍可查看静态图片链接。新增素材后运行 `python tools/build_gallery.py` 更新首页静态画廊，并运行 `python tools/validate_site.py` 检查本地链接、图片尺寸与工作流结构。

## 代码、内容与素材许可

本仓库网站源代码按 [MIT License](LICENSE) 授权。网站原创说明文字与生成提示词按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 共享。

角色设定图、社区投稿及外部项目素材不包含在上述代码许可中，分别遵循其作者或来源的授权说明；在使用图片前，请先核实对应许可。收录不代表本站拥有相关作品版权，也不代表获得再次使用授权。如某个文件另有许可说明，以该文件说明为准。

如认为网站展示的内容涉及侵权，请通过[反馈表单](https://github.com/TreapGoGo/deepseek-whale-girl/issues/new?template=feedback.yml)联系维护者。

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=TreapGoGo/deepseek-whale-girl&type=Date)](https://www.star-history.com/#TreapGoGo/deepseek-whale-girl&Date)
