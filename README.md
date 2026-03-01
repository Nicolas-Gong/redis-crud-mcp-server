# Redis CRUD MCP 服务器

这是一个 Model Context Protocol (MCP) 服务器，提供完整的 Redis 数据库 CRUD 操作工具。

## 功能特性

支持 Redis 的主要数据类型：

### 字符串 (Strings)
- **redis_set**: 在 Redis 中设置字符串键值对
- **redis_get**: 获取 Redis 中字符串键的值

### 列表 (Lists)
- **redis_lpush**: 从列表左侧推入元素
- **redis_rpush**: 从列表右侧推入元素
- **redis_lpop**: 从列表左侧弹出元素
- **redis_rpop**: 从列表右侧弹出元素
- **redis_lrange**: 获取列表指定范围的元素
- **redis_llen**: 获取列表长度

### 集合 (Sets)
- **redis_sadd**: 向集合添加成员
- **redis_srem**: 从集合移除成员
- **redis_smembers**: 获取集合的所有成员
- **redis_sismember**: 检查成员是否在集合中

### 哈希 (Hashes)
- **redis_hset**: 设置哈希字段的值
- **redis_hget**: 获取哈希字段的值
- **redis_hgetall**: 获取哈希的所有字段和值
- **redis_hdel**: 删除哈希字段

### 有序集合 (Sorted Sets)
- **redis_zadd**: 向有序集合添加成员
- **redis_zrem**: 从有序集合移除成员
- **redis_zrange**: 获取有序集合指定分数范围的成员

### 通用操作
- **redis_del**: 删除 Redis 中的键
- **redis_exists**: 检查 Redis 中键是否存在

## 安装

1. 安装依赖：
```bash
npm install
```

2. 构建项目：
```bash
npm run build
```

## 配置

### 方式一：项目级 .env 文件（推荐）

在项目根目录创建 `.env` 文件，配置 Redis 连接信息：

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

支持的配置名称（任选其一）：
- 主机: `REDIS_HOST` / `REDIS_SERVER_HOST` / `HOST`
- 端口: `REDIS_PORT` / `REDIS_SERVER_PORT` / `PORT`
- 密码: `REDIS_PASSWORD` / `REDIS_SERVER_PASSWORD` / `PASSWORD`

### 方式二：全局 MCP 配置文件

如果不想在项目中配置 .env 文件，也可以在 MCP 配置中设置环境变量。

## 启动服务器

```bash
npm start
```

## 测试

运行测试脚本验证功能：

```bash
node test.js
```

## 在 Cline 中使用

### 步骤 1：配置 Redis 连接

在项目根目录创建 `.env` 文件（推荐方式）：

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_actual_redis_password
```

或者在 MCP 配置中设置环境变量。

### 步骤 2：添加 MCP 服务器配置

1. 复制项目中的 `cline_mcp_settings.example.json` 文件
2. 编辑其中的配置信息：
   - 将 `"path/to/your/redis-crud-server/build/index.js"` 替换为实际的构建文件路径
3. 将配置添加到您的 `cline_mcp_settings.json` 文件中

配置位置:
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### 配置示例

#### 使用 .env 文件（推荐）

```json
{
  "mcpServers": {
    "redis-crud-server": {
      "autoApprove": [
        "redis_set",
        "redis_get",
        "redis_del",
        "redis_exists",
        "redis_lpush",
        "redis_rpush",
        "redis_lpop",
        "redis_rpop",
        "redis_lrange",
        "redis_llen",
        "redis_sadd",
        "redis_srem",
        "redis_smembers",
        "redis_sismember",
        "redis_hset",
        "redis_hget",
        "redis_hgetall",
        "redis_hdel",
        "redis_zadd",
        "redis_zrem",
        "redis_zrange"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "/path/to/your/project/redis-crud-server/build/index.js"
      ]
    }
  }
}
```

#### 使用 MCP 配置中的环境变量

如果不使用 .env 文件，可以在 MCP 配置中直接设置环境变量：

```json
{
  "mcpServers": {
    "redis-crud-server": {
      "autoApprove": [
        "redis_set",
        "redis_get",
        "redis_del",
        "redis_exists",
        "redis_lpush",
        "redis_rpush",
        "redis_lpop",
        "redis_rpop",
        "redis_lrange",
        "redis_llen",
        "redis_sadd",
        "redis_srem",
        "redis_smembers",
        "redis_sismember",
        "redis_hset",
        "redis_hget",
        "redis_hgetall",
        "redis_hdel",
        "redis_zadd",
        "redis_zrem",
        "redis_zrange"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "/path/to/your/project/redis-crud-server/build/index.js"
      ],
      "env": {
        "REDIS_HOST": "127.0.0.1",
        "REDIS_PORT": "6379",
        "REDIS_PASSWORD": "your_actual_redis_password"
      }
    }
  }
}
```

### 使用说明

1. 配置完成后，重启 VS Code
2. Redis CRUD 工具将在 Cline 中可用
3. 优先级：项目 .env 文件 > MCP 配置中的环境变量 > 默认值

## 开发

- 使用 TypeScript 编写
- 支持热重载开发：`npm run watch`
- 构建输出到 `build/` 目录

## 许可证

MIT
