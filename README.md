<p align="right">
  <a href="#english">English</a> | <strong>中文</strong>
</p>

# 🏠 个人网站 — RoccoLiang

一个基于 **Next.js 13** 构建的个人生活记录网站，用于追踪旅行、观影和游戏。采用 App Router、TypeScript、Tailwind CSS 和 Supabase 全栈方案。

> 💡 右上角可切换至 [English](#english)

---

## ✨ 功能特性

| 模块 | 功能 |
|------|------|
| 🗺️ **旅行** | 旅行记录列表（按年份分组）、详情页支持 Markdown 渲染和图片画廊 |
| 🎬 **电影** | 电影列表（年份/月份筛选、分页）、评分、短评；后台集成 **TMDB** 自动填充电影信息 |
| 🎮 **游戏** | 游戏列表（状态/平台/年份/月份筛选）、年度时间线视图、**Excel 导出**；后台集成 **Steam** 搜索 |
| 📷 **相册** | 密码保护的相册浏览，灯箱查看器，支持键盘导航（方向键/ESC） |
| 🔐 **管理后台** | 各模块独立的 CRUD 管理页面，密码认证 |
| ☁️ **双存储** | 支持 Supabase Storage 和 Cloudflare R2，内置一键迁移工具 |

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 13 (App Router) + React 18 + TypeScript |
| 样式 | Tailwind CSS + @tailwindcss/typography |
| UI 组件 | Ant Design (DatePicker, Pagination 等) |
| 图标 | Lucide React |
| 动画 | Framer Motion |
| 数据库 | Supabase (PostgreSQL + RLS) |
| 文件存储 | Cloudflare R2 (S3 兼容) |
| 外部 API | Steam Store API、TMDB API |
| Markdown | react-markdown + remark-gfm |

---

## 📁 项目结构

```
personal-website/
├── database/                  # 数据库 Schema
│   ├── schema.sql             # travels, travel_photos, movies, games 表
│   └── albums.sql             # albums, photos 表
├── src/
│   ├── middleware.ts           # 管理后台 API 路由保护（Cookie 鉴权）
│   ├── app/
│   │   ├── page.tsx           # 首页
│   │   ├── travel/            # 旅行模块（列表、详情、管理）
│   │   ├── movies/            # 电影模块（列表、详情、管理）
│   │   ├── games/             # 游戏模块（列表、详情、管理）
│   │   ├── albums/            # 相册模块（浏览、管理）
│   │   └── api/               # API 路由
│   │       ├── auth/          # 管理员认证
│   │       ├── albums-auth/   # 相册认证
│   │       ├── steam/         # Steam API 代理
│   │       └── admin/         # 管理后台 CRUD + 文件上传
│   ├── components/            # 共享组件
│   └── lib/                   # 工具库（Supabase、R2、Steam、TMDB）
├── .env.local.example         # 环境变量模板
├── next.config.js             # Next.js 配置（图片域名、缓存）
├── tailwind.config.ts         # Tailwind 配置
└── package.json
```

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd personal-website
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板并填入你的配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入以下变量：

| 变量名 | 必填 | 说明 |
|--------|:----:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务角色密钥（服务端管理操作使用） |
| `ADMIN_PASSWORD` | ✅ | 管理后台登录密码 |
| `ALBUMS_PASSWORD` | ✅ | 相册页面访问密码 |
| `R2_ENDPOINT` | ⭐ | Cloudflare R2 S3 端点 |
| `R2_ACCESS_KEY_ID` | ⭐ | R2 访问密钥 ID |
| `R2_SECRET_ACCESS_KEY` | ⭐ | R2 访问密钥 |
| `R2_BUCKET` | | R2 存储桶名称（默认 `photo-album`） |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | ⭐ | R2 对象的公开访问 URL |

> ⭐ 标记的变量为相册功能所必需。

### 4. 初始化数据库

在 Supabase 项目的 **SQL Editor** 中依次执行：

1. `database/schema.sql` — 创建 `travels`、`travel_photos`、`movies`、`games` 表及索引和 RLS 策略
2. `database/albums.sql` — 创建 `albums`、`photos` 表及 RLS 策略

还需手动创建以下 Supabase Storage Bucket（均设为公开）：
- `travel-covers`
- `travel-photos`
- `movie-posters`
- `game-covers`

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

---

## 📜 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产环境构建 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |

---

## 📄 页面路由

### 公开页面

| 路径 | 说明 |
|------|------|
| `/` | 首页 — 个人简介、当前在玩游戏、年度时间线 |
| `/travel` | 旅行列表 — 按年份分组的卡片网格 |
| `/travel/[slug]` | 旅行详情 — Markdown 正文 + 图片画廊 |
| `/albums` | 相册 — 需输入密码访问 |
| `/movies` | 电影列表 — 可按年份/月份筛选，分页展示 |
| `/movies/[slug]` | 电影详情 |
| `/games` | 游戏列表 — 可按状态/平台/年份/月份筛选，支持 Excel 导出 |
| `/games/[id]` | 游戏详情 |

### 管理后台（需密码登录）

| 路径 | 说明 |
|------|------|
| `/travel/admin` | 旅行管理 — 增删改查 + 图片上传 |
| `/albums/admin` | 相册管理 — 拖拽上传、R2 迁移工具 |
| `/movies/admin` | 电影管理 — TMDB 搜索自动填充 |
| `/games/admin` | 游戏管理 — Steam 搜索自动填充 |

---

## 🔐 认证机制

- **管理后台**：通过 `ADMIN_PASSWORD` 环境变量进行密码认证，认证后设置 `admin_token` Cookie。Next.js 中间件保护所有 `/api/admin/*` 路由。
- **相册**：独立密码认证（`ALBUMS_PASSWORD`），认证状态存储在浏览器 `sessionStorage` 中。

---

## 🗃️ 数据存储

| 类型 | 服务 | 说明 |
|------|------|------|
| 结构化数据 | Supabase PostgreSQL | 旅行、电影、游戏、相册元数据（启用 RLS） |
| 图片文件 | Cloudflare R2 | 相册照片、旅行封面、电影海报、游戏封面 |
| 备用存储 | Supabase Storage | 早期图片存储，可通过管理后台一键迁移至 R2 |

---

## 🌐 API 参考

### 公开接口（只读）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/games` | 获取游戏列表（支持 `?id=` 查询单个） |
| GET | `/api/movies` | 获取电影列表 |
| GET | `/api/albums` | 获取相册列表 |
| GET | `/api/photos` | 获取照片列表（支持 `?album_id=` 筛选） |
| GET | `/api/steam/search?q=` | Steam 搜索代理 |
| GET | `/api/steam/details?appid=` | Steam 应用详情代理 |

### 管理接口（需 Cookie 鉴权）

支持 `GET / POST / PUT / DELETE`：
- `/api/admin/travels` — 旅行 CRUD
- `/api/admin/travel-photos` — 旅行照片 CRUD
- `/api/admin/albums` — 相册 CRUD
- `/api/admin/games` — 游戏 CRUD
- `/api/admin/movies` — 电影 CRUD
- `/api/admin/upload` — 上传至 Supabase Storage
- `/api/admin/upload-r2` — 上传至 Cloudflare R2
- `/api/admin/migrate-to-r2` — 批量迁移至 R2

---

## ⚙️ 配置说明

### 图片域名

`next.config.js` 已配置以下远程图片域名：
- Supabase Storage
- Steam CDN（Akamai + Cloudflare）
- TMDB 图片服务
- Cloudflare R2 公开 URL

如需添加新的图片源，请在 `next.config.js` 的 `images.remotePatterns` 中配置。

### 图片缓存

图片缓存 TTL 设置为 **30 天**。

---

## 📝 备注

- 旅行页面使用**服务端渲染**（SSR），其他页面为**客户端渲染**
- TMDB API Key 目前硬编码在 `src/lib/tmdb.ts` 中（建议迁移到环境变量）
- 游戏状态包括：想玩、在玩、已通关、已弃坑
- 管理后台支持独立密码认证，各模块共用同一管理密码

---

<p id="english" align="right">
  <a href="#">中文</a> | <strong>English</strong>
</p>

# 🏠 Personal Website — RoccoLiang

A personal life-tracking website built with **Next.js 13**, designed to journal travels, movies watched, and games played. Powered by App Router, TypeScript, Tailwind CSS, and a Supabase full-stack backend.

> 💡 Click **English** at the top-right to jump here.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🗺️ **Travel** | Travel log list (grouped by year), detail pages with Markdown rendering and photo gallery |
| 🎬 **Movies** | Movie list (filter by year/month, paginated), ratings, reviews; admin integrates **TMDB** for auto-fill |
| 🎮 **Games** | Game list (filter by status/platform/year/month), yearly timeline view, **Excel export**; admin integrates **Steam** search |
| 📷 **Albums** | Password-protected photo albums with lightbox viewer and keyboard navigation (arrows/ESC) |
| 🔐 **Admin Panel** | Per-module CRUD management pages with password authentication |
| ☁️ **Dual Storage** | Supports both Supabase Storage and Cloudflare R2, with a built-in one-click migration tool |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 13 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS + @tailwindcss/typography |
| UI Components | Ant Design (DatePicker, Pagination, etc.) |
| Icons | Lucide React |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL + RLS) |
| File Storage | Cloudflare R2 (S3-compatible) |
| External APIs | Steam Store API, TMDB API |
| Markdown | react-markdown + remark-gfm |

---

## 📁 Project Structure

```
personal-website/
├── database/                  # Database schemas
│   ├── schema.sql             # travels, travel_photos, movies, games tables
│   └── albums.sql             # albums, photos tables
├── src/
│   ├── middleware.ts           # Admin API route protection (cookie auth)
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── travel/            # Travel module (list, detail, admin)
│   │   ├── movies/            # Movie module (list, detail, admin)
│   │   ├── games/             # Game module (list, detail, admin)
│   │   ├── albums/            # Album module (viewer, admin)
│   │   └── api/               # API routes
│   │       ├── auth/          # Admin authentication
│   │       ├── albums-auth/   # Albums authentication
│   │       ├── steam/         # Steam API proxy
│   │       └── admin/         # Admin CRUD + file uploads
│   ├── components/            # Shared components
│   └── lib/                   # Utilities (Supabase, R2, Steam, TMDB)
├── .env.local.example         # Environment variable template
├── next.config.js             # Next.js config (image domains, cache)
├── tailwind.config.ts         # Tailwind config
└── package.json
```

---

## 🚀 Quick Start

### 1. Clone the project

```bash
git clone <your-repo-url>
cd personal-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the template and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the following variables:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side admin operations) |
| `ADMIN_PASSWORD` | ✅ | Admin panel login password |
| `ALBUMS_PASSWORD` | ✅ | Albums page access password |
| `R2_ENDPOINT` | ⭐ | Cloudflare R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` | ⭐ | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | ⭐ | R2 secret access key |
| `R2_BUCKET` | | R2 bucket name (defaults to `photo-album`) |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | ⭐ | Public URL base for R2 objects |

> Variables marked with ⭐ are required for album functionality.

### 4. Initialize the database

Run the following SQL files in your Supabase project's **SQL Editor**:

1. `database/schema.sql` — Creates `travels`, `travel_photos`, `movies`, `games` tables with indexes and RLS policies
2. `database/albums.sql` — Creates `albums`, `photos` tables with RLS policies

You also need to manually create these Supabase Storage buckets (all public):
- `travel-covers`
- `travel-photos`
- `movie-posters`
- `game-covers`

### 5. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the site.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📄 Page Routes

### Public Pages

| Path | Description |
|------|-------------|
| `/` | Homepage — profile intro, currently playing games, yearly timeline |
| `/travel` | Travel list — card grid grouped by year |
| `/travel/[slug]` | Travel detail — Markdown body + photo gallery |
| `/albums` | Albums — password-protected access |
| `/movies` | Movie list — filterable by year/month, paginated |
| `/movies/[slug]` | Movie detail |
| `/games` | Game list — filterable by status/platform/year/month, Excel export |
| `/games/[id]` | Game detail |

### Admin Pages (password required)

| Path | Description |
|------|-------------|
| `/travel/admin` | Travel management — CRUD + photo upload |
| `/albums/admin` | Album management — drag & drop upload, R2 migration tool |
| `/movies/admin` | Movie management — TMDB auto-fill |
| `/games/admin` | Game management — Steam search auto-fill |

---

## 🔐 Authentication

- **Admin Panel**: Password-based authentication via the `ADMIN_PASSWORD` environment variable. Sets an `admin_token` cookie upon successful login. Next.js middleware protects all `/api/admin/*` routes.
- **Albums**: Separate password authentication (`ALBUMS_PASSWORD`). Auth state is stored in the browser's `sessionStorage`.

---

## 🗃️ Data Storage

| Type | Service | Description |
|------|---------|-------------|
| Structured Data | Supabase PostgreSQL | Travel, movie, game, and album metadata (RLS enabled) |
| Image Files | Cloudflare R2 | Album photos, travel covers, movie posters, game covers |
| Legacy Storage | Supabase Storage | Early image storage; can be migrated to R2 via admin panel |

---

## 🌐 API Reference

### Public Endpoints (Read-only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/games` | List games (supports `?id=` for single item) |
| GET | `/api/movies` | List movies |
| GET | `/api/albums` | List albums |
| GET | `/api/photos` | List photos (supports `?album_id=` filter) |
| GET | `/api/steam/search?q=` | Steam search proxy |
| GET | `/api/steam/details?appid=` | Steam app details proxy |

### Admin Endpoints (Cookie-authenticated)

Support `GET / POST / PUT / DELETE`:
- `/api/admin/travels` — Travel CRUD
- `/api/admin/travel-photos` — Travel photo CRUD
- `/api/admin/albums` — Album CRUD
- `/api/admin/games` — Game CRUD
- `/api/admin/movies` — Movie CRUD
- `/api/admin/upload` — Upload to Supabase Storage
- `/api/admin/upload-r2` — Upload to Cloudflare R2
- `/api/admin/migrate-to-r2` — Batch migrate to R2

---

## ⚙️ Configuration Notes

### Image Domains

`next.config.js` configures the following remote image domains:
- Supabase Storage
- Steam CDN (Akamai + Cloudflare)
- TMDB image service
- Cloudflare R2 public URL

To add new image sources, configure them in `next.config.js` under `images.remotePatterns`.

### Image Cache

Image cache TTL is set to **30 days**.

---

## 📝 Notes

- Travel pages use **server-side rendering** (SSR); all other pages are **client-side rendered**
- The TMDB API key is currently hardcoded in `src/lib/tmdb.ts` (recommended to migrate to environment variables)
- Game statuses: Want to Play, Playing, Completed, Dropped
- The admin panel uses a single shared password across all modules

---

## 📄 License

This is a personal project. Feel free to use it as reference for your own portfolio site.
