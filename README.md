# Index Translate 自维护项目

统一维护 Windows 后端与 Chrome 局域网插件。基于两端 0.1.20 的本地修改版建立；源码导入日期为 2026-10-08。

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

保留两端的 LICENSE、NOTICE 和后端 THIRD_PARTY_NOTICES.json；模型许可额外存放在 `backend/third-party-licenses/`，不包含模型权重。源码、模型、原生库各自适用已有许可，导入不改变许可。
