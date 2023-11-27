const axios = require('axios');

// 延时操作
function waitTime(n) {
  return new Promise((r) => setTimeout(r, n));
}

// async 方法包装，对 await 做兼容处理
function wrappedAwait(awaitFunc) {
  let p = Promise.resolve(awaitFunc); // 非Promise则转为Promise
  return p
    .then((res) => {
      return [null, res];
    })
    .catch((err) => {
      return [err, null];
    });
}

// 并发请求池 (无需等待全部请求完成)
async function* asyncPool(concurrency, iteratorList, iteratorFn) {
  const executing = new Set();
  async function consume() {
    const [promise, value] = await Promise.race(executing);
    executing.delete(promise);
    return value;
  }

  for (let i = 0; i < iteratorList.length; i++) {
    const item = iteratorList[i];
    // 如果第三个参数传入的是公共的处理函数，则调用处理函数 （iteratorList 是 参数的 集合）
    // 否则认为 iteratorList 是 promise 的集合
    const promise = wrappedAwait(
      iteratorFn && typeof iteratorFn === 'function'
      ? iteratorFn(item, iteratorList)
      : iteratorList[i]
    ).then(([err, data]) => {
      // console.log('err', err)
      // console.log('data', data)
      return [promise, { index: i, err, data }];
    })

    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await consume();
    }
  }
  while (executing.size) {
    yield await consume();
  }
}

// 并发请求池 (并发请求，最后返回全部请求完成的结果)
async function asyncPoolAll(concurrency, iterable, iteratorFn) {
  const result = [];
  for await (const {index, err, data} of asyncPool(concurrency, iterable, iteratorFn)) {
    console.log('result-index', index)
    console.log('result-index-data', data)
    result[index] = {err, data};
  }
  return result;
}

/**
 * @description: 生成随机字符串
 * @param {Number} len 想要生成的随机字符串长度
 * @param {Boolean} isPlainNumber 随机字符串是否纯数字
 * @return {String} 要输出的字符串
 */
function getRandomVal(len = 16, isPlainNumber = false) {
  let chars = isPlainNumber
    ? '1234567890'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let result = '';

  for (let i = 0; i < len; i++) {
    let currIndex = ~~(Math.random() * chars.length);
    result += chars[currIndex];
  }

  return result;
}

async function proxyFetchHandler(params) {
  const randomVal = getRandomVal(32);
  console.log(`proxyFetchHandler--params-${randomVal}`, JSON.stringify(params));
  return new Promise((resolve) => {
    axios({ ...params, 'Content-Type': 'application/json; charset=utf-8' })
      .then((res) => {
        console.log(`proxyFetchHandler--result-${randomVal}`, res.data);
        resolve(res.data || {});
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  waitTime,
  asyncPool,
  asyncPoolAll,
  wrappedAwait,
  getRandomVal,
  proxyFetchHandler,
};
