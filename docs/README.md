# WeChat Monitor - 文档目录

## 快速开始

- [INSTALL.md](INSTALL.md) - 安装指南
- [ARCHITECTURE-2G2G.md](ARCHITECTURE-2G2G.md) - 架构设计

## 报告标准

- [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md) - 报告输出标准模板
- [EXAMPLE-REPORT.md](EXAMPLE-REPORT.md) - 完整报告示例（逛逛GitHub）

## 其他

- [CHECKLIST.md](../CHECKLIST.md) - Skill完整性清单

## 报告示例

### 逛逛GitHub深度分析

文件：`EXAMPLE-REPORT.md`

包含完整的：
- 数据采集（账号信息、统计数据、采集方式）
- 抓取文章（基本信息、正文）
- 深度分析（标题拆解、维度分析、内容结构、语言特点、互动策略、爆款特征、对标价值）
- 总结评分
- 下载信息

### 使用报告模板

```bash
# 生成报告
node scripts/generate-report.js "公众号名称"

# 查看报告
cat data/reports/xxx-report.md
```
