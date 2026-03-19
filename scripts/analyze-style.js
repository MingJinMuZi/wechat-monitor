#!/usr/bin/env node
/**
 * 分析公众号写作风格
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

const articles = fs.existsSync(ARTICLES_FILE) ? JSON.parse(fs.readFileSync(ARTICLES_FILE)) : [];
const accountName = process.argv[2];

if (!accountName) {
  console.error('Usage: node analyze-style.js "公众号名称"');
  process.exit(1);
}

const accArticles = articles.filter(a => a.accountName.includes(accountName));
if (accArticles.length === 0) {
  console.error(`❌ 未找到 "${accountName}" 的文章`);
  process.exit(1);
}

console.log(`🎨 分析: ${accountName}`);
console.log(`📊 ${accArticles.length} 篇文章\n`);

const samples = accArticles.slice(0, 3).map((a, i) => `
文章${i+1}: ${a.title}
内容: ${a.content.substring(0, 500)}...
`).join('\n---\n');

const prompt = `分析以下公众号文章的写作风格，返回JSON格式:

${samples}

分析维度:
1. 标题特征: 套路、长度、钩子技巧
2. 内容结构: 开头、段落、结尾方式
3. 语言特点: 语气、词汇、句式
4. 互动策略: CTA、情绪触发
5. 发布规律: 频率、时间

输出JSON格式分析结果。`;

console.log('📝 分析提示词:\n');
console.log('─'.repeat(60));
console.log(prompt);
console.log('─'.repeat(60));
console.log('\n💡 将提示词发送给AI获取分析报告');
