const browserPool = require('./browser-pool.js');
const pagePool = require('./page-pool.js');
const {waitTime, asyncPool, asyncPoolAll} = require('./utils.js');

// 主程序入口
module.exports = async(params = {}) => {
  console.log('===============  poolTest程序已启动  ================ \n');

  const timeout = ms => new Promise((resolve, reject) => setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve({ msg: `success-${ms}` })
    } else {
      reject(`error-${ms}`)
    }
  }, ms));

  const result = await asyncPoolAll(2, [1000, 5000, 2000, 9000], timeout)
  // const result = await asyncPoolAll(2, [ timeout(1000), timeout(5000), timeout(2000), timeout(9000) ])
  console.log('result', result)
  return

  const browser = await browserPool.use(async browser => browser);
  console.log('poolTest--browser')

  for (let i = 0; i < 3; i++) {
    await browser.pagePool.use(async page => {
      console.log('===============  pagePool info  ================ \n');
      // console.log('pagePool.size', pagePool.size)
      // console.log('pagePool.available', pagePool.available)
      // console.log('pagePool.borrowed', pagePool.borrowed)
      // console.log('pagePool.pending', pagePool.pending)
      // console.log('page.useCount', page.useCount)
      await page.setViewport({ width: 1366, height: 1024 });
      await page.goto('https://developer.mozilla.org/zh-CN/docs/Web/XML');
      await page.evaluate((data) => {
        console.log('$$pageParams', data)
        window.$$pageParams = data;
      }, params);
      await waitTime(1000);
      return page;
    });

    await browser.pagePool.use(async page => {
      console.log('===============  pagePool info  ================ \n');
      // console.log('pagePool.size', pagePool.size)
      // console.log('pagePool.available', pagePool.available)
      // console.log('pagePool.borrowed', pagePool.borrowed)
      // console.log('pagePool.pending', pagePool.pending)
      // console.log('page.useCount', page.useCount)
      await page.setViewport({ width: 1366, height: 1024 });
      await page.goto('https://developer.mozilla.org/zh-CN/docs/Web/XPath');
      await page.evaluate((data) => {
        console.log('$$pageParams', data)
        window.$$pageParams = data;
      }, params);
      await waitTime(1000);
      return page;
    });
  }


  return {
    success: true,
    message: '任务进行中'
  }
};
