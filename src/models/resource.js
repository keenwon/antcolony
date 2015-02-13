var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Resource = new Schema({

    // 设置_id为infohash
    _id: { type: String, required: true },

    // name 资源名称
    n: { type: String, required: true },

    // type 资源类型
    t: {type: String },

    // size 资源总大小
    s: {type: Number },

    // files 包含文件
    f: [
        {
            _id: false,
            // name 文件名
            n: { type: String },
            // size 文件大小
            s: { type: Number, default: 0 }
        }
    ],

    // hot 最新热度值
    h: { type: Number, default: 0 },

    // hots 最近2周热度值, key:value 例如: 12-20:1000
    hs: [
        {
            _id: false,
            // 时间
            t: { type: String },
            // 热度值
            v: { type: Number, default: 0 }
        }
    ],

    // createDate 收录时间
    c: { type: Date, default: Date.now },

    // updateDate 更新时间
    u: { type: Date, default: Date.now },

    // disable 是否被禁用
    d: { type: Boolean }

});

mongoose.model('Resource', Resource);