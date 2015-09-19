const fs=require('fs'),
	path=require('path'),
	http2=require('http2'),
	bunyan=require('bunyan'),
	Wss=require('websocket').server,
	jade=require('jade'),
	stylus=require('stylus')

const server=http2.createServer({
	log: bunyan.createLogger({
		name: 'server',
		stream: process.stderr,
		level: process.env.HTTP2_LOG,
		serializers: http2.serializers
	}),
	key: fs.readFileSync(path.join(__dirname, './server.key')),
	cert: fs.readFileSync(path.join(__dirname, './server.crt'))
}, function(req, res){
	'use strict'
	// 적당히 취향에 맞게 고쳐 쓰세요
	if(/^\/index\.(?:css|html|js)$|^\/$/.exec(req.url)==null){
		res.writeHead(404)
		res.end()
		return
	}
	const fn=path.join(__dirname, (req.url==='/')?'/index.html':req.url)
	if(/\.html$|^\/$/.exec(req.url)!=null && res.push){

		const css=res.push('/index.css')
		css.writeHead(200)
		fs.createReadStream(path.join(__dirname, '/index.css')).pipe(css)

		const js=res.push('/index.js')
		js.writeHead(200)
		fs.createReadStream(path.join(__dirname, '/index.js')).pipe(js)
	}

	res.writeHead(200)
	const fstream=fs.createReadStream(fn)
	fstream.pipe(res)
	fstream.on('finish', res.end)
})

const wss=new Wss({
	httpServer: server
})

const sockets=[]

wss.on('request', req=>{
	if(req.requestedProtocols.indexOf('xnuk-protocol')===-1) return req.reject()
	const conn=req.accept('xnuk-protocol', req.origin)
	sockets.push(conn)
})

wss.on('close', conn=>sockets.splice(sockets.indexOf(conn), 1))

function broadcast(str){
	sockets.map(conn=>conn.sendUTF(str))
}

fs.watch(__dirname, (e, filename)=>{
	if(!filename) return
	const m=filename.match(/index\.(jade|stylus|styl|js)$/)
	if(m==null) return
	switch(m[1]){
		case 'jade':
		var j;
		try{
			j=jade.renderFile(filename)
		} catch(e){
			return console.error(e)
		}
		fs.writeFile(path.join(__dirname, 'index.html'), j, ()=>{broadcast(' reload')})
		break
		case 'js':
		broadcast(' reload')
		break
		case 'stylus': case 'styl':
		fs.readFile(filename, 'utf8', (e, d)=>{
			if(e) return console.error(e)
			stylus.render(d, {}, function(e, css){
				if(e) return console.error(e)
				fs.writeFile(path.join(__dirname, 'index.css'), css, ()=>{})
				broadcast(css)
			})
		})
	}
})

server.listen(process.env.HTTP2_PORT||8080)