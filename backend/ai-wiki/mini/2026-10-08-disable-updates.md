# 禁用整合包代码更新

## 目标与实施结果

- [x] 自动更新、手动检查和手动安装全部禁用，后续由用户自行维护。
- [x] 保留 EXE 所需的 update.py auto/check/apply 兼容入口，打印禁用提示后正常退出。
- [x] 移除更新器中的联网、下载、解压、备份、替换文件及更新缓存逻辑。
- [x] start.cmd 直接进入原启动流程；update.cmd 只显示禁用提示。
- [x] 同步使用说明、知识库索引和文件校验清单。

## 原因与修复方式

原 start.cmd 在启动前执行 update.py auto；EXE 二进制字符串也包含 update.py 和 auto。原更新器每天最多检查一次 GitHub Release，发现新版本可覆盖应用代码，包括已有本地修复。update.cmd 和 update.py apply 另有手动安装入口，因此仅删除 start.cmd 中的调用不足以实现完全禁用。

现在更新器仅依赖标准库 argparse，接受原有三个参数并打印禁用提示，正常退出码为 0；不保留下载或安装函数。保留文件与参数协议供现有 EXE 继续调用。手动 CMD 无需启动 Python。

## 影响范围（Impact analysis）

业务修改限定为 update.py、start.cmd、update.cmd；文档同步 README.zh-CN.md、ai-wiki/INDEX.md、本记录及 FILE-MANIFEST.json。模型下载和推理依赖未改动；不启动服务、不安装依赖、不操作数据库、不修改 EXE。

## 可能回归点（Regression risks）

- 本地版本不会获得上游自动修复，后续改动由用户审阅并手动维护。
- 保留 EXE 调用协议且返回成功；Windows EXE 与 CMD 的实际启动仍需实机验证。
- 日后整包覆盖、还原旧文件或替换更新相关脚本，可能重新启用更新；维护时需保留本策略。
- 更新记录和已有备份保留原样；它们不会触发这个已禁用的更新器。

## 自测清单（Test checklist）

已执行：

- [x] 隔离执行旧 main 主路径，禁止数据写入的断言失败，未实际联网或写入数据。
- [x] 新 main 的 auto、check、apply 均正常返回并输出“更新已禁用”。
- [x] 检查更新器只保留 argparse 和 main，无下载或安装函数；三个真实命令行入口正常退出。
- [x] start.cmd 无更新器调用，原 launcher.py desktop 参数转发保持；update.cmd 只提示禁用。
- [x] 实际文件与候选文件逐字节一致；更新文件的 SHA-256、字节数和清单总字节数核对通过。

建议用户实机验证（未执行）：

- [ ] 同步本次三个业务文件到 Windows，分别通过 start.cmd 和 EXE 启动，确认翻译页面正常打开。
- [ ] 双击 update.cmd，或在命令行运行 runtime\python.exe update.py check/apply，确认只显示禁用提示。

未执行 Windows CMD/EXE、整合包服务或全量测试。本次使用隔离 Python 验证与静态启动入口检查。
