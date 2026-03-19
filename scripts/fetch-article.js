#!/usr/bin/env node
/**
 * 抓取单篇公众号文章
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
  console.error('Usage: node fetch-article.js "https://mp.weixin.qq.com/s/xxxxx"');
  process.exit(1);
}

console.log(`🦞 抓取: ${url}`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const data = await page.evaluate(() => {
      const title = document.querySelector('h1, #activity-name')?.innerText?.trim() || '';
      const account = document.querySelector('#js_name, .profile_nickname')?.innerText?.trim() || '';
      const time = document.querySelector('#publish_time, .rich_media_meta_text')?.innerText?.trim() || '';
      const content = document.querySelector('#js_content, .rich_media_content')?.innerText?.trim() || '';
      return { title, account, time, content };
    });
    
    const article = {
      id: url.match(/__biz=([^&]+)/)?.[1] || Date.now().toString(),
      url, title: data.title || '未获取标题',
      accountName: data.account || '未知公众号',
      publishTime: data.time, content: data.content,
      contentLength: data.content.length,
      fetchedAt: new Date().toISOString()
    };
    
    const idx = articles.findIndex(a => a.url === url);
    idx >= 0 ? articles[idx] = article : articles.push(article);
    
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
    
    console.log('✅ 成功!');
    console.log(`📌 ${article.title}`);
    console.log(`👤 ${article.accountName}`);
    console.log(`📝 ${article.contentLength}字符`);
    
  } catch (err) {
    console.error('❌ 失败:', err.message);
  } finally {
    await browser.close();
  }
})();
