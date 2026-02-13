@echo off
chcp 65001 >nul
REM PM2 管理脚本 - Windows版本
REM 用于管理小石榴Express后端服务

cd /d "%~dp0\.."

if "%1"=="" goto :help
if /i "%1"=="start" goto :start
if /i "%1"=="stop" goto :stop
if /i "%1"=="restart" goto :restart
if /i "%1"=="reload" goto :reload
if /i "%1"=="delete" goto :delete
if /i "%1"=="status" goto :status
if /i "%1"=="logs" goto :logs
if /i "%1"=="monitor" goto :monitor
if /i "%1"=="dev" goto :dev
if /i "%1"=="prod" goto :prod
if /i "%1"=="help" goto :help
goto :help

:start
    echo [INFO] 正在启动小石榴API服务...
    call pm2 start ecosystem.config.js
    echo [OK] 服务已启动
    goto :eof

:stop
    echo [INFO] 正在停止小石榴API服务...
    call pm2 stop xiaoshiliu-api
    echo [OK] 服务已停止
    goto :eof

:restart
    echo [INFO] 正在重启小石榴API服务...
    call pm2 restart xiaoshiliu-api
    echo [OK] 服务已重启
    goto :eof

:reload
    echo [INFO] 正在重载小石榴API服务（零停机）...
    call pm2 reload xiaoshiliu-api
    echo [OK] 服务已重载
    goto :eof

:delete
    echo [INFO] 正在删除小石榴API服务...
    call pm2 delete xiaoshiliu-api
    echo [OK] 服务已删除
    goto :eof

:status
    echo [INFO] 查看服务状态...
    call pm2 status
    goto :eof

:logs
    echo [INFO] 查看日志（按 Ctrl+C 退出）...
    if "%2"=="" (
        call pm2 logs xiaoshiliu-api
    ) else (
        call pm2 logs xiaoshiliu-api --lines %2
    )
    goto :eof

:monitor
    echo [INFO] 打开监控面板（按 Ctrl+C 退出）...
    call pm2 monit
    goto :eof

:dev
    echo [INFO] 以开发模式启动（监视文件变化）...
    call pm2 start ecosystem.config.js --env development --watch
    echo [OK] 开发模式已启动
    goto :eof

:prod
    echo [INFO] 以生产模式启动...
    call pm2 start ecosystem.config.js --env production
    echo [OK] 生产模式已启动
    goto :eof

:help
    echo ============================================
    echo    小石榴 PM2 管理脚本
    echo ============================================
    echo.
    echo 用法: pm2-manage.bat [命令] [参数]
    echo.
    echo 命令:
    echo   start      启动服务
    echo   stop       停止服务
    echo   restart    重启服务
    echo   reload     重载服务（零停机）
    echo   delete     删除服务
    echo   status     查看服务状态
    echo   logs [n]   查看日志，n为行数（默认全部）
    echo   monitor    打开监控面板
    echo   dev        开发模式启动（监视文件变化）
    echo   prod       生产模式启动
    echo   help       显示帮助信息
    echo.
    echo 示例:
    echo   pm2-manage.bat start       启动服务
    echo   pm2-manage.bat logs 100    查看最近100行日志
    echo   pm2-manage.bat prod        生产模式启动
    echo.
    echo ============================================
    goto :eof
