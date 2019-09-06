## 简介

项目主要运用 Node.js 的文件和 HTTP 两个模块进行离线问询对接腾讯，解析线上的 txt 文件向对方进行问询，采用 log4js 存储日志，前提需品友公网 IP 配置到对接方白名单

## 安装

```bash
# 克隆项目
git clone git@gitlab.ipinyou.com:guangcheng.wang/tencentFitOffline.git

# 进入项目目录
cd tencentFitOffline

# 安装依赖
npm install

# 建议不要直接使用 cnpm 安装依赖，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npm.taobao.org

# 启动服务
npm run read
```

Copyright (c) 2019 品友互动优弛团队出品
