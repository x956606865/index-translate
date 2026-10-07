# R2T2 内部通信地址修复

## 目标与实施结果

- [x] 直接修复原整合包中的 speech/bridge.py 与 speech/r2t2_core/worker.py，共三处地址。
- [x] 语音进程端口探测、内部 HTTP 请求、语音 worker 监听统一为 127.0.0.1。
- [x] 保留主服务 0.0.0.0 监听、全部 RFC1918 局域网 Host 支持及固定配对规则。
- [x] 同步 FILE-MANIFEST.json 和 ai-wiki/INDEX.md。

## 现象、根因与当前修复

用户报告 R2T2 的 soxr 缺失错误，但在实际 K 盘整合包的 runtime/python.exe 中导入 soxr 成功。补充的 speech/.runtime/worker.log 开头仅有一次缺包堆栈，来自 D:\Index-Translate 路径；其后有 378 次成功解码。因此该日志不足以证明当前 K 盘环境仍缺少 soxr，本次不安装或重装依赖。

检查另发现，内部请求被改成 http://0.0.0.0:<port>。0.0.0.0 是监听通配地址，不应作为 Windows 内部连接目标。speech/bridge.py 将两个地址还原为 127.0.0.1 后，其字节哈希与原始文件清单一致，证实该文件曾被统一替换地址。worker.py 保留其余现有内容，仅恢复监听地址。

本次修复主服务与语音子进程之间的本机通信；这是已确认的独立地址问题，不代表该地址会引起 Python 缺模块错误。

## 影响范围（Impact analysis）

| 文件 | 变化 |
| --- | --- |
| speech/bridge.py | _port 的临时端口绑定与 _request 的 URL 恢复为 127.0.0.1 |
| speech/r2t2_core/worker.py | web.run_app 的监听地址恢复为 127.0.0.1 |

除两个业务文件外，仅更新知识库与文件校验清单。保持原文件换行格式。不修改令牌校验、解释器选择、依赖、语音模型及数据库。run.py、app/server.py、app/state.py 的文件哈希与修复前完全一致。

## 可能回归点（Regression risks）

- 语音 worker 仅接受同机通信；浏览器继续通过主服务访问语音功能。直接访问 worker 端口的外部脚本不再能连接。
- R2T2_WORKER_PYTHON 的现有覆盖逻辑保持不变；若当前运行仍出现 soxr 缺失，应核对新一轮日志与实际 worker 解释器。
- 尚未在 Windows 执行真实语音识别、CUDA 原生库加载或浏览器联调。

## 自测清单（Test checklist）

已执行：

- [x] 对原源码进行单一路径隔离检查，复现端口绑定、请求目标与监听均为 0.0.0.0 的错误。
- [x] 修改后对实际文件执行相同检查：三处均为 127.0.0.1，端口一致，Authorization 令牌仍被附加。
- [x] 两个 Python 文件语法检查通过，实际文件与已验证候选字节一致。
- [x] 主服务、LAN Host 与配对文件哈希不变。
- [x] 核对 FILE-MANIFEST.json 中本次变更条目的字节数与 SHA-256。

建议用户实机自测（未执行）：

- [ ] 将 speech/bridge.py、speech/r2t2_core/worker.py 与 FILE-MANIFEST.json 同步到 Windows 整合包。
- [ ] 手动完全停止并重启整合包，再开启一段短视频的语音识别。
- [ ] 确认局域网设备仍能经主服务使用翻译与语音功能。
- [ ] 若仍失败，提供新追加的 speech/.runtime/worker.log 和主服务本次错误信息；不要仅依据日志开头的历史 soxr 报错判断。

隔离检查提取实际源码方法，模拟 socket、HTTP 和 web.run_app；没有打开监听端口、启动语音进程、模型或数据库，也没有安装依赖。

参考：[Microsoft Winsock connect 文档](https://learn.microsoft.com/windows/win32/api/winsock2/nf-winsock2-connect)。
