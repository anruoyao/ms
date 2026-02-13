# Capacitor Android APK 打包指南

本文档介绍如何将 Vue3 前端项目打包为 Android APK。

## 前置要求

- Node.js 18+
- JDK 17（必须）
- Android SDK（API 34）
- 已配置环境变量：`JAVA_HOME`、`ANDROID_HOME`

---

## 快速打包命令

### 1. 开发调试版 APK（Debug）

```powershell
# 进入前端项目目录
cd d:\XiaoShiLiu\vue3-project

# 构建 Vue 项目
npm run build

# 同步到 Android 项目
npx cap sync android

# 进入 Android 目录
cd android

# 打包 Debug APK
.\gradlew assembleDebug
```

**APK 输出路径：**
```
vue3-project\android\app\build\outputs\apk\debug\app-debug.apk
```

---

### 2. 发布版 APK（Release）

```powershell
# 进入 Android 目录
cd d:\XiaoShiLiu\vue3-project\android

# 打包 Release APK
.\gradlew assembleRelease
```

**APK 输出路径：**
```
vue3-project\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

> ⚠️ 注意：Release 版本需要签名才能安装，详见下方签名配置。

---

## 完整打包流程

### 步骤 1：修改 API 地址

打包前，确保 `.env` 文件中的 API 地址正确：

```env
# 本地测试（手机和电脑同一 WiFi）
VITE_API_BASE_URL=http://192.168.1.4:3001/api

# 生产环境（已部署服务器）
VITE_API_BASE_URL=https://your-domain.com/api
```

### 步骤 2：构建 Vue 项目

```powershell
cd d:\XiaoShiLiu\vue3-project
npm run build
```

### 步骤 3：同步到 Android

```powershell
npx cap sync android
```

### 步骤 4：打包 APK

```powershell
cd android
.\gradlew assembleDebug
```

### 步骤 5：安装到手机

**方法 A：ADB 安装（推荐）**
```powershell
F:\Android\Sdk\platform-tools\adb.exe install -r "app\build\outputs\apk\debug\app-debug.apk"
```

**方法 B：手动安装**
1. 将 APK 复制到手机
2. 在手机上点击安装（需开启"允许安装未知来源应用"）

---

## 签名配置（发布版）

### 1. 生成签名密钥

```powershell
# 进入 Android 目录
cd d:\XiaoShiLiu\vue3-project\android

# 生成密钥（替换为你自己的信息）
F:\javajdk\bin\keytool.exe -genkey -v -keystore xiaoshiliu.keystore -alias xiaoshiliu -keyalg RSA -keysize 2048 -validity 10000
```

按提示输入：
- 密钥库口令
- 姓名、组织、城市等信息

### 2. 配置签名信息

在 `android/app/build.gradle` 中添加：

```gradle
android {
    // ... 其他配置

    signingConfigs {
        release {
            storeFile file('xiaoshiliu.keystore')
            storePassword '你的密钥库密码'
            keyAlias 'xiaoshiliu'
            keyPassword '你的密钥密码'
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### 3. 打包签名 APK

```powershell
.\gradlew assembleRelease
```

**签名 APK 输出路径：**
```
app\build\outputs\apk\release\app-release.apk
```

---

## 常见问题

### 1. "无效的源发行版：21" 错误

**原因：** JDK 版本不匹配

**解决：** 确保 `gradle.properties` 中指定了 JDK 17 路径：
```properties
org.gradle.java.home=F:\\javajdk
```

### 2. "安装包异常" 无法安装

**原因：** 手机未开启安装权限

**解决：**
- 设置 → 安全 → 安装未知应用 → 开启对应应用权限
- 或使用 ADB 安装

### 3. App 无法连接后端

**原因：** 网络不通或防火墙阻止

**解决：**
- 确保手机和电脑在同一 WiFi
- 检查 Windows 防火墙是否放行 3001 端口
- 手机浏览器访问 `http://192.168.1.4:3001` 测试连通性

### 4. Gradle 构建失败

**解决：** 清理缓存后重新构建
```powershell
.\gradlew clean
.\gradlew assembleDebug
```

---

## 项目结构

```
vue3-project/
├── android/                          # Android 项目目录
│   ├── app/
│   │   ├── build/
│   │   │   └── outputs/
│   │   │       └── apk/
│   │   │           ├── debug/        # Debug APK 输出
│   │   │           │   └── app-debug.apk
│   │   │           └── release/      # Release APK 输出
│   │   │               └── app-release.apk
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # Android 配置
│   │   │   └── assets/public/        # Vue 构建产物
│   │   └── build.gradle              # 模块配置
│   ├── gradle.properties             # Gradle 属性（JDK 路径等）
│   ├── variables.gradle               # SDK 版本配置
│   └── gradlew                       # Gradle Wrapper
├── capacitor.config.json             # Capacitor 配置
├── dist/                             # Vue 构建输出
└── .env                              # 环境变量
```

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm run build` | 构建 Vue 项目 |
| `npx cap sync android` | 同步到 Android |
| `npx cap open android` | 打开 Android Studio |
| `.\gradlew assembleDebug` | 打包 Debug APK |
| `.\gradlew assembleRelease` | 打包 Release APK |
| `.\gradlew clean` | 清理构建缓存 |
| `adb install -r app.apk` | 安装 APK 到手机 |
| `adb devices` | 查看已连接设备 |

---

## 更新 App 流程

当代码有更新时：

```powershell
# 1. 构建 Vue
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 打包 APK
cd android
.\gradlew assembleDebug

# 4. 安装到手机
F:\Android\Sdk\platform-tools\adb.exe install -r "app\build\outputs\apk\debug\app-debug.apk"
```

---

**文档版本：** 1.0  
**更新日期：** 2026-02-13
