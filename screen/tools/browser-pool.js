const puppeteer = require('puppeteer');
const genericPool = require('generic-pool');
const launchOptions = require('../config/launchOptions.js');
const initPagePool = require('./page-pool.js');

/**
 * 初始化一个 Puppeteer 池
 * @param {Object} options 创建池的配置配置
 * @param {Number} options.max 最多产生多少个 puppeteer 实例。如果设置它，请确保在引用关闭时调用清理池。 pool.drain().then(()=>pool.clear())
 * @param {Number} options.min 保证池中最少有多少个实例存活
 * @param {Number} options.maxUses 每一个 实例 最大可重用次数，超过后将重启实例。0表示不检验
 * @param {Number} options.testOnBorrow 在将 实例 提供给用户之前，池应该验证这些实例。
 * @param {Boolean} options.autostart 是不是需要在 池 初始化时 初始化 实例
 * @param {Number} options.idleTimeoutMillis 如果一个实例超过设置时长都没访问就销毁
 * @param {Number} options.evictionRunIntervalMillis 每过一段时间 检查一次 实例的访问状态
 * @param {Object} options.puppeteerArgs puppeteer.launch 启动的参数
 * @param {Function} options.validator 用户自定义校验 参数是 取到的一个实例
 * @param {Object} options.otherConfig 剩余的其他参数, 见 https://github.com/coopernurse/node-pool
 * @return {Object} pool
 */
function initPuppeteerPool(options = {}) {
  console.log('initPuppeteerPool')
  let browserId = 1;
  const {
    max = 1,
    min = 1,
    maxUses = 50,
    testOnBorrow = true,
    autostart = true,
    idleTimeoutMillis = 3600000 * 4,
    evictionRunIntervalMillis = 180000,
    puppeteerArgs = {},
    validator = () => Promise.resolve(true),
    ...otherConfig
  } = options;

  const factory = {
    create: async () => {
      console.log('创建一个 Puppeteer 实例');
      // 创建一个 puppeteer 实例 ，并且初始化使用次数为 0
      const instance = await puppeteer.launch(puppeteerArgs);
      instance.useCount = 0;
      instance.browserId = browserId++;
      instance.pagePool = await initPagePool({browser: instance});

      instance.on('disconnected', () => {
        console.log('---------------Browser disconnected--------------');
        console.log('Browser.isConnected()', instance.isConnected());
        // 在这里执行你需要的操作
      });
      // console.log(`instance.version`, await instance.version());
      // console.log(`instance.userAgent`, await instance.userAgent());
      return instance;
    },
    destroy: async (instance) => {
      console.log('销毁一个 Puppeteer 实例');
      console.log('browser-destroy--browser.isConnected()', instance.isConnected());
      try {
        await instance.pagePool.drain().then(async () => {
          await instance.pagePool.clear();
          await instance.close();
        });
      } catch (err) {
        console.log('browser-destroy-err', err);
      }
    },
    validate: (instance) => {
      // 执行一次自定义校验，并且校验 实例已使用次数。 当 返回 reject 时 表示实例不可用
      return validator(instance).then((valid) => {
        return Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses) && instance.isConnected())
      });
    },
  };
  const config = {
    max,
    min,
    testOnBorrow,
    autostart,
    idleTimeoutMillis,
    evictionRunIntervalMillis,
    ...otherConfig,
  };
  const pool = genericPool.createPool(factory, config);
  const genericAcquire = pool.acquire.bind(pool);
  // 重写了原有池的消费实例的方法。添加一个实例使用次数的增加
  pool.acquire = () =>
    genericAcquire().then((instance) => {
      instance.useCount += 1;
      return instance;
    });

  pool.use = (fn) => {
    let resource;
    return pool
      .acquire()
      .then((r) => {
        resource = r;
        console.log('使用一个 Puppeteer 实例', resource.browserId);
        return resource;
      })
      .then(fn)
      .then(
        (result) => {
          // console.log('resource.pagePool.max', resource.pagePool.max)
          // console.log('resource.pagePool.size', resource.pagePool.size)
          // console.log('resource.pagePool.available', resource.pagePool.available)
          // console.log('resource.pagePool.borrowed', resource.pagePool.borrowed)
          // console.log('resource.pagePool.pending', resource.pagePool.pending)
          if (resource.pagePool.pending < resource.pagePool.max) {
            pool.release(resource);
          }
          return result;
        },
        (err) => {
          pool.release(resource);
          throw err;
        }
      );
  };
  return pool;
};

// 全局只应该被初始化一次
module.exports = initPuppeteerPool({
  puppeteerArgs: launchOptions
});

