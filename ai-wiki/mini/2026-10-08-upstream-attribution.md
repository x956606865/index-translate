# 个人维护版来源说明

用户决定使用同一个源码仓库公开维护，要求醒目标明代码基于 T8 的 Comfyui-Index-Translate-T8 修改而来。用户已手动将仓库改为 Public，已通过 GitHub 仓库元数据确认。此次同步三份 README 的来源说明。

## Impact analysis

- 根 README 首屏标明 T8 / T8star-Aix / T8mars、上游链接、个人维护者及独立衍生版本身份，并列出本维护版改动。
- 后端与插件 README 首屏同步来源说明；保留原有 LICENSE、NOTICE、第三方声明和 SOURCE-IMPORT 初始快照。
- 本次只修改说明文档，不恢复更新器、不切换更新源、不发布 Release。

## Regression risks

- 上游完整项目包含本仓库未导入的交付物；已说明本仓库从 0.1.20 本地运行副本导入选定源码，不包含完整上游 Git 历史。
- 公开仓库不等于更新功能已接入；说明继续反映后端更新禁用、插件仍提示上游版本的当前状态。

## Test checklist

- [x] 三份 README 首屏均包含正确上游链接与个人维护版说明。
- [x] `git diff --check` 通过；原有许可文件与初始导入快照未修改。
- [x] 对当前三个提交的历史文件检查常见私钥、GitHub token、AWS access key 标记及排除运行目录路径，未发现匹配；此检查不等同完整安全审计。
- [ ] GitHub 首页与组件 README 的渲染排版待人工抽查。
- [x] GitHub 仓库元数据确认为 `visibility: public`。

本次为文档修改，无需执行模型、浏览器功能或 Windows 实机测试。
