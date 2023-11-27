cp -r /home/export/App/puppeteer/node_modules/* /export/App/server/node_modules
cp -r /home/export/App/puppeteer/puppeteerCache/* /export/App/server/puppeteerCache
### >>>>>>>>>> 如果chrome浏览器使用基础镜像中已打包的 chrome-linux-1133702.zip ，则解开注释
# mv /home/export/App/puppeteer/chrome-linux-1133702.zip /export/App/server/puppeteerCache/
# cd /home/export/App/server/puppeteerCache/
# unzip chrome-linux-1133702.zip
### <<<<<<<<<<
rm -rf /home/export/App/puppeteer

pm2 install pm2-logrotate
# 单个日志文件大小限制
pm2 set pm2-logrotate:max_size 2M
# 最多保留20个文件
pm2 set pm2-logrotate:retain 20
# 设置日志文件名的日期格式
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
# 每天晚上23点执行轮转
pm2 set pm2-logrotate:rotateInterval '59 23 * * *'
# 每10分钟检查一次文件大小，如果文件超过max_size，则新建日志文件
pm2 set pm2-logrotate:workerInterval 600


chmod -R 777 /export/App
cd /export/App/server
# npm run prod
npm run start:prod