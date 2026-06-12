# 企业治理作业系统 (Enterprise Governance OS)

版本: V5.0 | 更新: 2026-06-06

---

## 系统架构

```
┌─────────────────────────────────────────────┐
│  前端层                                       │
│  ├── Web 后台    Next.js 14 + Tailwind CSS    │
│  └── 移动端      React Native (iOS/Android)   │
├─────────────────────────────────────────────┤
│  后端层    NestJS 10 + TypeScript             │
│  ├── 26 个业务模块                            │
│  ├── JWT 认证 + RBAC/ABAC 权限                │
│  ├── 状态机引擎 (30+ 转换)                    │
│  └── 领域事件总线                             │
├─────────────────────────────────────────────┤
│  基础设施                                     │
│  ├── PostgreSQL 16   主数据库                 │
│  ├── Redis 7         缓存 / 队列              │
│  ├── MinIO/S3        对象存储                 │
│  ├── PaddleOCR       文字识别 (Docker)         │
│  └── Puppeteer       PDF 打印引擎             │
└─────────────────────────────────────────────┘
```

---

## 环境要求

| 软件 | 最低版本 | 用途 |
|------|---------|------|
| Node.js | 20+ | 运行环境 |
| Docker Desktop | 最新 | 数据库 + Redis + MinIO |
| PostgreSQL | 16 (Docker) | 主数据库 |
| Redis | 7 (Docker) | 缓存/队列 |

---

## 快速启动

### 第一步: 安装依赖

```bash
cd backend    && npm install --legacy-peer-deps
cd web-admin  && npm install --no-optional
cd mobile     && npm install --legacy-peer-deps
```

### 第二步: 启动基础设施

```bash
cd docker
docker-compose up -d
```

启动后自动创建 `governance_db` 数据库并执行 50 张表的 DDL 初始化。

### 第三步: 启动后端

```bash
cd backend
npm run start:dev
```

访问: http://localhost:3000/api/v1/

### 第四步: 启动 Web 后台

```bash
cd web-admin
npm run dev
```

访问: http://localhost:3001

### 第五步: 启动移动端 (可选)

```bash
cd mobile

# Android
npx react-native run-android

# iOS (需要 macOS + Xcode)
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## 默认账号

| 角色 | 员工编号 | 密码 | 说明 |
|------|---------|------|------|
| 系统管理员 | ADMIN001 | Admin@123 | 全部权限 |
| 财务 | FIN001 | (需在 DB 中创建) | 财务操作 |
| 品保 | QA001 | (需在 DB 中创建) | 召回管理 |

---

## 项目结构

```
ai-agents/
├── docker/                    # Docker Compose + SQL 脚本
│   ├── docker-compose.yml     # PostgreSQL + Redis + MinIO + PaddleOCR
│   └── init-sql/              # 6 个 SQL 文件 (50 张表 + 种子数据)
│
├── backend/                   # NestJS 后端 (端口 3000)
│   └── src/
│       ├── config/            # 数据库/Redis/JWT/MinIO/OCR 配置
│       ├── entities/          # TypeORM 实体 (8 个文件)
│       ├── core/              # 核心模块
│       │   ├── auth/          # JWT 认证 + 设备绑定 + RBAC
│       │   ├── state-machine/ # 状态机引擎 (30+ 转换)
│       │   ├── permission/    # ABAC+RBAC 权限
│       │   ├── workflow/      # 审批工作流
│       │   └── event-bus/     # 领域事件总线
│       ├── modules/           # 业务模块 (20 个)
│       │   ├── customer/      # 客户管理
│       │   ├── product/       # 产品管理
│       │   ├── sales-order/   # 销售订单
│       │   ├── recall/        # 召回治理 R1-R4
│       │   ├── finance/       # 财务应收
│       │   ├── purchase/      # 采购管理
│       │   ├── budget/        # 预算控制
│       │   ├── bi/            # CEO 驾驶舱
│       │   ├── print/         # 打印引擎
│       │   ├── import/        # 批量导入
│       │   ├── ocr/           # OCR 识别
│       │   ├── sos/           # 静默 SOS
│       │   ├── notification/  # 通知推送
│       │   └── ...            # 更多模块
│       └── shared/            # DTOs / 过滤器 / 拦截器
│
├── web-admin/                 # Next.js 后台 (端口 3001)
│   └── src/app/
│       ├── login/             # 登录页
│       ├── dashboard/         # 自动跳转 BI
│       ├── customers/         # 客户列表 + 详情 (6 标签)
│       ├── products/          # 产品管理
│       ├── orders/            # 销售订单 + 审批
│       ├── recall/            # 召回 + 批号追溯
│       ├── purchase/          # 采购管理
│       ├── finance/           # 财务应收
│       ├── bi/                # CEO 驾驶舱
│       └── system/            # 系统设置
│
└── mobile/                    # React Native (iOS/Android)
    └── src/
        ├── navigation/        # 5 标签底栏导航
        ├── screens/
        │   ├── auth/          # 登录 + SOS
        │   ├── business/      # 业务首页 + 客户 + 订单
        │   ├── ocr/           # OCR 拍照
        │   ├── visit/         # 拜访记录
        │   ├── warehouse/     # PDA 仓储
        │   └── ceo/           # 总裁驾驶舱
        └── services/          # API 服务层
```

---

## API 端点 (主要)

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `POST /api/v1/auth/login` | 登录 |
| 认证 | `POST /api/v1/auth/refresh` | 刷新 Token |
| 客户 | `GET /api/v1/customers` | 客户列表 |
| 客户 | `POST /api/v1/customers` | 新增客户 |
| 产品 | `GET /api/v1/products` | 产品列表 |
| 订单 | `GET /api/v1/sales-orders` | 订单列表 |
| 订单 | `POST /api/v1/sales-orders` | 创建订单 |
| 召回 | `GET /api/v1/recall` | 召回案件列表 |
| 召回 | `GET /api/v1/recall/trace/:batchNo` | 批号追溯 |
| 财务 | `GET /api/v1/finance/ar/overdue` | 逾期应收 |
| BI | `GET /api/v1/bi/dashboard/ceo` | CEO 驾驶舱 |
| 打印 | `POST /api/v1/print/render` | 生成 PDF |

完整端點: 100+ 个 API，覆盖全部 26 个模组。

---

## 环境变量 (backend/.env)

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=governance
DB_PASSWORD=governance123
DB_DATABASE=governance_db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
JWT_SECRET=governance-jwt-secret-dev
```

---

## 常见问题

**Q: npm install 失败?**
A: 后端用 `--legacy-peer-deps`，前端用 `--no-optional` 跳过 SWC 原生模块。

**Q: Docker 启动后表没创建?**
A: 检查 `docker-compose logs postgres` 确认 SQL 执行，或手动执行 `docker/init-sql/` 下的脚本。

**Q: 后端启动报数据库连接错误?**
A: 确保 `docker-compose up -d` 已运行且 PostgreSQL 健康检查通过。

**Q: 如何添加默认用户?**
A: 连接 PostgreSQL 后在 `employee_master` 表插入数据，密码用 bcryptjs 加密。