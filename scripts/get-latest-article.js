#!/usr/bin/env node
/**
 * 获取公众号最新文章
 * 通过搜索获取最新文章链接
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

const accounts = fs.existsSync(ACCOUNTS_FILE) ? JSON.parse(fs.readFileSync(ACCOUNTS_FILE)) : [];
const accountName = process.argv[2] || '逛逛GitHub';

console.log(`🔍 获取 ${accountName} 最新文章...\n`);

// 搜索最新文章
const queries = [
  `${accountName} site:mp.weixin.qq.com`,
  `${accountName} 微信公众号 最新`,
  `${accountName} github 开源`
];

const foundUrls = [];

for (const query of queries) {
  console.log(`🔎 搜索: ${query}`);
  try {
    const output = execSync(
      `node ~/.openclaw/workspace/skills/tavily-search/search.js "${query}" --time-range week`,
      { encoding: 'utf8', timeout: 30000 }
    );
    
    const data = JSON.parse(output);
    
    for (const result of data.results || []) {
      if (result.url?.includes('mp.weixin.qq.com')) {
        foundUrls.push({
          url: result.url,
          title: result.title,
          content: result.content?.substring(0, 200)
        });
        console.log(`  📄 ${result.title}`);
        console.log(`     ${result.url}`);
      }
    }
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
  
  // 间隔
  if (foundUrls.length === 0) {
    console.log('  ⏳ 等待...\n');
    execSync('sleep 2');
  }
}

// 去重
const uniqueUrls = [];
const seen = new Set();
for (const u of foundUrls) {
  if (!seen.has(u.url)) {
    seen.add(u.url);
    uniqueUrls.push(u);
  }
}

console.log(`\n📊 找到 ${uniqueUrls.length} 篇 unique 文章`);

if (uniqueUrls.length > 0) {
  // 保存到文件
  const urlsFile = path.join(DATA_DIR, 'latest-urls.json');
  fs.writeFileSync(urlsFile, JSON.stringify(uniqueUrls, null, 2));
  
  console.log('\n✅ 已保存到:', urlsFile);
  console.log('\n💡 抓取最新文章:');
  console.log(`  node scripts/fetch-article.js "${uniqueUrls[0].url}"`);
}
