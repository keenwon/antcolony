'use strict';

var fs = require('fs'),
    path = require('path'),
    config = require('../config'),
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
        console.log('waiting......');
        setTimeout(next, 10 * 1000);
        return;
    }

    var file = files[Math.floor(num * Math.random())],
        filePath = path.join(dir, file),
        torrentData,
        _id = file.split('.')[0].toLowerCase();

    files = null;

    try {
        //console.log('尝试读取并且解析文件');
        // 尝试读取并且解析文件
        torrentData = torrent(fs.readFileSync(filePath));
    } catch (error) {
        // 删除
        console.error('---------------');
        console.error(error.message);
        console.error(_id.toUpperCase());
        console.error('---------------');
        torrentData = null;
        fs.unlinkSync(filePath);
        next();
        return;
    }

    // 记录到mongodb
    //console.log('记录到mongodb');
    Resource.addResource(_id, torrentData.n, torrentData.f, torrentData.t, torrentData.s, function (error, product) {
        if (error) {
            if (error.code === 11000) {
                console.log('==================================');
                console.error('已存在');
                console.log('==================================');
            } else {
                logger.error(error);
            }
            // 删除torrent文件
            fs.unlinkSync(filePath);
            next();
        } else {
            console.log(_id);
            //console.log('==================================');
            sysInfo.incrInfohash();

            // 删除torrent文件
            fs.unlinkSync(filePath);
            next();
        }
    });

    torrentData = null;
};

next = function () {
    setImmediate(run);
};

console.log('run');
run();