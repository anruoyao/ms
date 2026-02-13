# PM2 进程管理指南

> 小石榴项目 PM2 进程管理完整指南

## 目录

- [简介](#简介)
- [安装 PM2](#安装-pm2)
- [快速开始](#快速开始)
- [管理命令](#管理命令)
- [配置文件说明](#配置文件说明)
- [日志管理](#日志管理)
- [监控与调试](#监控与调试)
- [生产环境部署](#生产环境部署)
- [常见问题](#常见问题)

---

## 简介

PM2 是一个 Node.js 进程管理器，提供以下功能：

- ✨ 进程守护（自动重启崩溃的服务）
- 📊 负载均衡（支持多实例集群模式）
- 📝 日志管理（自动分割和压缩）
- 🔍 实时监控（CPU、内存、请求等）
- 🚀 零停机部署（热重载）
- 💾 开机自启动

---

## 安装 PM2

### 全局安装

```bash
npm install -g pm2
```

### 验证安装

```bash
pm2 --version
```

---

## 快速开始

### Windows 系统

```powershell
# 启动服务（开发模式）
scripts\pm2-manage.bat start

# 生产模式启动
scripts\pm2-manage.bat prod

# 查看状态
scripts\pm2-manage.bat status
```

### Linux/Mac 系统

```bash
# 添加执行权限
chmod +x scripts/pm2-manage.sh

# 启动服务
./scripts/pm2-manage.sh start

# 生产模式启动
./scripts/pm2-manage.sh prod

# 查看状态
./scripts/pm2-manage.sh status
```

---

## 管理命令

### Windows 脚本命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `start` | 启动服务 | `scripts\pm2-manage.bat start` |
| `stop` | 停止服务 | `scripts\pm2-manage.bat stop` |
| `restart` | 重启服务 | `scripts\pm2-manage.bat restart` |
| `reload` | 重载服务（零停机） | `scripts\pm2-manage.bat reload` |
| `delete` | 删除服务 | `scripts\pm2-manage.bat delete` |
| `status` | 查看服务状态 | `scripts\pm2-manage.bat status` |
| `logs [n]` | 查看日志 | `scripts\pm2-manage.bat logs 100` |
| `monitor` | 打开监控面板 | `scripts\pm2-manage.bat monitor` |
| `dev` | 开发模式（监视文件变化） | `scripts\pm2-manage.bat dev` |
| `prod` | 生产模式启动 | `scripts\pm2-manage.bat prod` |
| `help` | 显示帮助 | `scripts\pm2-manage.bat help` |

### Linux/Mac 脚本命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `start` | 启动服务 | `./scripts/pm2-manage.sh start` |
| `stop` | 停止服务 | `./scripts/pm2-manage.sh stop` |
| `restart` | 重启服务 | `./scripts/pm2-manage.sh restart` |
| `reload` | 重载服务（零停机） | `./scripts/pm2-manage.sh reload` |
| `delete` | 删除服务 | `./scripts/pm2-manage.sh delete` |
| `status` | 查看服务状态 | `./scripts/pm2-manage.sh status` |
| `logs [n]` | 查看日志 | `./scripts/pm2-manage.sh logs 100` |
| `monitor` | 打开监控面板 | `./scripts/pm2-manage.sh monitor` |
| `dev` | 开发模式 | `./scripts/pm2-manage.sh dev` |
| `prod` | 生产模式 | `./scripts/pm2-manage.sh prod` |
| `save` | 保存进程列表 | `./scripts/pm2-manage.sh save` |
| `startup` | 生成开机启动脚本 | `./scripts/pm2-manage.sh startup` |

### 原生 PM2 命令

```bash
# 启动服务
pm2 start ecosystem.config.js

# 指定环境启动
pm2 start ecosystem.config.js --env production

# 停止服务
pm2 stop xiaoshiliu-api

# 重启服务
pm2 restart xiaoshiliu-api

# 重载服务（零停机）
pm2 reload xiaoshiliu-api

# 删除服务
pm2 delete xiaoshiliu-api

# 查看所有进程
pm2 status
pm2 list
pm2 ls

# 查看特定进程详情
pm2 describe xiaoshiliu-api

# 查看日志
pm2 logs xiaoshiliu-api
pm2 logs xiaoshiliu-api --lines 100
pm2 logs xiaoshiliu-api --follow

# 清空日志
pm2 flush

# 实时监控
pm2 monit

# 保存当前进程列表
pm2 save

# 生成开机启动脚本
pm2 startup
```

---

## 配置文件说明

配置文件位置：`ecosystem.config.js`

### 当前配置

```javascript
module.exports = {
  apps: [
    {
      name: 'xiaoshiliu-api',           // 应用名称
      script: './express-project/app.js', // 启动脚本
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,                     // 实例数量
      exec_mode: 'fork',                // 执行模式
      log_file: './logs/combined.log',  // 日志文件
      autorestart: true,                // 自动重启
      max_memory_restart: '500M',       // 内存限制
      watch: false,                     // 文件监视
      max_restarts: 10,                 // 最大重启次数
    }
  ]
};
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `name` | string | - | 应用名称 |
| `script` | string | - | 启动脚本路径 |
| `env` | object | - | 默认环境变量 |
| `env_production` | object | - | 生产环境变量 |
| `instances` | number/string | 1 | 实例数量，`max`表示CPU核心数 |
| `exec_mode` | string | 'fork' | 执行模式：`fork`/`cluster` |
| `log_file` | string | - | 合并日志文件路径 |
| `out_file` | string | - | 标准输出日志路径 |
| `error_file` | string | - | 错误日志路径 |
| `autorestart` | boolean | true | 崩溃后自动重启 |
| `restart_delay` | number | 0 | 重启延迟（毫秒） |
| `max_restarts` | number | 15 | 最大重启次数 |
| `min_uptime` | string | - | 最小运行时间 |
| `max_memory_restart` | string | - | 内存限制（如'500M'） |
| `watch` | boolean | false | 监视文件变化 |
| `ignore_watch` | array | - | 忽略监视的文件 |
| `node_args` | string | - | Node.js 参数 |

### 多服务配置示例

如果需要管理多个服务，可以扩展配置：

```javascript
module.exports = {
  apps: [
    {
      name: 'xiaoshiliu-api',
      script: './express-project/app.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'xiaoshiliu-ws',
      script: './websocket-server/app.js',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 3002 }
    },
    {
      name: 'xiaoshiliu-worker',
      script: './worker/index.js',
      instances: 1,
      cron_restart: '0 0 * * *',  // 每天凌晨重启
    }
  ]
};
```

---

## 日志管理

### 日志文件位置

```
logs/
├── combined.log    # 合并日志
├── out.log         # 标准输出
└── error.log       # 错误日志
```

### 日志命令

```bash
# 查看实时日志
pm2 logs xiaoshiliu-api

# 查看最近100行
pm2 logs xiaoshiliu-api --lines 100

# 查看错误日志
pm2 logs xiaoshiliu-api --err

# 查看输出日志
pm2 logs xiaoshiliu-api --out

# 清空所有日志
pm2 flush

# 清空特定应用日志
pm2 flush xiaoshiliu-api
```

### 日志轮转

安装 PM2 日志轮转模块：

```bash
pm2 install pm2-logrotate
```

配置日志轮转：

```bash
# 设置单个日志文件最大 10MB
pm2 set pm2-logrotate:max_size 10M

# 保留 10 个备份文件
pm2 set pm2-logrotate:retain 10

# 每天轮转一次
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

---

## 监控与调试

### 实时监控面板

```bash
pm2 monit
```

面板显示信息：
- CPU 使用率
- 内存占用
- 请求数量
- 错误数量
- 循环延迟

### PM2 Plus（Web 监控）

```bash
# 注册并链接到 PM2 Plus
pm2 plus

# 打开 Web 仪表板
pm2 open-dashboard
```

### 性能分析

```bash
# CPU 分析
pm2 profile:cpu start
pm2 profile:cpu stop

# 内存分析
pm2 profile:mem start
pm2 profile:mem stop
```

---

## 生产环境部署

### 部署流程

```bash
# 1. 进入项目目录
cd /var/www/xiaoshiliu

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖
npm install

# 4. 重载服务（零停机）
pm2 reload ecosystem.config.js --env production

# 5. 保存进程列表
pm2 save
```

### 开机自启动

**Linux 系统：**

```bash
# 生成开机启动脚本
pm2 startup systemd

# 按照提示执行命令（示例）
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-user --hp /home/your-user

# 保存当前进程列表
pm2 save
```

**Windows 系统：**

Windows 需要使用任务计划程序或 NSSM 工具设置开机启动。

### Nginx 反向代理

```nginx
upstream xiaoshiliu_api {
    server 127.0.0.1:3001;
    # 如果使用集群模式，添加多个后端
    # server 127.0.0.1:3002;
    # server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.misskey.site;

    location / {
        proxy_pass http://xiaoshiliu_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 常见问题

### Q: 服务启动后立即退出？

**A:** 检查日志找出错误原因：
```bash
pm2 logs xiaoshiliu-api --lines 50
```

常见原因：
- 端口被占用
- 数据库连接失败
- 环境变量缺失

### Q: 如何更新代码后重启服务？

**A:** 使用重载命令实现零停机部署：
```bash
pm2 reload xiaoshiliu-api
```

### Q: 内存占用过高怎么办？

**A:** 
1. 检查代码是否有内存泄漏
2. 调整 `max_memory_restart` 参数
3. 使用集群模式分散负载

### Q: 如何备份进程列表？

**A:**
```bash
# 导出进程列表
pm2 save

# 进程列表保存在：
# ~/.pm2/dump.pm2
```

### Q: 如何查看进程的资源使用？

**A:**
```bash
# 查看所有进程资源使用
pm2 status

# 查看详细信息
pm2 describe xiaoshiliu-api

# 实时监控
pm2 monit
```

### Q: 如何优雅地停止服务？

**A:**
```bash
# 发送 SIGTERM 信号，等待进程优雅退出
pm2 stop xiaoshiliu-api

# 强制停止（发送 SIGKILL）
pm2 delete xiaoshiliu-api
```

---

## 参考链接

- [PM2 官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 配置文件文档](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 日志管理](https://pm2.keymetrics.io/docs/usage/log-management/)

---

**文档版本**: v1.0  
**最后更新**: 2025-02-14  
**作者**: ZTMYO
