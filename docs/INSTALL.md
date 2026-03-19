# WeChat Monitor - 安装指南

## 系统要求

- Node.js >= 18
- Python >= 3.10
- Chromium 浏览器

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/MingJinMuZi/wechat-monitor.git
cd wechat-monitor
```

### 2. 安装依赖

```bash
# Node.js 依赖
npm install

# Python 依赖（可选，用于图片处理）
pip install requests Pillow
```

### 3. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Tavily API Key
# 获取地址：https://app.tavily.com/
```

### 4. 检查依赖

```bash
node scripts/check-deps.js
```

## 快速开始

### 添加对标账号

```bash
node scripts/add-account.js "XXX 对标账号" "https://mp.weixin.qq.com/s/xxxxx"
```

### 抓取文章

```bash
# 抓取单篇文章
node scripts/fetch-article.js "https://mp.weixin.qq.com/s/xxxxx"

# 完整抓取（文字 + 图片+HTML）
node scripts/fetch-article-full.js "https://mp.weixin.qq.com/s/xxxxx"
```

### 风格分析

```bash
node scripts/analyze-style.js "XXX 对标账号"
```

### 生成报告

```bash
# 分析最新抓取的文章
node scripts/generate-report.js "XXX 对标账号"

# 分析指定文章
node scripts/generate-report.js "XXX 对标账号" 2
```

## 配置说明

### .env 文件

```bash
# Tavily 搜索 API Key（必需）
TAVILY_API_KEY=your-tavily-api-key-here

# 可选：自定义数据目录
# CONTENT_STUDIO_DATA_DIR=./data
```

## 常见问题

### Q: Tavily API Key 如何获取？

A: 访问 https://app.tavily.com/ 注册并获取免费 API Key。

### Q: 抓取失败怎么办？

A: 检查网络连接，确保能访问微信公众号。

### Q: 如何批量抓取？

A: 使用 monitor 脚本自动监控新文章：

```bash
node scripts/monitor.js
```

## 下一步

- [查看架构设计](ARCHITECTURE-2G2G.md)
- [查看报告模板](REPORT-TEMPLATE.md)
- [查看示例报告](EXAMPLE-REPORT.md)

---

**更新时间**: 2026-03-19
