# Triton 编译工具路径修复

## 目标与实施结果

- [x] 直接修改原整合包的 run.py，在 Windows 上、导入 uvicorn / app.server 及推理依赖前指定包内工具。
- [x] 对当前进程设置 CC 为包内 triton/runtime/tcc/tcc.exe，CUDA_PATH 为包内 triton/backends/nvidia。
- [x] 检查 tcc.exe、ptxas.exe、cuda.h 和 cuda.lib；缺失时明确报告文件路径。
- [x] 启动日志输出实际选择的编译器与 CUDA 工具目录。
- [x] 同步 FILE-MANIFEST.json 与知识库索引。

## 现象、根因与修复思路

插件报告服务端用 C:\MinGW\bin\gcc.EXE 编译 cuda_utils.c 时退出码为 1。整合包用 .pth 将 index-translate-speed-deps 添加到模块搜索路径，但 Triton 的编译器和 CUDA 工具查找逻辑仍从 sysconfig 的标准 site-packages 目录拼接路径，漏掉额外子目录。CC 环境变量也可以直接指定系统 GCC；现有信息不能判断 Windows 上具体走了哪一种分支。

已在真实依赖源码中复现漏找自带工具的路径，并核实包内工具完整。修复在 run.py 中基于整合包 ROOT 定位工具并设置当前进程环境，使实际 get_cc 与 find_cuda_env 选择包内工具。无须修改 Triton 第三方源码或安装其他编译器。

GCC 具体编译失败原因仍缺少 stderr，不能据路径验证宣称 Windows 编译和模型翻译已经成功。当前修复解决已确认的工具选择问题。

## 影响范围（Impact analysis）

业务代码仅修改 run.py。补充本交付记录、ai-wiki/INDEX.md 和 FILE-MANIFEST.json 元数据。未修改语音功能、模型、配对、局域网规则、第三方库、全局环境变量或已有数据。

Windows 服务进程会覆盖继承的 CC 与 CUDA_PATH，统一使用本包工具；关闭进程即结束其影响。非 Windows 不执行此配置。工具路径基于整合包根目录计算，可移动磁盘或目录。

## 可能回归点（Regression risks）

- Windows 启动时要求四个工具文件齐全；精简或损坏的包会明确停止启动，包括选择 CPU 的情形。
- 为避免继续使用外部 MinGW，本服务进程不再使用继承的自定义 CC / CUDA_PATH。
- 其他 GPU、驱动兼容性、真实 C 编译及模型推理尚未在 Windows 验证；修复后仍可能出现独立错误。
- 仅 run.py 入口应用配置；绕过入口直接导入 app.server 的自定义运行方式不在本次范围。

## 自测清单（Test checklist）

已执行：

- [x] 修改前失败复现：继承的 MinGW CC 未被替换，缺失工具未被启动逻辑报告。
- [x] 修改后两项隔离测试通过：执行实际启动配置及 Triton get_cc / find_cuda_env，确认自带编译器和 CUDA 的 bin/include/lib 目录被采用；缺失工具时产生明确错误。
- [x] 对实际写入的 run.py 进行语法检查，核对与测试版本字节一致。
- [x] 核对文件校验清单中的本次修改条目。

建议用户执行（未执行）：

- [ ] 将 run.py 与 FILE-MANIFEST.json 同步到 Windows 整合包，自行停止并重新启动程序。
- [ ] 检查 data/service.log 中“使用整合包编译器”和“使用整合包 CUDA 工具”两行，确认路径位于当前整合包内。
- [ ] 在插件翻译一个短段落；若失败，提供 data/service.log 中本次失败前的编译器 error / fatal error / ld 输出。

没有启动服务、模型、编译器或数据库，没有安装依赖。测试只提取实际源码中的启动与工具选择逻辑，用内存环境变量模拟 Windows。

## 已核实资料

- 包内 triton/runtime/build.py：get_cc 优先读取 CC。
- 包内 triton/windows_utils.py：find_cuda_env 优先读取 CUDA_PATH，并检查工具、头文件和链接库。
- [Triton Windows 编译器说明](https://github.com/triton-lang/triton-windows#5-c-compiler)：自带 TinyCC 与 CC 配置方式。
