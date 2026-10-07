# MINI-2026-10-07-lan-pairing

## 目标
允许 Chrome 插件使用局域网 IPv4 地址与原整合包配对，保留现有身份校验及翻译/语音协议。

## 影响范围（Impact analysis）
- `protocol.js`：允许 RFC1918 私有 IPv4，保留原 HTTP、端口、凭据、路径限制。所有正文/视频/语音接口共用此校验。
- `manifest.json`：连接策略允许 HTTP，增加 LAN 版本展示和描述；保留现有脚本策略和 host_permissions。CSP 不能用 CIDR 表达私有网段，实际目的地址由 endpoint 校验限制。
- `background.js`：接口 fetch 禁止重定向，避免连接策略扩大后绕过地址边界。配对 token、服务 identity、缓存隔离均沿用。
- `options.html`、`README.zh-CN.md`：说明地址范围、端口、数据传输和服务端条件。
- `tests/protocol.test.mjs`：一个主路径及一个拒绝路径，使用现有 Node 内置测试，无新增依赖。原包没有相关测试，故新增以复现地址被拒绝的问题。
- `FILE-MANIFEST.json`：刷新交付文件大小与 SHA256。

## 实施步骤与 Checklist
- [x] 阅读配对入口、地址校验、请求函数与扩展配置。
- [x] 先运行测试，确认旧逻辑拒绝 192.168.1.20。
- [x] 增加私有 IPv4 支持，同步 CSP 与设置说明。
- [x] 运行针对性测试、语法检查并检查交付文件清单。

## 实施结果
完成客户端修改，交付基于原 0.1.20 的独立副本。未修改下载目录原文件。未改服务端、安装依赖、提交 Git 或执行部署。

## 可能回归点（Regression risks）
- 接口请求现在拒绝 HTTP 3xx 重定向；需要填写最终直连地址。
- 新目录加载可能改变扩展 ID，需要重新配对；现有目录覆盖重新加载一般保留配置。
- 服务端若限制监听地址、Host、Origin 或客户端来源，仍可能拒绝局域网配对，需要单独检查服务端。
- HTTP 不加密正文、配对请求及音频，仅适用于可信局域网。
- 本次继续原任务与语音协议，不支持直接把地址换成 Unsloth `/v1`。
- 上游更新覆盖文件可能撤销本修改。

## 验证（Validation）与具体自测清单（Test checklist）
### 已执行
- 修改前：2 项测试中主路径失败、拒绝路径通过。
- 修改后：2 项测试全部通过，覆盖三类私有 IPv4、172.16/12 边界、本机兼容、伪装域名与带凭据/路径的地址拒绝。
- 命令（插件根目录）：`node --experimental-default-type=module --test tests/protocol.test.mjs`。
- 所有交付 JavaScript 文件通过 Node 语法检查；manifest JSON 与文件 SHA256/大小核对通过。

### 建议用户实机验证（尚未执行）
- [ ] Chrome 加载扩展，无 manifest/CSP 错误，设置页显示局域网地址说明。
- [ ] 服务端已允许局域网访问；输入实际内网 IP 和配对码，配对成功后「检查连接」通过。
- [ ] 一个普通网页的正文翻译、停止与还原可用。
- [ ] 如需视频功能，验证已有字幕翻译；有 R2T2 的服务再验证声音采集、翻译和停止。

本次没有可用的局域网服务地址、配对码，未执行真实 Chrome 配对或模型翻译，不将单元测试视为端到端成功。

## 查证资料
通过 Context7 查证 Chrome 后台跨域请求及 host_permissions，配合官方说明确认自定义 CSP 需允许目标服务：
- https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
