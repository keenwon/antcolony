'use strict';

var redis = require('./../common/redis');

// 增加发送请求数
exports.incrSendRequest = function () {
    redis.hincrby('sysInfo', 'sendRequest', 1);
};

// 增加发送响应数
exports.incrSendReponse = function () {
    redis.hincrby('sysInfo', 'sendReponse', 1);
};

// 增加接收请求数
exports.incrReceiveRequest = function () {
    redis.hincrby('sysInfo', 'receiveRequest', 1);
};

// 增加接收响应数
exports.incrReceiveReponse = function () {
    redis.hincrby('sysInfo', 'receiveReponse', 1);
};

// 增加接收错误数
exports.incrReceiveError = function () {
    redis.hincrby('sysInfo', 'receiveError', 1);
};

// infohash+1
exports.incrInfohash = function () {
    redis.hincrby('sysInfo', 'infohash', 1);
};