#!/usr/bin/env node
/**
 * 添加对标账号
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let accounts = [];
if (fs.existsSync(ACCOUNTS_FILE)) {
  accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
}

const [name, sampleUrl] = process.argv.slice(2);
if (!name) {
  console.error('Usage: node add-account.js "公众号名称" ["示例链接"]');
  process.exit(1);
}

const existing = accounts.find(a => a.name === name);
if (existing) {
  console.log(`⚠️ "${name}" 已存在`);
  if (sampleUrl) {
    existing.sampleUrl = sampleUrl;
    existing.updatedAt = new Date().toISOString();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  }
  process.exit(0);
}

accounts.push({
  id: Date.now().toString(), name, sampleUrl,
  addedAt: new Date().toISOString(), status: 'active'
});

fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
console.log('✅ 添加成功!');
console.log(`📌 ${name}`);
console.log(`📊 共 ${accounts.length} 个账号`);
