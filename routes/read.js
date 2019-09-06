var http = require('http');
var KeepAliveAgent = require('keep-alive-agent')
var util = require('util');
var events = require('events');
var log4js = require("../public/log4js/logConf");
var params = require("../public/data/param.json");
var fs = require('fs');//引入文件读取模块
var readline = require('readline');
const HOSTNAME = '125.39.52.225'; // 正式地址
// const HOSTNAME = 'tencentfit.dmp.com';// 祥波nginx代理，本机hosts指向192.168.152.220
// const filePath = "./public/test/test.txt"; //解析测试文件
const filePath = "/data/users/hadoop_ts/peng.yan/test/online1214/online_1214.txt"; //解析线上文件
// const lineBytes = 34;//一行对应偏移的字节数
const lineBytes = 33;//线上一行对应偏移的字节数
const readFileNamePath = "./public/readProgress/readFileName.txt";
const cachePath = "./public/readProgress/cache.txt";
const cacheReadLinePath = "./public/readProgress/cacheReadLine.txt";
const startLinePath = "./public/readProgress/startLine.txt";
const spendTimePath = "./public/readProgress/spendTime.txt";
const logger = log4js.getLogger()//根据需要获取logger
const othlogger = log4js.getLogger('oth')
const errlogger = log4js.getLogger('err')
const QBS = 5000;// 读取文件，限制速度
var _readlinesSecond = 0;// 启动系统的读取行数
var _readTimestamp = Date.now();// 启动系统的时间戳
const splitWord = '\t ';//log拼接符
const dmp_name = 'TencentFitPrebid';
var reqTime = '';// 发起时间戳
var resTime = '';// 响应时间戳
var logString = '';
const readLength = 1000;//将读取信息放入cache中，在发送请求
const reLineBytes = 32;//cache中一行内容的字节数
var startLine = getLastLine();
var endLine = getEndLine();
var readFileTime = '';//记录每次开始读取文件的时间戳
var sendRequestTime = '';//记录每次开始发送第一条请求的时间戳

//继续上次操作，将cache中内容读取完毕。
readCache();

//文件信息异常
function errorLog(data) {
  errlogger.info(data)
}
//逐行读取文件内容
function readFile(path){
  readFileTime = Date.now();
  reqTime = new Date().getTime();
  //console.log('getLastLine: %s, getEndLine: %s', getLastLine(), getEndLine());
  // 读文件，参数(文件路径，QBS)
  var s = new ReadStreamThrottle(fs.createReadStream(path,{start:startBytes(),end:endBytes()}), QBS);
  s.on('read', function () {
    var spent = (Date.now() - _readTimestamp) / 1000;
    //console.log('read %s lines, speed: %sL/S', _readlinesSecond, (_readlinesSecond / spent).toFixed(2));
  });
  s.on('close', function () {
    var t = Date.now();
    var readLine = getLastLine();
    var spendTime = getSpendTime();
    spendTime += Date.now() - t;
    var spent = (spendTime) / 1000;
    // console.log('read... total %s lines, spend: %sS', readLine, spent.toFixed(2));
  });
}
//读取缓存信息发送请求
function readCache() {
  var fRead = fs.createReadStream(cachePath);
  var objReadline = readline.createInterface({input: fRead});
  var buffer = [];
  objReadline.on('line', function (line){
    buffer.push(line.toString())
  });

  objReadline.on('close', function (){
    // console.log('read file',((Date.now()-readFileTime)/1000).toFixed(2))
    sendRequest(buffer)
  });
}
//读取文件开始偏移位置
function startBytes() {
  return getLastLine()*lineBytes;
}
//读取文件结束偏移位置
function endBytes() {
  // -2减去换行符
  return getEndLine()*lineBytes-1;
}
//获取已经读取的文件路径
function getReadFilePath() {
  var path = fs.readFileSync(readFileNamePath,'utf-8');
  return path ? path.toString().split(" ") : "";
}
//修改已经读取的文件路径
function setReadFilePath(path) {
  fs.writeFileSync(readFileNamePath, path + ' ', { 'flag': 'a' });
}
//获取cache上次读取位置
function getCacheReadLine() {
  var lineIndex = fs.readFileSync(cacheReadLinePath,'utf-8');
  return lineIndex ? parseInt(lineIndex) : 0;
}
//修改cache上次读取位置
function setCacheReadLine(index) {
  fs.writeFileSync(cacheReadLinePath, index ,'utf8');
}
//获取文件上次读取位置
function getLastLine() {
  var data = fs.readFileSync(startLinePath,'utf-8');
  return data ? parseInt(data) : 0;
}
//修改文件已经读取位置
function setLastLine(index) {
  fs.writeFileSync(startLinePath, index ,'utf8');
}
//读取到第多少行
function getEndLine() {
  return getLastLine() + readLength;
}
//读取累计时间
function getSpendTime() {
  var time = fs.readFileSync(spendTimePath,'utf-8');
  return time ? parseInt(time) : 0;
}
//修改累计时间
function setSpendTime(time) {
  fs.writeFileSync(spendTimePath, time ,'utf8');
}
//发送请求
function sendRequest(buffer) {
  sendRequestTime = Date.now();
  var bufferLen = buffer.length;
  if(bufferLen === 0){
    readFile(filePath);
    return;
  }
  for(let i = 0; i < bufferLen;i ++){
    params.didMd5 = buffer[i]; //修改传递参数
    othlogger.info(buffer[i]);
    var postData = JSON.stringify(params)
    var options = {
      hostname: HOSTNAME,
      port: 8080,
      path: "/recommend/dmp/groupQuery.do",
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Length': postData.length
      },
      agent: new KeepAliveAgent(),
    };
    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (body) {
        reqTime = resTime;
        resTime = new Date().getTime();
        logString = '';
        logString += 'null' + splitWord; //bid_action_id
        logString += reqTime + splitWord;
        logString += dmp_name + splitWord;
        logString += 'null' + splitWord; //token
        logString += (buffer[i] ? buffer[i] : params.didMd5) + splitWord;
        logString += 'null' + splitWord; //device_id
        logString += 'null' + splitWord; //inventory_type
        logString += 'null' + splitWord; //os
        logString += 'null' + splitWord; //ip
        logString += 'null' + splitWord; //error_info
        logString += JSON.stringify(params.groupIds) + splitWord;
        logString += (body ? JSON.stringify(body) : 'null') + splitWord;
        logString += resTime + splitWord;
        logString += 'null' + splitWord; //adp_tags
        logger.info(logString);
      });
      if (i === bufferLen -1) operateAfterReq(bufferLen)
    });

    req.on('error', function(e) {
      errlogger.info(buffer[i] + splitWord + e.message);
      if (i === bufferLen -1) operateAfterReq(bufferLen)
    });
    req.write(postData);
    req.end();
  }
}
//缓存内容请求发送完毕后续操作
function operateAfterReq(bufferLen) {
  // console.log('send request time',((Date.now()-sendRequestTime)/1000).toFixed(2))
  var startIndex = getLastLine();
  var hasFinishLine = startIndex + bufferLen;
  var spendTime = getSpendTime();
  spendTime += Date.now() - readFileTime;
  setSpendTime(spendTime);
  //修改文件问询行数
  setLastLine(hasFinishLine);
  if(bufferLen === readLength){
    console.log('total has finished %s lines, spend: %sS', hasFinishLine, (spendTime/1000).toFixed(2));
    readFile(filePath);
  } else{
    console.log(filePath + ' has finished reading!')
    setReadFilePath(filePath)
  }
}
//限速读文件构造函数
function ReadStreamThrottle (stream, speed) {
  this._stream = stream;
  this._speed = speed;
  this._closeed = false;
  this._paused = false;
  this._readLineIndex = 0;
  var self = this;
  startLine = getLastLine();
  endLine = getEndLine();

  // 检查速度是否太快
  function isTooFast () {
    var t = (Date.now() - _readTimestamp) / 1000;
    var bps = _readlinesSecond / t;
    return bps > speed;
  }

  // 每隔一段时间检查速度
  function checkSpeed () {
    if (isTooFast()) {
      self.pause();
      // 直到平均速度放缓到预设的值时继续读流
      var tid = setInterval(function () {
        if (!isTooFast()) {
          clearInterval(tid);
          self.resume();
        }
      }, 100);
    } else {
      self.resume();
    }
  }
  stream.on('data', function (chunk) {
    fs.writeFileSync(cachePath, chunk);
    _readlinesSecond += readLength;
    self.emit('read');
    checkSpeed();
  });

  stream.on('close', function () {
    readCache();
    self._closeed = true;
    self.emit('close');
  });
}
//继承events绑定事件
util.inherits(ReadStreamThrottle, events.EventEmitter);
//读文件暂停
ReadStreamThrottle.prototype.pause = function () {
  this._paused = true;
  this._stream.pause();
};
//重新读文件
ReadStreamThrottle.prototype.resume = function () {
  this._paused = false;
  this._stream.resume();
};
