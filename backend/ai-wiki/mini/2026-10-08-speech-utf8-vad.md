# R2T2 UTF-8 边界与 VAD CPU 开销修复

## 目标与实施结果

- [x] 直接修改原整合包，处理流式 token 截在 UTF-8 多字节字符中间的情况。
- [x] VAD 使用 2 个算子内计算线程，顺序执行，关闭线程自旋。
- [x] 保持原有 320 ms 流式节奏、语音分段、8 个 ASR CPU 线程和 GPU 配置。
- [x] 对实际文件执行隔离验证，并同步校验清单与知识库索引。

## 现象、根因与修复思路

用户在 i9-14900K / RTX 5080 上实时语音识别时 CPU 持续满载，并遇到 Worker 400 INVALID_INPUT：utf-8 unexpected end of data。

流式生成每次仅允许少量 token，且回退时按 token 切分。字节 token 可能切开中文字符。原生库转 Python 字符串时可抛 UnicodeDecodeError；原回退逻辑只检查替换字符，来不及处理直接抛出的异常。该异常又属于 ValueError，因而被 worker 统一映射成 INVALID_INPUT。已用实际 Python 流式方法及模拟的字节 token 原生后端复现；现有日志无本次完整堆栈，不能证明截图唯一触发点。

native.py 对严格 UTF-8 尾部截断，在同一输入和提示词上逐次增加生成预算，最多增加 3 个 token、最多重试 3 次，且总预算不超过 4096。每次重跑原生生成，不是复用一次生成的缓存；成功后保留原生返回字典及结束原因。streaming.py 在回退碰到同类截断时继续减少 token，直到完整字符边界。其他编码错误继续抛出，避免静默吞掉损坏数据。

VAD 原来固定在 CPU 上执行，未限制 ONNX Runtime 线程数或配置自旋。现在通过 SessionOptions 限制 intra_op_num_threads=2、inter_op_num_threads=1、ORT_SEQUENTIAL，并将 intra_op/inter_op 的 allow_spinning 设为 0。此设置针对每个 VAD session，不是将整个程序限制为两个线程。

## 影响范围（Impact analysis）

| 文件 | 修改 |
| --- | --- |
| speech/r2t2_core/native.py | 原生生成返回尾部不完整 UTF-8 时有界重试 |
| speech/r2t2_core/streaming.py | 回退到完整 UTF-8 字符边界 |
| speech/r2t2_core/vad.py | VAD 线程与自旋设置 |

另同步 ai-wiki/INDEX.md、本记录及 FILE-MANIFEST.json。未修改模型、原生二进制、语音内部回环、主服务局域网访问、配对或已有数据，未安装依赖。

## 可能回归点（Regression risks）

- 仅在尾部截断异常出现时重跑生成，可能短暂增加该轮计算时间和最多 3 个 token 的输出预算；不保证三次内解决所有原生库异常，达到上限仍报错。
- 正确字符边界可能要求回退更多 token；已有稳定文本保护逻辑保持不变。
- 限制 VAD 线程和关闭自旋可能增加单次 VAD 延迟，需要实测实时处理是否跟得上音频。
- 没有测得本机实际 CPU 降幅，也未验证 GPU 实际卸载情况；持续高占用可能还涉及原生 ASR、整段音频重复识别或其他进程。

## 自测清单（Test checklist）

已执行：

- [x] 修改前主路径失败，复现原生生成遇到半个中文字符时的 unexpected end of data。
- [x] 加入 UTF-8 修复后，中文预览和稳定文本断言通过；未加 VAD 配置时同一验证仍失败，证明旧线程配置未满足要求。
- [x] 完整修改后两项隔离测试通过：实际 StreamingSession.feed 和 NativeQ8Engine 方法在模拟字节 token 后端下生成完整预览“你好”和稳定文本“你”；原生调用预算由 4、5 增至 6，保留 finish_reason；实际 VAD 初始化代码向模拟 ORT 传递线程及自旋选项。
- [x] 无效起始字节继续抛错，生成不重试，回退不吞掉错误。
- [x] 实际写入的三个文件与验证候选一致，Python 语法检查通过，清单字节数和 SHA-256 已核对。

建议用户实机验证（未执行）：

- [ ] 将三个业务文件及 FILE-MANIFEST.json 同步到 Windows，手动完全停止并重启整合包。
- [ ] 对同一段含中文的视频开启语音识别，检查是否仍出现 UTF-8 报错、稳定字幕是否丢字或回改。
- [ ] 对比相同视频、相同识别时段的 worker CPU 占用与字幕延迟；启动时的加载峰值不计入持续识别对比。
- [ ] 若仍满载，记录占用最高的进程与 GPU CUDA/Compute 使用率，再定位其他计算开销。

未启动 Windows 原生库、GPU、ONNX 模型、服务或数据库。测试使用实际 Python 方法和模拟原生/ORT 后端，不能代替实机语音和性能验证。

## 资料

- [ONNX Runtime 线程与自旋配置](https://onnxruntime.ai/docs/performance/tune-performance/threading.html)
- [pybind11 字符串与 UTF-8 转换](https://pybind11.readthedocs.io/en/stable/advanced/cast/strings.html)
