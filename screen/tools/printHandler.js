const path = require('path');
const fs = require('fs');
const {KnownDevices} = require('puppeteer');
const axios = require('axios');
const dayjs = require('dayjs');
const { jsPDF } = require('jspdf');
const sizeOf = require('image-size');

const browserPool = require('./browser-pool.js');
// const pagePool = require('./page-pool.js');
const { getRandomVal, wrappedAwait, proxyFetchHandler } = require('./utils.js');
const { uploadHandler } = require('./ossFileHandler.js');

const {
  basePath,
  defaultWaitType,
  defaultSelector,
  defaultCustomVar,
  defaultWaitTimeout,
  defaultWaitForFunctionTimeout,
  defaultWaitForSelectorTimeout,
} = require('../config/defaultConfig');


// 给页面挂载数据 (type 默认 init 表示初次挂载，type=reset 表示重置数据)
async function pageParamsEmulate(page, pageParams, type = 'init') {
  const { params = {}, customVar } = pageParams;
  await page.evaluate(__params => {
    window.$$pageParams = __params.params;
    window.$$customVar = __params.customVar;
    window[__params.customVar] = false;
  }, {
    params: type == 'reset' ? null : params,
    customVar
  });
}

async function initPageParams(page, pageParams) {
  await page.goto('chrome://version/');
  await pageParamsEmulate(page, pageParams, 'reset');
  const { pageUrl, params = {}, customVar } = pageParams;
  const randomVal = getRandomVal(16);
  const _pageUrl = pageUrl.includes('?') ? `${pageUrl}&randomVal=${randomVal}` : `${pageUrl}?randomVal=${randomVal}`;
  // console.log('page.browser', page.browser());
  await page.setViewport({ width: 1366, height: 1024 });
  // await page.emulate(KnownDevices['iPad Pro']);
  // 监听页面错误
  page.on('pageerror', err => {
    console.log('Page error: ' + err.toString());
  });
  // const $$proxyFetchHandler = await page.evaluate(() => window.$$proxyFetchHandler);
  // if (!$$proxyFetchHandler) {
  //   await page.exposeFunction('$$proxyFetchHandler', (params) => proxyFetchHandler(params));
  // }

  // const $$getProvideParams = await page.evaluate(() => window.$$getProvideParams);
  // // console.log('$$getProvideParams', $$getProvideParams)
  // 先判断是否已挂载$$getProvideParams方法，如果已挂载，则先remove
  // if ($$getProvideParams) {
  //   try {
  //     await page.removeExposedFunction('$$getProvideParams')
  //   } catch {
  //     console.log('removeExposedFunction报错，不影响后续代码执行')
  //   }
  // }

  // 挂载$$getProvideParams方法
  // await page.exposeFunction('$$getProvideParams', () => ({
  //   $$pageParams: params,
  //   $$customVar: customVar,
  // }));

  await page.evaluateOnNewDocument((__params) => {
    window.$$pageParams = __params.params;
    window.$$customVar = __params.customVar;
    window[__params.customVar] = false;
  }, {
    params,
    customVar
  });

  // await page.goto(_pageUrl, { waitUntil: 'networkidle0' });
  await page.goto(_pageUrl);
  await pageParamsEmulate(page, pageParams);

  // 如果页面定义了window.$$startup，则执行
  // page.evaluate(() => {
  //   try {
  //     console.log('$$startup', window.$$startup)
  //     window.$$startup && window.$$startup()
  //   } catch (err) {
  //     console.log('执行window.$$startup方法失败');
  //   }
  // });
  // 往页面插入script后执行
  // await page.addScriptTag({
  //   content: `
  //     console.log('window.$$startup', window.$$startup);
  //     window.$$startup && window.$$startup();
  //   `,
  //   type: 'module',
  // })

  console.log(`已打开页面：【${_pageUrl}】 \n`);
  console.log(`===============  等待截图  ================ \n`);
}

// 等待截图策略
function waitStrategy(page, pageParams) {
  // 默认使用 customVar 方式，等待页面的 window.customVar 状态改变时进行截图
  let {
    waitType, customVar, timeout, selector, waitForFunctionTimeout, waitForSelectorTimeout
  } = pageParams || {};

  const strategy = {
    timeout: () => {
      return page.waitForTimeout(+timeout);
    },
    customVar: () => {
      return page.waitForFunction((__customVar) => {
        // console.log('__customVar', __customVar);
        // console.log('window[__customVar]', window[__customVar]);
        return window[__customVar]
      }, { timeout: waitForFunctionTimeout }, customVar);
    },
    selector: () => {
      return page.waitForSelector(selector || 'body', { timeout: waitForSelectorTimeout });
    }
  }

  return strategy[waitType]()
}

// 输出pdf
async function pdfHandler(pageParams, date) {
  const { pageUrl } = pageParams;
  const now = dayjs(date).format('YYYYMMDD');
  const browser = await browserPool.use(async browser => browser);
  return await browser.pagePool.use(async page => {
    await initPageParams(page, pageParams);

    const headerTemplate = `<div
      style="width:calc(100% - 50px);margin:-4px auto 0;font-size:8px;padding:4px 0;display: flex; justify-content: space-between;">
      <span>${now}</span>
      <span>数据报表</span>
    </div>`;
    const footerTemplate = `<div
      style="width:calc(100% - 50px);margin:0 auto -4px;font-size:8px;padding:4px 0;display: flex; justify-content: space-between; ">
      <span> </span>
      <div><span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div>`;

    try {
      await waitStrategy(page, pageParams);
      const status = await page.evaluate(() => window[window.$$customVar])
      console.log('waitStrategy--fetch-status', status)
      if (status == 2) throw new Error('当前页面取消截图')
    } catch (err) {
      throw new Error(err)
    }

    let pdfBuffer = await page.pdf({
      width: 1366,
      printBackground: true,
      '-webkit-print-color-adjust': 'exact',
      // displayHeaderFooter: true,
      // headerTemplate,
      // footerTemplate,
      displayHeaderFooter: false,
      // margin: {
      //   top: 50,
      //   bottom: 50
      // },
    });

    // await page.close();
    return pdfBuffer;
  });
}

async function imgToPdf(imgBinary) {
  console.log('=============== imgToPdf ===============')
  const { width = 1366, height = 1024 } = await sizeOf(imgBinary) || {};
  // a4纸的尺寸[595.28,841.89], imgWidth 单位 pt
  const imgWidth = 590;
  const imgHeight = (imgWidth / width) * height;

  const pdfX = imgWidth;
  const pdfY = imgHeight > 841.89 ? imgHeight : 841.89;
  const pdf = new jsPDF('p', 'pt', [pdfX, pdfY]);

  // 将所有内容都放到一页中
  pdf.addImage(imgBinary, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'MEDIUM');
  return Buffer.from(pdf.output('arraybuffer'));
}

// 输出图片
async function imgHandler(pageParams, screenshotOptions = {}, selector = 'html') {
  const browser = await browserPool.use(async browser => browser);
  console.log('imgHandler--browser.isConnected()', browser.isConnected());
  return await browser.pagePool.use(async page => {
    await initPageParams(page, pageParams);

    // TODO 默认超时放弃截图，设置 timeoutAutoExecute 为true时，则超时自动执行截图
    try {
      await waitStrategy(page, pageParams);
      const status = await page.evaluate(() => window[window.$$customVar])
      console.log('waitStrategy--fetch-status', status)
      if (status == 2) throw new Error('当前页面取消截图')
    } catch (err) {
      throw new Error(err)
    }

    let imgBinary = await page.screenshot(screenshotOptions);

    // page.isDetached = true
    // await page.close();
    // return `data:image/${options.type};base64,${imgBinary}`; // encoding为 'base64' 时，返回的base64字符串
    return imgBinary;
  });
}

// 截图方案策略
function getStrategy(params) {
  const { pageParams: {
    waitType, selector, customVar, screenshotOptions,
    timeout, waitForFunctionTimeout, waitForSelectorTimeout,
  } } = params;
  const _params = {
    params: {},
    callbackParams: {},
    ...(params.pageParams || {}),
    waitType: waitType || defaultWaitType,
    selector: selector || defaultSelector,
    customVar: customVar || defaultCustomVar,
    timeout: timeout || defaultWaitTimeout,
    waitForFunctionTimeout: waitForFunctionTimeout ?? defaultWaitForFunctionTimeout,
    waitForSelectorTimeout: waitForSelectorTimeout ?? defaultWaitForSelectorTimeout,
  };

  const { fileType, extName, dateTime } = handleOutputOptions(_params.outputOptions || {});
  const _screenshotOptions = {
    // path: path.resolve(__dirname, '../output/xxx.jpeg'),
    // 要截取整个页面的内容，而不仅仅是可见部分
    fullPage: true,
    type: 'png', // 默认为png
    // quality: 100, // 不适用于 png 图像
    // encoding: 'base64', // 默认binary
    // 如果设置为 true，将忽略页面的背景，即背景将是透明的。如果设置为 false 或者不提供，那么将包括页面的背景。
    omitBackground: true,
    ...screenshotOptions
  };
  if (_screenshotOptions.type == 'png') {
    delete _screenshotOptions.quality
  }
  const strategy = {
    // pdf: () => pdfHandler(pageParams, dateTime),
    pdf: () => {
      const getPdfBuffer = async () => {
        const imgBinary = await imgHandler({
          ..._params,
          outputOptions: { ..._params.outputOptions, fileType: 'img', extName: 'png' }
        }, _screenshotOptions);
        return await imgToPdf(imgBinary)
      }
      return getPdfBuffer()
    },
    img: () => {
      return imgHandler(_params, _screenshotOptions);
    }
  }
  return strategy[fileType]
}

// 处理outputOptions
function handleOutputOptions(outputOptions) {
  let { ossPath = '', fileType = 'img', fileName, extName = 'png', dateTime } = outputOptions || {};
  const now = dayjs(dateTime).format('YYYYMMDD');
  const defaultName = `${now}-${Math.random().toString().slice(2, 10)}`;

  fileType = fileType.toString().toLowerCase();
  extName = extName.toString().toLowerCase();

  // 默认变成 img 如果不是pdf 和 img 
  if (!['pdf', 'img'].includes(fileType)) {
    fileType = 'img'
  }
  if (!['jpeg', 'png', 'webp'].includes(extName)) {
    extName = 'png'
  }

  extName = fileType == 'pdf' ? 'pdf' : extName

  return {
    extName,
    fileType,
    fileName,
    fullName: `${ossPath}/${fileName || defaultName}.${extName}`,
    dateTime: now
  }
}

// 保存单个文件 returnType: ( ossFile: 上传oss, stream: 接口直接返回二进制流)
async function saveSingleFile(params) {
  console.log(params,'params')
  const { returnType = 'ossFile' } = params || {};
  const { pageUrl, outputOptions = {} } = params.pageParams || {};

  if (!pageUrl) {
    console.log('缺少pageUrl参数')
    return {
      success: false,
      message: '缺少pageUrl参数'
    }
  }

  const { fullName } = handleOutputOptions(outputOptions);
  const screenshotHandler = getStrategy(params)
  const [handlerErr, fileBinary] = await wrappedAwait(screenshotHandler())
  if (handlerErr) {
    console.log('截图时内部报错', handlerErr)
    return {
      success: false,
      message: '截图时内部报错'
    }
  }

  console.log('fullName', `${basePath}${fullName}`)

  if (process.env.NODE_ENV === 'development') {
    const now = dayjs().format('YYYY-MM-DD_HH-mm-ss')
    const { fileName = now, extName = 'png' } = params?.pageParams?.outputOptions || {};
    const _fileName = `${fileName}.${extName}`;
    const savePath = path.join(__dirname, `../output/${_fileName}`);
    // console.log('savePath', savePath)
    // console.log('fileBinary', fileBinary)
    fs.writeFile(savePath, fileBinary, function(err) {
      if (!err) {
        console.log(`${_fileName}--本地保存成功`);
      } else {
        console.log(`${_fileName}--本地保存失败`);
        console.log(err)
      }
    });
  }

  if (returnType == 'stream') {
    console.log('截图成功，返回二进制流')
    return {
      success: true,
      message: '截图成功，返回二进制流',
      data: fileBinary
    }
  }
  
  console.log(`===============  截图完成，开始上传oss  ================ \n`);

  const [uploadErr, result] = await wrappedAwait(
    uploadHandler({
      binaryString: fileBinary,
      name: `${basePath}${fullName}`,
    })
  )

  if (uploadErr || !result.success) {
    return {
      success: false,
      message: '上传oss时报错'
    }
  }

  console.log(`===== ${fullName} 上传oss完成  ===== \n`);
  return result;
}

// 保存多个文件
function saveBatchFiles(params = {}, callbackApi) {
  const { pageParams = [] } = params;
  pageParams.forEach(async item => {
    const result = await saveSingleFile({...params, pageParams: item});
    if (callbackApi) {
      console.log(`===============  开始请求回调接口  ================ \n`);
      const apiParams = {
        ...(item.callbackParams || {}),
        msg: result.message,
        code: +result.success,
        filePath: result.filePath,
      }
      console.log(`callbackApi: `, callbackApi);
      console.log(`apiParams: `, JSON.stringify(apiParams));
      axios.post(callbackApi, apiParams).then(res => {
        console.log('请求回调接口成功')
      }).catch(err => {
        console.log('请求回调接口报错--err', err)
      })
    }
  })
}

// 主程序入口
const main = async(params = {}) => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  try {
    console.log('===============  程序已启动  ================ \n');
    console.log(`当前时间：${now} \n`);
    console.log(`启动参数: `, JSON.stringify(params));

    const { pageParams, callbackApi } = params;
    if (!pageParams) {
      console.log('缺少pageParams参数')
      return {
        success: false,
        message: '缺少pageParams参数'
      };
    }

    if (Array.isArray(pageParams)) {
      saveBatchFiles(params, callbackApi);
      return {
        success: true,
        message: '任务进行中'
      }
    }

    let result = await saveSingleFile(params);

    if (!result) {
      return {
        success: false,
        message: '内部错误'
      }
    };

    console.log('已全部完成，程序结束 \n');
    return result;
  } catch (err) {
    console.log('main-err', err)
    return {
      success: false,
      message: '内部错误'
    }
  }
};

module.exports = main;
