#!/usr/bin/env node

/**
 * Redis CRUD MCP 服务器 - 自动检测项目目录版
 *
 * 特性：
 * 1. 自动向上查找 .env 文件定位项目根目录
 * 2. 支持环境变量 PROJECT_DIR 手动指定
 * 3. 兼容 Claude Code、Codex 等多种工具
 * 4. 多项目连接隔离
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 项目目录检测 ====================

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.env'))) return dir;
    const parentDir = path.dirname(dir);
    if (parentDir === dir) break;
    dir = parentDir;
  }
  return startDir;
}

function getProjectDir(): string {
  if (process.env.PROJECT_DIR) return process.env.PROJECT_DIR;
  if (process.env.MCP_PROJECT_DIR) return process.env.MCP_PROJECT_DIR;
  return findProjectRoot(process.cwd());
}

// ==================== 连接管理 ====================

const clientCache: Map<string, any> = new Map();
const OPERATION_TIMEOUT = parseInt(process.env.REDIS_TIMEOUT || '10000'); // 默认 10 秒

function parseIniConfig(filePath: string): Record<string, Record<string, string>> {
  const config: Record<string, Record<string, string>> = {};
  try {
    if (!fs.existsSync(filePath)) return config;
    // 统一换行符，支持 Windows (\r\n)、Unix (\n) 和旧 Mac (\r)
    const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let currentSection = '';
    content.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith(';') || line.startsWith('#')) return;
      const sectionMatch = line.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) { currentSection = sectionMatch[1]; config[currentSection] = {}; return; }
      const keyValueMatch = line.match(/^([^=]+)=(.*)$/);
      if (keyValueMatch && currentSection) config[currentSection][keyValueMatch[1].trim()] = keyValueMatch[2].trim();
    });
  } catch (error) {}
  return config;
}

function getRedisConfig(projectDir: string) {
  const envPath = path.join(projectDir, '.env');
  const iniConfig = parseIniConfig(envPath);

  const redisEnvKeys = ['REDIS_HOST', 'REDIS_SERVER_HOST', 'REDIS_HOSTNAME', 'HOST', 'HOSTNAME',
    'REDIS_PORT', 'REDIS_SERVER_PORT', 'HOSTPORT', 'PORT',
    'REDIS_PASSWORD', 'REDIS_SERVER_PASSWORD', 'PASSWORD',
    'REDIS_DB', 'SELECT', 'DATABASE_INDEX', 'DB_INDEX'];

  const originalEnv: Record<string, string | undefined> = {};
  redisEnvKeys.forEach(k => originalEnv[k] = process.env[k]);

  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

  const mappings: Record<string, string[]> = {
    host: ['REDIS_HOST', 'REDIS_SERVER_HOST', 'REDIS_HOSTNAME', 'HOST', 'HOSTNAME'],
    port: ['REDIS_PORT', 'REDIS_SERVER_PORT', 'PORT'],
    password: ['REDIS_PASSWORD', 'REDIS_SERVER_PASSWORD', 'PASSWORD'],
    db: ['REDIS_DB', 'SELECT', 'DATABASE_INDEX', 'DB_INDEX']
  };

  const getEnvValue = (key: string): string | undefined => {
    const names = mappings[key];
    if (!names) return undefined;
    for (const name of names) {
      if (process.env[name]) return process.env[name];
    }
    return undefined;
  };

  // INI 配置只从 REDIS section 读取，避免与 DATABASE section 混淆
  const getIniValue = (key: string): string | undefined => {
    const names = mappings[key];
    if (!names || !iniConfig.REDIS) return undefined;
    for (const name of names) {
      if (iniConfig.REDIS[name]) return iniConfig.REDIS[name];
    }
    return undefined;
  };

  const host = getEnvValue('host') || getIniValue('host') || '127.0.0.1';
  const port = getEnvValue('port') || getIniValue('port') || '6379';
  const password = getEnvValue('password') || getIniValue('password');
  const dbStr = getEnvValue('db') || getIniValue('db') || '0';

  redisEnvKeys.forEach(k => originalEnv[k] === undefined ? delete process.env[k] : process.env[k] = originalEnv[k]);

  if (!password) {
    throw new Error(`Redis 配置不完整。项目目录: ${projectDir}\n请检查 .env 文件中的 Redis 配置。`);
  }

  return { host, port: parseInt(port), password, db: parseInt(dbStr) || 0, socket: { connectTimeout: OPERATION_TIMEOUT } };
}

// 超时包装函数
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

async function getClient(projectDir: string): Promise<any> {
  if (clientCache.has(projectDir)) return clientCache.get(projectDir)!;

  const config = getRedisConfig(projectDir);
  const client = createClient({
    url: `redis://:${config.password}@${config.host}:${config.port}/${config.db}`,
    socket: { connectTimeout: OPERATION_TIMEOUT }
  });
  client.on('error', (err: any) => console.error('Redis 错误:', err));

  // 显式连接并带超时保护
  try {
    await withTimeout(client.connect(), OPERATION_TIMEOUT, `Redis 连接超时 (${OPERATION_TIMEOUT}ms)`);
    console.error(`Redis 连接成功 [${projectDir}] -> ${config.host}:${config.port}/${config.db}`);
  } catch (error) {
    console.error(`Redis 连接失败:`, error);
    throw error;
  }

  clientCache.set(projectDir, client);
  return client;
}

// ==================== MCP 服务器 ====================

const server = new Server(
  { name: "redis-crud-server", version: "1.3.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "redis_set", description: "设置键值。自动读取项目 .env 配置连接 Redis。", inputSchema: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] } },
    { name: "redis_get", description: "获取键值。", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
    { name: "redis_del", description: "删除键。", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
    { name: "redis_exists", description: "检查键是否存在。", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
    { name: "redis_info", description: "获取连接信息。", inputSchema: { type: "object", properties: {} } },
    { name: "redis_hset", description: "设置哈希字段。", inputSchema: { type: "object", properties: { key: { type: "string" }, field: { type: "string" }, value: { type: "string" } }, required: ["key", "field", "value"] } },
    { name: "redis_hget", description: "获取哈希字段。", inputSchema: { type: "object", properties: { key: { type: "string" }, field: { type: "string" } }, required: ["key", "field"] } },
    { name: "redis_hgetall", description: "获取哈希所有字段。", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
    { name: "redis_hdel", description: "删除哈希字段。", inputSchema: { type: "object", properties: { key: { type: "string" }, fields: { type: "array", items: { type: "string" } } }, required: ["key", "fields"] } }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const projectDir = getProjectDir();
    const client = await getClient(projectDir);
    const args = request.params.arguments as any;

    const ops: Record<string, () => Promise<string>> = {
      redis_info: async () => `Redis MCP 信息\n项目目录: ${projectDir}\n连接数: ${clientCache.size}`,
      redis_set: async () => { const r = await client.set(args.key, args.value); return `SET 成功。键: ${args.key}`; },
      redis_get: async () => { const r = await client.get(args.key); return `GET 成功。键: ${args.key}, 值: ${r ?? 'null'}`; },
      redis_del: async () => { const r = await client.del(args.key); return `DEL 成功。删除 ${r} 个键`; },
      redis_exists: async () => { const r = await client.exists(args.key); return `EXISTS 成功。键 ${args.key} ${r > 0 ? '存在' : '不存在'}`; },
      redis_hset: async () => { await client.hSet(args.key, args.field, args.value); return `HSET 成功。${args.key}.${args.field} = ${args.value}`; },
      redis_hget: async () => { const r = await client.hGet(args.key, args.field); return `HGET 成功。${args.key}.${args.field} = ${r ?? 'null'}`; },
      redis_hgetall: async () => { const r = await client.hGetAll(args.key); return `HGETALL 成功。${args.key}: ${JSON.stringify(r)}`; },
      redis_hdel: async () => { const r = await client.hDel(args.key, args.fields); return `HDEL 成功。删除 ${r} 个字段`; }
    };

    if (!ops[request.params.name]) throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${request.params.name}`);
    return { content: [{ type: "text", text: await ops[request.params.name]() }] };
  } catch (error) {
    // 连接错误时清除缓存，下次请求重新创建连接
    const projectDir = getProjectDir();
    if (clientCache.has(projectDir)) {
      const client = clientCache.get(projectDir)!;
      clientCache.delete(projectDir);
      client.quit().catch(() => {});
    }
    return { content: [{ type: "text", text: `操作失败: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
  }
});

async function main() {
  const projectDir = getProjectDir();
  console.error(`Redis CRUD MCP 启动`);
  console.error(`项目目录: ${projectDir}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
