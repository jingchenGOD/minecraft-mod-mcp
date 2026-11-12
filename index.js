#!/usr/bin/env node

/**
 * minecraft-dev-mcp: Minecraft mod/plugin development MCP server.
 * Extracted from minecraft-dev DSH plugin, stripped of all dsh dependencies.
 *
 * Tools:
 *   mc_scaffold  - Create a new MC project from bundled template
 *   mc_gradle    - Run a Gradle task via project wrapper
 *   mc_list_versions - List supported platform × version matrix
 *   mc_read_skill    - Read a development skill's content
 *
 * Resources:
 *   skill://minecraft-xxx  - 8 development knowledge documents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFile, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { scaffoldProject } from './lib/scaffold.js'
import { runGradle, renderGradleResult } from './lib/gradle.js'
import {
  PLATFORM_LINES,
  SUPPORTED_PLATFORMS,
  PLATFORM_LABELS,
  defaultJavaVersion,
} from './lib/versions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILLS_ROOT = path.join(__dirname, 'assets', 'skills')

// ── Skill registry ──────────────────────────────────────────────

const SKILLS = [
  {
    name: 'minecraft-java-build',
    description: 'Java/Gradle/toolchain knowledge for MC projects (1.7.10~26.x)',
  },
  {
    name: 'minecraft-paper-plugin',
    description: 'Paper/Spigot server plugin development (1.20.x/1.21.x/26.x)',
  },
  {
    name: 'minecraft-fabric-mod',
    description: 'Fabric mod development (1.20.1/1.21.x/26.x)',
  },
  {
    name: 'minecraft-forge-mod',
    description: 'Forge mod development (1.7.10/1.12.2/1.16.5/1.20.1)',
  },
  {
    name: 'minecraft-neoforge-mod',
    description: 'NeoForge mod development (1.20.1/1.21.x/26.x)',
  },
  {
    name: 'minecraft-spigot-legacy',
    description: 'Spigot/Bukkit legacy plugin development (1.7.10/1.12.2)',
  },
  {
    name: 'minecraft-major-mods',
    description: 'Major mod addon development reference (28 mods)',
  },
  {
    name: 'minecraft-intake',
    description: 'Task intake and requirement clarification',
  },
]

// ── Create MCP server ───────────────────────────────────────────

const server = new McpServer({
  name: 'minecraft-dev-mcp',
  version: '1.0.0',
})

// ── Tool: mc_scaffold ───────────────────────────────────────────

server.tool(
  'mc_scaffold',
  'Create a new Minecraft project from bundled template. Generates complete Gradle project: build scripts, main class, plugin/mod metadata, and Gradle wrapper. Supported platforms: paper, fabric, forge, neoforge, spigot.',
  {
    platform: server._z.enum(SUPPORTED_PLATFORMS).describe('Project platform'),
    targetDir: server._z.string().describe('Absolute path of the new project root; must not exist or be empty'),
    name: server._z.string().describe('Project name in lowercase kebab-case (e.g. my-plugin)'),
    packageName: server._z.string().describe('Java package name, e.g. com.example.myplugin'),
    minecraftVersion: server._z.string().describe('Target MC version, e.g. 1.7.10, 1.12.2, 1.20.1, 1.21.8, 26.3'),
    javaVersion: server._z.number().optional().describe('Java level (8/17/21/25). Omit for era default.'),
  },
  async (args) => {
    try {
      const result = await scaffoldProject({
        platform: args.platform,
        targetDir: args.targetDir,
        name: args.name,
        packageName: args.packageName,
        minecraftVersion: args.minecraftVersion,
        javaVersion: args.javaVersion,
      })
      return {
        content: [{
          type: 'text',
          text: `✅ Created ${result.platform} project at ${result.projectDir} for Minecraft ${result.minecraftVersion}\n`
            + `   ${result.filesCreated.length} files written, Gradle wrapper included.\n`
            + `   Build: ${result.buildCommand}\n`
            + `   Files:\n${result.filesCreated.map(f => `     - ${f}`).join('\n')}`
            + (result.platform === 'spigot' && result.minecraftVersion.startsWith('1.7')
              ? '\n\n⚠️  Before building, place the vendored API jar into libs/ per libs/README.txt (no public maven hosts 1.7.10 spigot-api).'
              : ''),
        }],
      }
    } catch (err) {
      return { content: [{ type: 'text', text: `❌ ${err.message}` }], isError: true }
    }
  }
)

// ── Tool: mc_gradle ─────────────────────────────────────────────

server.tool(
  'mc_gradle',
  'Run a Gradle task in a Minecraft project via its wrapper (gradlew). Reports exit code in result instead of failing on non-zero exits. Use to build, test, or run client/server tasks.',
  {
    projectDir: server._z.string().describe('Absolute path of the Gradle project root (must contain gradlew)'),
    task: server._z.string().describe('Gradle task, e.g. build, clean, runClient, runServer'),
    args: server._z.array(server._z.string()).optional().describe('Extra arguments, e.g. --no-daemon, -Pfoo=bar'),
    timeoutMs: server._z.number().optional().describe('Timeout in ms (default 600000)'),
    tailChars: server._z.number().optional().describe('Output chars to keep, head+tail (default 12000)'),
  },
  async (args) => {
    try {
      const result = await runGradle({
        projectDir: args.projectDir,
        task: args.task,
        args: args.args,
        timeoutMs: args.timeoutMs ?? 600_000,
        tailChars: args.tailChars ?? 12_000,
      })
      const text = renderGradleResult(result)
      return {
        content: [{
          type: 'text',
          text,
        }],
        isError: result.exitCode !== 0,
      }
    } catch (err) {
      return { content: [{ type: 'text', text: `❌ ${err.message}` }], isError: true }
    }
  }
)

// ── Tool: mc_list_versions ──────────────────────────────────────

server.tool(
  'mc_list_versions',
  'List all supported platform × Minecraft version combinations with default Java levels.',
  {},
  async () => {
    const lines = []
    for (const platform of SUPPORTED_PLATFORMS) {
      const label = PLATFORM_LABELS[platform] || platform
      const entries = PLATFORM_LINES[platform]
      lines.push(`\n## ${label} (${platform})`)
      for (const entry of entries) {
        const coords = entry.coords ? ` | coords: ${Object.keys(entry.coords).join(', ')}` : ''
        lines.push(`  - ${entry.defaultMcVersion} (Java ${entry.javaVersion}, template: ${entry.templateDir}${coords})`)
      }
    }
    return {
      content: [{
        type: 'text',
        text: '# Minecraft Dev: Supported Platform × Version Matrix' + lines.join('\n'),
      }],
    }
  }
)

// ── Tool: mc_read_skill ─────────────────────────────────────────

server.tool(
  'mc_read_skill',
  'Read a Minecraft development skill document. Returns the full skill content for the specified skill name.',
  {
    skill: server._z.enum(SKILLS.map(s => s.name)).describe('Skill name to read'),
  },
  async (args) => {
    try {
      const skillDir = path.join(SKILLS_ROOT, args.skill)
      const skillFile = path.join(skillDir, 'SKILL.md')
      const content = await readFile(skillFile, 'utf8')

      // Also list reference files if present
      const refDir = path.join(skillDir, 'references', 'api')
      let refs = ''
      try {
        const entries = await readdir(refDir)
        const mdFiles = entries.filter(e => e.endsWith('.md'))
        if (mdFiles.length > 0) {
          refs = '\n\n📎 API reference files available (use mc_read_skill with path option):\n'
            + mdFiles.map(f => `  - ${args.skill}/references/api/${f}`).join('\n')
        }
      } catch {}

      return { content: [{ type: 'text', text: content + refs }] }
    } catch (err) {
      return { content: [{ type: 'text', text: `❌ ${err.message}` }], isError: true }
    }
  }
)

// ── Tool: mc_read_reference ─────────────────────────────────────

server.tool(
  'mc_read_reference',
  'Read an API reference file within a skill. Use mc_read_skill first to see available reference files.',
  {
    path: server._z.string().describe('Relative path under skills/, e.g. minecraft-forge-mod/references/api/forge-1.12.2-api.md'),
  },
  async (args) => {
    try {
      // Sanitize: no path traversal
      const resolved = path.resolve(SKILLS_ROOT, args.path)
      if (!resolved.startsWith(SKILLS_ROOT)) {
        return { content: [{ type: 'text', text: '❌ Path traversal not allowed' }], isError: true }
      }
      const content = await readFile(resolved, 'utf8')
      return { content: [{ type: 'text', text: content }] }
    } catch (err) {
      return { content: [{ type: 'text', text: `❌ ${err.message}` }], isError: true }
    }
  }
)

// ── Resources: expose skills as MCP resources ───────────────────

for (const skill of SKILLS) {
  server.resource(
    `skill://${skill.name}`,
    `skill://${skill.name}`,
    { name: skill.name, description: skill.description, mimeType: 'text/markdown' },
    async (uri) => {
      const skillFile = path.join(SKILLS_ROOT, skill.name, 'SKILL.md')
      const content = await readFile(skillFile, 'utf8')
      return { contents: [{ uri: uri.href, text: content, mimeType: 'text/markdown' }] }
    }
  )
}

// ── Start ───────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
