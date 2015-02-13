'use strict';

var redis = require("redis"),
    logger = require('./logger'),
    config = require('../../config'),
    client = redis.createClient(config.redisPort, config.redisHost, {
        auth_pass: config.redisAuth
    });

client.on("error", function (error) {
    logger.error('redis error: ' + error);
});

client.on('end', function () {
    logger.info('redis服务器连接被断开');
});

module.exports = client;