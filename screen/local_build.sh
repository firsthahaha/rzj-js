#!/bin/sh

echo "############## start ##############"
pwd
ls -lha
node -v
npm -v

echo "############## 开始安装依赖 ##############"

npm install --production --registry=http://registry.m.jd.com --puppeteer_skip_download=true --unsafe-perm=true --allow-root

# node node_modules/puppeteer/install.js

echo "############## 开始拷贝代码 ##############"

mkdir -p $BUILD/bin
mkdir -p $BUILD/server
cp -r ./bin/* $BUILD/bin
cp -r ./* $BUILD/server
# cp -r ./puppeteerCache/* $BUILD/puppeteerCache

echo "############## ls -lha $BUILD ##############"