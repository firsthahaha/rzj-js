const dayjs = require('dayjs');
const Jss = require('@jd/jmfe-node-jss');
const {
  accessKey,
  secretKey,
  useHttps,
  endpoint,
  presignUrl,
} = require('../config/oss');

const jss = new Jss(endpoint, accessKey, secretKey, useHttps, presignUrl);

const { wrappedAwait } = require('./utils.js');

// 上传到oss
async function uploadHandler({binaryString, name, bucket = 'wht'}) {
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

module.exports = uploadHandler;