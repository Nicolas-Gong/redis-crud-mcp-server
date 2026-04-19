# Redis CRUD MCP 服务器

这是一个用于 Redis 数据库操作的 MCP (Model Context Protocol) 服务器插件，提供完整的 CRUD 操作工具。

## ✨ 特性

- 🔍 **自动检测项目配置** - 自动向上查找 `.env` 文件定位项目根目录
- 🔄 **多项目支持** - 不同项目自动使用不同的 Redis 连接
- ⏱️ **连接超时保护** - 默认 10 秒超时，可通过环境变量配置
- 📝 **多种配置格式** - 支持 INI section 和 KEY=VALUE 两种格式
- 🛠️ **兼容多工具** - 支持 Claude Code、Cline、Codex 等

## 🚀 快速开始

### 全局安装（推荐）

```bash
npm install -g redis-crud-server
```

### MCP 配置

在项目根目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "redis-crud": {
      "command": "redis-crud-server"
    }
  }
}
```

## ⚙️ 配置说明

### 配置格式一：INI Section 格式

```ini
[REDIS]
REDIS_HOSTNAME = 127.0.0.1
PORT = 6379
REDIS_PASSWORD = your_password
SELECT = 0
```

### 配置格式二：KEY=VALUE 格式

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### 支持的配置名称

| 配置项 | 支持的名称 |
|--------|-----------|
| 主机 | `REDIS_HOST` / `REDIS_SERVER_HOST` / `REDIS_HOSTNAME` |
| 端口 | `REDIS_PORT` / `REDIS_SERVER_PORT` / `PORT` |
| 密码 | `REDIS_PASSWORD` / `REDIS_SERVER_PASSWORD` / `PASSWORD` |
| 数据库 | `REDIS_DB` / `SELECT` / `DATABASE_INDEX` |

## 🔧 工具列表

### 字符串操作
- **redis_set** - 设置字符串键值
- **redis_get** - 获取字符串键值
- **redis_del** - 删除键
- **redis_exists** - 检查键是否存在

### 哈希操作
- **redis_hset** - 设置哈希字段
- **redis_hget** - 获取哈希字段
- **redis_hgetall** - 获取哈希所有字段
- **redis_hdel** - 删除哈希字段

### 信息
- **redis_info** - 获取连接信息

## ⏱️ 超时配置

默认连接超时为 10 秒，可通过环境变量配置：

```json
{
  "mcpServers": {
    "redis-crud": {
      "command": "redis-crud-server",
      "env": {
        "REDIS_TIMEOUT": "30000"
      }
    }
  }
}
```

## 📝 使用示例

### 设置键值

```
redis_set: key=test_key, value=hello_world
```

### 获取键值

```
redis_get: key=test_key
```

### 哈希操作

```
redis_hset: key=user:1, field=name, value=张三
redis_hget: key=user:1, field=name
redis_hgetall: key=user:1
```

## 🐛 故障排除

### 连接超时

- 检查网络连接和防火墙设置
- 确认 Redis 服务器可访问
- 调整 `REDIS_TIMEOUT` 环境变量

### 配置文件找不到

- 确保 `.env` 文件在项目根目录
- MCP 会自动向上查找 `.env` 文件

### INI 格式解析失败

- 确保使用正确的 section 名称 `[REDIS]`
- 支持 Windows (`\r\n`)、Unix (`\n`) 和旧 Mac (`\r`) 换行符

## 📄 许可证

MIT
