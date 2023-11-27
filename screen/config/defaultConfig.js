const { basePath } = require('./oss');
// =========== 配置默认参数 ===========
module.exports = {
  basePath,
  defaultWaitType: 'selector', // 默认 waitType 为 selector
  defaultSelector: '#__screenshot_start__', // 未设置 selector 值的默认值
  defaultCustomVar: '__screenshot_start__', // 未设置 customVar 值的默认值
  defaultWaitTimeout: 5000, // waitType为timeout时的等待截图时间
  defaultWaitForFunctionTimeout: 60000, // waitForFunction时的等待截图时间
  defaultWaitForSelectorTimeout: 60000, // waitForSelector时的等待截图时间
}