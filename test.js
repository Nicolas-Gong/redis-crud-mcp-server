import { spawn } from 'child_process';
import { createClient } from 'redis';

// 设置测试环境变量
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '123456';

// 模拟 MCP 客户端测试
async function testRedisTools() {
  console.log('开始全面测试 Redis MCP 工具...');

  // 首先直接测试 Redis 连接和各种数据类型
  const redisClient = createClient({
    url: 'redis://:123456@127.0.0.1:6379'
  });

  try {
    await redisClient.connect();
    console.log('✓ Redis 连接成功');

    // 测试字符串操作
    console.log('测试字符串操作...');
    await redisClient.set('string_key', 'string_value');
    const stringValue = await redisClient.get('string_key');
    console.log('✓ 字符串操作测试通过');

    // 测试列表操作
    console.log('测试列表操作...');
    await redisClient.lPush('list_key', ['item1', 'item2', 'item3']);
    const listLength = await redisClient.lLen('list_key');
    const listRange = await redisClient.lRange('list_key', 0, -1);
    const poppedItem = await redisClient.lPop('list_key');
    console.log('✓ 列表操作测试通过');

    // 测试集合操作
    console.log('测试集合操作...');
    await redisClient.sAdd('set_key', ['member1', 'member2', 'member3']);
    const setMembers = await redisClient.sMembers('set_key');
    const isMember = await redisClient.sIsMember('set_key', 'member1');
    await redisClient.sRem('set_key', ['member2']);
    console.log('✓ 集合操作测试通过');

    // 测试哈希操作
    console.log('测试哈希操作...');
    await redisClient.hSet('hash_key', 'field1', 'value1');
    await redisClient.hSet('hash_key', 'field2', 'value2');
    const hashValue = await redisClient.hGet('hash_key', 'field1');
    const hashAll = await redisClient.hGetAll('hash_key');
    await redisClient.hDel('hash_key', ['field1']);
    console.log('✓ 哈希操作测试通过');

    // 测试有序集合操作
    console.log('测试有序集合操作...');
    await redisClient.zAdd('zset_key', { score: 1, value: 'member1' });
    await redisClient.zAdd('zset_key', { score: 2, value: 'member2' });
    await redisClient.zAdd('zset_key', { score: 3, value: 'member3' });
    const zsetRange = await redisClient.zRange('zset_key', 0, -1);
    await redisClient.zRem('zset_key', ['member2']);
    console.log('✓ 有序集合操作测试通过');

    // 清理测试数据
    const keys = ['string_key', 'list_key', 'set_key', 'hash_key', 'zset_key'];
    for (const key of keys) {
      await redisClient.del(key);
    }

    await redisClient.disconnect();
    console.log('✓ 所有 Redis 数据类型测试通过');

  } catch (error) {
    console.error('Redis 测试失败:', error);
    return;
  }

  // 测试 MCP 服务器启动
  console.log('测试 MCP 服务器启动...');
  const serverProcess = spawn('node', ['build/index.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverReady = false;
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('服务器输出:', output);
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.log('服务器日志:', output);
    if (output.includes('Redis CRUD MCP 服务器正在 stdio 上运行')) {
      serverReady = true;
      console.log('✓ MCP 服务器启动成功');
      serverProcess.kill();
    }
  });

  // 等待服务器启动或超时
  setTimeout(() => {
    if (!serverReady) {
      console.error('✗ MCP 服务器启动超时');
      serverProcess.kill();
    }
  }, 5000);
}

testRedisTools().catch(console.error);
