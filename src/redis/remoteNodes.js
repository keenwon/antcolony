'use strict';

var util = require('util'),
    confog = require('../../config'),
    redis = require('./../common/redis'),
    remoteNodesKey = 'remoteNodes';

// 在redis集合的尾部添加nodes
exports.push = function (remoteNodes, callback) {
    var nodes = [remoteNodesKey];

    // 插入，且格式化为address:port的格式
    for (var i = 0, j = remoteNodes.length; i < j; i++) {
        nodes.push(util.format('%s:%d', remoteNodes[i].address, remoteNodes[i].port));
    }

    if (callback || typeof callback === 'function') {
        nodes.push(callback);
    }

    redis.lpush.apply(redis, nodes);
    redis.ltrim(remoteNodesKey, 0, confog.remoteNodesLimit);

    nodes = null;
};

// 在redis链表的头部取出，并且删除node
exports.pop = function (callback) {
    // callback参数是 callback(err, reply)
    redis.rpop(remoteNodesKey, callback);
};