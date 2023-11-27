const axios = require('axios');
const express = require('express');
const routes = express.Router();
const util = require('util');
const { exec } = require('child_process');
const { join } = require('path');

const { getRandomVal } = require('../../tools/utils.js');
const printHandler = require('../../tools/printHandler.js');
const { deleteFileEntry } = require('../../tools/ossFileHandler.js');
const poolTest = require('../../tools/poolTest.js');

const contentTypeDefault = 'application/json; charset=utf-8'

routes.get('/', (req, res) => {
  res.send('report-root-path');
});

// 服务重启
routes.get('/reload', async (req, res) => {
  setTimeout(() => {
    exec('npm run reload', { pwd: join(__dirname, '../../') });
  }, 3000);

  res.json({
    code: 1,
    success: true,
    message: 'reload通知已发送, 程序将在3s后重启',
    data: null
  });
});

// 开始截图任务
routes.post('/screenshot', async(req, res) => {
  const params = req.body;

  try {
    let result = await printHandler(params);
    // console.log('screenshot--result', result);
    if (!result) {
      res.json({ code: 0, success: false, message: '操作失败', data: null });
    } else {
      const { returnType = 'ossFile' } = params || {};
      if (returnType == 'ossFile') {
        res.json({
          code: +result.success,
          data: null,
          ...result
        });
      } else if (returnType == 'stream') {
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream', // 告诉浏览器这是一个二进制文件
          'Content-Disposition': 'attachment; filename=export.pdf', // 告诉浏览器这是一个需要下载的文件
        });
        res.end(result.data);
      }
    }
  } catch {
    res.json({ code: 0, success: false, message: '操作失败', data: null });
  }
});

// 请求代理接口
// routes.post('/api-proxy', async (req, res) => {
//   const randomVal = getRandomVal(32);
//   try {
//     console.log(`api-proxy--params-${randomVal}`, JSON.stringify(req.body || {}))
//     axios({
//       ...req.body,
//       'Content-Type': contentTypeDefault,
//       'traceId': randomVal,
//     }).then(result => {
//       console.log(`api-proxy--result-${randomVal}`, result.data)
//       res.json({...result.data, traceId: randomVal});
//     }).catch(err => {
//       res.json({ code: 0, success: false, message: err, data: null, traceId: randomVal });
//     });
//   } catch (err) {
//     res.json({ code: 0, success: false, message: '请求失败', data: null, traceId: randomVal });
//   }
// });

// 批量删除OSS文件
// routes.post('/oss/delete', async (req, res) => {
//   try {
//     const result = await deleteFileEntry(req.body);

//     if (!result) {
//       res.json({ code: 0, success: false, message: '操作失败', data: null });
//     } else {
//       res.json({
//         code: +result.success,
//         data: null,
//         ...result
//       });
//     }
//   } catch {
//     res.json({ code: 0, success: false, message: '操作失败', data: null });
//     return;
//   }
// });


// 服务状态小测试
routes.get('/apitest', async (req, res) => {
  console.log('apitest--query', req.query)
  res.json({
    code: 1,
    success: true,
    message: 'api测试',
    data: req.query
  });
});

// pool小测试
routes.get('/poolTest', async (req, res) => {
  let result = await poolTest({ name: 'xxxyyyzzz', id: 5678 });
  // console.log('poolTest--result', result)
  res.json({
    code: 1,
    data: null
  });
});

// 自推送测试
routes.post('/postMessage', (req, res) => {
  const data = req.body;
  console.log('postMessage--data', data)
  res.json({
    code: 1,
    data
  });
});

module.exports = routes;
