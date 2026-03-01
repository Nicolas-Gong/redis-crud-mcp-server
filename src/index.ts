#!/usr/bin/env node

/**
 * Redis CRUD MCP 服务器
 * 提供用于 Redis 数据库操作的工具：SET、GET、DEL、EXISTS
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Redis 客户端
let redisClient: RedisClientType;

/**
 * 获取 Redis 连接配置 - 支持项目级 .env 文件和环境变量
 */
function getRedisConfig() {
  // 优先级 1: 尝试读取 .env 文件
  // 支持通过 ENV_PATH 环境变量指定 .env 文件路径
  const envPath = process.env.ENV_PATH || path.join(__dirname, '..', '.env');
  dotenv.config({ path: envPath });

  // 定义可能的配置名称映射（支持多种命名约定）
  const configNameMappings = {
    host: ['REDIS_HOST', 'REDIS_SERVER_HOST', 'HOST'],
    port: ['REDIS_PORT', 'REDIS_SERVER_PORT', 'PORT'],
    password: ['REDIS_PASSWORD', 'REDIS_SERVER_PASSWORD', 'PASSWORD']
  };

  // 尝试从环境变量中获取配置值
  function getConfigValue(configKey: string): string | undefined {
    const possibleNames = configNameMappings[configKey as keyof typeof configNameMappings];
    if (!possibleNames) return undefined;

    for (const name of possibleNames) {
      if (process.env[name]) {
        return process.env[name];
      }
    }
    return undefined;
  }

  // 获取所有配置值
  const host = getConfigValue('host') || '127.0.0.1';
  const port = getConfigValue('port') || '6379';
  const password = getConfigValue('password');

  // 检查是否有密码被设置
  if (!password) {
    throw new Error(
      `Redis CRUD MCP 服务器需要配置密码。\n\n` +
      `配置方式（优先级顺序）：\n\n` +
      `1. 项目级 .env 文件（推荐）\n` +
      `   - 在项目根目录创建 .env 文件\n` +
      `   - 支持的配置名称（任选其一）：\n` +
      `     • 主机: REDIS_HOST / REDIS_SERVER_HOST / HOST\n` +
      `     • 端口: REDIS_PORT / REDIS_SERVER_PORT / PORT\n` +
      `     • 密码: REDIS_PASSWORD / REDIS_SERVER_PASSWORD / PASSWORD\n\n` +
      `2. 全局 MCP 配置文件\n` +
      `   - 复制项目中的 cline_mcp_settings.example.json 文件\n` +
      `   - 编辑其中的 Redis 配置信息\n` +
      `   - 将配置添加到您的 cline_mcp_settings.json 文件中\n` +
      `   - 配置位置: %APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json\n\n` +
      `示例 .env 文件：\n` +
      `REDIS_HOST=127.0.0.1\n` +
      `REDIS_PORT=6379\n` +
      `REDIS_PASSWORD=your_password\n\n` +
      `或者运行 install.cjs 脚本进行自动配置。`
    );
  }

  return {
    host,
    port: parseInt(port),
    password,
  };
}

/**
 * 初始化 Redis 连接
 */
async function initializeRedis() {
  try {
    const config = getRedisConfig();
    redisClient = createClient({
      url: `redis://:${config.password}@${config.host}:${config.port}`
    });

    redisClient.on('error', (err) => console.error('Redis 连接错误:', err));

    await redisClient.connect();
    console.error('Redis 连接成功');
  } catch (error) {
    console.error('初始化 Redis 连接失败:', error);
    throw error;
  }
}

/**
 * 验证 Redis 操作参数
 */
function validateRedisArgs(args: any): args is {
  key: string;
  value?: string;
  field?: string;
  fields?: string[];
  values?: string[];
  members?: string[];
  member?: string;
  score?: number;
  start?: number;
  stop?: number;
  min?: number;
  max?: number;
} {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.key === 'string' &&
    (args.value === undefined || typeof args.value === 'string') &&
    (args.field === undefined || typeof args.field === 'string') &&
    (args.fields === undefined || Array.isArray(args.fields)) &&
    (args.values === undefined || Array.isArray(args.values)) &&
    (args.members === undefined || Array.isArray(args.members)) &&
    (args.member === undefined || typeof args.member === 'string') &&
    (args.score === undefined || typeof args.score === 'number') &&
    (args.start === undefined || typeof args.start === 'number') &&
    (args.stop === undefined || typeof args.stop === 'number') &&
    (args.min === undefined || typeof args.min === 'number') &&
    (args.max === undefined || typeof args.max === 'number')
  );
}

/**
 * 执行 SET 操作
 */
async function executeSet(key: string, value: string): Promise<string | null> {
  return await redisClient.set(key, value);
}

/**
 * 执行 GET 操作
 */
async function executeGet(key: string): Promise<string | null> {
  return await redisClient.get(key);
}

/**
 * 执行 DEL 操作
 */
async function executeDel(key: string): Promise<number> {
  return await redisClient.del(key);
}

/**
 * 执行 EXISTS 操作
 */
async function executeExists(key: string): Promise<number> {
  return await redisClient.exists(key);
}

/**
 * 执行 LPUSH 操作 (列表左侧推入)
 */
async function executeLPush(key: string, values: string[]): Promise<number> {
  return await redisClient.lPush(key, values);
}

/**
 * 执行 RPUSH 操作 (列表右侧推入)
 */
async function executeRPush(key: string, values: string[]): Promise<number> {
  return await redisClient.rPush(key, values);
}

/**
 * 执行 LPOP 操作 (列表左侧弹出)
 */
async function executeLPop(key: string): Promise<string | null> {
  return await redisClient.lPop(key);
}

/**
 * 执行 RPOP 操作 (列表右侧弹出)
 */
async function executeRPop(key: string): Promise<string | null> {
  return await redisClient.rPop(key);
}

/**
 * 执行 LRANGE 操作 (获取列表范围)
 */
async function executeLRange(key: string, start: number, stop: number): Promise<string[]> {
  return await redisClient.lRange(key, start, stop);
}

/**
 * 执行 LLEN 操作 (获取列表长度)
 */
async function executeLLen(key: string): Promise<number> {
  return await redisClient.lLen(key);
}

/**
 * 执行 SADD 操作 (集合添加成员)
 */
async function executeSAdd(key: string, members: string[]): Promise<number> {
  return await redisClient.sAdd(key, members);
}

/**
 * 执行 SREM 操作 (集合移除成员)
 */
async function executeSRem(key: string, members: string[]): Promise<number> {
  return await redisClient.sRem(key, members);
}

/**
 * 执行 SMEMBERS 操作 (获取集合所有成员)
 */
async function executeSMembers(key: string): Promise<string[]> {
  return await redisClient.sMembers(key);
}

/**
 * 执行 SISMEMBER 操作 (检查成员是否在集合中)
 */
async function executeSIsMember(key: string, member: string): Promise<boolean> {
  return await redisClient.sIsMember(key, member);
}

/**
 * 执行 HSET 操作 (哈希设置字段)
 */
async function executeHSet(key: string, field: string, value: string): Promise<number> {
  return await redisClient.hSet(key, field, value);
}

/**
 * 执行 HGET 操作 (哈希获取字段)
 */
async function executeHGet(key: string, field: string): Promise<string | undefined> {
  return await redisClient.hGet(key, field);
}

/**
 * 执行 HGETALL 操作 (获取哈希所有字段和值)
 */
async function executeHGetAll(key: string): Promise<Record<string, string>> {
  return await redisClient.hGetAll(key);
}

/**
 * 执行 HDEL 操作 (哈希删除字段)
 */
async function executeHDel(key: string, fields: string[]): Promise<number> {
  return await redisClient.hDel(key, fields);
}

/**
 * 执行 ZADD 操作 (有序集合添加成员)
 */
async function executeZAdd(key: string, score: number, member: string): Promise<number> {
  return await redisClient.zAdd(key, { score, value: member });
}

/**
 * 执行 ZREM 操作 (有序集合移除成员)
 */
async function executeZRem(key: string, members: string[]): Promise<number> {
  return await redisClient.zRem(key, members);
}

/**
 * 执行 ZRANGE 操作 (有序集合范围查询)
 */
async function executeZRange(key: string, min: number, max: number): Promise<string[]> {
  return await redisClient.zRange(key, min, max);
}

/**
 * 创建带有 Redis CRUD 操作工具的 MCP 服务器
 */
const server = new Server(
  {
    name: "redis-crud-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 列出可用 Redis CRUD 工具的处理器
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // 字符串操作
      {
        name: "redis_set",
        description: "在 Redis 数据库中设置字符串键值对",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "要设置的键"
            },
            value: {
              type: "string",
              description: "要设置的值"
            }
          },
          required: ["key", "value"]
        }
      },
      {
        name: "redis_get",
        description: "从 Redis 数据库中获取字符串键的值",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "要获取的键"
            }
          },
          required: ["key"]
        }
      },
      // 通用操作
      {
        name: "redis_del",
        description: "从 Redis 数据库中删除键",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "要删除的键"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "redis_exists",
        description: "检查 Redis 数据库中键是否存在",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "要检查的键"
            }
          },
          required: ["key"]
        }
      },
      // 列表操作
      {
        name: "redis_lpush",
        description: "从列表左侧推入元素",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "列表键"
            },
            values: {
              type: "array",
              items: { type: "string" },
              description: "要推入的值数组"
            }
          },
          required: ["key", "values"]
        }
      },
      {
        name: "redis_rpush",
        description: "从列表右侧推入元素",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "列表键"
            },
            values: {
              type: "array",
              items: { type: "string" },
              description: "要推入的值数组"
            }
          },
          required: ["key", "values"]
        }
      },
      {
        name: "redis_lpop",
        description: "从列表左侧弹出元素",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "列表键"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "redis_rpop",
        description: "从列表右侧弹出元素",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "列表键"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "redis_lrange",
        description: "获取列表指定范围的元素",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "列表键"
            },
            start: {
              type: "number",
              description: "起始索引",
              default: 0
            },
            stop: {
              type: "number",
              description: "结束索引",
              default: -1
            }
          },
          required: ["key"]
        }
      },
      {
        name: "redis_llen",
        description: "获取列表长度",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "列表键"
            }
          },
          required: ["key"]
        }
      },
      // 集合操作
      {
        name: "redis_sadd",
        description: "向集合添加成员",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "集合键"
            },
            members: {
              type: "array",
              items: { type: "string" },
              description: "要添加的成员数组"
            }
          },
          required: ["key", "members"]
        }
      },
      {
        name: "redis_srem",
        description: "从集合移除成员",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "集合键"
            },
            members: {
              type: "array",
              items: { type: "string" },
              description: "要移除的成员数组"
            }
          },
          required: ["key", "members"]
        }
      },
      {
        name: "redis_smembers",
        description: "获取集合的所有成员",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "集合键"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "redis_sismember",
        description: "检查成员是否在集合中",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "集合键"
            },
            member: {
              type: "string",
              description: "要检查的成员"
            }
          },
          required: ["key", "member"]
        }
      },
      // 哈希操作
      {
        name: "redis_hset",
        description: "设置哈希字段的值",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "哈希键"
            },
            field: {
              type: "string",
              description: "字段名"
            },
            value: {
              type: "string",
              description: "字段值"
            }
          },
          required: ["key", "field", "value"]
        }
      },
      {
        name: "redis_hget",
        description: "获取哈希字段的值",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "哈希键"
            },
            field: {
              type: "string",
              description: "字段名"
            }
          },
          required: ["key", "field"]
        }
      },
      {
        name: "redis_hgetall",
        description: "获取哈希的所有字段和值",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "哈希键"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "redis_hdel",
        description: "删除哈希字段",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "哈希键"
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description: "要删除的字段数组"
            }
          },
          required: ["key", "fields"]
        }
      },
      // 有序集合操作
      {
        name: "redis_zadd",
        description: "向有序集合添加成员",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "有序集合键"
            },
            score: {
              type: "number",
              description: "成员分数"
            },
            member: {
              type: "string",
              description: "成员值"
            }
          },
          required: ["key", "score", "member"]
        }
      },
      {
        name: "redis_zrem",
        description: "从有序集合移除成员",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "有序集合键"
            },
            members: {
              type: "array",
              items: { type: "string" },
              description: "要移除的成员数组"
            }
          },
          required: ["key", "members"]
        }
      },
      {
        name: "redis_zrange",
        description: "获取有序集合指定分数范围的成员",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "有序集合键"
            },
            min: {
              type: "number",
              description: "最小分数",
              default: "-inf"
            },
            max: {
              type: "number",
              description: "最大分数",
              default: "+inf"
            }
          },
          required: ["key"]
        }
      }
    ]
  };
});

/**
 * Redis CRUD 工具调用的处理器
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!validateRedisArgs(request.params.arguments)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      '无效的参数。必需参数：key (字符串)，其他参数根据操作类型而定'
    );
  }

  const args = request.params.arguments;
  const { key } = args;

  try {
    let result: any;

    switch (request.params.name) {
      // 字符串操作
      case "redis_set":
        if (!args.value) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'SET 操作需要提供 value 参数'
          );
        }
        result = await executeSet(key, args.value);
        return {
          content: [
            {
              type: "text",
              text: `SET 执行成功。键: ${key}, 值: ${args.value}, 结果: ${result}`
            }
          ]
        };

      case "redis_get":
        result = await executeGet(key);
        return {
          content: [
            {
              type: "text",
              text: `GET 执行成功。键: ${key}, 值: ${result !== null ? result : 'null'}`
            }
          ]
        };

      // 通用操作
      case "redis_del":
        result = await executeDel(key);
        return {
          content: [
            {
              type: "text",
              text: `DEL 执行成功。键: ${key}, 删除的键数量: ${result}`
            }
          ]
        };

      case "redis_exists":
        result = await executeExists(key);
        return {
          content: [
            {
              type: "text",
              text: `EXISTS 执行成功。键: ${key}, 存在: ${result > 0 ? '是' : '否'}`
            }
          ]
        };

      // 列表操作
      case "redis_lpush":
        if (!args.values) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'LPUSH 操作需要提供 values 参数'
          );
        }
        result = await executeLPush(key, args.values);
        return {
          content: [
            {
              type: "text",
              text: `LPUSH 执行成功。键: ${key}, 添加的元素数量: ${result}`
            }
          ]
        };

      case "redis_rpush":
        if (!args.values) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'RPUSH 操作需要提供 values 参数'
          );
        }
        result = await executeRPush(key, args.values);
        return {
          content: [
            {
              type: "text",
              text: `RPUSH 执行成功。键: ${key}, 添加的元素数量: ${result}`
            }
          ]
        };

      case "redis_lpop":
        result = await executeLPop(key);
        return {
          content: [
            {
              type: "text",
              text: `LPOP 执行成功。键: ${key}, 弹出的元素: ${result !== null ? result : 'null'}`
            }
          ]
        };

      case "redis_rpop":
        result = await executeRPop(key);
        return {
          content: [
            {
              type: "text",
              text: `RPOP 执行成功。键: ${key}, 弹出的元素: ${result !== null ? result : 'null'}`
            }
          ]
        };

      case "redis_lrange":
        const start = args.start || 0;
        const stop = args.stop || -1;
        result = await executeLRange(key, start, stop);
        return {
          content: [
            {
              type: "text",
              text: `LRANGE 执行成功。键: ${key}, 范围: [${start}, ${stop}], 结果: [${result.join(', ')}]`
            }
          ]
        };

      case "redis_llen":
        result = await executeLLen(key);
        return {
          content: [
            {
              type: "text",
              text: `LLEN 执行成功。键: ${key}, 长度: ${result}`
            }
          ]
        };

      // 集合操作
      case "redis_sadd":
        if (!args.members) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'SADD 操作需要提供 members 参数'
          );
        }
        result = await executeSAdd(key, args.members);
        return {
          content: [
            {
              type: "text",
              text: `SADD 执行成功。键: ${key}, 添加的成员数量: ${result}`
            }
          ]
        };

      case "redis_srem":
        if (!args.members) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'SREM 操作需要提供 members 参数'
          );
        }
        result = await executeSRem(key, args.members);
        return {
          content: [
            {
              type: "text",
              text: `SREM 执行成功。键: ${key}, 移除的成员数量: ${result}`
            }
          ]
        };

      case "redis_smembers":
        result = await executeSMembers(key);
        return {
          content: [
            {
              type: "text",
              text: `SMEMBERS 执行成功。键: ${key}, 成员: [${result.join(', ')}]`
            }
          ]
        };

      case "redis_sismember":
        if (!args.member) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'SISMEMBER 操作需要提供 member 参数'
          );
        }
        result = await executeSIsMember(key, args.member);
        return {
          content: [
            {
              type: "text",
              text: `SISMEMBER 执行成功。键: ${key}, 成员: ${args.member}, 是否存在: ${result ? '是' : '否'}`
            }
          ]
        };

      // 哈希操作
      case "redis_hset":
        if (!args.field || !args.value) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'HSET 操作需要提供 field 和 value 参数'
          );
        }
        result = await executeHSet(key, args.field, args.value);
        return {
          content: [
            {
              type: "text",
              text: `HSET 执行成功。键: ${key}, 字段: ${args.field}, 值: ${args.value}, 结果: ${result}`
            }
          ]
        };

      case "redis_hget":
        if (!args.field) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'HGET 操作需要提供 field 参数'
          );
        }
        result = await executeHGet(key, args.field);
        return {
          content: [
            {
              type: "text",
              text: `HGET 执行成功。键: ${key}, 字段: ${args.field}, 值: ${result !== undefined ? result : 'undefined'}`
            }
          ]
        };

      case "redis_hgetall":
        result = await executeHGetAll(key);
        return {
          content: [
            {
              type: "text",
              text: `HGETALL 执行成功。键: ${key}, 数据: ${JSON.stringify(result)}`
            }
          ]
        };

      case "redis_hdel":
        if (!args.fields) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'HDEL 操作需要提供 fields 参数'
          );
        }
        result = await executeHDel(key, args.fields);
        return {
          content: [
            {
              type: "text",
              text: `HDEL 执行成功。键: ${key}, 删除的字段数量: ${result}`
            }
          ]
        };

      // 有序集合操作
      case "redis_zadd":
        if (args.score === undefined || !args.member) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'ZADD 操作需要提供 score 和 member 参数'
          );
        }
        result = await executeZAdd(key, args.score, args.member);
        return {
          content: [
            {
              type: "text",
              text: `ZADD 执行成功。键: ${key}, 分数: ${args.score}, 成员: ${args.member}, 结果: ${result}`
            }
          ]
        };

      case "redis_zrem":
        if (!args.members) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'ZREM 操作需要提供 members 参数'
          );
        }
        result = await executeZRem(key, args.members);
        return {
          content: [
            {
              type: "text",
              text: `ZREM 执行成功。键: ${key}, 移除的成员数量: ${result}`
            }
          ]
        };

      case "redis_zrange":
        const min = args.min || 0;
        const max = args.max || -1;
        result = await executeZRange(key, min, max);
        return {
          content: [
            {
              type: "text",
              text: `ZRANGE 执行成功。键: ${key}, 范围: [${min}, ${max}], 结果: [${result.join(', ')}]`
            }
          ]
        };

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `未知工具: ${request.params.name}`
        );
    }
  } catch (error) {
    console.error(`Redis 操作失败:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Redis 操作失败: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

/**
 * 使用 stdio 传输启动服务器
 */
async function main() {
  try {
    await initializeRedis();

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Redis CRUD MCP 服务器正在 stdio 上运行');
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("服务器错误:", error);
  process.exit(1);
});
