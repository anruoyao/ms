const express = require('express');
const router = express.Router();
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { uploadFile, uploadVideo } = require('../utils/uploadHelper');

// 配置 multer 内存存储（用于云端图床）
const storage = multer.memoryStorage();

// 文件过滤器 - 图片
const imageFileFilter = (req, file, cb) => {
  // 检查文件类型
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 文件过滤器 - 视频
const videoFileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传视频文件'), false);
  }
};

// 配置 multer - 图片
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  }
});

// 配置 multer - 视频
// 混合文件过滤器（支持视频和图片）
const mixedFileFilter = (req, file, cb) => {
  if (file.fieldname === 'file') {
    // 视频文件验证
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持视频文件'), false);
    }
  } else if (file.fieldname === 'thumbnail') {
    // 缩略图文件验证（图片）
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('缩略图只支持图片文件'), false);
    }
  } else {
    cb(new Error('未知的文件字段'), false);
  }
};

const videoUpload = multer({
  storage: storage,
  fileFilter: mixedFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB 限制
  }
});

// 单图片上传到图床
router.post('/single', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '没有上传文件' });
    }

    // 使用统一上传函数（根据配置选择策略）
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req // 传入 req 用于动态获取 baseUrl
    );

    if (result.success) {
      // 记录用户上传操作日志
      console.log(`单图片上传成功 - 用户ID: ${req.user.id}, 文件名: ${req.file.originalname}`);

      res.json({
        code: RESPONSE_CODES.SUCCESS,
        message: '上传成功',
        data: {
          originalname: req.file.originalname,
          size: req.file.size,
          url: result.url
        }
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: result.message || '图床上传失败' });
    }
  } catch (error) {
    console.error('单图片上传失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: '上传失败' });
  }
});

// 多图片上传到图床
router.post('/multiple', authenticateToken, upload.array('files', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        data: null,
        message: '没有上传文件'
      });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of req.files) {
      const result = await uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        req // 传入 req 用于动态获取 baseUrl
      );

      if (result.success) {
        uploadResults.push({
          originalname: file.originalname,
          size: file.size,
          url: result.url
        });
      } else {
        errors.push({
          originalname: file.originalname,
          message: result.message || '上传失败'
        });
      }
    }

    // 记录用户批量上传操作日志
    console.log(`多图片上传完成 - 用户ID: ${req.user.id}, 成功: ${uploadResults.length}, 失败: ${errors.length}`);

    if (uploadResults.length > 0) {
      res.json({
        code: RESPONSE_CODES.SUCCESS,
        message: `上传完成，成功 ${uploadResults.length} 个${errors.length > 0 ? `，失败 ${errors.length} 个` : ''}`,
        data: {
          uploaded: uploadResults,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        message: '所有文件上传失败',
        data: { errors }
      });
    }
  } catch (error) {
    console.error('多图片上传失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '上传失败'
    });
  }
});

// 视频上传接口（支持本地存储和R2）
router.post('/video', authenticateToken, videoUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.file || req.files.file.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        message: '没有上传视频文件'
      });
    }

    const videoFile = req.files.file[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    console.log(`视频上传开始 - 用户ID: ${req.user.id}, 视频文件: ${videoFile.originalname}`);
    if (thumbnailFile) {
      console.log(`包含前端生成的缩略图: ${thumbnailFile.originalname}`);
    }

    // 上传视频文件
    const uploadResult = await uploadVideo(
      videoFile.buffer,
      videoFile.originalname,
      videoFile.mimetype,
      req // 传入 req 用于动态获取 baseUrl
    );

    if (!uploadResult.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        message: uploadResult.message || '视频上传失败'
      });
    }

    let coverUrl = null;

    // 优先使用前端生成的缩略图
    if (thumbnailFile) {
      try {
        console.log('使用前端生成的缩略图');
        const thumbnailUploadResult = await uploadFile(
          thumbnailFile.buffer,
          thumbnailFile.originalname,
          thumbnailFile.mimetype,
          req // 传入 req 用于动态获取 baseUrl
        );

        if (thumbnailUploadResult.success) {
          coverUrl = thumbnailUploadResult.url;
          console.log('缩略图上传成功:', coverUrl);
        } else {
          console.warn('缩略图上传失败:', thumbnailUploadResult.message);
        }
      } catch (thumbnailError) {
        console.warn('缩略图上传失败:', thumbnailError.message);
      }
    }

    // 记录用户视频上传操作日志
    console.log(`视频上传成功 - 用户ID: ${req.user.id}, 视频URL: ${uploadResult.url}, 封面URL: ${coverUrl || '无'}`);

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '视频上传成功',
      data: {
        originalname: videoFile.originalname,
        size: videoFile.size,
        url: uploadResult.url,
        coverUrl: coverUrl,
        mimetype: videoFile.mimetype
      }
    });
  } catch (error) {
    console.error('视频上传失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '视频上传失败'
    });
  }
});

module.exports = router;
