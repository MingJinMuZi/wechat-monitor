# WeChat Monitor - 安装指南

## 快速安装 (3步)

### 第1步: 运行依赖检查

```bash
cd wechat-monitor
node scripts/check-deps.js
```

这个脚本会自动：
- ✅ 检查Node.js版本 (需要 >= 18)
- ✅ 检查Chromium浏览器
- ✅ 自动安装npm依赖 (puppeteer-core)
- ✅ 创建数据目录
- ✅ 检查Tavily API配置
- ✅ 测试浏览器功能

### 第2步: 配置API Key (可选)

如果需要AI搜索功能，配置Tavily API Key：

```bash
# 临时配置 (当前终端)
export TAVILY_API_KEY="tvly-your-key"

# 永久配置 (添加到 ~/.bashrc 或 ~/.zshrc)
echo 'export TAVILY_API_KEY="tvly-your-key"' >> ~/.bashrc
source ~/.bashrc
```

获取API Key: https://tavily.com

### 第3步: 开始使用

```bash
# 添加第一个监控账号
node scripts/add-account.js "逛逛GitHub" "https://mp.weixin.qq.com/s/xxxxx"

# 抓取文章
node scripts/fetch-article.js "https://mp.weixin.qq.com/s/xxxxx"

# 监控新文章
node scripts/monitor.js
```

---

## 手动安装 (如果自动安装失败)

### 1. 安装Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
sudo yum install -y nodejs

# Mac
brew install node
```

验证: `node --version` (需要 >= 18)

### 2. 安装Chromium

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y chromium-browser

# CentOS/RHEL
sudo yum install -y chromium

# Mac
brew install chromium
```

验证: `chromium-browser --version`

### 3. 安装npm依赖

```bash
cd wechat-monitor
npm install
```

### 4. 创建数据目录

```bash
mkdir -p data
echo '[]' > data/accounts.json
echo '[]' > data/articles.json
```

---

## 常见问题

### Q1: 提示 "Node.js版本过低"

**解决**: 升级Node.js到18+
```bash
# 使用nvm升级
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Q2: 提示 "未找到Chromium"

**解决**: 安装Chromium浏览器
```bash
# 查找系统中已有的Chrome
which google-chrome || which chromium-browser || which chromium

# 如果没有，安装
sudo apt install chromium-browser  # Ubuntu
sudo yum install chromium          # CentOS
```

### Q3: puppeteer-core安装失败

**解决**: 使用npm镜像或代理
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install

# 或使用代理
npm install --proxy http://proxy.company.com:8080
```

### Q4: 抓取时超时

**解决**: 检查网络或增加超时时间
```bash
# 编辑 scripts/fetch-article.js，增加timeout
await page.goto(url, { timeout: 120000 });  // 2分钟
```

### Q5: 内存不足

**解决**: 减少并发或增加swap
```bash
# 创建2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 验证安装

```bash
# 1. 检查Node.js
node --version  # v18+ ✅

# 2. 检查Chromium
chromium-browser --version  # 100+ ✅

# 3. 检查依赖
ls node_modules/puppeteer-core  # 存在 ✅

# 4. 测试抓取
node scripts/fetch-article.js "https://mp.weixin.qq.com/s/xxxxx"
```

---

## 卸载

```bash
# 删除Skill目录
rm -rf wechat-monitor

# 删除数据 (可选)
rm -rf ~/.openclaw/workspace/skills/wechat-monitor

# 卸载全局依赖 (可选)
npm uninstall -g puppeteer-core
```

---

## 技术支持

- 文档: `docs/README.md`
- 架构: `docs/ARCHITECTURE-2G2G.md`
- 检查脚本: `scripts/check-deps.js`
