# WeChat Monitor - 微信公众号对标监控系统

🔍 自动抓取微信公众号文章，分析写作风格，生成深度分析报告

## ✨ 功能特性

- 📊 **自动监控** - 跟踪对标公众号新文章
- 📄 **完整抓取** - 文字、图片、HTML、排版样式
- 🧠 **AI 分析** - 深度分析写作风格、标题套路、内容结构
- 📈 **数据报告** - 生成可视化分析报告
- 🎯 **风格档案** - 建立可复用的写作风格模板

## 🚀 快速开始

### 1. 安装依赖

```bash
cd wechat-monitor

# 安装 Node.js 依赖
npm install

# 安装 Python 依赖（可选，用于图片处理）
pip install requests Pillow
```

### 2. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Tavily API Key
# 获取地址：https://app.tavily.com/
```

### 3. 检查依赖

```bash
node scripts/check-deps.js
```

### 4. 开始使用

```bash
# 抓取单篇文章
node scripts/fetch-article-full.js "文章链接"

# 分析公众号风格
node scripts/analyze-style.js "公众号名称"

# 生成深度报告
node scripts/report.js "公众号名称"
```

## 📖 使用文档

### 抓取文章

```bash
node scripts/fetch-article-full.js "https://mp.weixin.qq.com/s/xxx"
```

**输出**：
- `article.html` - 完整网页
- `article.md` - Markdown 格式
- `article.json` - 元数据
- `image_*.jpg/png` - 所有图片

### 风格分析

```bash
node scripts/analyze-style.js "老赵讲道理"
```

**分析维度**：
- 标题套路（疑问式、否定式、热点式）
- 内容结构（钩子、共情、案例、对比、金句）
- 语言风格（口语化、人称使用、标志性句式）
- 配图策略（主题、风格、使用规律）

### 生成报告

```bash
# 分析最新抓取的文章
node scripts/report.js "公众号名称"

# 分析指定文章
node scripts/report.js "公众号名称" 2
```

## 📁 项目结构

```
wechat-monitor/
├── scripts/              # 脚本目录
│   ├── fetch-article-full.js    # 文章抓取
│   ├── analyze-style.js         # 风格分析
│   ├── report.js                # 生成报告
│   └── check-deps.js            # 依赖检查
├── docs/                 # 文档目录
│   ├── INSTALL.md        # 安装指南
│   └── USAGE.md          # 使用指南
├── tests/                # 测试目录
├── data/                 # 数据目录（已忽略）
├── SKILL.md              # 技能定义
├── README.md             # 项目说明
├── LICENSE               # MIT 许可证
├── .env.example          # 配置模板
└── .gitignore            # Git 忽略规则
```

## 🔧 配置说明

### 必需配置

| 变量 | 说明 | 获取方式 |
|------|------|---------|
| `TAVILY_API_KEY` | Tavily 搜索 API | https://app.tavily.com/ |

### 可选配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WECHAT_MONITOR_DATA_DIR` | 数据存储目录 | `./data` |

## 🎯 使用场景

1. **对标学习** - 分析优秀公众号的写作技巧
2. **风格模仿** - 学习并模仿特定写作风格
3. **内容创作** - 基于分析结果指导创作
4. **竞品分析** - 跟踪竞争对手的内容策略

## ⚠️ 注意事项

1. **遵守版权** - 抓取内容仅用于学习，请勿直接抄袭
2. **合理频率** - 避免频繁抓取，建议间隔 5 秒以上
3. **API 限制** - Tavily 免费版有调用次数限制
4. **数据隐私** - 不要抓取敏感或私密内容

## 📝 示例输出

### 风格分析报告

```markdown
# 老赵讲道理 - 风格分析报告

## 标题套路
- 疑问式：《为什么...？》
- 否定式：《不要...》
- 热点式：《2024 年...》

## 内容结构
1. 钩子 (50-80 字)
2. 共情 (80-100 字)
3. 案例 (400-500 字)
4. 对比 (150-200 字)
5. 金句 (100-150 字)

## 语言特征
- 人称：第一人称/第二人称混用
- 语气：口语化、接地气
- 句式：短句为主，多用反问
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 👤 作者

MingJinMuZi

## 🔗 相关链接

- [OpenClaw](https://github.com/openclaw/openclaw)
- [ClawHub](https://clawhub.ai/)
- [Tavily API](https://tavily.com/)
