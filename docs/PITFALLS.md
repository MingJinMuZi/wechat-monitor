# WeChat Monitor - 常见错误和避坑指南

> 基于实战经验的错误总结，避免重复踩坑

---

## 错误1: 找错文章

### 现象
抓取到错误公众号的文章，分析报告完全错误。

### 原因
- 使用了自动搜索结果
- 未使用用户提供的准确链接

### 解决
**必须优先使用用户提供的链接**：
```bash
# ❌ 错误：依赖自动搜索
node scripts/get-latest-article.js "公众号名称"

# ✅ 正确：使用用户提供的链接
node scripts/fetch-article-full.js "https://mp.weixin.qq.com/s/xxxxx"
```

### 预防
- 询问用户是否有指定文章链接
- 自动搜索仅作为备用方案
- 抓取前确认文章标题和公众号

---

## 错误2: 图片数量不对

### 现象
报告中的图片数量与实际不符（如写1张，实际3张）。

### 原因
1. **未处理微信懒加载** - 微信使用 `data-src` 属性延迟加载图片
2. **未等待图片加载** - 页面打开后立即获取，图片还未加载
3. **漏了封面图** - 只抓了正文图，漏了封面图
4. **未过滤占位图** - 把1x1像素的占位图也算进去了

### 解决
**正确的图片抓取代码**：
```javascript
// 1. 等待页面完全加载（关键！）
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 10000)); // 等待10秒

// 2. 获取封面图
const coverUrl = await page.evaluate(() => {
  return document.querySelector('meta[property="og:image"]')?.content
    || document.querySelector('#js_share_image img')?.getAttribute('data-src')
    || document.querySelector('#js_share_image img')?.src;
});

// 3. 获取正文图片（处理data-src，过滤占位图）
const images = await page.evaluate(() => {
  const imgs = document.querySelectorAll('#js_content img');
  return Array.from(imgs)
    .map(img => img.getAttribute('data-src') || img.src)
    .filter(src => {
      // 必须是微信图片
      if (!src || !src.includes('mmbiz.qpic.cn')) return false;
      // 过滤占位图（SVG或极小图片）
      if (src.includes('svg') || src.includes('data:image')) return false;
      return true;
    });
});

// 4. 合并并去重
const allImages = [coverUrl, ...images].filter((v, i, a) => a.indexOf(v) === i);
```

### 预防
- 等待8-10秒确保图片加载
- 处理 `data-src` 属性
- 单独获取封面图
- 过滤占位图
- **与原文核对图片数量**

---

## 错误3: 数据不准确

### 现象
字数、段落数等统计数据与实际不符。

### 原因
- 未正确统计（如只统计了可见文字）
- 未与原文核对

### 解决
**准确统计方法**：
```javascript
// 获取纯文本内容
const textContent = await page.evaluate(() => {
  const content = document.querySelector('#js_content');
  return content?.innerText?.trim() || '';
});

// 统计
const stats = {
  charCount: textContent.length,  // 字符数
  paragraphCount: textContent.split('\n').filter(p => p.trim()).length,  // 段落数
  // ...
};
```

### 预防
- 使用 `innerText` 获取完整文字
- 与原文人工核对一遍
- 报告生成后检查数据合理性

---

## 错误4: 排版信息缺失

### 现象
报告缺少字体、大小、间距等排版样式信息。

### 原因
- 未获取计算样式
- 不知道需要分析排版

### 解决
**获取排版样式**：
```javascript
const styles = await page.evaluate(() => {
  const title = document.querySelector('h1, .rich_media_title');
  const content = document.querySelector('#js_content');
  const firstP = content?.querySelector('p');
  
  return {
    title: {
      fontSize: window.getComputedStyle(title)?.fontSize,
      fontWeight: window.getComputedStyle(title)?.fontWeight,
      lineHeight: window.getComputedStyle(title)?.lineHeight,
      color: window.getComputedStyle(title)?.color,
    },
    content: {
      fontSize: window.getComputedStyle(content)?.fontSize,
      lineHeight: window.getComputedStyle(content)?.lineHeight,
    },
    paragraph: {
      fontSize: window.getComputedStyle(firstP)?.fontSize,
      marginBottom: window.getComputedStyle(firstP)?.marginBottom,
      textIndent: window.getComputedStyle(firstP)?.textIndent,
    }
  };
});
```

### 预防
- 将排版分析加入标准流程
- 使用 `getComputedStyle` 获取实际样式

---

## 标准检查清单

抓取文章后，必须检查：

- [ ] 是否使用了用户提供的链接？
- [ ] 是否等待了8-10秒让图片加载？
- [ ] 是否获取了封面图？
- [ ] 是否处理了 `data-src` 懒加载？
- [ ] 是否过滤了占位图？
- [ ] 图片数量是否与原文一致？
- [ ] 字数统计是否准确？
- [ ] 是否获取了排版样式？
- [ ] 报告数据是否与实物核对？

---

## 实战案例

### 案例: 对标账号文章分析

**时间**: 2026-03-15

**错误1**: 找错文章
- 使用了自动搜索结果
- 抓取到"郭美青聊AI"而非"对标账号"
- **解决**: 使用老板提供的正确链接重新抓取

**错误2**: 图片数量错误
- 第一次: 报告写1张，实际3张
- 第二次: 修正为2张，仍漏了封面
- 第三次: 最终确认为3张（封面1 + 正文2）
- **解决**: 
  - 等待10秒确保加载
  - 单独获取封面图
  - 处理 `data-src` 属性
  - 与原文核对

**错误3**: 排版信息缺失
- 报告缺少字体、大小、间距
- **解决**: 使用 Puppeteer 获取计算样式

**教训**:
1. 必须使用用户提供的链接
2. 图片抓取要完整（封面+正文）
3. 数据必须与原文核对
4. 排版分析不能少

---

## 相关文档

- [SKILL.md](../SKILL.md) - 技能主文档
- [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md) - 报告模板
- [docs/ARCHITECTURE-2G2G.md](ARCHITECTURE-2G2G.md) - 架构设计

---

*最后更新: 2026-03-15*
