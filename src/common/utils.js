'use strict';

var utils = exports,
    os = require('os');

/**
 * 格式化文件大小
 */
utils.formatFileSize = function (size) {
    var result = '';
    if (size < 1024) {
        result = size + ' bytes';
    } else if (size < 1024 * 1024) {
        result = (size / 1024).toFixed(2) + ' KB';
    } else if (size < 1024 * 1024 * 1024) {
        result = (size / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (size < 1024 * 1024 * 1024 * 1024) {
        result = (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    } else {
        result = (size / (1024 * 1024 * 1024 * 1024)).toFixed(2) + ' TB';
    }
    return result;
};

/**
 * 获取文件类型
 */
utils.getFileType = function (str) {
    return str.substr(str.lastIndexOf('.') + 1);
};

/**
 * 编码peers
 */
utils.encodePeers = function encodePeers(peers) {
    var data = new Buffer(peers.length * 6),
        offset = 0;

    peers.forEach(function(peer) {
        var ip = peer.address.split(/\./g, 4);

        for (var i = 0; i < 4; i++) {
            data[i + offset] = +ip[i];
        }
        data.writeUInt16BE(peer.port, 4 + offset);

        offset += 6;
    });

    return data;
};

/**
 * 编码nodes
 */
utils.encodeNodes = function encodeNodes(nodes) {
    var data = new Buffer(26 * nodes.length),
        offset = 0;

    nodes.forEach(function(node) {
        var ip = node.address.split(/\./g, 4);

        node.id.copy(data, offset);
        for (var i = 0; i < 4; i++) {
            data[i + 20 + offset] = +ip[i];
        }
        data.writeUInt16BE(node.port, 24 + offset);
        offset += 26;
    });

    return data;
};

/**
 * 解码peers
 */
utils.decodePeers = function decodePeers(data) {
    var peers = [];

    for (var i = 0; i + 6 <= data.length; i += 6) {
        peers.push({
            address: data[i] + '.' + data[i + 1] + '.' +
                data[i + 2] + '.' + data[i + 3],
            port: data.readUInt16BE(i + 4)
        });
    }

    return peers;
};

/**
 * 解码nodes
 */
utils.decodeNodes = function decodeNodes(data) {
    var nodes = [];

    for (var i = 0; i + 26 <= data.length; i += 26) {
        nodes.push({
            id: data.slice(i, i + 20),
            address: data[i + 20] + '.' + data[i + 21] + '.' +
                data[i + 22] + '.' + data[i + 23],
            port: data.readUInt16BE(i + 24)
        });
    }

    return nodes;
};

/**
 * 本机的全部ip
 */
utils.getLocalIps = function getLocalIps() {
    var ips = [],
        ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (iface) {
        ifaces[iface].forEach(function (addr) {
            ips.push(addr.address);
        });
    });

    return ips;
};