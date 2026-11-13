# minecraft-mod-mcp

Minecraft 模组 / 插件开发 MCP 服务器（stdio）。提供起工程、跑 Gradle、查开发知识三类工具，覆盖 MC 1.7.10 ~ 26.3 的 Paper / Fabric / Forge / NeoForge / Spigot。

## 安装

需要 Node.js ≥ 18。

```bash
git clone https://github.com/jingchenGOD/minecraft-mod-mcp.git
cd minecraft-mod-mcp
npm install
```

依赖：`@modelcontextprotocol/sdk`、`zod`。

## 配置

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

DSH：

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

| 工具 | 说明 | 参数 |
| --- | --- | --- |
| `mc_scaffold` | 从模板生成完整工程 | `platform`、`targetDir`、`name`、`packageName`、`minecraftVersion`、`javaVersion?` |
| `mc_gradle` | 用 wrapper 跑 Gradle 任务，输出截断 | `projectDir`、`task`、`args?`、`timeoutMs?`、`tailChars?` |
| `mc_list_versions` | 平台 × 版本矩阵 | 无 |
| `mc_read_skill` | 读技能正文 | `skill` |
| `mc_read_reference` | 读技能下的 API 参考 | `path` |

另暴露 8 份 `skill://minecraft-xxx` 资源。

## 技能

| 技能 | 说明 |
| --- | --- |
| `minecraft-java-build` | 各时代 JDK / Gradle 配对与构建排错 |
| `minecraft-paper-plugin` | Paper / Spigot 1.20.x、1.21.x、26.x |
| `minecraft-fabric-mod` | Fabric |
| `minecraft-forge-mod` | Forge 1.7.10 / 1.12.2 / 1.16.5 / 1.20.1 |
| `minecraft-neoforge-mod` | NeoForge 1.20.1 / 1.21.x / 26.x |
| `minecraft-spigot-legacy` | Spigot 1.7.10 / 1.12.2 |
| `minecraft-major-mods` | 老线主流模组附属开发 |
| `minecraft-intake` | 需求澄清问题矩阵 |

## 版本矩阵

| 平台 | 版本 | 默认 JDK |
| --- | --- | --- |
| Paper | 1.20.6、1.21.8、26.2、26.3 | 17 / 21 / 25 / 25 |
| Fabric | 1.20.1、1.21.11、26.2、26.3 | 17 / 21 / 25 / 25 |
| Forge | 1.7.10、1.12.2、1.16.5、1.20.1 | 8 / 8 / 8 / 17 |
| NeoForge | 1.20.1、1.21.1、1.21.11、26.2、26.3 | 17 / 21 / 21 / 25 / 25 |
| Spigot | 1.7.10、1.12.2 | 8 / 8 |

模板 13 套，位于 `assets/templates/`。

## 使用

1. `mc_list_versions` 确认版本与 JDK
2. `mc_scaffold` 生成工程
3. `mc_gradle` 跑 `build`

## 注意

- 首次构建需下载并 merge 整个 Minecraft 环境，耗时较长。
- `mc_gradle` 只保留输出前后共 12000 字符，完整日志见 `projectDir/build/reports/`。
- Forge 1.20.1 构建卡在 Gradle 下载时，把 `gradle/wrapper/gradle-wrapper.properties` 的 `distributionUrl` 换成 `https://mirrors.cloud.tencent.com/gradle/gradle-8.1.1-bin.zip`。
- Spigot 1.7.10 无公开 maven，构建前按 `libs/README.txt` 放入 API jar。
- `targetDir` 必须不存在或为空。
- 部分技能文档保留 DSH 专有提法（如 `ask_user_question`），在其他客户端按对应机制理解。
- 版本坐标核对于 2026-08-16，更新需改 `lib/versions.js`。

## 许可

MIT。包含上游 DSH 插件 [minecraft-dev](https://github.com/sikadi233-hub/minecraft-dev) 的 MIT 版权声明。

本项目从该插件提取可移植部分重组，未包含其子代理、Agent 预设与 Codex 集成。

`NOTICE.txt` 来自上游 v0.12.0+（Apache-2.0 §4(d)），原样保留；其中所述仲裁架构不在本仓库内。
