'use strict';

module.exports = {

    debug: true,

    // TODO:绑定address
    //address:'127.0.0.1',

    // redis相关
    redisHost: '<设置redis地址>', // 服务器
    //redisHost: '127.0.0.1',
    redisPort: 6379,
    redisAuth: '<Redis密码>',

    // mongodb相关
    mongodbHost: '<设置mongodb地址>', // 服务器
    //mongodbHost: '127.0.0.1',
    mongodbPort: 27017,
    mongodbDatabase: '<Database>',
    mongodbUserName: '<用户名>',
    mongodbPassword: '<密码>',

    elasticsearchHost: '<设置Elasticsearch地址>', // 127.0.0.1:9200

    // bootstrap dht
    //'bootstrapAddress': 'dht.transmissionbt.com',
    bootstrapAddress: 'router.utorrent.com',
    bootstrapPort: 6881,

    // remoteNodes数量限制
    remoteNodesLimit: 100000,

    // 单个worker内存限制
    memoryLimit: {
        'worker': '65',
        'male': '45',
        'female': '60'
    },

    // 保留多少天的热度
    hotCounts: 14,

    worker: {
        3000: {
            sended: true, // 是否发送find_node
            cycle: 20 // 周期，每隔多少毫秒发送一次find_node。值越小，频率越高
        },
        3001: {
            sended: true,
            cycle: 20
        },
        3002: {
            sended: true,
            cycle: 20
        },
        3003: {
            sended: true,
            cycle: 20
        },
        3004: {
            sended: true,
            cycle: 20
        }
    }
};
