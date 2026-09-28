# 鲸鱼娘开源资产库

这是一个由社区维护的鲸鱼娘二创资产库，为创作提供参考图、生成提示词、社区作品和相关项目入口。本项目为社区自发行为，不代表深度求索公司或 DeepSeek 官方立场；网站不设定唯一或标准化人设。

## 在线访问

https://treapgogo.github.io/deepseek-whale-girl/

## 本地预览

在仓库根目录运行：

~~~powershell
python -m http.server 4173 --directory site
~~~

然后打开 <http://localhost:4173>。

## 项目结构

- site/index.html：首页、提示词、参考图、项目宗旨、友情链接与社区画廊
- site/project.html：常见问题（FAQ）
- site/contribute.html：面向所有社区成员的贡献方式
- site/assets/：网页使用的角色设定图和社区作品
- site/assets/gallery/：画廊图片
- characters/：角色设定图原始归档
- .github/ISSUE_TEMPLATE/：无需提交代码的网页投稿表单
- .github/workflows/pages.yml：将 site/ 部署到 GitHub Pages

## 投稿

不需要会写代码。可以通过网站的“贡献方式”页面提交作品、推荐相关项目，或反馈问题。请尽可能注明作者、来源与授权；不确定授权时如实说明即可，不会默认视为开放授权。

网站原创文字与提示词采用 CC BY-SA 4.0。画廊作品的具体来源和许可请以作者及原始页面为准；本站收录不代表所有作品都可自由转载或改作。
