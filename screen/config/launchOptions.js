const {join} = require('path');
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
// console.log('process.versions', process.versions);
const NODE_ENV = process.env.NODE_ENV || 'production';

const options = {
  headless: 'new', // 使用新版无头chrome模式
  // headless: false,
  // dumpio: true,
  ignoreHTTPSErrors: true,
  args: [
    '--no-zygote',
    '--no-sandbox',
    // '--disable-gpu',
    '--no-first-run',
    // '--single-process',
    '--disable-extensions',
    "--disable-xss-auditor",
    // '--disable-dev-shm-usage',
    '--disable-popup-blocking',
    '--disable-setuid-sandbox',
    "--disable-web-security",
    '--disable-accelerated-2d-canvas',
    '--enable-features=NetworkService',
  ],
  // executablePath: join(__dirname, '../puppeteerCache', 'chrome-linux/chrome'),
}

// 如果chrome浏览器使用基础镜像中已打包的 chrome-linux-1133702.zip ，则需要指定executablePath
// if (NODE_ENV == 'production') {
//   options.executablePath = join(__dirname, '../puppeteerCache', 'chrome-linux/chrome')
// }

module.exports = options