/**
 * PM2 生态系统配置文件
 * 用于管理小石榴项目的后端服务
 *
 * @author ZTMYO
 * @description PM2 process manager configuration
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'xiaoshiliu-api',

      // 启动脚本
      script: './express-project/app.js',

      // 运行环境
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },

      // 进程配置
      instances: 1,           // 实例数量（1为单实例，'max'为CPU核心数）
      exec_mode: 'fork',      // 执行模式：fork/cluster

      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 自动重启配置
      autorestart: true,      // 崩溃后自动重启
      restart_delay: 3000,    // 重启延迟（毫秒）
      max_restarts: 10,       // 最大重启次数
      min_uptime: '10s',      // 最小运行时间

      // 内存限制
      max_memory_restart: '500M',  // 内存超过500MB时重启

      // 监控配置
      watch: false,           // 是否监视文件变化（生产环境建议false）
      ignore_watch: [         // 忽略监视的文件
        'node_modules',
        'logs',
        'uploads',
        '.git'
      ],

      // 健康检查
      kill_timeout: 5000,     // 优雅关闭超时时间
      listen_timeout: 8000,   // 启动超时时间

      // 额外参数
      node_args: '--max-old-space-size=512',  // Node.js 内存限制

      // 错误处理
      exp_backoff_restart_delay: 100  // 指数退避重启延迟
    }
  ],

  // 部署配置（可选，用于远程部署）
  deploy: {
    production: {
      user: 'root',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/var/www/xiaoshiliu',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
