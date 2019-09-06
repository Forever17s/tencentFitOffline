const log4js = require('log4js')
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {//控制台输出
            type: 'stdout',
            layout: { type: 'messagePassThrough' }
        },
        req: {//请求日志
            type: 'dateFile',
            filename: '/data/tencentFitOffline/reqresp/logs/reqlog/',
            pattern: 'yyyy-MM-dd-hh-mm.log',
            alwaysIncludePattern: true, 
            layout: { type: 'messagePassThrough' }
        },
        err: {//错误日志
            type: 'dateFile',
            filename: '/data/tencentFitOffline/reqresp/logs/errlog/',
            pattern: 'yyyy-MM-dd-hh-mm.log',
            alwaysIncludePattern: true, 
            layout: { type: 'messagePassThrough' }
        },
        oth: {//其他日志
            type: 'dateFile',
            filename: '/data/tencentFitOffline/reqresp/logs/othlog/',
            pattern: 'yyyy-MM-dd-hh-mm.log',
            alwaysIncludePattern: true, 
            layout: { type: 'messagePassThrough' }
        }
    },
    categories: {
        default: { appenders: ['req'], level: 'debug' },//appenders:采用的appender,取appenders项,level:设置级别
        err: { appenders: ['err'], level: 'info' },
        oth: { appenders: ['oth'], level: 'info' }
    }
})
 
exports.getLogger = function (name) {//name取categories项
    return log4js.getLogger(name || 'default')
}