# WeChat Monitor 架构设计 - 2核2G40GB优化版

## 资源约束

| 资源 | 总量 | 已用 | 可用 | 策略 |
|------|------|------|------|------|
| CPU | 2核 | ~30% | ~70% | 串行处理，避免并行 |
| 内存 | 2GB | ~1GB | ~900MB | 轻量级存储，避免内存数据库 |
| 存储 | 40GB | 15GB | 23GB | 压缩存储，定期清理 |

## 优化架构

```
┌─────────────────────────────────────────────────────────────┐
│                    第一层：数据采集层                          │
│                    内存占用: ~200MB (按需启动)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  主方案: 浏览器自动化 (Puppeteer + Chromium)                  │
│  ├─ 策略: 单进程串行抓取，抓完即关浏览器                        │
│  ├─ 内存: 启动时~150MB，运行时~300MB                          │
│  └─ 优化: 不保持常驻，需要时启动                               │
│                                                             │
│  辅助方案: Tavily AI搜索 (已运行)                             │
│  ├─ 内存: ~20MB (Node进程)                                   │
│  └─ 用途: 获取文章链接、补充信息                               │
│                                                             │
│  备用方案: 第三方API (极致了/新榜)                            │
│  └─ 内存: 0 (外部服务)                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    第二层：数据存储层                          │
│                    内存占用: ~50MB                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  主存储: SQLite (轻量级文件数据库)                             │
│  ├─ 优势: 零配置，单文件，内存占用低                           │
│  ├─ 适用: 文章元数据、账号信息、监控记录                        │
│  └─ 预估: 1000篇文章 ~50MB                                    │
│                                                             │
│  辅助存储: JSON文件 (当前实现)                                 │
│  ├─ 优势: 简单，易读，无依赖                                   │
│  └─ 适用: 配置、分析报告、临时数据                             │
│                                                             │
│  淘汰方案: MySQL/MongoDB/Redis                                │
│  └─ 原因: 内存占用高(>200MB)，不适合2G环境                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    第三层：分析应用层                          │
│                    内存占用: ~100MB (运行时)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  风格分析: OpenClaw内置AI (已有)                              │
│  └─ 内存: 复用现有gateway，不额外占用                          │
│                                                             │
│  数据处理: Node.js脚本 (轻量级)                                │
│  └─ 内存: ~50MB/进程，用完即退                                 │
│                                                             │
│  定时任务: OpenClaw Cron (内置)                               │
│  └─ 内存: 复用gateway                                         │
│                                                             │
│  报告生成: Markdown/HTML静态文件                               │
│  └─ 优势: 无内存占用，直接生成文件                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 关键优化策略

### 1. 内存优化

```javascript
// 抓取脚本优化 - 及时释放资源
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',  // 关键：减少/dev/shm使用
    '--disable-gpu',             // 禁用GPU加速
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process'
  ]
});

// 抓取完成后立即关闭
try {
  // 抓取逻辑
} finally {
  await browser.close();  // 确保关闭释放内存
}
```

### 2. 存储优化

```sql
-- SQLite表设计 - 压缩存储
CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    url TEXT UNIQUE,
    title TEXT,
    account_name TEXT,
    content TEXT,           -- 压缩存储
    content_length INTEGER,
    publish_time TEXT,
    fetched_at TEXT,
    read_count INTEGER,
    like_count INTEGER,
    is_analyzed BOOLEAN DEFAULT 0
);

-- 索引优化查询
CREATE INDEX idx_account ON articles(account_name);
CREATE INDEX idx_fetched ON articles(fetched_at);
```

### 3. 任务调度优化

```yaml
# cron配置 - 错峰执行，避免内存峰值
# 每2小时检查一次新文章（非高峰期）
0 */2 * * * node fetch-new.js

# 每天凌晨3点生成报告（低峰期）
0 3 * * * node generate-report.js

# 每周日凌晨清理旧数据
0 3 * * 0 node cleanup.js
```

## 部署清单

### 必需组件 (已安装)
- ✅ Node.js 24+
- ✅ Puppeteer-core
- ✅ Chromium (系统版)
- ✅ SQLite3
- ✅ OpenClaw Gateway

### 存储规划

| 数据类型 | 存储位置 | 预估大小 | 保留策略 |
|---------|---------|---------|---------|
| 文章元数据 | SQLite | ~50MB/千篇 | 永久 |
| 文章内容 | SQLite (压缩) | ~100MB/千篇 | 最近100篇完整，其他摘要 |
| 分析报告 | JSON文件 | ~10MB/账号 | 永久 |
| 日志文件 | logs/ | ~5MB/月 | 保留3个月 |
| 临时文件 | tmp/ | ~50MB | 即时清理 |

### 监控告警

```javascript
// 内存监控
const memUsage = process.memoryUsage();
if (memUsage.heapUsed > 500 * 1024 * 1024) {  // >500MB
  console.warn('内存警告: ', memUsage.heapUsed / 1024 / 1024, 'MB');
  // 触发垃圾回收或重启
}

// 存储监控
const stats = fs.statSync(DB_PATH);
if (stats.size > 1024 * 1024 * 1024) {  // >1GB
  console.warn('数据库过大，需要归档');
}
```

## 性能基准

### 2G2G配置下预期性能

| 操作 | 内存占用 | 耗时 | 并发 |
|------|---------|------|------|
| 单篇文章抓取 | ~300MB | 10-30s | 串行(1) |
| Tavily搜索 | ~50MB | 3-5s | 串行(1) |
| AI风格分析 | ~100MB | 5-10s | 串行(1) |
| 报告生成 | ~50MB | 2-5s | 串行(1) |
| 批量100篇 | ~300MB | 15-30min | 串行 |

### 资源限制策略

```javascript
// 限制同时运行的浏览器实例
const CONCURRENT_LIMIT = 1;
const MEMORY_LIMIT_MB = 1500;  // 留500MB缓冲

async function checkResources() {
  const memInfo = await getMemoryInfo();
  if (memInfo.available < MEMORY_LIMIT_MB) {
    throw new Error('内存不足，请稍后重试');
  }
}
```

## 扩展建议 (未来升级)

当资源升级后可添加:
1. **MySQL**: 大量数据存储 (>10万篇文章)
2. **Redis**: 缓存加速
3. **Elasticsearch**: 全文搜索
4. **多进程**: 并行抓取

---

**当前配置适合**: 
- 监控5-10个对标账号
- 存储1000-5000篇文章
- 日更频率抓取
- 轻量级分析
