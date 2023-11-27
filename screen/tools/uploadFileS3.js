const AWS = require('aws-sdk');
const path = require('path');
const dayjs = require('dayjs');

AWS.config.loadFromPath(path.join(__dirname, '../config/s3.json'));
let s3 = new AWS.S3();

console.log('s3', s3.upload)
// 上传到oss
function uploadHandler({binaryString, name, bucket = 'wht'}) {
  console.log('uploadHandler--name', name)
  const now = dayjs().format('YYYYMMDD');
  return new Promise((resolve, reject) => {
      let uploadParams = {
        Bucket: bucket,
        Body: binaryString,
        Key: name || `${now}-${Math.random().toString().slice(2, 10)}`,
      };

      s3.upload(uploadParams, function (err, data) {
          if (err) {
              console.log('upload-err', err)
              reject(err);
          } else {
              resolve(data);
          }
      });
  });
}

// const uploadHandler = async () => 'oss.xxx/aaa'

module.exports = uploadHandler;