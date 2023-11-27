module.exports = {
  apps: [{
    name: 'screenshot_service', // 应用程序名称
    cwd: './', // 应用程序所在的目录
    script: './server/server.js', // 应用程序的脚本路径
    // 是否启用监控模式，默认是false。如果设置成true，当应用程序变动时，pm2会自动重载。这里也可以设置你要监控的文件
    watch: ['./config', './server', './tools', 'ecosystem.config.js', 'puppeteer.config.cjs'],
    ignore_watch: [ // 不用监听的文件
      'bin',
      'node_modules',
      'logs',
      'output',
      'Dockerfile*',
      'local_build.sh',
      './package.json',
    ],
    // interpreter: '/usr/local/bin/node',
    // exec_interpreter: 'nodejs',
    exec_mode: 'cluster', // 应用启动模式
    instances: 2, // 应用启动实例个数
    autorestart: true, // 默认为true, 发生异常的情况下自动重启
    max_memory_restart: '1G',
    merge_logs: true, // 设置追加日志而不是新建日志
    error_file: './logs/app-err.log', // 错误日志文件
    out_file: './logs/app-out.log', // 正常日志文件
    log_date_format: 'YYYY-MM-DD HH:mm:ss', // 指定日志文件的时间格式
    env_dev: {
      NODE_ENV: 'development' // 环境参数，当前指定为开发环境 pm2 start xxx.js --env_dev
    },
    env_prod: {
      NODE_ENV: 'production' // 环境参数，当前指定为生产环境 process.env.NODE_ENV
    },
    // logrotate: {
    //   "max_size": "5M",
    //   "retain": 20, // 最多保留20个文件
    //   "dateFormat": "YYYY-MM-DD_HH:mm:ss", // 日志文件名日期格式
    //   "rotateInterval": "0 23 * * *", // 每天晚上23:00开始轮换
    //   "workerInterval": 600 // 每10分钟检查一次文件大小，如果文件超过max_size，则新建日志文件
    // }
  }],
};
