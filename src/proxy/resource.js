var moment = require('moment'),
    index = require('../models/index'),
    config = require('../../config'),
    Resource = index.Resource;

// 新增一个资源
exports.addResource = function addResource(infohash, name, files, type, size, callback) {
    var resource = new Resource();
    resource._id = infohash;
    resource.n = name;
    resource.f = files;
    resource.t = type;
    resource.s = size;
    resource.save(callback);
};

// 根据infohash获取资源
exports.getResourceByInfohash = function getResourceByInfohash(infohash, callback) {
    Resource.findOne({_id: infohash}, callback);
};

// 热度+1
exports.incrResource = function incrResource(infohash) {
    Resource.findOne({_id: infohash}, function (err, resource) {
        if (err || !resource) {
            return;
        }

        // 只保留2周
        for (var i = resource.hs.length - 1; i >= 0; i--) {
            if (moment.utc(resource.hs[i].t).isBefore(moment.utc().subtract(config.hotCounts || 14, 'day'))) {
                // 删除
                resource.hs.splice(i, 1);
            } else {
                break;
            }
        }

        // 更新最近2周的热度
        var now = moment.utc().format('YYYY-MM-DD');
        if (!resource.hs || resource.hs.length <= 0) {
            resource.hs = [
                {t: now, v: 1}
            ];
        } else if (moment.utc(now).isSame(resource.hs[0].t, 'day')) {
            ++resource.hs[0].v;
        } else {
            resource.hs.unshift({t: now, v: 1});
        }

        //刷新最新热度
        resource.h = resource.hs[0].v;

        // 刷新更新时间
        resource.u = moment.utc();

        // 保存
        resource.markModified('hs');
        resource.save();
    });
};