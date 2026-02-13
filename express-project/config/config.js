/**
 * 集中管理所有配置项
 *
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description Express应用的核心配置管理
 * @version v1.3.0
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// 动态获取服务器基础URL
// 优先使用环境变量，否则根据请求动态生成
const getBaseUrl = (req) => {
  // 优先使用环境变量（最安全）
  if (process.env.LOCAL_BASE_URL) {
    return process.env.LOCAL_BASE_URL;
  }
  if (req) {
    // 从请求头获取协议和主机
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    let host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3001';
    
    // 安全检查：只允许有效的主机名格式（防止 Host Header 注入）
    // 移除端口号后检查是否为有效域名
    const hostname = host.split(':')[0];
    
    // 白名单：允许的主机名模式
    const allowedPatterns = [
      /^localhost$/i,
      /^127\.0\.0\.1$/i,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,  // 局域网 IP
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,  // 内网 IP
      /^[\w-]+\.misskey\.site$/i,  // 你的域名
      /^api\.misskey\.site$/i,  // API 域名
      /^[\w-]+\.(com|cn|net|org|io)$/i  // 常见顶级域名
    ];
    
    // 检查主机名是否在白名单中
    const isAllowed = allowedPatterns.some(pattern => pattern.test(hostname));
    
    if (!isAllowed) {
      // 如果不在白名单中，使用默认值
      console.warn(`⚠️ 可疑的主机头被拒绝: ${hostname}`);
      return 'http://localhost:3001';
    }
    
    return `${protocol}://${host}`;
  }
  return 'http://localhost:3001';
};

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'xiaoshiliu_secret_key_2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'test',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+08:00'
  },

  // 上传配置
  upload: {
    // 图片上传配置
    image: {
      maxSize: process.env.IMAGE_MAX_SIZE || '10mb',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      // 图片上传策略配置
      strategy: process.env.IMAGE_UPLOAD_STRATEGY || 'local', // 'local', 'imagehost' 或 'r2'
      // 本地存储配置
      local: {
        uploadDir: process.env.IMAGE_LOCAL_UPLOAD_DIR || 'uploads/images',
        baseUrl: process.env.LOCAL_BASE_URL // 不再设置默认值，由 getBaseUrl 动态获取
      },
      // 第三方图床配置
      imagehost: {
        apiUrl: process.env.IMAGEHOST_API_URL || 'https://api.xinyew.cn/api/jdtc',
        timeout: parseInt(process.env.IMAGEHOST_TIMEOUT) || 60000
      },
      // Cloudflare R2配置
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT,
        publicUrl: process.env.R2_PUBLIC_URL, // 可选：自定义域名
        region: process.env.R2_REGION || 'auto'
      }
    },
    // 视频上传配置
    video: {
      maxSize: process.env.VIDEO_MAX_SIZE || '100mb',
      allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
      // 视频上传策略配置（只支持本地和R2，不支持第三方图床）
      strategy: process.env.VIDEO_UPLOAD_STRATEGY || 'local', // 'local' 或 'r2'
      // 本地存储配置
      local: {
        uploadDir: process.env.VIDEO_LOCAL_UPLOAD_DIR || 'uploads/videos',
        baseUrl: process.env.LOCAL_BASE_URL // 不再设置默认值，由 getBaseUrl 动态获取
      },
      // Cloudflare R2配置
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT,
        publicUrl: process.env.R2_PUBLIC_URL, // 可选：自定义域名
        region: process.env.R2_REGION || 'auto'
      }
    }
  },

  // API配置
  api: {
    baseUrl: process.env.API_BASE_URL, // 不再设置默认值，由 getBaseUrl 动态获取
    timeout: 30000
  },

  // 分页配置
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // 缓存配置
  cache: {
    ttl: 300 // 5分钟
  },

  // 邮件服务配置
  email: {
    // 是否启用邮件功能
    enabled: process.env.EMAIL_ENABLED === 'true', // 默认不启用
    // SMTP服务器配置
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'false' ? false : true, // 默认使用SSL
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || ''
      }
    },
    // 发件人配置
    from: {
      email: process.env.EMAIL_FROM || '',
      name: process.env.EMAIL_FROM_NAME || '小石榴校园图文社区'
    }
  }
};

// 数据库连接池配置
const dbConfig = {
  ...config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

module.exports = {
  ...config,
  pool,
  getBaseUrl // 导出动态获取URL的函数
};
