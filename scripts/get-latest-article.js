#!/usr/bin/env node

/**
 * 获取对标账号最新文章
 * 使用 Tavily 搜索最新文章
 */

const { search } = require('@tavily/core');
require('dotenv').config({ path: '.env' });

// 默认账号名称（可通过命令行参数覆盖）
const accountName = process.argv[2] || 'XXX 对标账号';

async function getLatestArticles(accountName, limit = 5) {
  try {
    const tavily = search(process.env.TAVILY_API_KEY);
    
    // 搜索微信公众号文章
    const results = await tavily.search(
      `${accountName} site:mp.weixin.qq.com`,
      {
        maxResults: 10,
        topic: 'general',
        days: 7
      }
    );
    
    const articles = [];
    for (const result of results.results) {
      if (result.url?.includes('mp.weixin.qq.com')) {
        articles.push({
          title: result.title,
          url: result.url,
          publishedAt: result.publishedDate,
          snippet: result.content
        });
      }
    }
    
    return articles.slice(0, limit);
  } catch (error) {
    console.error('搜索失败:', error.message);
    return [];
  }
}

async function main() {
  console.log(`🔍 搜索 "${accountName}" 最新文章...\n`);
  
  const articles = await getLatestArticles(accountName, 5);
  
  if (articles.length === 0) {
    console.log('❌ 未找到最新文章');
    return;
  }
  
  console.log(`✅ 找到 ${articles.length} 篇文章:\n`);
  articles.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   ${article.url}`);
    console.log(`   ${article.publishedAt || '未知时间'}\n`);
  });
  
  console.log('💡 下一步:');
  console.log(`   node scripts/fetch-article-full.js "${articles[0].url}"`);
}

main();
