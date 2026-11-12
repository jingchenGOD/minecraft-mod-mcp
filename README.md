

```markdown
# minecraft-dev-mcp

Minecraft 模组 / 插件开发 MCP 服务器（stdio）。把「起工程 + 跑 Gradle + 查开发知识」三件事打包成 MCP 工具，覆盖 **MC 1.7.10 ~ 26.3** 的 Paper / Fabric / Forge / NeoForge / Spigot。

由 `minecraft-dev` DSH 插件重组而来：只保留可移植的部分，去掉了 dsh 专属依赖、子代理与预设。

## 安装

```bash
git clone https://github.com/jingchenGOD/minecraft-mod-mcp.git
cd minecraft-mod-mcp
npm install
```

需要 Node.js ≥ 18（用了 `node:` 前缀导入与 ESM）。

## 客户端配置

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

连 DSH 时把对应的 `cordis.patch.yml` 条目写成：

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

| 工具 | 作用 | 主要参数 |
|---|---|---|
| `mc_scaffold` | 从内置模板生成完整工程（build 脚本、主类、mod 元数据、Gradle wrapper） | `platform`、`targetDir`、`name`、`packageName`、`minecraftVersion`、`javaVersion?` |
| `mc_gradle` | 用工程自带 wrapper 跑 Gradle 任务，输出按字符数截断 | `projectDir`、`task`、`args?`、`timeoutMs?`（默认 600000）、`tailChars?`（默认 12000） |
| `mc_list_versions` | 列出支持的平台 × 版本矩阵与各时代默认 JDK | 无 |
| `mc_read_skill` | 读取某个开发技能的正文 | `skill` |
| `mc_read_reference` | 读取技能下的 API 参考文档（按需，不预加载） | `path` |

另有资源 `skill://minecraft-xxx`，共 8 份。

## 内置技能（8 份）

- `minecraft-java-build` — 各时代 JDK / Gradle 配对与构建排错
- `minecraft-paper-plugin` — Paper / Spigot 1.20.x、1.21.x、26.x
- `minecraft-fabric-mod` — Fabric（loom / loader / Fabric API）
- `minecraft-forge-mod` — Forge 四时代：1.7.10 / 1.12.2 / 1.16.5 / 1.20.1
- `minecraft-neoforge-mod` — NeoForge 1.20.1 / 1.21.x / 26.x
- `minecraft-spigot-legacy` — Spigot 1.7.10 / 1.12.2 与混合服
- `minecraft-major-mods` — 老线主流模组的附属开发（Thaumcraft、TiCon、Botania、AE2 等）
- `minecraft-intake` — 需求澄清问题矩阵

## 版本矩阵（默认 JDK）

| 平台 | 支持版本 | 默认 JDK |
|---|---|---|
| Paper | 1.20.6、1.21.8、26.x | 17 / 21 / 25 |
| Fabric | 1.20.1、1.21.x、26.x | 17 / 21 / 25 |
| Forge | 1.7.10、1.12.2、1.16.5、1.20.1 | 8 / 8 / 8 / 17 |
| NeoForge | 1.20.1、1.21.x、26.x | 17 / 21 / 25 |
| Spigot | 1.7.10、1.12.2 | 8 |

## 用法

```
1. mc_list_versions 确认时代与 JDK
2. mc_scaffold 生成工程
3. mc_gradle  跑 build（首次会下载依赖，耗时较长）
4. 遇到 API 签名问题再 mc_read_skill / mc_read_reference 按需查
```

## 注意

- **首次构建慢是正常的**，Forge / NeoForge 要下载并 merge 整个 Minecraft 环境。
- `mc_gradle` 的输出截断是刻意的：只保留前后共 12000 字符，避免日志淹没上下文。要看完整日志请直接读 `projectDir/build/reports/`。
- 生成 Forge 1.20.1 工程后，如果构建卡在 Gradle 发行包下载，把 `gradle/wrapper/gradle-wrapper.properties` 里的 `distributionUrl` 换成国内镜像（如 `https://mirrors.cloud.tencent.com/gradle/gradle-8.1.1-bin.zip`）。
- 模板不包含第三方镜像源与企业插件（原版 MDK 里的 ForgeGradleCN 因镜像证书过期已不可用），一律走标准 FG6。

## 许可

MIT。技能文档整理自各平台公开资料，核对日期 2026-08-16。
```
