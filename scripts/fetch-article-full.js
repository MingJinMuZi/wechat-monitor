#!/usr/bin/env node
/**
 * 完整文章抓取 - 包含图片、视频、样式
 * 增强版，保存完整HTML和素材
 * 
 * 修复记录:
 * 2026-03-16: 修复图片抓取问题
 *   - 等待时间从3秒增加到10秒（微信懒加载需要更长时间）
 *   - 添加封面图单独获取逻辑
 *   - 处理 data-src 懒加载属性
 *   - 过滤占位图和SVG
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = process.env.WECHAT_MONITOR_DATA_DIR || path.join(__dirname, '..', 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');

// 确保目录
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

let articles = [];
if (fs.existsSync(ARTICLES_FILE)) {
  articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
}

const url = process.argv[2];
if (!url) {
  console.error('Usage: node fetch-article-full.js "https://mp.weixin.qq.com/s/xxxxx"');
  process.exit(1);
}

console.log(`🦞 完整抓取: ${url}`);
console.log('💾 包含: 文字 + 图片(封面+正文) + HTML\n');

// 下载图片
async function downloadImage(imageUrl, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, { timeout: 30000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', reject);
  });
}

// 主函数
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  try {
    console.log('📱 打开页面...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 关键修复1: 等待10秒确保图片加载
    console.log('⏳ 等待图片加载 (10秒)...');
    await new Promise(r => setTimeout(r, 10000));
    
    // 获取基本信息
    console.log('📝 获取基本信息...');
    const basicInfo = await page.evaluate(() => {
      const title = document.querySelector('h1, #activity-name')?.innerText?.trim() || '';
      const account = document.querySelector('#js_name, .profile_nickname')?.innerText?.trim() || '';
      const time = document.querySelector('#publish_time, .rich_media_meta_text')?.innerText?.trim() || '';
      return { title, account, time };
    });
    
    // 获取纯文本内容
    console.log('📄 获取文字内容...');
    const textContent = await page.evaluate(() => {
      const content = document.querySelector('#js_content, .rich_media_content');
      return content?.innerText?.trim() || '';
    });
    
    // 关键修复2: 单独获取封面图
    console.log('🖼️  获取封面图...');
    const coverImage = await page.evaluate(() => {
      const metaImg = document.querySelector('meta[property="og:image"]')?.content;
      if (metaImg) return metaImg;
      
      const shareImg = document.querySelector('#js_share_image img');
      if (shareImg) {
        return shareImg.getAttribute('data-src') || shareImg.src;
      }
      
      const otherImg = document.querySelector('.rich_media_thumb img');
      if (otherImg) {
        return otherImg.getAttribute('data-src') || otherImg.src;
      }
      
      return null;
    });
    
    if (coverImage) {
      console.log(`  ✅ 找到封面图`);
    }
    
    // 关键修复3: 获取正文图片（处理data-src，过滤占位图）
    console.log('🖼️  获取正文图片...');
    const contentImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#js_content img, .rich_media_content img');
      return Array.from(imgs)
        .map((img, i) => {
          const src = img.getAttribute('data-src') || img.src;
          return {
            index: i,
            src: src,
            alt: img.alt || '',
            width: img.width,
            height: img.height
          };
        })
        .filter(img => {
          if (!img.src) return false;
          if (!img.src.includes('mmbiz.qpic.cn') && !img.src.includes('mmbiz.qlogo.cn')) return false;
          if (img.src.includes('svg') || img.src.includes('data:image')) return false;
          if (img.src.includes('1x1') || img.src.includes('blank')) return false;
          return true;
        });
    });
    
    // 合并封面图和正文图（去重）
    const allImageUrls = [];
    if (coverImage && !contentImages.some(img => img.src === coverImage)) {
      allImageUrls.push({ src: coverImage, type: 'cover', alt: '封面图' });
    }
    contentImages.forEach((img, i) => {
      allImageUrls.push({ ...img, type: 'content', index: i });
    });
    
    console.log(`  📊 找到 ${allImageUrls.length} 张图片 (封面${coverImage ? 1 : 0} + 正文${contentImages.length})`);
    
    // 创建文章专属目录
    const articleId = Date.now().toString();
    const articleDir = path.join(ASSETS_DIR, articleId);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }
    
    // 下载图片
    console.log('⬇️  下载图片...');
    const downloadedImages = [];
    for (let i = 0; i < allImageUrls.length; i++) {
      const img = allImageUrls[i];
      const ext = path.extname(img.src).split('?')[0] || '.jpg';
      const filename = `image_${String(i + 1).padStart(3, '0')}${ext}`;
      const filepath = path.join(articleDir, filename);
      
      try {
        await downloadImage(img.src, filepath);
        downloadedImages.push({
          original: img.src,
          local: filename,
          path: filepath,
          alt: img.alt,
          type: img.type
        });
        console.log(`  ✅ ${filename} (${img.type === 'cover' ? '封面' : '正文'})`);
      } catch (e) {
        console.log(`  ❌ ${filename}: ${e.message}`);
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    // 获取HTML内容
    console.log('🌐 获取HTML内容...');
    const htmlContent = await page.evaluate(() => {
      const content = document.querySelector('#js_content, .rich_media_content');
      return content?.innerHTML || '';
    });
    
    // 保存HTML文件
    console.log('💾 保存HTML文件...');
    let htmlWithLocalImages = htmlContent;
    downloadedImages.filter(img => img.type === 'content').forEach((img) => {
      htmlWithLocalImages = htmlWithLocalImages.replace(
        new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        img.local
      );
    });
    
    // 封面图HTML
    const coverHtml = downloadedImages.find(img => img.type === 'cover') 
      ? `<div class="cover-image"><img src="${downloadedImages.find(img => img.type === 'cover').local}" alt="封面图"></div>\n`
      : '';
    
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${basicInfo.title}</title>
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 20px; font-family: -apple-system, sans-serif; }
    img { max-width: 100%; height: auto; }
    h1 { font-size: 24px; margin-bottom: 10px; }
    .meta { color: #999; margin-bottom: 20px; }
    .content { line-height: 1.8; }
    .cover-image { margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${basicInfo.title}</h1>
  <div class="meta">
    <span>${basicInfo.account}</span> · 
    <span>${basicInfo.time}</span>
  </div>
  ${coverHtml}<div class="content">
    ${htmlWithLocalImages}
  </div>
</body>
</html>`;
    
    const htmlFile = path.join(articleDir, 'article.html');
    fs.writeFileSync(htmlFile, fullHtml);
    console.log(`  ✅ article.html`);
    
    // 保存Markdown文件
    console.log('📝 保存Markdown文件...');
    let markdownContent = `# ${basicInfo.title}\n\n`;
    markdownContent += `**公众号**: ${basicInfo.account}  \n`;
    markdownContent += `**发布时间**: ${basicInfo.time}  \n`;
    markdownContent += `**原文链接**: ${url}\n\n`;
    markdownContent += `---\n\n`;
    
    // 插入封面图
    const coverImg = downloadedImages.find(img => img.type === 'cover');
    if (coverImg) {
      markdownContent += `![封面图](${coverImg.local})\n\n`;
    }
    
    // 插入正文图片
    const contentImgs = downloadedImages.filter(img => img.type === 'content');
    if (contentImgs.length > 0) {
      markdownContent += `## 正文配图\n\n`;
      contentImgs.forEach((img, i) => {
        markdownContent += `![${img.alt || '图片' + (i + 1)}](${img.local})\n\n`;
      });
      markdownContent += `---\n\n`;
    }
    
    markdownContent += `## 正文\n\n`;
    markdownContent += textContent;
    
    const mdFile = path.join(articleDir, 'article.md');
    fs.writeFileSync(mdFile, markdownContent);
    console.log(`  ✅ article.md`);
    
    // 保存数据
    const article = {
      id: articleId,
      url: url,
      title: basicInfo.title,
      accountName: basicInfo.account,
      publishTime: basicInfo.time,
      content: textContent,
      contentLength: textContent.length,
      imageCount: allImageUrls.length,
      coverCount: coverImage ? 1 : 0,
      contentImageCount: contentImages.length,
      downloadedImages: downloadedImages.length,
      assetsDir: articleDir,
      fetchedAt: new Date().toISOString()
    };
    
    const idx = articles.findIndex(a => a.url === url);
    idx >= 0 ? articles[idx] = article : articles.push(article);
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
    
    await browser.close();
    
    console.log('\n✅ 抓取完成!');
    console.log(`📌 标题: ${basicInfo.title}`);
    console.log(`👤 公众号: ${basicInfo.account}`);
    console.log(`📝 文字: ${textContent.length} 字符`);
    console.log(`🖼️  图片: ${downloadedImages.length}/${allImageUrls.length} 张 (封面${coverImage ? 1 : 0} + 正文${contentImages.length})`);
    console.log(`💾 保存位置: ${articleDir}`);
    console.log(`   - article.html (完整网页)`);
    console.log(`   - article.md (Markdown)`);
    console.log(`   - image_xxx.jpg/png (图片文件)`);
    
  } catch (err) {
    console.error('❌ 抓取失败:', err.message);
    await browser.close().catch(() => {});
    process.exit(1);
  }
})();