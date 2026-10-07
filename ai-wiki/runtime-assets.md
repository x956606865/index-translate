# 未入库资源与原始来源

初次导入来源：

- backend：`/Users/natsurei/Downloads /IndexTranslate-Windows`（Downloads 后有一个空格）。
- extension：`/Volumes/rei/chrome插件/chrome_index_translate_lan`。

保留这些来源作为原始运行资源和历史备份。本次仅复制选定代码，没有移动或删除来源文件，也没有把运行数据复制到新项目。

| 资源 | Git 策略与恢复注意 |
| --- | --- |
| backend/runtime/ | 排除；保存现有完整 Windows 私有 Python、CUDA/推理包、加速 .pth 和 Triton 工具。锁文件不足以一键恢复 |
| backend/models/ | 排除；翻译模型可来自既有目录或程序支持的模型源，按现有设置保留 |
| backend/speech/models/ | 排除权重、ONNX 和 cmvn.ark；实际运行 FireRedVAD 需要这三个配套资源。R2T2 支持在管理页选择现有 GGUF 目录 |
| backend/speech/.runtime/build-native-cu128/ | 排除原生 .pyd 和 DLL；需保留既有兼容 Windows 构建，源码仓库不提供原生重建工具链 |
| backend/data/ | 排除；包含服务身份、设置、配对、任务、日志和缓存，仅由用户保管 |
| speech/.runtime/worker.log、__pycache__/ | 排除；运行产物不迁入源码 |
| FILE-MANIFEST.json、归档.zip | 排除两端发行包清单和压缩归档；原清单包含大量未入库运行文件，不适用于新目录 |
| backend/T8IndexTranslate.exe | 唯一保留的 EXE，19,456 字节；源码和编译流程缺失，hash 见 SOURCE-IMPORT.json |
| backend/third-party-licenses/ | 从模型资源目录单独保留的原始许可文本；不包含模型内容 |

原始后端目录检查时未看到顶层 models；模型可能由用户在另一机器或目录配置，不能假设本机具有完整可用翻译权重。原 runtime 和 speech 原生资源仍在来源目录；本次没有运行或验证其完整性。

今后人工将审阅后的业务文件更新到 Windows 运行副本时，要保留上述排除资源。不要使用 `--delete` 或以 Git 文件清单清理运行目录。实际交付和部署只由用户手动执行。
