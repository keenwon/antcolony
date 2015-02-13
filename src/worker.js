'use strict';

var dgram = require('dgram'),
    crypto = require('crypto'),
    util = require('util'),
    bencode = require('bencode'),
    remoteNodes = require('./redis/remoteNodes'),
    bucket = require('./redis/bucket'),
    sysInfo = require('./redis/sysInfo'),
    infohash = require('./redis/infohash'),
    config = require('../config'),
    logger = require('./common/logger'),
    utils = require('./common/utils'),
    Resource = require('./proxy/resource');

function Worker(port) {
    var self = this;

    self.id = new Buffer(crypto.createHash('sha1').update((config.address || '') + port.toString()).digest('hex'), 'hex');
    self.port = port;
    self.socket = dgram.createSocket('udp4');

    // 取得ips，不响应本机的请求，不给本机发请求
    self.ips = utils.getLocalIps();

    // 最后一次请求bootstrap节点的时间
    self.lastBootstrapTime = 0;

    // 捕获错误
    self.socket.on('error', function (err) {
        logger.error("socket error:\n" + err);
    });

    // 有消息发来时触发
    self.socket.on('message', self.onmessage.bind(self));

    // listen后触发
    if (config.worker[self.port].sended) {
        self.socket.once('listening', self.run.bind(self));
    }

    if (config.address) {
        self.socket.bind(port, config.address);
    } else {
        self.socket.bind(port);
    }
}

// 启动
Worker.prototype.run = function run() {
    var self = this,
        target;

    // 从remoteNodes里取一个，取不到就用默认的（bootstrap的节点，最多5s一次）
    remoteNodes.pop(function (error, reply) {
        if (error) {
            logger.error('get remoteNodes error');
            logger.error(error);
            return;
        }

        target = reply ? {
            address: reply.split(':')[0],
            port: +reply.split(':')[1]
        } : {
            address: config.bootstrapAddress,
            port: config.bootstrapPort
        };

        /**
         * 1、reply存在，立刻发送
         * 2、reply不存在，lastSendTime也不存在，说明第一次请求bootstrap的节点，立刻发送
         * 3、reply不存在，lashSendTime存在，且间隔5s以上，立刻发送
         */
        if (reply || !self.lastBootstrapTime || (+new Date() - self.lastBootstrapTime >= 5000)) {
            if (!reply) {
                self.lastBootstrapTime = +new Date();
            }

            self.sendFindNode(target);
        }

        // 不停的发送
        setTimeout(run.bind(self), config.worker[self.port].cycle);
    });
};

/**
 * socket的消息处理
 */
Worker.prototype.onmessage = function onmessage(packet, rinfo) {
    var self = this;

    // 不处理本机的请求&响应
    if (self.ips.indexOf(rinfo.address) !== -1) {
        return;
    }

    var msg, id;

    // 尝试解码
    try {
        msg = bencode.decode(packet);
    } catch (e) {
        logger.error(util.format('[bencode decode error] %s:%d', rinfo.address, rinfo.port));
        return false;
    }

    // 取得id
    if (msg.a && msg.a.id) {
        id = msg.a.id;
    } else if (msg.r && msg.r.id) {
        id = msg.r.id;
    }

    // 忽略异常数据
    if (!id || !Buffer.isBuffer(id) || id.length !== 20) {
        return this.error(rinfo, msg, 203, 'Id is required');
    }
    if (!msg.y || msg.y.length !== 1) {
        return this.error(rinfo, msg, 203, 'Y is required');
    }
    if (!msg.t) {
        return this.error(rinfo, msg, 203, 'T is required');
    }

    // 接收到的是异常的话
    if (msg.y[0] === 0x65 /* e */) {
        logger.error(msg.e);
        return;
    }

    // 发送来的是查询，包括ping,find_node,get_peers,announce_peer
    if (msg.y[0] === 0x71 /* q */) {
        sysInfo.incrReceiveRequest();

        if (!msg.a) {
            return this.error(rinfo, msg, 203, 'A is required');
        }
        if (!msg.q) {
            return this.error(rinfo, msg, 203, 'Q is required');
        }

        // 执行响应
        this.processRequest(msg.q.toString(), msg, rinfo);
    }

    // 发送来的是响应，只可能是响应find_node，因为我们只发find_node的请求
    if (msg.y[0] === 0x72 /* r */) {
        sysInfo.incrReceiveReponse();

        if (msg && Buffer.isBuffer(msg.r.nodes)) {
            var nodes;
            try {
                nodes = utils.decodeNodes(msg.r.nodes);
            } catch (error) {
                logger.error(util.format('%s:%d respond find_node error:'), rinfo.address, rinfo.port);
                logger.error(error);
                return;
            }

            if (nodes.length > 0) {
                // 添加到节点列表
                remoteNodes.push(nodes);
            }
        }
    }

    // 为了保证桶的“活性”，只把给我发请求和响应我的添加到桶里
    bucket.push(self.id, [
        {
            id: id,
            address: rinfo.address,
            port: rinfo.port
        }
    ]);
};

/**
 * 响应
 */

// 统一的响应请求方法
Worker.prototype.processRequest = function processRequest(type, msg, rinfo) {

    // 端口不合法
    if (rinfo.port <= 0 || rinfo.port >= 65536) {
        return;
    }

    if (type === 'ping') {
        this.processPing(msg, rinfo);
    } else if (type === 'find_node') {
        this.processFindNode(msg, rinfo);
    } else if (type === 'get_peers') {
        this.processGetPeers(msg, rinfo);
    } else if (type === 'announce_peer') {
        this.processAnnouncePeer(msg, rinfo);
    }
};

// 响应ping请求
Worker.prototype.processPing = function processPing(msg, rinfo) {
    this._respond(rinfo, msg, {
        id: this.id
    });
};

// 响应find_node请求
Worker.prototype.processFindNode = function processFindNode(msg, rinfo) {
    var self = this,
        token = crypto.randomBytes(4);

    bucket.getKClosest(self.id, msg.a.id, function (nodes) {
        self._respond(rinfo, msg, {
            id: self.id,
            token: token,
            nodes: utils.encodeNodes(nodes)
        });
    });
};

// 响应get_peers请求
Worker.prototype.processGetPeers = function processGetPeers(msg, rinfo) {
    var self = this;

    if (!msg.a.info_hash || !Buffer.isBuffer(msg.a.info_hash) || msg.a.info_hash.length !== 20) {
        return self.error(rinfo, msg, 203, 'get_peers without info_hash');
    }

    // 保存infohash
    self._saveInfohash(msg.a.info_hash.toString('hex'));

    var token = crypto.randomBytes(4);

    bucket.getKClosest(self.id, msg.a.id, function (nodes) {
        self._respond(rinfo, msg, {
            id: self.id,
            token: token,
            nodes: utils.encodeNodes(nodes)
        });
    });
};

// 响应announce_peer请求
Worker.prototype.processAnnouncePeer = function processAnnouncePeer(msg, rinfo) {
    var self = this;

    if (!msg.a.token || !Buffer.isBuffer(msg.a.token)) {
        return self.error(rinfo, msg, 203, 'token is invalid');
    }

    if (!msg.a.info_hash || !Buffer.isBuffer(msg.a.info_hash) || msg.a.info_hash.length !== 20) {
        return self.error(rinfo, msg, 203, 'announce_peer without info_hash');
    }

    // 保存infohash
    self._saveInfohash(msg.a.info_hash.toString('hex'));

    self._respond(rinfo, msg, {
        id: self.id
    });
};

// 执行响应
Worker.prototype._respond = function _respond(target, msg, args) {
    args.id = this.id;

    var response = {
            t: msg.t, // 带上别人发来的事务ID
            y: 'r',
            r: args
        },
        packet = bencode.encode(response);

    this.socket.send(packet, 0, packet.length, target.port, target.address);

    sysInfo.incrSendReponse();
};

// 保存infohash
Worker.prototype._saveInfohash = function _saveInfohash(infohashStr) {
    Resource.getResourceByInfohash(infohashStr, function (error, value) {
        if (error) {
            logger.error(error);
        }

        if (!value) {
            infohash.sadd(infohashStr);
        } else {
            // 更新hotpeers
            Resource.incrResource(infohashStr);
        }
    });
};


/**
 * 请求
 */

// 发送find_node请求（随机查找）
Worker.prototype.sendFindNode = function sendFindNode(target) {
    this._request(target, 'find_node', {
        id: this.id,
        target: new Buffer(crypto.createHash('sha1').update(crypto.randomBytes(20)).digest('hex'), 'hex')
    });
};

// 发送查询
Worker.prototype._request = function _request(target, type, args) {
    // 不给本机发送请求
    if (this.ips.indexOf(target.address) !== -1) {
        return;
    }

    // 端口号不合法
    if (target.port <= 0 || target.port >= 65536) {
        return;
    }

    // 随机事务ID
    var transactionId = new Buffer([~~(Math.random() * 256), ~~(Math.random() * 256)]),
        msg = {
            t: transactionId,
            y: 'q',
            q: type,
            a: args
        },
        packet = bencode.encode(msg);

    this.socket.send(packet, 0, packet.length, target.port, target.address);

    sysInfo.incrSendRequest();
};

/**
 * 响应错误
 */
Worker.prototype.error = function error(target, msg, code, text) {
    // 不给本机发送请求
    if (this.ips.indexOf(target.address) !== -1) {
        return;
    }

    // 端口号不合法
    if (target.port <= 0 || target.port >= 65536) {
        return;
    }

    var response = {
            t: msg.t,
            y: 'e',
            e: [code, util.format('[http://findit.so] %s', text || 'error')]
        },
        packet = bencode.encode(response);

    this.socket.send(packet, 0, packet.length, target.port, target.address);

    sysInfo.incrReceiveError();

    // 记录日志，以供分析，稳定后可删除
    // logger.error(util.format('[%s:%d] %s', target.address, target.port, text || 'error'));
    // logger.error(msg);
};

// 创建一个worker
exports.create = function create(port) {
    return new Worker(port);
};