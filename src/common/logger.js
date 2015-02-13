'use strict';

var winston = require('winston'),
    path = require('path'),
    util = require('util');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: path.join(__dirname, '../../log/info.log'),
            handleExceptions: true,
            maxsize: 2 * 1024 * 1024, // 2M
            json: false
        })
    ],
    exitOnError: false
});

//调试，不使用winston默认的console.log
logger.on('logging', function (transport, level, msg, meta) {
    console.log(util.inspect(msg ? msg : meta, { showHidden: true, depth: null, colors: true }));
});

module.exports = logger;
