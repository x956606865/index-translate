# 项目结构

| 路径 | 职责与关键入口 |
| --- | --- |
| backend/start.cmd、launcher.py、T8IndexTranslate.exe | Windows GUI 启动、服务进程归属判断和停止；EXE 只保留现有二进制 |
| backend/run.py | 配置便携 Triton 工具，加载 Uvicorn，默认监听 0.0.0.0:8098 |
| backend/app/server.py | FastAPI 路由、Host/Origin/身份边界、WebUI 静态文件 |
| backend/app/state.py | 设置、配对、翻译队列、取消、模型状态与数据持久化 |
| backend/app/speech_service.py | 扩展 owner 与语音 session 生命周期 |
| backend/_vendor/index_translate_core/ | 已随包提供、需纳入版本控制的模型目录、下载和推理/加速源码 |
| backend/speech/bridge.py | 管理独立 worker、日志与 127.0.0.1 内部通信 |
| backend/speech/r2t2_core/ | worker、原生 ASR 适配、流式分段与 VAD |
| backend/web/ | 后端管理页面、配置与模型预热 |
| extension/manifest.json | MV3 权限、后台模块、内容脚本与页面入口 |
| extension/background.js、protocol.js | 配对、API 调用、地址和结果校验、任务管理、更新提示 |
| extension/content.js、video.js | 网页正文和视频字幕交互 |
| extension/offscreen.js、audio-worklet.js | 页签音频采集与音频分块 |
| extension/video_jobs.js、speech_phrases.js、cache.js | 视频任务、语音文本和缓存 |
| extension/options.*、popup.* | 设置和弹出页面 |
| extension/tests/protocol.test.mjs | 既有 LAN 地址接受/拒绝测试 |

两端原来的目录内部布局保持不变。后端路径以自身文件位置解析，因此统一仓库增加 `backend/` 层不要求改业务代码。不存在 npm 构建配置、完整 Python 项目安装配置或 EXE 构建源码；不能假设能在 macOS 运行 Windows 原生后端。
