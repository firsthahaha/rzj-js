const genericPool = require('generic-pool');
// const browserPool = require('./browser-pool.js');

/**
 * 初始化一个 Page 池
 * @param {Object} options 创建池的配置配置
 * @param {Number} options.max 最多产生多少个 Page 实例。如果设置它，请确保在引用关闭时调用清理池。 pool.drain().then(()=>pool.clear())
 * @param {Number} options.min 保证池中最少有多少个实例存活
 * @param {Number} options.maxUses 每一个 Page 实例 最大可重用次数，超过后将重启实例。0表示不检验
 * @param {Number} options.testOnBorrow 在将 实例 提供给用户之前，池应该验证这些实例。
 * @param {Boolean} options.autostart 是不是需要在 池 初始化时 初始化 实例
 * @param {Number} options.idleTimeoutMillis 如果一个实例超过设置时长都没访问就销毁
 * @param {Number} options.evictionRunIntervalMillis 每过一段时间 检查一次 实例的访问状态
 * @param {Function} options.validator 用户自定义校验 参数是 取到的一个实例
 * @param {Object} options.otherConfig 剩余的其他参数, 见 https://github.com/coopernurse/node-pool
 * @return {Object} pool
 */
function initPagePool(options = {}) {
  console.log('initPagePool')
  let pageId = 1;
  const {
    max = 8,
    min = 1,
    maxUses = 6,
    testOnBorrow = true,
    autostart = true,
    idleTimeoutMillis = 3600000, // 60分钟
    evictionRunIntervalMillis = 180000, // 3分钟
    validator = () => Promise.resolve(true),
    browser,
    ...otherConfig
  } = options;

  const factory = {
    create: async () => {
      console.log('创建一个 Page 实例');
      // 创建一个 Page 实例 ，并且初始化使用次数为 0
      const instance = await browser.newPage();
      // const instance = await browserPool.use(async browser => {
      //   console.log('browser.browserId', browser.browserId);
      //   return await browser.newPage();
      // });
      instance.useCount = 0;
      instance.pageId = pageId++;
      instance.isDetached = false;
      handlerInstance(instance);

      return instance;
    },
    destroy: async (instance) => {
      console.log('销毁一个 Page 实例');
      console.log('page-destroy--page.isClosed()', instance.isClosed());
      if (instance.isClosed()) return;
      console.log('page没有close, 则销毁page');
      instance.close().catch(err => {
        console.log('page-destroy-err', err);
      });
    },
    validate: (instance) => {
      // 执行一次自定义校验，并且校验 实例已使用次数。 当 返回 reject 时 表示实例不可用
      return validator(instance).then((valid) =>
        Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses && !instance.isDetached))
      );
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
        // console.log('使用一个 Page 实例', resource.useCount, resource);
        return resource;
      })
      .then(fn)
      .then(
        (result) => {
          // 不管业务方使用实例成功与否都表示一下实例消费完成
          pool.release(resource);
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

function handlerInstance(instance) {
  instance.on('close', async () => {
    console.log('close-pageId', instance.pageId)
    instance.isDetached = true
  }).on('framedetached', async () => {
    console.log('framedetached-pageId', instance.pageId)
    instance.isDetached = true
  }).on('error', () => {
    console.log('error-pageId', instance.pageId)
    instance.isDetached = true
  }).on('workerdestroyed', () => {
    console.log('workerdestroyed-pageId', instance.pageId)
    instance.isDetached = true
  })
}

module.exports = initPagePool;

