var local = false;
var fs = require('fs');

module.exports = DEPLOY;
function DEPLOY(AV, _require){
	try{
		process.env.TZ = 'UTC';
		local = AV.localhost = true;
	} catch(e){
		local = AV.localhost = false;
		console.log('start deploy on leancloud server.');
	}
	AV.require = _require;
	var e = console.error;
	AV.fatal = console.error = function (errormessage){
		errormessage = errormessage || '';
		try{
			process.stderr.write('部署失败:\n' + errormessage.trim() + '\n');
			process.exit(10);
		} catch(e){
			throw new Error('部署失败:\n' + errormessage.trim());
		}
	};
	try{
		var app = main(AV);
		delete AV.fatal;
		console.error = e;
		return app;
	} catch(e){
		AV.fatal(e.stack);
	}
}

function main(AV){
	Object.AV = AV; // save as global var
	
	var express = AV.express = AV.require('express');
	var app = express();
	
	var CONFIG = AV.CONFIG = require('cloud/__gen/config.js');
	AV.isDebugEnv = CONFIG.isDebugEnv;
	
	AV.lib = AV.library = require('../include/library_loader.js');
	AV.ApiError = require('../include/ApiError.js');
	require('cloud/__gen/error.js');
	AV.CLS = require('../include/module.prototype.js');
	
	AV.InputChecker = require('../include/InputChecker.js');
	var types = require('../include/InputChecker.types.js');
	for(var n in types){
		AV.InputChecker.register(n, types[n]);
	}
	
	AV.Logger = require('../include/Logger.js');
	AV.ExpressController = require('../include/ExpressController.js');
	AV.CloudCodeWrapper = require('../include/CloudCodeWrapper.js');
	AV.ServerCloud = require('../include/ServerCloud.js');
	AV.CONSTANTS = require('cloud/__gen/import.jsconst.js');
	
	require('../include/global-functions.js');
	
	// 开始启动
	require('cloud/__gen/import.librarys.js');
	require('cloud/__gen/import.modules.js');
	require('cloud/__gen/import.functions.js');
	require('cloud/__gen/import.triggers.js');
	
	var avosExpressCookieSession = require('avos-express-cookie-session');
	
	// App 全局配置
	app.use(express.compress());
	app.set('env', local? 'development' : 'production');
	app.set('x-powered-by', false);
	app.set('lib', AV.lib);
	app.use(express.bodyParser());
	
	if(fs.existsSync('public/favicon.ico')){
		app.use(require('serve-favicon')('public/favicon.ico'));
	}
	
	app.use(require('less-middleware')('public'));
	
	//启用cookie 1小时
	app.use(express.cookieParser('gfx'));
	app.use(avosExpressCookieSession({
		cookie: {maxAge: 1000*60*60*24*360},
		key   : CONFIG.sessionKey
	}));
	
	if(local){
		var debug = require('../include/debug-client.js')(app);
	}
	
	AV.server = app;
	AV.templatePlugin = require('../include/express-nsmarty-shim.js');
	require('cloud/__gen/import.nsmarty.js').forEach(function (f){
		AV.templatePlugin.parseFile(f);
	});
	
	require('cloud/__gen/import.express.js');
	
	return app;
}
