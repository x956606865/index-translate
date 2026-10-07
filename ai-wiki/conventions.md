# 维护约定

- 本仓库是后续代码维护的主副本。导入来源目录保留，不自动双向同步。
- backend 与 extension 保留独立版本文件，目前均为 0.1.20；本次导入不冒充上游新版本。两端协议变更需一起审阅。
- 后端更新禁用入口必须保持可被旧 EXE 调用且正常退出；不能恢复上游 updater 覆盖本地修复。
- 主服务 LAN 与语音 worker 回环属于不同边界，不能把内部 127.0.0.1 批量替换成 LAN IP。
- 配对、身份、owner、hash 和占位符校验不可因连通性问题随意放宽；HTTP LAN 仅适用于可信网络。
- `_vendor/index_translate_core` 是当前程序源码组成部分，要纳入 Git。runtime/site-packages 则属于未入库运行环境。
- T8IndexTranslate.exe 是有意保留的 19,456 字节兼容文件；没有构建源码，不声称后端能从本仓库完全重建。
- 保留两端许可和来源说明。模型许可保存在 backend/third-party-licenses，不表示模型权重纳入仓库。
- SOURCE-IMPORT.json 只记录首次导入时的字节 hash；业务修改后无需更新它。运行整合包 FILE-MANIFEST.json 是发行包清单，已从导入范围排除。
- 用户数据、配对 token、环境密钥、模型、日志、运行时和构建缓存不提交。Git 操作按当前任务明确授权执行，不自动 push。
- 验证使用现有定向测试，不新建全量框架。实施文档记录影响、回归点和已执行/待执行验证；小任务使用 mini 文档，跨会话多阶段任务才建立 workstream。
