# 两端接口与联调边界

| 环节 | 插件/客户端 | 后端 |
| --- | --- | --- |
| 服务地址 | protocol.js endpoint 校验 HTTP、私有 IPv4/回环、无用户信息/额外路径/查询，端口至少 1024 | run.py 监听 0.0.0.0；server.py Host 限制当前端口与回环/RFC1918 |
| 配对 | background.js 向 /api/pair 发送六位 code 与扩展 ID | app/state.py 校验固定码，返回配对凭据；错误次数受限 |
| 身份 | 保存 token/identity，调用前确认 /api/status；业务 fetch 拒绝重定向 | Bearer token 与扩展 Origin 校验；支持 expected_identity/X-Expected-Identity |
| 翻译 | POST /api/jobs，GET/DELETE /api/jobs/{id}，请求撤销和优先级管理 | state 管理队列、owner、结果、取消与模型 |
| 语音 | POST /api/speech/start、/{sid}/feed、finish、cancel；音频序号/采样水位 | speech_service 管理 session，bridge 到回环 worker，ASR 稳定文本再进入翻译 |
| 回写 | verifyResults 校验 id、source_hash、占位符及数量 | 每段返回对应原文身份和完成状态 |

管理接口另含 /api/settings、/api/models、/api/verify、/api/warmup、/api/unload、/api/download 和语音模型设置。这些管理能力不代表远程 WebUI 被放开；本机 UI 仍校验 session 和回环 Origin。

用户联调顺序：在 Windows 本机管理页确认服务 → 插件配置真实 LAN 地址和配对码 → 检查连接 → 小段网页翻译 → 已有字幕视频 → 声音识别。后两步依赖原生资源和模型，协议单元测试不覆盖这些行为。

本次没有启动服务或浏览器联调。换扩展目录或丢失运行 data 都可能改变配对关系；身份不匹配时应重新配对，不绕过校验。

## 页面识别语言

`POST /api/speech/start` 接受可选 JSON `{"language":"Japanese"}`。无 body、`{}` 或省略 language 时保持 `Auto`。允许值为 `Auto`、`Chinese`、`English`、`Cantonese`、`Japanese`、`Korean`、`German`、`French`、`Russian`、`Portuguese`、`Spanish`、`Italian`；未知语言及额外字段按严格请求模型拒绝。响应在原 `session_id`、`sample_rate` 上增加 `language`，服务层在任何会话取消/启动前再次检查语言。

插件将当前页面选择传入首次启动、seek/语言变更重启和九分钟续接。首次模型加载中改选语言会取消过期启动结果，再用最新语言启动。明确指定语言时必须收到同值确认，否则取消返回的会话并提示更新后端；Auto 允许旧后端没有此响应字段。选择保存在内容脚本内存，不经过持久化偏好；刷新、pagehide、URL 改变清除，页面切换后拒绝旧弹窗写入。

FastAPI 请求体依据：Context7 本次解析请求失败，回退核对 [官方请求体文档](https://fastapi.tiangolo.com/tutorial/body/)。本机缺少 FastAPI/Pydantic，未启动 HTTP 服务；语言透传和无效参数隔离已用标准库替身测试，真实 HTTP 校验仍待用户实机验证。
