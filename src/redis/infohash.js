'use strict';

var redis = require('./../common/redis');

// 保存infohash
exports.sadd = function (infohash) {
    redis.sadd('infohash', infohash);
};

// 随机取出并且删除一个infohash
exports.spop = function (callback) {
    redis.spop('infohash', callback);
};