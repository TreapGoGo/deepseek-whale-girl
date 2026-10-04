# 鲸鱼娘（大肥鱼）文生图工作流

**来源**：提示词取自 [deepseek-whale-girl 开源资产库](https://github.com/TreapGoGo/deepseek-whale-girl)（本目录上一级已克隆）
**引擎**：ComfyUI（Qwen-Image 2.1，8G 显存量化版）
**首次运行**：2026-09-29，6/6 成功，单张约 2 分钟

## 工作流文件

`鲸鱼娘文生图_{角色}_{seed}.json`（ComfyUI API 格式）×6：
- 角色：`q版大肥鱼`（三头身 Q 版）/ `成熟比例鲸鱼娘`
- 种子：20260929 / 42 / 777

## 图结构

```
UNETLoader  qwen_image_2.1_int8_convrot.safetensors
CLIPLoader  qwen3vl_8b_int8_convrot.safetensors (type=qwen_image)
VAELoader   qwen_image_2.1_vae_bf16.safetensors
TextEncodeQwenImage21  ← 官方中文长提示词 + 通用负面
EmptyLatentImage 1024×1536 → KSampler(euler/simple, 28步, cfg=1)
→ VAEDecode → Lanczos 放大到 1400×2048 → SaveImage
```

## 用法

```bash
# 启动 ComfyUI 后（http://127.0.0.1:8188）：
python -c "import json,urllib.request; \
  wf=json.load(open('鲸鱼娘文生图_q版大肥鱼_seed42.json',encoding='utf-8')); \
  print(urllib.request.urlopen(urllib.request.Request( \
  'http://127.0.0.1:8188/prompt', json.dumps({'prompt':wf}).encode(), \
  {'Content-Type':'application/json'})).read())"
```

或在 ComfyUI 网页里加载 JSON 改种子/提示词再跑。
改提示词直接替换节点 "4" 的 `prompt` 字段即可（支持整段中文描述）。

## 产物

`../产物/` 与桌面 `鲸鱼娘二创/` 各存一份（1400×2048 PNG）。
