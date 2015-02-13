var http = require('http'),
    url = require('url'),
    util = require('util'),
    zlib = require('zlib');

var headers = {
    'accept-charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
    'accept-language': 'en-US,en;q=0.8',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2',
    'accept-encoding': 'gzip,deflate'
};

module.exports = function (torrentUrl, callback) {
    var torrentUrlObj = url.parse(torrentUrl);

    // 不写referer，有些地址会失败
    // 写了，会出现404错认为200
    //headers['referer'] = util.format('http://%s',torrentUrlObj.hostname);

    var options = {
        hostname: torrentUrlObj.hostname,
        path: torrentUrlObj.path,
        port: 80,
        method: 'GET',
        secureProtocol: 'SSLv3_method',
        headers: headers
    };

    http.request(options, function (res) {

        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            if (res.statusCode !== 200 || res.headers['content-type'].indexOf('text/html') !== -1) {
                callback(res.statusCode || 404);
                return;
            }

            var buffer = Buffer.concat(chunks);
            var encoding = res.headers['content-encoding'];
            if (encoding === 'gzip') {
                zlib.gunzip(buffer, function (err, decoded) {
                    callback(err, decoded);
                });
            } else if (encoding === 'deflate') {
                zlib.inflate(buffer, function (err, decoded) {
                    callback(err, decoded);
                });
            } else {
                callback(null, buffer.toString());
            }
        });
    }).on('error', function (err) {
        callback(err);
    }).end();
};