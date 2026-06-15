# 智能错题簿

面向初中生、老师、家长的错题管理及学习分析平台。

## 功能

- **错题管理**：手动录入 + OCR 拍照识别
- **知识点巩固**：按学科/章节管理知识点，自动统计薄弱环节
- **智能评测**：基于知识点的选择题 / 填空题 / 判断题练习
- **AI 智能体**：错题分析、学习建议、知识答疑
- **统计分析**：学科分布、掌握程度、本周趋势
- **练习册**：自定义错题合集，强化练习

## 技术栈

| 类别       | 技术                              |
| ---------- | --------------------------------- |
| 前端框架   | Next.js 16 (App Router)           |
| 语言       | TypeScript                        |
| 样式       | Tailwind CSS 4                    |
| 后端       | Supabase（Auth + Postgres + Storage） |
| 状态管理   | Zustand                           |
| 表单       | React Hook Form + Zod             |
| 部署       | Vercel                            |

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 填写 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. 初始化数据库（Supabase SQL Editor 中执行）
#    supabase/schema.sql

# 4. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 脚本

| 命令            | 说明         |
| --------------- | ------------ |
| `npm run dev`   | 启动开发服务 |
| `npm run build` | 生产构建     |
| `npm run start` | 启动生产服务 |
| `npm run lint`  | ESLint 检查  |

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 登录 / 注册
│   ├── (main)/            # 主页面（受 proxy 保护）
│   │   ├── dashboard/
│   │   ├── wrong-questions/
│   │   ├── knowledge/
│   │   ├── workbook/
│   │   ├── assessment/
│   │   ├── agent/
│   │   └── statistics/
│   └── api/               # 后端 API
├── components/ui/         # 基础 UI 组件
├── hooks/                 # 共享 hooks
├── lib/                   # 数据访问与工具
│   ├── supabase.ts        # Supabase 客户端 + 类型
│   ├── database.ts        # CRUD 封装
│   └── utils.ts           # 防抖/节流等
├── store/                 # Zustand 状态
└── proxy.ts               # 登录守卫（Next.js 16 取代 middleware）
```

## CI/CD

GitHub Actions：

- `lint.yml` — ESLint
- `typecheck.yml` — TypeScript
- `build.yml` — Next.js 构建
- `ci.yml` — 聚合 + Vercel PR 预览

## 路线图

- [x] 用户注册/登录
- [x] 错题 CRUD + OCR
- [x] 知识点管理
- [x] 智能评测
- [x] 练习册
- [x] AI 智能体
- [x] 统计分析
- [ ] 老师-学生关联
- [ ] 家长查看
- [ ] AI 自动出题
