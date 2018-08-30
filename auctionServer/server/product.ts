import * as express from 'express'
import * as path from 'path';
import {Server} from "ws";

// 服务器端口
const app = express();
export class Product {
	constructor (
		public id: number,
		public title: string,
		public price: number,
		public rating: number,
		public desc: string,
		public categories: Array<string>
	) {  }
}
export class Comment {
	constructor(
		public id: number,
		public productId: number,
		public timestamp: string,
		public user: string,
		public rating: number,
		public content: string
	) { }
}
const products: Product[] = [
	new Product(1, '第一个商品', 1.99, 3.5, '这是一个商品。。。', ['电子产品']),
	new Product(2, '第二个商品', 1.99, 1, '这是一个商品。。。', ['硬件设备']),
	new Product(3, '第三个商品', 1.99, 3, '这是一个商品。。。', ['硬件设备']),
	new Product(4, '第四个商品', 1.99, 0, '这是一个商品。。。', ['图书']),
	new Product(5, '第五个商品', 1.99, 0, '这是一个商品。。。', ['图书'])
];
const comments: Comment[] = [
	new Comment( 1, 1, '2017-2-2 22:22:22', '张三', 3, '东西不错' ),
	new Comment( 2, 1, '2017-4-2 22:22:22', '张三', 2, '东西不错' ),
	new Comment( 3, 1, '2017-5-2 22:22:22', '张三', 4, '东西不错' ),
	new Comment( 4, 2, '2017-5-2 22:22:22', '张三', 1, '东西不错' ),
	new Comment( 5, 3, '2017-6-2 22:22:22', '张三', 3, '东西不错' )
];
app.use('/',express.static(path.join(__dirname, '..','client')));
app.get( '/api/product', (req, res) => {
	let result = products;
	let params = req.query;
	console.log();
	if( params.title ) {
		result = result.filter( p => p.title.indexOf(decodeURI(params.title)) != -1 );
	}
	if( params.price && result.length > 0 ) {
		result = result.filter( p => p.price <= params.price );
	}
	if( params.category && params.category != -1 && result.length > 0 ) {
		result = result.filter( p => p.categories.indexOf(decodeURI(params.category)) != -1 );
	}

	res.json( result );
} );
app.get( '/api/product/:id', (req, res) => {
	res.json( products.find( product => product.id == req.params.id ) );
} );
app.get('/api/product/:id/comments', (req, res) => {
	res.json( comments.filter( ( comment: Comment ) => comment.productId == req.params.id ));
});
const server = app.listen( 8000, 'localhost', () => {
	console.log('服务器已启动');
});

// websocket端口
const ws = new Server( { port:8085 } );
const subscript = new Map<any, number[]>();
const currentBids = new Map<number, number>();
ws.on( 'connection', websocket => {
	websocket.on('message', message => {
		let messageObj = JSON.parse(<string>message );
		let productIds = subscript.get(websocket) || [];
		subscript.set( websocket, [...productIds, messageObj.productId] );
	});
} );
setInterval( () => {
	products.forEach( p => {
		let currentBid = currentBids.get(p.id) || p.price;
		let newBid  = currentBid + Math.random()*5;
		currentBids.set(p.id,  Number(newBid.toFixed(2)));
	});

	subscript.forEach( ( productIds: number[], ws ) => {
		if (ws.readyState === 1) {
			let newBids = productIds.map( pid => ({
				productId: pid,
				bid: currentBids.get(pid)
			}) );
			ws.send( JSON.stringify(newBids) );
		}else{
			subscript.delete(ws);
		}
	});

},2000);

