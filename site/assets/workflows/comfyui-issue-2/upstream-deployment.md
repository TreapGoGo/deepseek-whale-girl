# 鲸鱼娘（大肥鱼）文生图工作流 · 部署说明方案

**版本**：2026-09-29 · 首次部署已验证（6/6 出图成功）
**适用机器**：NVIDIA RTX 3050 8GB（≥8G 显存的 NVIDIA 卡均可参考）
**本目录结构**：

```
⑤大肥鱼资产\
├─ deepseek-whale-girl\   开源资产库克隆（提示词与设定图来源）
├─ 工作流\                6 个工作流 JSON + 本说明
└─ 产物\                  已生成图片（1400×2048 PNG ×6）
```

---

## 一、方案概述

用本地 ComfyUI 跑 **Qwen-Image 2.1 文生图**（8G 显存量化版），
输入资产库官方中文提示词，输出鲸鱼娘立绘。

**技术选型理由**：

| 项 | 选择 | 理由 |
|---|---|---|
| 生图模型 | `qwen_image_2.1_int8_convrot` | int8 量化约 7 GB 级，8G 卡可跑；原生理解中文长提示词，无需翻译成 danbooru 标签 |
| 文本编码器 | `qwen3vl_8b_int8_convrot` | 与生图模型配套，`type=qwen_image` |
| VAE | `qwen_image_2.1_vae_bf16` | 官方配套 |
| 分辨率策略 | 1024×1536 采样 → Lanczos 放大 1400×2048 | 采样分辨率是显存大头，放大代价几乎为零 |
| 采样参数 | euler / simple / 28 步 / **cfg=1** | Qwen-Image 推荐；cfg=1 时负面不参与采样 |

## 二、前置条件

### 2.1 软件

- **ComfyUI**
  - 运行用它的 venv：`.venv\Scripts\python.exe`（standalone-env 里没有 torch，别用错）
- 无需其他依赖；提交任务走 HTTP API，浏览器都不用开

### 2.2 模型

| 子目录 | 文件 |
|---|---|
| `diffusion_models\` | `qwen_image_2.1_int8_convrot.safetensors` |
| `text_encoders\` | `qwen3vl_8b_int8_convrot.safetensors` |
| `vae\` | `qwen_image_2.1_vae_bf16.safetensors` |

### 2.3 模型路径打通（关键）
`ComfyUI\extra_model_paths.yaml`：

```yaml
comfyui_shared:
  base_path: E:\model\ComfyUI-Shared\models
  is_default: true
  checkpoints: checkpoints
  text_encoders: text_encoders
  vae: vae
  diffusion_models: diffusion_models
  ...
```

新机器部署时把 `base_path` 改成自己的模型库根路径即可。

## 三、部署步骤（从零到出图）

### 步骤 1 · 启动 ComfyUI 服务

```powershell
cd C:\Users\YourName\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI
.venv\Scripts\python.exe main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch
```

等到日志出现 `To see the GUI go to: http://127.0.0.1:8188`（本机实测约 40 秒）。
验证：浏览器打开 `http://127.0.0.1:8188` 或 `curl http://127.0.0.1:8188/system_stats`。

> 注意：不要用 ComfyUI Desktop 桌面快捷方式与本脚本同时跑，端口会冲突。
> 若 8188 被占，换 `--port 8189` 并同步改后面命令里的端口。

### 步骤 2 · 提交工作流

每个 JSON 就是一个完整任务（API 格式）。批量提交：

```bash
cd "E:\工程代码\5.workflow\⑤大肥鱼资产\工作流"
for f in 鲸鱼娘文生图_*.json; do
python -c "
import json,urllib.request,sys
wf=json.load(open(sys.argv[1],encoding='utf-8'))
r=urllib.request.urlopen(urllib.request.Request(
  'http://127.0.0.1:8188/prompt',
  json.dumps({'prompt':wf}).encode(),{'Content-Type':'application/json'}))
print(sys.argv[1],'->',json.loads(r.read())['prompt_id'])" "$f"
done
```

单个提交把文件名换掉即可。任务进入队列后依次执行，
**首张含模型加载约 3 分钟，之后每张约 2 分钟**。

### 步骤 3 · 取产物

图片落在 ComfyUI 输出目录（文件名前缀 `whale_girl_*`）：

```
C:\Users\YourName\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\output\
```

复制到本目录归档：

```bash
cp ".../output/whale_girl_*.png" "E:\工程代码\5.workflow\⑤大肥鱼资产\产物\"
```

### 步骤 4（可选）· 用网页界面改着玩

浏览器打开 `http://127.0.0.1:8188` → 把工作流 JSON 直接拖进页面 →
改种子/提示词 → Queue。JSON 是 API 格式，网页可正常加载编辑。

## 四、工作流参数速查

| 想改什么 | 改哪里 |
|---|---|
| 提示词 | 节点 `"4"`（TextEncodeQwenImage21）的 `prompt`，支持整段中文 |
| 种子 | 节点 `"6"`（KSampler）的 `seed` |
| 步数/质量 | `"6"` 的 `steps`（20~30 合理，越大越慢） |
| 竖版/横版 | `"5"`（EmptyLatentImage）的 `width/height`（总和约 2M 像素内），同步改 `"8"` 的目标尺寸 |
| 负面生效 | `"6"` 的 `cfg` 调到 2.5 左右（cfg=1 时负面被跳过，这是正常行为） |
| 批量张数 | `"5"` 的 `batch_size`（8G 卡建议保持 1，靠多种子排队更稳） |

**提示词来源**：`deepseek-whale-girl\site\index.html` 里的官方两段
（Q 版大肥鱼 / 成熟比例鲸鱼娘），本目录工作流已内置。
二创改写时保留"鲸鳍耳、鲸尾、女仆装、蓝白渐变发色"等核心特征词即可保持角色一致性。

## 五、常见故障排查

| 症状 | 原因与处置 |
|---|---|
| 提交返回 400 `required_input_missing` | 工作流 JSON 与 ComfyUI 版本节点参数不匹配（如旧版 `ImageScale` 缺 `crop`）。看返回体里 `node_errors` 指哪个节点，按提示补参数 |
| 提交返回 200 但卡住不动 | 首次加载模型确实要几分钟；查 `curl http://127.0.0.1:8188/queue` 看 `queue_running` |
| `ValueError: No module named 'torch'` | 用错了解释器——必须用 `.venv\Scripts\python.exe`，不是 `standalone-env\python.exe` |
| 报模型文件找不到 | 检查 `extra_model_paths.yaml` 的 `base_path` 和三个模型文件是否在位（见 2.2） |
| CUDA out of memory | 确认用的是 int8 模型而非 bf16；关掉其他占显存的程序（Ollama 常驻约 7 GB，跑图前先 `taskkill //IM ollama.exe //F`） |
| 出图带 `<think>` 或乱码文字 | Qwen-Image 偶发，换个种子重跑 |

## 六、本机已验证的部署记录

- 2026-09-29：6 个工作流（2 角色 × 3 种子）全部出图成功，
  单张 ~120 秒（含 Lanczos 放大），产物见 `产物\` 与桌面 `鲸鱼娘二创\`。
- 参考设定图：`deepseek-whale-girl\characters\dafeiyu\reference-sheets\`
  （chibi 版 / mature 版各一张），可用于对照验收。
