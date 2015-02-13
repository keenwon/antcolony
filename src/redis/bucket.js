'use strict';

var util = require('util'),
    config = require('../../config'),
    redis = require('./../common/redis'),
    logger = require('./../common/logger'),
    K = 8;

var getDistance;

// 插入桶（可以插入重复的值）
exports.push = function (workerId, remoteNodes) {
    var key, value, node, distance;

    for (var i = 0, j = remoteNodes.length; i < j; i++) {
        node = remoteNodes[i];
        distance = getDistance(workerId, node.id);
        key = util.format('bucket:%d', distance);
        value = util.format('%s:%s:%d', node.id.toString('hex'), node.address, node.port);

        // 添加保持桶里只有8个
        redis.lpush(key, value);
        redis.ltrim(key, 0, K - 1);
    }
};

// 取K个最近的
exports.getKClosest = function (workerId, targetId, callback) {
    var distance = getDistance(workerId, targetId),
        key = util.format('bucket:%d', distance);

    redis.lrange(key, 0, K - 1, function (error, values) {
        if (error) {
            logger.error(error);
            return;
        }
        var node, nodes = [];
        for (var i = 0, j = values.length; i < j; i++) {
            node = values[i].split(':');
            nodes.push({
                id: new Buffer(node[0], 'hex'),
                address: node[1],
                port: +node[2]
            });
        }
        callback(nodes);
    });
};

getDistance = function (firstId, secondId) {
    var max = Math.max(firstId.length, secondId.length);
    var accumulator = '';
    for (var i = 0; i < max; i++) {
        var maxDistance = (firstId[i] === undefined || secondId[i] === undefined);
        if (maxDistance) {
            accumulator += (255).toString(16);
        } else {
            accumulator += (firstId[i] ^ secondId[i]).toString(16);
        }
    }
    var result = parseInt(accumulator, 16);

    // 计算在[2^0,2^160)内的落点
    // 160的概率大，所以反过来循环
    for (var distance = 159; distance >= 0; distance--) {
        if (Math.pow(2, distance) <= result && result < Math.pow(2, distance + 1)) {
            return distance;
        }
    }

    return 159;
};