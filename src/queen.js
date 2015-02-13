'use strict';

/**
 * Worker - 收集infohash
 * Male   - 根据infohash下载torrent文件
 * Female - 解析torrent文件，存入mongodb
 */

var method = process.argv.slice(2)[0],
    port = process.argv.slice(2)[1],
    logger = require('./common/logger'),
    util = require('util'),
    Male = require('./male'),
    Female = require('./female'),
    Worker = require('./worker');

if (method === 'male') {
    Male.run();
} else if (method === 'female') {
    Female.run();
} else {
    Worker.create(port);
}