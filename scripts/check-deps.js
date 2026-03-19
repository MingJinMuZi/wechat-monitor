#!/usr/bin/env node
/**
 * 依赖检查和自动安装脚本
 * 第1次使用时运行，检查环境并自动修复
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_DIR = path.join(__dirname, '..');
const NODE_MODULES = path.join(BASE_DIR, 'node_modules');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, msg) {
  const color = colors[level] || colors.reset;
  console.log(`${color}${msg}${colors.reset}`);
}

// 检查Node.js版本
function checkNodeVersion() {
  log('blue', '\n📦 检查 Node.js...');
  const version = process.version;
  const major = parseInt(version.match(/v(\d+)/)[1]);
  
  log('cyan', `  当前版本: ${version}`);
  
  if (major < 18) {
    log('red', '  ❌ Node.js版本过低，需要 >= 18.0.0');
    log('yellow', '  💡 请升级Node.js: https://nodejs.org/');
    return false;
  }
  
  log('green', '  ✅ Node.js版本符合要求');
  return true;
}

// 检查Chromium
function checkChromium() {
  log('blue', '\n🌐 检查 Chromium 浏览器...');
  
  const chromiumPaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  
  for (const p of chromiumPaths) {
    if (fs.existsSync(p)) {
      try {
        const version = execSync(`"${p}" --version`, { encoding: 'utf8' }).trim();
        log('cyan', `  找到: ${p}`);
        log('cyan', `  版本: ${version}`);
        log('green', '  ✅ Chromium已安装');
        return p;
      } catch (e) {
        continue;
      }
    }
  }
  
  log('red', '  ❌ 未找到Chromium浏览器');
  log('yellow', '  💡 请安装:');
  log('yellow', '     Ubuntu/Debian: sudo apt install chromium-browser');
  log('yellow', '     CentOS/RHEL: sudo yum install chromium');
  log('yellow', '     Mac: brew install chromium');
  return null;
}

// 检查npm包
function checkNpmPackage(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

// 安装npm包
function installPackage(name, version = '') {
  log('yellow', `  ⏳ 安装 ${name}...`);
  try {
    execSync(`npm install ${name}${version ? '@' + version : ''} --save`, {
      cwd: BASE_DIR,
      stdio: 'inherit'
    });
    log('green', `  ✅ ${name} 安装成功`);
    return true;
  } catch (e) {
    log('red', `  ❌ ${name} 安装失败: ${e.message}`);
    return false;
  }
}

// 检查并安装依赖
function checkAndInstallDeps() {
  log('blue', '\n📥 检查 npm 依赖...');
  
  const deps = [
    { name: 'puppeteer-core', version: '^21.0.0', required: true },
    { name: 'sqlite3', version: '^5.1.6', required: false, desc: 'SQLite数据库(可选)' }
  ];
  
  let allInstalled = true;
  
  for (const dep of deps) {
    const installed = checkNpmPackage(dep.name);
    if (installed) {
      log('green', `  ✅ ${dep.name} 已安装`);
    } else {
      log('yellow', `  ⚠️  ${dep.name} 未安装${dep.desc ? ' (' + dep.desc + ')' : ''}`);
      if (dep.required || process.argv.includes('--install-all')) {
        if (!installPackage(dep.name, dep.version)) {
          if (dep.required) allInstalled = false;
        }
      }
    }
  }
  
  return allInstalled;
}

// 检查数据目录
function checkDataDir() {
  log('blue', '\n💾 检查数据目录...');
  
  const dataDir = process.env.WECHAT_MONITOR_DATA_DIR || path.join(BASE_DIR, 'data');
  
  if (!fs.existsSync(dataDir)) {
    log('yellow', `  ⏳ 创建数据目录: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 创建必要的JSON文件
  const files = ['accounts.json', 'articles.json'];
  for (const f of files) {
    const fp = path.join(dataDir, f);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, '[]');
      log('cyan', `  创建: ${f}`);
    }
  }
  
  log('green', '  ✅ 数据目录就绪');
  return dataDir;
}

// 检查Tavily API Key
function checkTavilyConfig() {
  log('blue', '\n🔑 检查 Tavily API...');
  
  const key = process.env.TAVILY_API_KEY;
  if (key) {
    log('green', '  ✅ TAVILY_API_KEY 已配置');
    return true;
  }
  
  log('yellow', '  ⚠️  TAVILY_API_KEY 未配置');
  log('cyan', '  💡 Tavily搜索功能需要API Key');
  log('cyan', '     获取地址: https://tavily.com');
  log('cyan', '     配置方式: export TAVILY_API_KEY="your-key"');
  return false;
}

// 测试抓取功能
async function testFetch(chromiumPath) {
  log('blue', '\n🧪 测试抓取功能...');
  
  const puppeteer = require('puppeteer-core');
  
  try {
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.example.com', { timeout: 10000 });
    const title = await page.title();
    await browser.close();
    
    log('green', `  ✅ 浏览器测试通过 (标题: ${title})`);
    return true;
  } catch (e) {
    log('red', `  ❌ 浏览器测试失败: ${e.message}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('\n' + '='.repeat(60));
  log('cyan', '🦞 WeChat Monitor - 环境检查');
  console.log('='.repeat(60));
  
  const results = {
    node: checkNodeVersion(),
    chromium: checkChromium(),
    deps: checkAndInstallDeps(),
    dataDir: checkDataDir(),
    tavily: checkTavilyConfig()
  };
  
  // 如果Chromium和依赖都OK，测试抓取
  if (results.chromium && results.deps) {
    results.test = await testFetch(results.chromium);
  }
  
  // 总结
  console.log('\n' + '='.repeat(60));
  log('cyan', '📊 检查结果');
  console.log('='.repeat(60));
  
  const checks = [
    ['Node.js', results.node],
    ['Chromium', !!results.chromium],
    ['npm依赖', results.deps],
    ['数据目录', !!results.dataDir],
    ['浏览器测试', results.test]
  ];
  
  for (const [name, ok] of checks) {
    if (ok === undefined) continue;
    const status = ok ? colors.green + '✅' : colors.red + '❌';
    console.log(`  ${status} ${name}${colors.reset}`);
  }
  
  const allOk = results.node && results.chromium && results.deps && results.dataDir;
  
  console.log('\n' + '='.repeat(60));
  if (allOk) {
    log('green', '🎉 环境检查通过！可以开始使用');
    console.log('\n💡 快速开始:');
    console.log('  node scripts/add-account.js "公众号名" "链接"');
    console.log('  node scripts/fetch-article.js "文章链接"');
    console.log('  node scripts/monitor.js');
  } else {
    log('red', '⚠️  环境检查未通过，请修复上述问题');
    console.log('\n💡 修复后重新运行:');
    console.log('  node scripts/check-deps.js');
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(allOk ? 0 : 1);
}

main().catch(e => {
  log('red', `\n💥 检查出错: ${e.message}`);
  process.exit(1);
});
