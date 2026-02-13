#!/bin/bash
# PM2 管理脚本 - Linux/Mac版本
# 用于管理小石榴Express后端服务

cd "$(dirname "$0")/.."

# 显示帮助信息
show_help() {
    echo "============================================"
    echo "   小石榴 PM2 管理脚本"
    echo "============================================"
    echo ""
    echo "用法: ./pm2-manage.sh [命令] [参数]"
    echo ""
    echo "命令:"
    echo "  start      启动服务"
    echo "  stop       停止服务"
    echo "  restart    重启服务"
    echo "  reload     重载服务（零停机）"
    echo "  delete     删除服务"
    echo "  status     查看服务状态"
    echo "  logs [n]   查看日志，n为行数（默认全部）"
    echo "  monitor    打开监控面板"
    echo "  dev        开发模式启动（监视文件变化）"
    echo "  prod       生产模式启动"
    echo "  save       保存当前进程列表"
    echo "  startup    生成开机启动脚本"
    echo "  help       显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./pm2-manage.sh start       启动服务"
    echo "  ./pm2-manage.sh logs 100    查看最近100行日志"
    echo "  ./pm2-manage.sh prod        生产模式启动"
    echo ""
    echo "============================================"
}

# 启动服务
cmd_start() {
    echo "[INFO] 正在启动小石榴API服务..."
    pm2 start ecosystem.config.js
    echo "[OK] 服务已启动"
}

# 停止服务
cmd_stop() {
    echo "[INFO] 正在停止小石榴API服务..."
    pm2 stop xiaoshiliu-api
    echo "[OK] 服务已停止"
}

# 重启服务
cmd_restart() {
    echo "[INFO] 正在重启小石榴API服务..."
    pm2 restart xiaoshiliu-api
    echo "[OK] 服务已重启"
}

# 重载服务（零停机）
cmd_reload() {
    echo "[INFO] 正在重载小石榴API服务（零停机）..."
    pm2 reload xiaoshiliu-api
    echo "[OK] 服务已重载"
}

# 删除服务
cmd_delete() {
    echo "[INFO] 正在删除小石榴API服务..."
    pm2 delete xiaoshiliu-api
    echo "[OK] 服务已删除"
}

# 查看状态
cmd_status() {
    echo "[INFO] 查看服务状态..."
    pm2 status
}

# 查看日志
cmd_logs() {
    local lines="${1:-}"
    echo "[INFO] 查看日志（按 Ctrl+C 退出）..."
    if [ -z "$lines" ]; then
        pm2 logs xiaoshiliu-api
    else
        pm2 logs xiaoshiliu-api --lines "$lines"
    fi
}

# 监控面板
cmd_monitor() {
    echo "[INFO] 打开监控面板（按 Ctrl+C 退出）..."
    pm2 monit
}

# 开发模式
cmd_dev() {
    echo "[INFO] 以开发模式启动（监视文件变化）..."
    pm2 start ecosystem.config.js --env development --watch
    echo "[OK] 开发模式已启动"
}

# 生产模式
cmd_prod() {
    echo "[INFO] 以生产模式启动..."
    pm2 start ecosystem.config.js --env production
    echo "[OK] 生产模式已启动"
}

# 保存进程列表
cmd_save() {
    echo "[INFO] 保存当前进程列表..."
    pm2 save
    echo "[OK] 进程列表已保存"
}

# 生成开机启动脚本
cmd_startup() {
    echo "[INFO] 生成开机启动脚本..."
    pm2 startup
    echo "[OK] 请按照上方提示执行相应命令"
}

# 主逻辑
case "${1:-help}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    reload)
        cmd_reload
        ;;
    delete)
        cmd_delete
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs "$2"
        ;;
    monitor)
        cmd_monitor
        ;;
    dev)
        cmd_dev
        ;;
    prod)
        cmd_prod
        ;;
    save)
        cmd_save
        ;;
    startup)
        cmd_startup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "[ERROR] 未知命令: $1"
        show_help
        exit 1
        ;;
esac
