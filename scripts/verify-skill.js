#!/usr/bin/env node
/**
 * Skill完整性验证脚本
 * 检查所有必需文件和功能是否完整
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// 必需文件清单
const requiredFiles = [
  { path: 'SKILL.md', desc: '技能定义文档' },
  { path: 'package.json', desc: 'Node.js配置' },
  { path: 'scripts/add-account.js', desc: '添加账号脚本' },
  { path: 'scripts/fetch-article.js', desc: '抓取文章脚本' },
  { path: 'scripts/monitor.js', desc: '监控脚本' },
  { path: 'scripts/analyze-style.js', desc: '风格分析脚本' },
  { path: 'scripts/check-deps.js', desc: '依赖检查脚本' },
  { path: 'docs/README.md', desc: '使用指南' },
  { path: 'docs/INSTALL.md', desc: '安装指南' },
  { path: 'docs/ARCHITECTURE-2G2G.md', desc: '架构文档' }
];

// 可选文件
const optionalFiles = [
  { path: 'data/accounts.json', desc: '账号数据' },
  { path: 'data/articles.json', desc: '文章数据' }
];

// 检查文件
function checkFiles() {
  console.log('\n📁 文件完整性检查\n');
  
  let allOk = true;
  
  console.log('必需文件:');
  for (const f of requiredFiles) {
    const fullPath = path.join(BASE_DIR, f.path);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${f.path} - ${f.desc}`);
    if (!exists) allOk = false;
  }
  
  console.log('\n可选文件:');
  for (const f of optionalFiles) {
    const fullPath = path.join(BASE_DIR, f.path);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✅' : '⚠️ ';
    console.log(`  ${status} ${f.path} - ${f.desc}`);
  }
  
  return allOk;
}

// 检查package.json
function checkPackageJson() {
  console.log('\n📦 package.json 检查\n');
  
  const pkgPath = path.join(BASE_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const checks = [
    ['name', pkg.name === 'wechat-monitor'],
    ['version', !!pkg.version],
    ['description', !!pkg.description],
    ['scripts.install:check', !!pkg.scripts?.['install:check']],
    ['scripts.postinstall', !!pkg.scripts?.postinstall],
    ['dependencies.puppeteer-core', !!pkg.dependencies?.['puppeteer-core']],
    ['engines.node', !!pkg.engines?.node]
  ];
  
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  }
  
  return checks.every(c => c[1]);
}

// 检查SKILL.md
function checkSkillMd() {
  console.log('\n📝 SKILL.md 检查\n');
  
  const skillPath = path.join(BASE_DIR, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  
  const checks = [
    ['name字段', content.includes('name: wechat-monitor')],
    ['description字段', content.includes('description:')],
    ['version字段', content.includes('version:')],
    ['安装说明', content.includes('## 安装')],
    ['使用方法', content.includes('## 使用方法')],
    ['依赖要求表格', content.includes('| 依赖 |')]
  ];
  
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  }
  
  return checks.every(c => c[1]);
}

// 检查脚本可执行
function checkScripts() {
  console.log('\n🔧 脚本可执行性检查\n');
  
  const scripts = [
    'scripts/add-account.js',
    'scripts/fetch-article.js',
    'scripts/monitor.js',
    'scripts/analyze-style.js',
    'scripts/check-deps.js'
  ];
  
  let allOk = true;
  
  for (const s of scripts) {
    const fullPath = path.join(BASE_DIR, s);
    try {
      const stats = fs.statSync(fullPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      const status = isExecutable ? '✅' : '⚠️ ';
      console.log(`  ${status} ${s} ${!isExecutable ? '(建议chmod +x)' : ''}`);
    } catch (e) {
      console.log(`  ❌ ${s} - ${e.message}`);
      allOk = false;
    }
  }
  
  return allOk;
}

// 主函数
function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 WeChat Monitor Skill 完整性验证');
  console.log('='.repeat(60));
  
  const results = {
    files: checkFiles(),
    package: checkPackageJson(),
    skill: checkSkillMd(),
    scripts: checkScripts()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果');
  console.log('='.repeat(60));
  
  console.log(`  ${results.files ? '✅' : '❌'} 文件完整性`);
  console.log(`  ${results.package ? '✅' : '❌'} package.json`);
  console.log(`  ${results.skill ? '✅' : '❌'} SKILL.md`);
  console.log(`  ${results.scripts ? '✅' : '❌'} 脚本可执行`);
  
  const allOk = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('🎉 Skill完整性验证通过！');
    console.log('\n💡 可以打包发布或迁移到其他平台');
  } else {
    console.log('⚠️  验证未通过，请修复上述问题');
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(allOk ? 0 : 1);
}

main();
