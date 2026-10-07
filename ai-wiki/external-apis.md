# 外部服务与第三方依赖

以下按导入的源码和随包元数据记录；本次未访问远端、重新解析依赖或验证上游最新版本。

| 服务/组件 | 当前用途与依据 |
| --- | --- |
| GitHub Releases | extension/background.js 查询 T8mars/Comfyui-Index-Translate-T8 最新版本并提示；后端 update.py 已不联网 |
| ModelScope / Hugging Face | backend/_vendor/index_translate_core/model-catalog.json 固定模型 URL、revision、大小和 hash；models.py 下载/校验 |
| Chrome Extensions API | MV3 storage、scripting、alarms、tabCapture、offscreen；minimum_chrome_version 为 120 |
| FastAPI / Uvicorn / Pydantic | 本地 HTTP 服务、输入验证；随包锁文件记录版本 |
| PyTorch / Transformers / Triton | 翻译推理和 Windows 加速；ACCELERATION-DEPS.json 记录 PyTorch 2.10.0+cu128、Python 3.12.14 和 Triton Windows 等随包版本 |
| R2T2 native / ONNX Runtime | ASR 原生库、FireRedVAD；speech 目录保留源码适配与许可 |

公开模型和 Release 请求未配置外部服务密钥；本地 API 使用配对 token，服务 identity 用于识别运行副本变化。插件业务 fetch 禁止 HTTP 重定向；更新查询是独立入口。请求限制、超时和重试应以当前代码为准，不推导远端配额。

已有参考链接：

- 上游项目：https://github.com/T8mars/Comfyui-Index-Translate-T8
- R2T2 来源：https://github.com/T8mars/comfyui-confucius-r2t2-t8
- Chrome 跨域请求：https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- Chrome CSP：https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
- ONNX Runtime 线程：https://onnxruntime.ai/docs/performance/tune-performance/threading.html
- pybind11 字符串：https://pybind11.readthedocs.io/en/stable/advanced/cast/strings.html

修改第三方调用前按项目规则查询当前权威资料；本页链接是导航，不表示本次重新验证了远端内容。
