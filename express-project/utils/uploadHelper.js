const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');
const config = require('../config/config');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * 保存图片文件到本地
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {object} req - Express请求对象（用于动态获取baseUrl）
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function saveImageToLocal(fileBuffer, filename, req) {
  try {
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), config.upload.image.local.uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const ext = path.extname(filename);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `${Date.now()}_${hash}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // 保存文件
    fs.writeFileSync(filePath, fileBuffer);

    // 返回访问URL - 使用动态获取的baseUrl
    const baseUrl = config.getBaseUrl(req);
    const url = `${baseUrl}/${config.upload.image.local.uploadDir}/${uniqueFilename}`;
    return {
      success: true,
      url: url
    };
  } catch (error) {
    console.error('❌ 图片本地保存失败:', error.message);
    return {
      success: false,
      message: error.message || '图片本地保存失败'
    };
  }
}

/**
 * 保存视频文件到本地
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {object} req - Express请求对象（用于动态获取baseUrl）
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function saveVideoToLocal(fileBuffer, filename, req) {
  try {
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), config.upload.video.local.uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const ext = path.extname(filename);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `${Date.now()}_${hash}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // 保存文件
    fs.writeFileSync(filePath, fileBuffer);

    // 返回访问URL和文件路径 - 使用动态获取的baseUrl
    const baseUrl = config.getBaseUrl(req);
    const url = `${baseUrl}/${config.upload.video.local.uploadDir}/${uniqueFilename}`;
    return {
      success: true,
      url: url,
      filePath: filePath
    };
  } catch (error) {
    console.error('❌ 视频本地保存失败:', error.message);
    return {
      success: false,
      message: error.message || '视频本地保存失败'
    };
  }
}

/**
 * 上传文件到图床
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadToImageHost(fileBuffer, filename, mimetype) {
  try {
    // 检查配置是否存在
    if (!config.upload || !config.upload.image || !config.upload.image.imagehost || !config.upload.image.imagehost.apiUrl) {
      console.error('❌ 图床配置不完整:', config.upload?.image?.imagehost);
      return {
        success: false,
        message: '图床配置不完整，请检查环境变量配置'
      };
    }

    const imageHostConfig = config.upload.image.imagehost;
    console.log('📤 开始上传图片到图床:', filename);

    // 创建FormData
    const FormData = require('form-data');
    const form = new FormData();

    // 添加文件到表单
    form.append('file', fileBuffer, {
      filename: filename,
      contentType: mimetype,
      knownLength: fileBuffer.length
    });

    // 发送请求到图床API
    const response = await axios.post(imageHostConfig.apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: imageHostConfig.timeout || 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      // 允许自签名证书（开发环境）
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    console.log('📥 图床响应:', response.data);

    // 检查响应
    if (response.data && response.data.code === 200 && response.data.data && response.data.data.url) {
      console.log('✅ 图片上传到图床成功:', response.data.data.url);
      return {
        success: true,
        url: response.data.data.url
      };
    } else {
      console.error('❌ 图床返回错误:', response.data);
      return {
        success: false,
        message: response.data?.msg || '图床上传失败'
      };
    }
  } catch (error) {
    console.error('❌ 图床上传失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return {
      success: false,
      message: error.message || '图床上传失败'
    };
  }
}

/**
 * 上传文件到Cloudflare R2
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @param {string} fileType - 文件类型 ('image' 或 'video')
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadToR2(fileBuffer, filename, mimetype, fileType = 'image') {
  try {
    // 检查R2配置
    const r2Config = config.upload[fileType].r2;
    if (!r2Config || !r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName) {
      console.error('❌ R2配置不完整');
      return {
        success: false,
        message: 'R2配置不完整，请检查环境变量配置'
      };
    }

    console.log('📤 开始上传文件到R2:', filename);

    // 创建S3客户端
    const s3Client = new S3Client({
      region: r2Config.region || 'auto',
      endpoint: r2Config.endpoint || `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey
      }
    });

    // 生成唯一文件名
    const ext = path.extname(filename);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `${fileType}s/${Date.now()}_${hash}${ext}`;

    // 上传文件
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: uniqueFilename,
      Body: fileBuffer,
      ContentType: mimetype
    });

    await s3Client.send(command);

    // 构建访问URL
    const url = r2Config.publicUrl
      ? `${r2Config.publicUrl}/${uniqueFilename}`
      : `${r2Config.endpoint}/${r2Config.bucketName}/${uniqueFilename}`;

    console.log('✅ 文件上传到R2成功:', url);
    return {
      success: true,
      url: url
    };
  } catch (error) {
    console.error('❌ R2上传失败:', error.message);
    return {
      success: false,
      message: error.message || 'R2上传失败'
    };
  }
}

/**
 * 上传图片（根据配置选择上传方式）
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @param {object} req - Express请求对象（用于动态获取baseUrl）
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadImage(fileBuffer, filename, mimetype, req) {
  const strategy = config.upload.image.strategy;
  console.log('🖼️ 图片上传策略:', strategy);

  switch (strategy) {
    case 'imagehost':
      return await uploadToImageHost(fileBuffer, filename, mimetype);
    case 'r2':
      return await uploadToR2(fileBuffer, filename, mimetype, 'image');
    case 'local':
    default:
      return await saveImageToLocal(fileBuffer, filename, req);
  }
}

/**
 * 上传视频（根据配置选择上传方式）
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @param {object} req - Express请求对象（用于动态获取baseUrl）
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadVideo(fileBuffer, filename, mimetype, req) {
  const strategy = config.upload.video.strategy;
  console.log('🎬 视频上传策略:', strategy);

  switch (strategy) {
    case 'r2':
      return await uploadToR2(fileBuffer, filename, mimetype, 'video');
    case 'local':
    default:
      return await saveVideoToLocal(fileBuffer, filename, req);
  }
}

module.exports = {
  saveImageToLocal,
  saveVideoToLocal,
  uploadToImageHost,
  uploadToR2,
  uploadImage,
  uploadVideo,
  uploadFile: uploadImage // uploadFile 是 uploadImage 的别名，用于向后兼容
};
