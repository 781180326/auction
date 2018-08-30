"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var ws_1 = require("ws");
// 服务器端口
var app = express();
var Product = (function () {
    function Product(id, title, price, rating, desc, categories) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.rating = rating;
        this.desc = desc;
        this.categories = categories;
    }
    return Product;
}());
exports.Product = Product;
var Comment = (function () {
    function Comment(id, productId, timestamp, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timestamp = timestamp;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var products = [
    new Product(1, '第一个商品', 1.99, 3.5, '这是一个商品。。。', ['电子产品']),
    new Product(2, '第二个商品', 1.99, 1, '这是一个商品。。。', ['硬件设备']),
    new Product(3, '第三个商品', 1.99, 3, '这是一个商品。。。', ['硬件设备']),
    new Product(4, '第四个商品', 1.99, 0, '这是一个商品。。。', ['图书']),
    new Product(5, '第五个商品', 1.99, 0, '这是一个商品。。。', ['图书'])
];
var comments = [
    new Comment(1, 1, '2017-2-2 22:22:22', '张三', 3, '东西不错'),
    new Comment(2, 1, '2017-4-2 22:22:22', '张三', 2, '东西不错'),
    new Comment(3, 1, '2017-5-2 22:22:22', '张三', 4, '东西不错'),
    new Comment(4, 2, '2017-5-2 22:22:22', '张三', 1, '东西不错'),
    new Comment(5, 3, '2017-6-2 22:22:22', '张三', 3, '东西不错')
];
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.get('/api/product', function (req, res) {
    var result = products;
    var params = req.query;
    console.log();
    if (params.title) {
        result = result.filter(function (p) { return p.title.indexOf(decodeURI(params.title)) != -1; });
    }
    if (params.price && result.length > 0) {
        result = result.filter(function (p) { return p.price <= params.price; });
    }
    if (params.category && params.category != -1 && result.length > 0) {
        result = result.filter(function (p) { return p.categories.indexOf(decodeURI(params.category)) != -1; });
    }
    res.json(result);
});
app.get('/api/product/:id', function (req, res) {
    res.json(products.find(function (product) { return product.id == req.params.id; }));
});
app.get('/api/product/:id/comments', function (req, res) {
    res.json(comments.filter(function (comment) { return comment.productId == req.params.id; }));
});
var server = app.listen(8000, 'localhost', function () {
    console.log('服务器已启动');
});
// websocket端口
var ws = new ws_1.Server({ port: 8085 });
var subscript = new Map();
var currentBids = new Map();
ws.on('connection', function (websocket) {
    websocket.on('message', function (message) {
        var messageObj = JSON.parse(message);
        var productIds = subscript.get(websocket) || [];
        subscript.set(websocket, productIds.concat([messageObj.productId]));
    });
});
setInterval(function () {
    products.forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, Number(newBid.toFixed(2)));
    });
    subscript.forEach(function (productIds, ws) {
        if (ws.readyState === 1) {
            var newBids = productIds.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscript.delete(ws);
        }
    });
}, 2000);
