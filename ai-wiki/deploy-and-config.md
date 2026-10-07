# 运行、配置与人工交付

## 源码与运行副本

本仓库用于开发维护。Windows 整合包依赖未入库的 runtime、翻译模型、speech/models 和 speech/.runtime/build-native-cu128，见 [资源说明](runtime-assets.md)。当前机器是 macOS，不执行 Windows 服务、部署或模型加载。

用户人工交付时，应先停止运行副本并备份，再将审阅过的 `backend/` 业务文件按相对路径同步到整合包根目录；保留该运行副本的 runtime、models、data 和 speech 原生资源。不要使用删除目标多余文件的镜像同步。不要把整个仓库根目录覆盖到整合包根目录。

资源齐备后，用户在 Windows 双击 start.cmd 或 T8IndexTranslate.exe，管理页访问 http://127.0.0.1:8098；stop.cmd 停止本包服务。插件连接 Windows 机器真实 LAN IPv4，例如 http://192.168.1.20:8098。管理 WebUI 的写操作仍使用本机 Origin，远程插件通过配对 token 访问。

用户在 Chrome 加载 `extension/`，新目录可能改变扩展 ID，需要重新配对。现有配对信息位于浏览器存储和运行副本 data 中，不随仓库复制。

## 已观察到的配置

| 名称/入口 | 作用与默认值 |
| --- | --- |
| INDEX_TRANSLATE_PAIR_CODE | 六位数字配对码，默认 246810；由 app/state.py 校验 |
| --port | launcher.py/run.py 默认 8098，范围 1024–65535 |
| CC、CUDA_PATH | Windows 启动时由 run.py 指向本包 Triton tcc 和 NVIDIA 资源，并检查文件 |
| R2T2_WORKER_PYTHON | 可指定 worker Python；默认 sys.executable |
| R2T2_WORKER_TOKEN | bridge 为子进程临时生成的凭据，不手填、不记录、不提交 |
| HF_HUB_DISABLE_TELEMETRY、DO_NOT_TRACK | 默认设为 1 |
| HF_HUB_OFFLINE、TRANSFORMERS_OFFLINE | run.py --offline 时设为 1 |

已知限制：当前 run.py 的 --offline socket audit hook 没有拒绝连接的逻辑，监听仍为 0.0.0.0；不能将此参数视为完整断网或仅回环访问保证。本次只记录已观察到的代码，不更改该行为。

requirements.lock.txt 是原运行时依赖快照，其中含本机 file:/// wheel 路径，并依赖额外的加速 .pth 激活；不是已验证的跨平台一键安装方案。不要直接 pip/uv 覆盖现有 runtime；安装依赖需单独明确授权。

## 定向验证

在 extension 下运行：`node --experimental-default-type=module --test tests/protocol.test.mjs`。后端可只做 Python AST 语法检查，不 import 或启动服务。Windows、GPU、真实 Chrome 配对及声音采集由用户实机验证。

本仓库未配置 CI/CD、容器或自动发布；部署和发布只由用户手动执行。没有数据库迁移任务；JSON 数据文件也不得在验证中触碰真实运行副本。
