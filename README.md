# minecraft-mod-mcp

Minecraft 模组 / 插件开发 MCP 服务器（stdio）。把「起工程 + 跑 Gradle + 查开发知识」三件事打包成 MCP 工具，覆盖 **MC 1.7.10 ~ 1.21.x** 的 Paper / Fabric / Forge / NeoForge / Spigot。

## 来源与定位

本项目从 DSH 插件 **minecraft-dev** 重组而来，只保留可移植的部分，去掉了 DSH 专属依赖、子代理与预设。

原 DSH 插件仓库：

https://github.com/sikadi233-hub/minecraft-dev

请支持原插件作者的努力。

> **与 MCDxAI/minecraft-dev-mcp 的关系**：`MCDxAI/minecraft-dev-mcp` 是另一个独立的通用 MCP 服务器项目，与本项目无直接派生关系。此前版本 README 曾误将本项目标注为重构自该项目，现予更正。

> **DSH 用户注意**：DSH 原生 `minecraft-dev` 插件与本项目不是同一实现。原生插件包含 DSH 专属依赖、子代理与预设；本项目是去掉这些内容后的可移植 MCP 服务器。如果你已经安装原生插件，不需要再配置本项目；如果你希望以通用 MCP 服务器方式接入 DSH，可参考下文“DSH 配置（可选）”。

## 安装

### 环境要求

- Node.js ≥ 18（使用了 `node:` 前缀导入与 ESM）

### 克隆并安装

```bash
git clone https://github.com/jingchenGOD/minecraft-mod-mcp.git
cd minecraft-mod-mcp
npm install
```

## 客户端配置

### 通用 MCP 客户端

```json
{
  "mcpServers": {
    "minecraft-dev": {
      "command": "node",
      "args": ["/绝对路径/minecraft-mod-mcp/index.js"]
    }
  }
}
```

### DSH 配置（可选）

仅当你希望把本项目作为 MCP 服务器接入 DSH 时使用。如果你已安装 DSH 原生 `minecraft-dev` 插件，不需要此配置。

把对应的 `cordis.patch.yml` 条目写成：

```yaml
- insert:
    - id: mcp-mc-dev
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: 'minecraft-dev'
        transport: 'stdio'
        command: 'node'
        args:
          - '/绝对路径/minecraft-mod-mcp/index.js'
```

## 工具

### `mc_scaffold`

从内置模板生成完整工程（build 脚本、主类、mod 元数据、Gradle wrapper）。

- 参数：`platform`、`targetDir`、`name`、`packageName`、`minecraftVersion`、`javaVersion?`

### `mc_gradle`

用工程自带 wrapper 跑 Gradle 任务，输出按字符数截断。

- 参数：`projectDir`、`task`、`args?`、`timeoutMs?`（默认 `600000`）、`tailChars?`（默认 `12000`）

### `mc_list_versions`

列出支持的平台 × 版本矩阵与各时代默认 JDK。

- 参数：无

### `mc_read_skill`

读取某个开发技能的正文。

- 参数：`skill`

### `mc_read_reference`

读取技能下的 API 参考文档（按需，不预加载）。

- 参数：`path`

## 资源

另有资源 `skill://minecraft-xxx`，共 8 份。正文通过 `mc_read_skill` / `mc_read_reference` 按需读取。

## 内置技能（8 份）

| 技能 | 说明 |
| --- | --- |
| `minecraft-java-build` | 各时代 JDK / Gradle 配对与构建排错 |
| `minecraft-paper-plugin` | Paper / Spigot 1.20.x、1.21.x、26.x |
| `minecraft-fabric-mod` | Fabric（loom / loader / Fabric API） |
| `minecraft-forge-mod` | Forge 四时代：1.7.10 / 1.12.2 / 1.16.5 / 1.20.1 |
| `minecraft-neoforge-mod` | NeoForge 1.20.1 / 1.21.x / 26.x |
| `minecraft-spigot-legacy` | Spigot 1.7.10 / 1.12.2 与混合服 |
| `minecraft-major-mods` | 老线主流模组的附属开发（Thaumcraft、TiCon、Botania、AE2 等） |
| `minecraft-intake` | 需求澄清问题矩阵 |

## 版本矩阵（默认 JDK）

| 平台 | 支持版本 | 默认 JDK |
| --- | --- | --- |
| Paper | 1.20.6、1.21.8、26.x | 17 / 21 / 25 |
| Fabric | 1.20.1、1.21.x、26.x | 17 / 21 / 25 |
| Forge | 1.7.10、1.12.2、1.16.5、1.20.1 | 8 / 8 / 8 / 17 |
| NeoForge | 1.20.1、1.21.x、26.x | 17 / 21 / 25 |
| Spigot | 1.7.10、1.12.2 | 8 |

## 用法

1. `mc_list_versions` 确认时代与 JDK。
2. `mc_scaffold` 生成工程。
3. `mc_gradle` 跑 `build`（首次会下载依赖，耗时较长）。
4. 遇到 API 签名问题，再 `mc_read_skill` / `mc_read_reference` 按需查。

## 注意事项

- 首次构建慢是正常的，Forge / NeoForge 要下载并 merge 整个 Minecraft 环境。
- `mc_gradle` 的输出截断是刻意的：只保留前后共 12000 字符，避免日志淹没上下文。要看完整日志，请直接读 `projectDir/build/reports/`。
- 生成 Forge 1.20.1 工程后，如果构建卡在 Gradle 发行包下载，把 `gradle/wrapper/gradle-wrapper.properties` 里的 `distributionUrl` 换成国内镜像（如 `https://mirrors.cloud.tencent.com/gradle/gradle-8.1.1-bin.zip`）。
- 模板不包含第三方镜像源与企业插件（原版 MDK 里的 ForgeGradleCN 因镜像证书过期已不可用），一律走标准 FG6。

## 许可

本项目整体采用 MIT 许可协议。

本项目衍生自 DSH 插件 `minecraft-dev`，该原作品按 Apache License 2.0 授权。根据 Apache-2.0 §4(d) 及原项目要求，本仓库保留原项目的 `NOTICE.txt`，其中包含原作者 sikadi233 的版权与架构归属声明。

原插件仓库：https://github.com/sikadi233-hub/minecraft-dev

技能文档整理自各平台公开资料，核对日期 2026-08-16。
