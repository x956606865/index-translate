# Index Translate · 个人修改维护版

> **原项目与作者：本仓库基于 T8（T8star-Aix / T8mars）的 [Comfyui-Index-Translate-T8](https://github.com/T8mars/Comfyui-Index-Translate-T8) 项目所提供的 Windows 后端和 Chrome 插件代码修改而来。感谢 T8 的原始开发与开源工作。**
>
> **这是由 [x956606865](https://github.com/x956606865) 独立维护、加入个人改动的衍生版本。此处新增的功能、修复和后续更新由本仓库维护者负责，不代表 T8 官方发布或认可。**

本仓库统一维护 Windows 后端与 Chrome 局域网插件，基于两端 0.1.20 的本地修改版建立，源码导入日期为 2026-10-08。导入的是已有本地运行副本中的选定源码，未继承上游完整 Git 历史，也未包含上游全部交付物；后续上游改动不会自动合入。

## 本维护版的主要改动

- 局域网连接与配对适配，保留本地 Triton、R2T2 回环通信、UTF-8 和 VAD 修复。
- Alt / Option 选中文字或鼠标所在段落的页内双语翻译。
- 当前页面临时锁定语音识别语言：默认 Auto，支持手动选择，暂停、拖动及重启识别时保留。
- 日语稳定识别短语提前提交与等待时限优化，实际延迟和准确率仍需实机验证。
- 后端与插件源码统一维护，保留实施记录与定向回归测试。

具体行为、验证范围及限制见 [项目能力](ai-wiki/project-capabilities.md) 与 [知识库索引](ai-wiki/INDEX.md)。

## 仓库内容

| 目录 | 内容 |
| --- | --- |
| `backend/` | Python 服务、WebUI、R2T2 语音桥接和 Windows 启动脚本 |
| `extension/` | 可加载的 Manifest V3 插件、页面/视频翻译和既有协议测试 |
| `ai-wiki/` | 统一维护知识库、接口说明、运行环境及本次导入记录 |
| `SOURCE-IMPORT.json` | 初次导入的来源、字节数与 SHA-256；它是历史快照，不随日常修改刷新 |

后端已禁用内置自动和手动代码更新，保留固定配对码、LAN Host 校验、Triton 工具路径、R2T2 回环通信、UTF-8 与 VAD 修复。插件保留现有 LAN 地址和重定向校验；它仍会查询上游并提示更新，不会自动安装。

## 开始维护

先读 [知识库索引](ai-wiki/INDEX.md)、[项目结构](ai-wiki/project-structure.md) 和 [环境配置](ai-wiki/deploy-and-config.md)。两端原有 README 和 ai-wiki 已保留，属于来源记录；当前维护方式以根知识库为准。

后端是源码副本，未携带 Python 运行时、模型、用户数据或原生语音库，不能仅克隆仓库就运行 Windows 整合包。唯一纳入 Git 的 EXE 是原有 19 KB 启动器，因当前源码中没有它的构建来源。原生运行环境的保存和恢复见 [资源说明](ai-wiki/runtime-assets.md)。

插件不需要打包：由用户在 Chrome 扩展页面开启开发者模式，加载 `extension/`。换目录可能导致扩展 ID 变化，需要重新配对。后端的实际同步、启动和部署由用户手动完成。

现有插件测试（已安装 Node 时）：

```sh
cd extension
node --experimental-default-type=module --test tests/protocol.test.mjs
```

这是局域网地址规则的定向单元测试，不证明 Windows 推理和真实浏览器联调成功。本仓库不新增依赖安装流程、CI 或自动部署。

## 许可与来源

- 直接来源：[T8mars / Comfyui-Index-Translate-T8](https://github.com/T8mars/Comfyui-Index-Translate-T8)，原作者 T8 / T8star-Aix。
- 原项目使用的 Index-Translate 模型与相关格式来自 [IndexTeam / bilibili](https://github.com/bilibili/Index-Translate)；原有归属信息继续保留。
- 保留 [后端 LICENSE](backend/LICENSE)、[后端 NOTICE](backend/NOTICE)、[插件 LICENSE](extension/LICENSE)、[插件 NOTICE](extension/NOTICE) 和 [第三方声明](backend/THIRD_PARTY_NOTICES.json)。模型许可另存于 `backend/third-party-licenses/`，不包含模型权重。

源码、模型与原生库分别适用随附的许可和声明。本维护版的修改说明不替代原作者署名或第三方许可。
