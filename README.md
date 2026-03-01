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

在项目根目录创建 `.env` 文件，配置 Redis 连接信息。支持两种格式：

**快速开始**：
1. 复制项目中的 `.env.example` 文件为 `.env`
2. 编辑 `.env` 文件，填入实际的 Redis 连接信息

#### 格式一：标准 KEY=VALUE 格式

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

**支持的配置名称**（任选其一）：
- 主机: `REDIS_HOST` / `REDIS_SERVER_HOST` / `HOST` / `HOSTNAME` / `REDIS_HOSTNAME`
- 端口: `REDIS_PORT` / `REDIS_SERVER_PORT` / `PORT` / `HOSTPORT`
- 密码: `REDIS_PASSWORD` / `REDIS_SERVER_PASSWORD` / `PASSWORD`
- 数据库: `REDIS_DB` / `SELECT` / `DATABASE_INDEX` / `DB_INDEX`（默认: 0）

#### 格式二：INI 格式（[REDIS] section）

```ini
[REDIS]
REDIS_HOSTNAME=127.0.0.1
PORT=6379
REDIS_PASSWORD=your_redis_password
SELECT=0
```

#### 格式三：INI 格式（[DATABASE] section）

```ini
[DATABASE]
TYPE=redis
HOSTNAME=127.0.0.1
HOSTPORT=6379
PASSWORD=your_redis_password
SELECT=0
```

### 方式二：全局 MCP 配置文件

如果不想在项目中配置 .env 文件，也可以在 MCP 配置中设置环境变量。

## 启动服务器

```bash
npm start
```

## 📝 注意事项

1. Redis 密码是必需的配置项
2. 服务器会在启动时验证 Redis 连接
3. 如果缺少必需的环境变量，服务器将无法启动并显示详细的配置说明
4. `.env` 文件不应提交到版本控制系统（已在 .gitignore 中配置）
5. 支持多个 Redis 数据库（通过 SELECT/REDIS_DB 配置）

## 🐛 故障排除

### 服务器无法启动
- 检查 Redis 连接信息是否正确
- 确认 Redis 服务正在运行
- 查看错误日志中的具体错误信息

### 连接超时
- 检查网络连接
- 确认防火墙设置
- 验证 Redis 服务是否可访问

### 配置文件找不到
- 确保 `.env` 文件在项目根目录
- 检查 `ENV_PATH` 环境变量是否正确设置
- 查看错误消息中的配置路径提示

### 认证失败
- 确认 Redis 密码是否正确
- 检查 Redis 服务器是否启用了认证
- 验证用户是否有权限访问指定的数据库

## 📖 更多信息

- 查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本历史
- 查看源码中的注释了解技术细节
- 访问 [npm 包页面](https://www.npmjs.com/package/redis-crud-server)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发设置

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 监视文件变化
npm run watch

# 启动服务器
npm start
```

### 提交更改

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加适当的注释和文档
- 确保代码能够成功构建

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件

## 在 Cline 中使用

### 步骤 1：配置 Redis 连接

在项目根目录创建 `.env` 文件（推荐方式）。支持两种格式：

**格式一：标准 KEY=VALUE 格式**

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_actual_redis_password
REDIS_DB=0
```

**格式二：INI 格式**

```ini
[REDIS]
REDIS_HOSTNAME=127.0.0.1
PORT=6379
REDIS_PASSWORD=your_actual_redis_password
SELECT=0
```

或者在 MCP 配置中设置环境变量。

### 步骤 2：添加 MCP 服务器配置

1. 复制项目中的 `cline_mcp_settings.example.json` 文件
2. 编辑其中的配置信息：
   - 将 `path/to/your/redis-crud-server/build/index.js` 替换为实际的构建文件路径
3. 将配置添加到您的 `cline_mcp_settings.json` 文件中

**配置位置**:
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Cline 配置示例

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
        "C:\\path\\to\\redis-crud-server\\build\\index.js"
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
        "C:\\path\\to\\redis-crud-server\\build\\index.js"
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

## 在 Claude Code 中使用

### 步骤 1：配置 Redis 连接

在项目根目录创建 `.env` 文件（推荐方式）。支持两种格式：

**格式一：标准 KEY=VALUE 格式**

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_actual_redis_password
REDIS_DB=0
```

**格式二：INI 格式**

```ini
[REDIS]
REDIS_HOSTNAME=127.0.0.1
PORT=6379
REDIS_PASSWORD=your_actual_redis_password
SELECT=0
```

### 步骤 2：添加 MCP 服务器配置

1. 在项目根目录创建 `.claude` 文件夹（如果不存在）
2. 复制项目中的 `claude_mcp_settings.example.json` 文件到 `.claude/mcp.json`
3. 编辑 `.claude/mcp.json`，根据需要调整配置

**配置位置**: `.claude/mcp.json`

### Claude Code 配置示例

#### 使用 .env 文件（推荐）

```json
{
  "mcpServers": {
    "redis-crud-server": {
      "command": "node",
      "args": [
        "./redis-crud-server/build/index.js"
      ]
    }
  }
}
```

#### 使用配置中的环境变量

如果不使用 .env 文件，可以在配置中直接设置环境变量：

```json
{
  "mcpServers": {
    "redis-crud-server": {
      "command": "node",
      "args": [
        "./redis-crud-server/build/index.js"
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

**Cline**:
1. 配置完成后，重启 VS Code
2. Redis CRUD 工具将在 Cline 中可用

**Claude Code**:
1. 配置完成后，重启 Claude Code 或重新加载项目
2. Redis CRUD 工具将在 Claude Code 中可用

**配置优先级**: 项目 .env 文件 > MCP 配置中的环境变量 > 默认值

## 开发

- 使用 TypeScript 编写
- 支持热重载开发：`npm run watch`
- 构建输出到 `build/` 目录

## 许可证

MIT
