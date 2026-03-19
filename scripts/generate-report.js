#!/usr/bin/env node
/**
 * 生成深度分析报告
 * 输出到文件，支持下载
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

// 确保目录
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// 加载文章
const articles = fs.existsSync(ARTICLES_FILE) 
  ? JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8')) 
  : [];

const accountName = process.argv[2];
const articleIndex = parseInt(process.argv[3]) || 0;

if (!accountName) {
  console.error('Usage: node generate-report.js "公众号名称" [文章序号]');
  process.exit(1);
}

// 筛选文章
const accArticles = articles.filter(a => 
  a.accountName.includes(accountName) || accountName.includes(a.accountName)
);

if (accArticles.length === 0) {
  console.error(`❌ 未找到 "${accountName}" 的文章`);
  process.exit(1);
}

const article = accArticles[articleIndex] || accArticles[0];

console.log(`📝 生成报告: ${article.title}`);

// 生成报告内容
function generateReport(article) {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  return `# 📊 ${article.accountName} - 深度分析报告

---

## 一、数据采集

### 1.1 账号信息

| 项目 | 内容 |
|------|------|
| **公众号名称** | ${article.accountName} |
| **文章标题** | ${article.title} |
| **发布时间** | ${article.publishTime} |
| **抓取时间** | ${article.fetchedAt} |
| **内容长度** | ${article.contentLength} 字符 |

### 1.2 采集方式

| 项目 | 内容 |
|------|------|
| **搜索工具** | Tavily AI Search |
| **抓取工具** | Puppeteer + Chromium |
| **存储方式** | JSON文件 |
| **采集时间** | ${timestamp} |

---

## 二、抓取文章

### 2.1 文章基本信息

| 项目 | 内容 |
|------|------|
| **标题** | ${article.title} |
| **发布时间** | ${article.publishTime} |
| **文章链接** | ${article.url} |
| **内容长度** | ${article.contentLength} 字符 |
| **公众号** | ${article.accountName} |

### 2.2 文章正文

\`\`\`
${article.content}
\`\`\`

---

## 三、深度分析报告

### 3.1 标题套路拆解

| 组成部分 | 内容 | 作用 |
|---------|------|------|
| **副词** | （待分析） | 制造情绪 |
| **动词** | （待分析） | 核心动作 |
| **人称代词** | （待分析） | 拉近距离 |
| **热点词** | （待分析） | 蹭热点 |
| **数字** | （待分析） | 具体明确 |
| **类型** | （待分析） | 内容定位 |
| **动作** | （待分析） | 结果导向 |

**标题结构公式**:
\`\`\`
[情绪副词] + [动作动词] + [人称代词] + [热点产品] + [数字] + [内容类型] + [结果动作]
\`\`\`

### 3.2 标题维度分析

| 维度 | 分析 |
|------|------|
| **结构** | 待分析 |
| **模式** | 待分析 |
| **字数** | 待分析 |
| **Emoji使用** | 待分析 |
| **ClickBait指数** | 待分析 |

### 3.3 内容结构

| 部分 | 内容 | 字数 | 作用 |
|------|------|------|------|
| **钩子** | 待分析 | - | 吸引注意 |
| **铺垫** | 待分析 | - | 过渡衔接 |
| **正文** | 待分析 | - | 核心内容 |
| **引导** | 待分析 | - | 转化CTA |

### 3.4 语言特点

| 维度 | 特征 |
|------|------|
| **段落长度** | 待分析 |
| **句式结构** | 待分析 |
| **语气语调** | 待分析 |
| **口语化程度** | 待分析 |

**词汇分类**:

| 类型 | 示例 | 作用 |
|------|------|------|
| **技术术语** | 待分析 | 专业可信 |
| **网络热词** | 待分析 | 引发共鸣 |
| **情绪词** | 待分析 | 增加感染力 |
| **口语化** | 待分析 | 拉近距离 |

### 3.5 互动策略

| 策略类型 | 具体应用 | 效果 |
|---------|---------|------|
| **场景化** | 待分析 | 让读者代入 |
| **案例展示** | 待分析 | 增强可信度 |
| **数字吸引** | 待分析 | 具体可信 |
| **情绪触发** | 待分析 | 多维度触动 |
| **CTA引导** | 待分析 | 明确转化 |

### 3.6 爆款特征

| 特征 | 体现 |
|------|------|
| **蹭热点** | 待分析 |
| **新奇角度** | 待分析 |
| **实用价值** | 待分析 |
| **情感共鸣** | 待分析 |
| **易传播** | 待分析 |

### 3.7 对标价值

**可学习点**:

| 序号 | 学习点 | 应用场景 |
|------|--------|---------|
| 1 | 待分析 | 技术类文章 |
| 2 | 待分析 | 项目推荐类 |
| 3 | 待分析 | 开发者社区 |
| 4 | 待分析 | 热点追踪 |
| 5 | 待分析 | 技术科普 |

**适用场景**:
- 技术类公众号
- 开源项目推荐
- AI工具介绍
- 开发者社区

---

## 四、总结评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **标题吸引力** | ⭐⭐⭐⭐⭐ | 待评估 |
| **内容结构** | ⭐⭐⭐⭐⭐ | 待评估 |
| **语言风格** | ⭐⭐⭐⭐⭐ | 待评估 |
| **实用价值** | ⭐⭐⭐⭐ | 待评估 |
| **互动设计** | ⭐⭐⭐⭐ | 待评估 |

**整体评价**: 待分析

---

**报告生成时间**: ${timestamp}
**数据来源**: WeChat Monitor Skill v1.0.0
**分析账号**: ${article.accountName}
**文章标题**: ${article.title}
**报告文件**: 见下方下载链接

---

## 📥 下载报告

报告文件已生成，路径:
\`\`\`
${REPORTS_DIR}/${article.accountName}-${date}-report.md
\`\`\`
`;
}

// 生成报告
const report = generateReport(article);
const date = new Date().toISOString().split('T')[0];
const filename = `${article.accountName}-${date}-report.md`;
const filepath = path.join(REPORTS_DIR, filename);

// 写入文件
fs.writeFileSync(filepath, report);

console.log('✅ 报告生成成功!');
console.log(`📁 文件路径: ${filepath}`);
console.log(`📊 文件大小: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
console.log('\n💡 查看报告:');
console.log(`  cat ${filepath}`);
console.log('\n💡 下载命令:');
console.log(`  scp user@host:${filepath} ./`);
