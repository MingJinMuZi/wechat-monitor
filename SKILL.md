---
name: wechat-monitor
description: 微信公众号对标监控系统 - 自动抓取文章、分析数据、生成报告
author: Fire
version: 1.0.0
homepage: https://github.com/openclaw/skills/wechat-monitor
triggers:
  - "监控公众号"
  - "抓取文章"
  - "对标分析"
  - "微信监控"
metadata:
  clawdbot:
    emoji: 📊
    requires:
      bins: ["node", "chromium-browser"]
      node_modules: ["puppeteer-core"]
    config:
      env:
        WECHAT_MONITOR_DATA_DIR:
          description: 数据存储目录
          default: "{baseDir}/data"
        WECHAT_MONITOR_MEMORY_LIMIT:
          description: 内存限制(MB)
          default: "500"
---

# WeChat Monitor - 公众号对标监控系统

## 功能

- 🔍 自动抓取对标公众号文章
- 📈 监控阅读量、点赞、评论数据  
- 🤖 AI分析写作风格和爆款特征
- 📄 自动生成分析报告
- 🔔 新文章实时提醒

## 安装

### 方式1: 自动安装 (推荐)

```bash
# 第1步: 运行依赖检查，自动安装缺失依赖
node scripts/check-deps.js

# 第2步: 配置Tavily API Key (可选，用于搜索)
export TAVILY_API_KEY="your-key"
```

### 方式2: 手动安装

```bash
# 1. 安装Node.js依赖
npm install

# 2. 确保Chromium已安装
which chromium-browser
# 如未安装: sudo apt/yum install chromium-browser

# 3. 配置环境变量
export TAVILY_API_KEY="your-key"
export WECHAT_MONITOR_DATA_DIR="./data"
```

### 依赖要求

| 依赖 | 版本 | 必需 | 说明 |
|------|------|------|------|
| Node.js | >=18 | ✅ | 运行环境 |
| Chromium | >=100 | ✅ | 浏览器自动化 |
| puppeteer-core | ^21.0 | ✅ | 浏览器控制 |
| Tavily API | - | ❌ | AI搜索(可选) |

## 使用方法

### ⚠️ 重要提醒

**抓取文章时必须注意**：
1. **优先使用用户提供的链接** - 自动搜索结果可能不准确
2. **确保获取所有图片** - 包括封面图 + 正文所有图片（处理微信懒加载）
3. **数据必须核对** - 字数、图片数等必须与原文一致
4. **包含排版分析** - 字体、大小、间距等样式信息

详见：[docs/PITFALLS.md](docs/PITFALLS.md) - 常见错误和避坑指南

### 基础功能

```bash
# 添加对标账号
uv run {baseDir}/scripts/add-account.js "公众号名称" "示例链接"

# 抓取单篇文章（文字）
uv run {baseDir}/scripts/fetch-article.js "文章链接"

# 完整抓取（文字+图片+HTML）⭐推荐
uv run {baseDir}/scripts/fetch-article-full.js "文章链接"

# 抓取文章（尝试获取阅读数据）
uv run {baseDir}/scripts/fetch-article-data.js "文章链接"

# 定时监控
uv run {baseDir}/scripts/monitor.js

# 风格分析
uv run {baseDir}/scripts/analyze-style.js "公众号名称"

# 依赖检查
uv run {baseDir}/scripts/check-deps.js
```

### 阅读数据获取说明

**微信官方限制**:
- 微信未开放阅读量、点赞数API
- 网页端大部分数据不可见

**免费获取方式**:

1. **第三方平台免费版** (推荐)
   - 新榜: https://newrank.cn (免费查看，有限额)
   - 极致了: https://www.jzl.com (免费查看，有限额)
   - 使用方式: 注册→搜索公众号→查看数据→手动录入

2. **开源Hook方案** (免费但复杂)
   - wechat-spider (GitHub开源)
   - 费用: 免费
   - 要求: 额外服务器+MySQL+Redis+代理配置
   - 复杂度: 高
   - 适用: 大规模自动化需求

3. **当前方案** (已完整)
   - ✅ 文字内容: 完整抓取
   - ✅ 图片素材: 完整下载
   - ⚠️ 阅读数据: 需手动补充

**推荐方案**: 使用现有功能抓取文字+图片，阅读数据通过新榜/极致了查看后手动录入。

**使用方法**:
```bash
# 1. 抓取文章（文字+图片）
node scripts/fetch-article-full.js "文章链接"

# 2. 新榜/极致了查看阅读数据
#    https://newrank.cn 或 https://www.jzl.com
```

**详细对比**: 见 `docs/DATA-SOLUTION.md`

### 报告生成

```bash
# 生成深度分析报告 (输出到文件)
uv run {baseDir}/scripts/generate-report.js "公众号名称" [文章序号]

# 查看报告
cat {baseDir}/data/reports/xxx-report.md

# 下载报告
scp user@host:{baseDir}/data/reports/xxx-report.md ./
```

### 批量操作

```bash
# 批量抓取
uv run {baseDir}/scripts/batch-fetch.js urls.txt

# 获取最新文章
uv run {baseDir}/scripts/get-latest-article.js "公众号名称"

# 验证Skill完整性
uv run {baseDir}/scripts/verify-skill.js
```

## 配置

环境变量:
- `WECHAT_MONITOR_DATA_DIR`: 数据目录 (默认: {baseDir}/data)
- `WECHAT_MONITOR_MEMORY_LIMIT`: 内存限制MB (默认: 500)
- `TAVILY_API_KEY`: Tavily搜索API Key

## 文档

- `docs/README.md` - 快速使用指南
- `docs/INSTALL.md` - 详细安装指南
- `docs/ARCHITECTURE-2G2G.md` - 架构设计文档
- `docs/REPORT-TEMPLATE.md` - 报告输出标准
- `docs/CHECKLIST.md` - 完整性清单
- `scripts/check-deps.js` - 依赖检查和自动安装
- `scripts/generate-report.js` - 报告生成脚本
