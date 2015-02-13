var util = require('util'),
    mongoose = require('mongoose'),
    config = require('../../config'),
    logger = require('../common/logger'),
    uri = util.format('mongodb://%s:%d/%s', config.mongodbHost, config.mongodbPort, config.mongodbDatabase);

//mongoose.set('debug', config.debug);

mongoose.connect(uri, {
    user: config.mongodbUserName,
    pass: config.mongodbPassword
}, function (err) {
    if (err) {
        logger.error('connect to %s error: ', config.mongodbDatabase, err.message);
        process.exit(1);
    }
});

mongoose.connection.on('error', function (err) {
    logger.error('mongodb error: ' + err);
});

// models
require('./resource');

exports.Resource = mongoose.model('Resource');