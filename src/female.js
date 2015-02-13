'use strict';

var fs = require('fs'),
    path = require('path'),
    config = require('../config'),
//    elasticsearch = require('elasticsearch'),
//    client = new elasticsearch.Client({
//        host: config.elasticsearchHost,
//        log: 'error'
//    }),
    infohash = require('./redis/infohash'),
    sysInfo = require('./redis/sysInfo'),
    Resource = require('./proxy/resource'),
    logger = require('./common/logger'),
    torrent = require('./common/torrent');

var run, next;

run = function () {
    var dir = path.join(__dirname + '/../.temp/'),
        files = fs.readdirSync(dir),
        num = files.length;

    if (num <= 0) {
        // 等10s再启动
        setTimeout(next, 10 * 1000);
        return;
    }

    var file = files[Math.floor(num * Math.random())],
        filePath = path.join(dir, file),
        torrentData,
        _id = file.split('.')[0].toLowerCase();

    files = null;

    try {
        // 尝试读取并且解析文件
        torrentData = torrent(fs.readFileSync(filePath));
    } catch (error) {
        // 删除
        torrentData = null;
        fs.unlinkSync(filePath);
        next();
        return;
    }

    // 记录到mongodb
    Resource.addResource(_id, torrentData.n, torrentData.f, torrentData.t, torrentData.s, function (error, product) {
        // 11000是_id重复了，忽略，为保证数据完整，再插入一次elasticsearch
        if (error && error.code !== 11000) {
            logger.error(error);

            // 删除torrent文件
            fs.unlinkSync(filePath);
            next();
        } else {
            // 新增成功，同步到elasticsearch
//            client.create({
//                index: 'antcolony',
//                type: 'resource',
//                id: _id,
//                body: {
//                    n: product.n,
//                    s: product.s,
//                    t: product.t,
//                    c: product.c
//                }
//            }, function (error) {
//                if (error) {
//                    logger.error('elasticsearch index error: ' + _id);
//                }

                sysInfo.incrInfohash();

                // 删除torrent文件
                fs.unlinkSync(filePath);
                next();
//            });
        }
    });

    torrentData = null;
};

next = function () {
    setImmediate(run);
};

exports.run = function () {
    run();
};