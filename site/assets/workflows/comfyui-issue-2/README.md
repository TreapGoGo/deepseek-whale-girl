# ComfyUI 鲸鱼娘文生图工作流

来源：[社区投稿 #2](https://github.com/TreapGoGo/deepseek-whale-girl/issues/2)，提交者 hyq13886640。提示词基于本站社区参考资料，不是官方或唯一人设。

本目录保存提交者的 6 份 API 格式 JSON，未改变生成参数。提交者报告于 2026-09-29 在 RTX 3050 8GB 上成功运行；维护者只验证了 JSON 结构、节点引用、种子与依赖文件名，没有进行 GPU 生图复测。

## 文件

| 形象 | 种子 | 文件 |
|---|---|---|
| Q 版 | 42 | chibi-seed42.json |
| Q 版 | 777 | chibi-seed777.json |
| Q 版 | 20260929 | chibi-seed20260929.json |
| 成熟比例 | 42 | mature-seed42.json |
| 成熟比例 | 777 | mature-seed777.json |
| 成熟比例 | 20260929 | mature-seed20260929.json |

`upstream-readme.md` 与 `upstream-deployment.md` 是投稿者原始说明的归档，含其本地环境示例，不应原样照搬路径或把其中的“官方提示词”视为官方声明。本站使用方法以本文件为准。

## 依赖

已运行的 ComfyUI 与匹配的 `TextEncodeQwenImage21` 节点；包内不包含模型、ComfyUI 或第三方节点安装器。

- diffusion_models/qwen_image_2.1_int8_convrot.safetensors
- text_encoders/qwen3vl_8b_int8_convrot.safetensors
- vae/qwen_image_2.1_vae_bf16.safetensors

采样节点使用 euler / simple、28 步、CFG 1；先生成 1024×1536，再放大至 1400×2048。模型与节点版本不匹配时可能报错，应以自己安装环境的节点接口为准。

## 提交一个任务

这些文件是 API 格式，不带可视化编辑器节点布局，不保证可直接拖入所有版本的界面。

先启动自己已配置好的本地 ComfyUI，然后在解压目录运行：

```bash
python submit.py chibi-seed42.json
```

默认只连接本机 `http://127.0.0.1:8188`，不向网站或其他远程服务发送任务。更换本地端口可用 `--server http://127.0.0.1:8189`。返回 `prompt_id` 只表示任务入队，不表示已经出图；结果查看 ComfyUI 页面或输出目录。

修改提示词：节点 `4` 的 `inputs.prompt`；随机种子：节点 `6` 的 `inputs.seed`；采样尺寸：节点 `5` 的 width/height；放大尺寸：节点 `8`。工作流中的负面提示是投稿者提供的生成参数，和首页通用角色描述是不同用途。

## 来源与许可

保留社区投稿及原始附件来源。网站代码的 MIT 不自动覆盖投稿素材或上游模型；本站原创提示词按仓库说明共享。模型、节点和投稿内容分别遵循其来源说明。如涉及侵权，请联系删除。
