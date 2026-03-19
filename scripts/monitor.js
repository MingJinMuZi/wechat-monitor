#!/usr/bin/env node
/**
 * 定时监控新文章
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const LOG_FILE = path.join(DATA_DIR, 'monitor.log');

const accounts = fs.existsSync(ACCOUNTS_FILE) ? JSON.parse(fs.readFileSync(ACCOUNTS_FILE)) : [];
const articles = fs.existsSync(ARTICLES_FILE) ? JSON.parse(fs.readFileSync(ARTICLES_FILE)) : [];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function checkAccount(account) {
  log(`\n🔍 ${account.name}`);
  try {
    const query = `${account.name} 微信公众号`;
    const out = execSync(`node ~/.openclaw/workspace/skills/tavily-search/search.js "${query}"`, 
      { encoding: 'utf8', timeout: 30000 });
    const data = JSON.parse(out);
    
    const newUrls = [];
    for (const r of data.results || []) {
      if (r.url?.includes('mp.weixin.qq.com') && !articles.some(a => a.url === r.url)) {
        newUrls.push({ url: r.url, title: r.title });
      }
    }
    log(`  📊 ${newUrls.length} 篇新文章`);
    return newUrls;
  } catch (e) {
    log(`  ❌ ${e.message}`);
    return [];
  }
}

async function main() {
  log('\n' + '='.repeat(50));
  log('🚀 监控启动');
  log(`📋 ${accounts.length} 个账号, ${articles.length} 篇文章`);
  
  const allNew = [];
  for (const acc of accounts) {
    allNew.push(...await checkAccount(acc));
    await new Promise(r => setTimeout(r, 3000));
  }
  
  if (allNew.length > 0) {
    const urlsFile = path.join(DATA_DIR, 'urls-to-fetch.txt');
    fs.writeFileSync(urlsFile, allNew.map(u => u.url).join('\n'));
    log(`\n🎉 ${allNew.length} 篇新文章!`);
    log(`💡 node fetch-article.js "链接"`);
  } else {
    log('\n✅ 无新文章');
  }
  
  accounts.forEach(a => a.lastChecked = new Date().toISOString());
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

main().catch(e => log(`💥 ${e.message}`));
