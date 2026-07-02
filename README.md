# GEO Auto Content Monitoring Backend

一个零依赖 Node.js 后台程序，用于监测 GEO 自动图文生成任务。它提供任务创建、状态推进、指标统计和健康检查接口，适合作为后续接入大模型、图片生成服务、发布平台的基础后端。

## 功能

- 创建图文生成监测任务，记录关键词、主题、渠道和负责人。
- 自动模拟任务状态推进：`queued` -> `generating` -> `reviewing` -> `published`。
- 统计任务总数、成功率、失败率、平均耗时和渠道分布。
- 提供失败标记接口，便于监控异常内容生成任务。
- 使用内存存储，启动即可运行，无需数据库。

## 快速启动

```bash
npm start
```

默认监听：`http://localhost:3000`

可以用环境变量修改端口：

```bash
PORT=4000 npm start
```

## 接口

### 健康检查

```bash
GET /health
```

### 创建监测任务

```bash
POST /api/jobs
Content-Type: application/json

{
  "keyword": "基层医疗 AI",
  "topic": "AI 医疗科普图文",
  "channel": "wechat",
  "owner": "content-team"
}
```

### 查看任务列表

```bash
GET /api/jobs
```

支持按状态筛选：

```bash
GET /api/jobs?status=published
```

### 查看单个任务

```bash
GET /api/jobs/:id
```

### 标记任务失败

```bash
POST /api/jobs/:id/fail
Content-Type: application/json

{
  "reason": "image generation timeout"
}
```

### 查看监测指标

```bash
GET /api/metrics
```

## 测试

```bash
npm test
```
