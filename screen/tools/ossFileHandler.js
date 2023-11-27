const dayjs = require('dayjs');
const Jss = require('@jd/jmfe-node-jss');
const {
  ossConfig: {
    accessKey,
    secretKey,
    useHttps,
    endpoint,
    presignUrl,
  },
  basePath,
  defaultBucket
} = require('../config/oss');

const jss = new Jss(endpoint, accessKey, secretKey, useHttps, presignUrl);

const { wrappedAwait } = require('./utils.js');

// 上传到oss
async function uploadHandler({binaryString, name, bucket = defaultBucket}) {
  const now = dayjs().format('YYYYMMDD');
  const [err, hasBucket] = await wrappedAwait(jss.hasBucket(bucket))
  if (err) {
    console.log('查询bucket时报错', err)
    return {
      success: false,
      message: '查询bucket时报错'
    }
  }

  const bkt = jss.bucket(bucket)
  if (!hasBucket) {
    await bkt.create();
  }

  const objectKey = name || `${now}-${Math.random().toString().slice(2, 10)}.jpeg`;
  const ossObject = bkt.object(objectKey)

  const [uploadErr, uploadResult] = await wrappedAwait(ossObject.putBody(binaryString))
  if (uploadErr) {
    console.log('上传到oss时报错', uploadErr)
    return {
      success: false,
      message: '上传到oss时报错'
    }
  }

  return {
    success: true,
    message: '操作成功',
    data: uploadResult,
    filePath: `/${bucket}/${objectKey}`
  };
}

// 删除oss对应的资源
async function deleteHandler({path, bucket = defaultBucket}) {
  const _path = path.substring(`/${bucket}/`.length)
  console.log('_path', _path)
  const [err, hasBucket] = await wrappedAwait(jss.hasBucket(bucket))
  if (err) {
    console.log('查询bucket时报错', err)
    return {
      success: false,
      message: '查询bucket时报错'
    }
  }

  if (!hasBucket) {
    return {
      success: true,
      message: '删除成功'
    }
  }

  const ossObject = jss.bucket(bucket).object(_path)

  const [existErr, isExist] = await wrappedAwait(ossObject.exist())

  if (existErr) {
    console.log('查询object时报错', existErr)
    return {
      success: false,
      message: '查询object时报错'
    }
  }

  console.log('oss-file-isExist', isExist)
  if (!isExist) {
    return {
      success: true,
      message: '删除成功'
    }
  }

  const [deleteErr, deleteResult] = await wrappedAwait(ossObject.delete())
  if (deleteErr) {
    console.log('删除oss资源时报错', deleteErr)
    return {
      success: false,
      message: '删除oss资源时报错'
    }
  }

  return {
    success: true,
    message: '删除成功',
    data: { path, bucket },
  };
}

// 根据prefix删除oss对应的资源
async function deleteByPrefix({prefix = '', bucket = defaultBucket}) {
  const [err, hasBucket] = await wrappedAwait(jss.hasBucket(bucket))
  if (err) {
    console.log('查询bucket时报错', err)
    return {
      success: false,
      message: '查询bucket时报错'
    }
  }

  if (!hasBucket) {
    return {
      success: true,
      message: '删除成功'
    }
  }

  const bkt = jss.bucket(bucket);

  const _prefix = basePath + prefix;
  console.log('deleteByPrefix--_prefix', _prefix)

  async function getAllList (resultList, _bucket, marker) {
    try {
      const result = await _bucket.listObject(marker, 1000, _prefix, undefined);
      const { HasNext = false, Contents = [] } = JSON.parse(result || {})

      if (HasNext) {
        const _marker = Contents[Contents.length - 1].Key;
        return await getAllList([...resultList, ...Contents], _bucket, _marker);
      } else {
        return [...resultList, ...Contents]
      }
    } catch (err) {

    }
  }

  const objectList = await getAllList([], bkt, undefined)

  const promises = objectList.map(item => deleteHandler({path: `/${bucket}/${item.Key}`, bucket}));
  const [promiseErr, promisesResult] = await wrappedAwait(Promise.allSettled(promises));

  if (promiseErr) {
    return {
      success: false,
      message: '内部错误'
    };
  }

  const result = promisesResult.map(item => {
    if (item.status === 'rejected') {
      return {
        success: false,
        message: '删除失败',
        ...(item.value || {})
      }
    }
    return item.value
  })

  console.log('deleteByPrefix-result', result)

  return {
    success: true,
    message: '删除成功',
    data: result
  }
}

async function deleteFileEntry (params) {
  try {
    console.log('===============  开始删除oss资源  ================ \n');
    console.log(`启动参数: `, JSON.stringify(params));

    const { list = [], prefix } = params || {};
    if (prefix) {
      return await deleteByPrefix(params);
    }

    if (!list.length) {
      return {
        success: false,
        message: '缺少list参数'
      };
    }

    const promises = list.map(item => deleteHandler(item));
    const [err, promisesResult] = await wrappedAwait(Promise.allSettled(promises));

    if (err) {
      return {
        success: false,
        message: '内部错误'
      };
    }

    const result = promisesResult.map(item => {
      if (item.status === 'rejected') {
        return {
          success: false,
          message: '删除失败',
          ...(item.value || {})
        }
      }
      return item.value
    })

    console.log('deleteFileEntry-result', JSON.stringify(result));

    return {
      success: true,
      message: '删除成功',
      data: result
    }
  } catch (err) {
    console.log('err', err)
    return {
      success: false,
      message: '内部错误'
    }
  }
}

module.exports = {
  uploadHandler,
  deleteHandler,
  deleteFileEntry
}