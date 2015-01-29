var express=require('express'),
	morgan=require('morgan'),
	jade=require('jade'),
	sjc=require('./sjc.js')

var SUPER='.//'
var app=express()
	.use(morgan('dev'))
	.set('port', process.env.PORT|6969)
	.use('//', sjc)
app.listen(app.get('port'))

function render(res, path, options){
	res.type('html')
	var html='';
	try{
		html=jade.renderFile(path, options);
	} catch(e){
		console.log(e.message)
		res.sendStatus(500).end()
		return
	}
	res.status(200).send(html).end()
}
