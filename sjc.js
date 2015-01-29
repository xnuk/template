var router=require('express').Router(),
	stylus=require('stylus'),
	uglifyJS=require('uglify-js'),
	cleancss=require('clean-css'),
	fs=require('fs'),
	nib=require('nib')(),
	coffee=require('coffee-script')
router.get(/^\/([\w/]+)\.(\w+)/, function(req, res){
	console.log(req.params[0]+" "+req.params[1])
	var rqfn=req.params[0]
	switch(req.params[1]){
		case 'styl':
			res.type('css')
			cacheRes(res, './v/'+rqfn+'.styl', './cached/'+rqfn+'_styl.css', function(originalPath, cachedPath){
				stylus.render(fs.readFileSync(originalPath).toString(), {'use': nib}, function(err, css){
					if(err){
						res.status(500).send('/* Server cannot parse the file */').end()
						console.error(err)
						return
					}
					var p=new cleancss().minify(css).styles
					res.status(200).send(p).end()
					fs.writeFile(cachedPath, p, function(err){})
				})
			})
			break;
		case 'js':
			res.type('js')
			cacheRes(res, './js/'+rqfn+'.js', './cached/'+rqfn+'_js.js', function(originalPath, cachedPath){
				var code='';
				try{
					code=uglifyJS.minify(originalPath).code
				} catch(e){
					// 500
					res.send(500).send('/* Server cannot parse the file */').end()
					return;
				}
				fs.writeFile(cachedPath, code, function(err){})
			})
			break;
		case 'coffee':
			res.type('js')
			cacheRes(res, './coffee'+rqfn+'.coffee', './cached/'+rqfn+'_coffee.js', function(originalPath, cachedPath){
				var code=''
				try{
					code=uglify.minify(coffee.compile(fs.readFileSync(originalPath)), {'fromString': true}).code
				} catch(e){
					res.status(500).send('/* Server cannot parse the file */').end()
					return;
				}
				fs.writeFile(cachedPath, code, function(err){})
			})
			break;
		default:
			res.sendStatus(404).end()
	}
})
function cacheRes(res, originalPath, cachedPath, generator){
	fs.stat(originalPath, function(err, sta){
		if(err!=null){
			res.status(404).send('/* Not Found */').end()
			return
		}
		fs.stat(cachedPath, function(err, stat){
			if(err==null && stat.mtime.getTime()>sta.mtime.getTime()){
				res.sendFile(cachedPath, {'root': __dirname}, function(err){
					if(err)res.status(err.status).end()
					else res.status(200).end()
				})
				return
			}
			generator(originalPath, cachedPath)
		})					
	})
}

module.exports=router
