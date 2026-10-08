# 统一项目知识库索引

根知识库说明当前维护方式；组件内 ai-wiki 保留历史实施证据。维护前先读项目结构、环境配置和相关历史修复。

| 文档 | 用途与何时更新 |
| --- | --- |
| [INDEX.md](INDEX.md) | 全部根知识库及组件记录入口；增改文档时同步 |
| [project-structure.md](project-structure.md) | 目录、模块及入口；代码组织变化时更新 |
| [project-capabilities.md](project-capabilities.md) | 产品能力与当前边界；行为变化时更新 |
| [deploy-and-config.md](deploy-and-config.md) | 环境、配置、定向验证与人工交付；运行方式变化时更新 |
| [external-apis.md](external-apis.md) | 外部服务、依赖依据与文档导航；接口变化时更新 |
| [conventions.md](conventions.md) | 开发和版本控制约定；维护规则变化时更新 |
| [integration.md](integration.md) | 两端协议和联调边界；接口/鉴权变化时更新 |
| [runtime-assets.md](runtime-assets.md) | 未入库资源、来源与恢复限制；资源布局变化时更新 |
| [ddl/README.md](ddl/README.md) | 数据结构说明约定；仅用户执行数据库变更 |
| [feature/README.md](feature/README.md) | 功能专项记录的创建条件 |
| [fix/README.md](fix/README.md) | 修复专项记录的创建条件 |
| [workstreams/WORKSTREAMS.md](workstreams/WORKSTREAMS.md) | 阶段计划索引；建立或归档 workstream 时更新 |
| [workstreams/ACTIVE_WORKSTREAM.md](workstreams/ACTIVE_WORKSTREAM.md) | 当前指针；目前 NONE |
| [mini/2026-10-08-repository-init.md](mini/2026-10-08-repository-init.md) | 本次初始化范围、风险和验证记录 |
| [mini/2026-10-08-local-translation.md](mini/2026-10-08-local-translation.md) | Alt 选区/悬停段落翻译、页内双语呈现的实现与验证记录 |
| [mini/2026-10-08-page-speech-language.md](mini/2026-10-08-page-speech-language.md) | 当前页面语音识别语言临时锁定、后端协议与验证记录 |
| [mini/2026-10-08-japanese-speech-latency.md](mini/2026-10-08-japanese-speech-latency.md) | 日语语音译第一版：短语提前发送、等待时限、定时任务隔离与实机对比清单 |
| [backend/ai-wiki/INDEX.md](../backend/ai-wiki/INDEX.md) | backend 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [backend/ai-wiki/mini/2026-10-07-fixed-pairing.md](../backend/ai-wiki/mini/2026-10-07-fixed-pairing.md) | backend 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [backend/ai-wiki/mini/2026-10-07-speech-loopback.md](../backend/ai-wiki/mini/2026-10-07-speech-loopback.md) | backend 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [backend/ai-wiki/mini/2026-10-07-triton-toolchain.md](../backend/ai-wiki/mini/2026-10-07-triton-toolchain.md) | backend 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [backend/ai-wiki/mini/2026-10-08-disable-updates.md](../backend/ai-wiki/mini/2026-10-08-disable-updates.md) | backend 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [backend/ai-wiki/mini/2026-10-08-speech-utf8-vad.md](../backend/ai-wiki/mini/2026-10-08-speech-utf8-vad.md) | backend 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [extension/ai-wiki/INDEX.md](../extension/ai-wiki/INDEX.md) | extension 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |
| [extension/ai-wiki/mini-plans/MINI-2026-10-07-lan-pairing.md](../extension/ai-wiki/mini-plans/MINI-2026-10-07-lan-pairing.md) | extension 导入前的索引/实施记录；相关规则变化时结合当前源码核实 |

维护规则：所有根 ai-wiki Markdown 页面及组件历史文档在此可达。接口、配置、资源或维护规则变化时更新对应页面；实现完成时记录 Impact analysis、Regression risks 和 Test checklist。既有历史测试不等于当前实机验证。
