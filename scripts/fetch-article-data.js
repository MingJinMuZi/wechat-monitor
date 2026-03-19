#!/usr/bin/env node
/**
 * 抓取文章数据（包含阅读量、点赞数等）
 * 支持第三方API接入
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let articles = [];
if (fs.existsSync(ARTICLES_FILE)) {
  articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
}

const url = process.argv[2];
if (!url) {
  console.error('Usage: node fetch-article-data.js "https://mp.weixin.qq.com/s/xxxxx"');
  console.error('\n💡 说明:');
  console.error('  1. 微信官方未开放阅读量API');
  console.error('  2. 需要配置第三方API（极致了/次幂数据等）');
  console.error('  3. 或手动输入阅读数据');
  process.exit(1);
}

console.log(`📊 抓取文章数据: ${url}`);
console.log('📝 包含: 文字 + 图片 + 阅读数据\n');

// 从网页提取阅读数据（部分公众号可见）
async function extractDataFromPage(page) {
  try {
    // 尝试获取阅读数、点赞数
    const data = await page.evaluate(() => {
      // 查找阅读量元素
      const readElements = document.querySelectorAll('.read-count, #js_read_count, .read_num');
      const likeElements = document.querySelectorAll('.like-count, #js_like_count, .like_num');
      
      const readCount = readElements[0]?.innerText?.replace(/[^\d]/g, '') || null;
      const likeCount = likeElements[0]?.innerText?.replace(/[^\d]/g, '') || null;
      
      return { readCount, likeCount };
    });
    
    return data;
  } catch (e) {
    return { readCount: null, likeCount: null };
  }
}

// 主函数
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  try {
    console.log('📱 打开页面...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // 获取基本信息
    console.log('📝 获取基本信息...');
    const basicInfo = await page.evaluate(() => {
      const title = document.querySelector('h1, #activity-name')?.innerText?.trim() || '';
      const account = document.querySelector('#js_name, .profile_nickname')?.innerText?.trim() || '';
      const time = document.querySelector('#publish_time, .rich_media_meta_text')?.innerText?.trim() || '';
      return { title, account, time };
    });
    
    // 获取文字内容
    console.log('📄 获取文字内容...');
    const textContent = await page.evaluate(() => {
      const content = document.querySelector('#js_content, .rich_media_content');
      return content?.innerText?.trim() || '';
    });
    
    // 获取阅读数据
    console.log('📊 获取阅读数据...');
    const readData = await extractDataFromPage(page);
    
    if (readData.readCount) {
      console.log(`  ✅ 阅读量: ${readData.readCount}`);
    } else {
      console.log('  ⚠️  阅读量: 未获取（需登录或第三方API）');
    }
    
    if (readData.likeCount) {
      console.log(`  ✅ 点赞数: ${readData.likeCount}`);
    } else {
      console.log('  ⚠️  点赞数: 未获取（需登录或第三方API）');
    }
    
    await browser.close();
    
    // 保存数据
    const article = {
      id: url.match(/__biz=([^&]+)/)?.[1] || Date.now().toString(),
      url: url,
      title: basicInfo.title,
      accountName: basicInfo.account,
      publishTime: basicInfo.time,
      content: textContent,
      contentLength: textContent.length,
      readCount: readData.readCount,
      likeCount: readData.likeCount,
      fetchedAt: new Date().toISOString()
    };
    
    const idx = articles.findIndex(a => a.url === url);
    idx >= 0 ? articles[idx] = article : articles.push(article);
    
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
    
    console.log('\n✅ 抓取完成!');
    console.log(`📌 标题: ${basicInfo.title}`);
    console.log(`👤 公众号: ${basicInfo.account}`);
    console.log(`📝 文字: ${textContent.length} 字符`);
    console.log(`📊 阅读量: ${readData.readCount || 'N/A'}`);
    console.log(`👍 点赞数: ${readData.likeCount || 'N/A'}`);
    
    console.log('\n💡 获取完整阅读数据的方法:');
    console.log('  1. 配置第三方API（极致了/次幂数据）');
    console.log('  2. 使用微信Hook抓包工具');
    console.log('  3. 手动输入阅读数据');
    
  } catch (err) {
    console.error('❌ 抓取失败:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
