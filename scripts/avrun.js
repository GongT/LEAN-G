var childProcess = require('child_process');
var Promise = require('promise');
module.exports = function (){
	var args = Array.prototype.slice.call(arguments);
	return new Promise(function (resolve, reject){
		var p = module.exports.spawn(args,
				{
					stdio: 'inherit',
					env  : process.env
				});
		p.on("exit", function (code){
			if(code == 0){
				resolve();
			} else{
				console.log("sub command failed with code " + code);
				reject();
			}
		});
	});
};

var platformExec;
module.exports.external = function (cmd){
	return new Promise(function (resolve, reject){
		console.log('start external program - %s', cmd);
		var p = platformExec(cmd);
		p.on("exit", function (code){
			if(code == 0){
				resolve();
			} else{
				console.log("sub command failed with code " + code);
				reject();
			}
		});
	});
};

module.exports.runner = require('path').resolve(APPPATH, 'node_modules/avoscloud-code/bin/run.js');
if(!module.exports.runner){
	console.error("Cannot find avoscloud-code.");
	process.exit(-1);
}

if(process.env.comspec){
	module.exports.spawn = spawn_windows;
	platformExec = exec_windows;
} else{
	module.exports.spawn = spawn_linux;
	platformExec = exec_linux;
}

function spawn_windows(args, options){
	if(!args){
		args = [];
	}
	args = ['/C', 'node', module.exports.runner].concat(args);
	
	console.log('call lean-cloud script - %s %s.', process.env.comspec, args.join(' '));
	return childProcess.spawn(process.env.comspec, args, options);
}

function spawn_linux(args, options){
	console.log('call lean-cloud script - %s %s.', module.exports.runner, args.join(' '));
	return childProcess.spawn(module.exports.runner, args, options);
}

function exec_windows(args, options){
	if(!args){
		args = [];
	}
	args = ['/C', 'node', module.exports.runner].concat(args);
	
	console.log('exec external file - %s %s.', process.env.comspec, args.join(' '));
	return childProcess.exec(process.env.comspec, args, options);
}

function exec_linux(args, options){
	console.log('exec external file - %s %s.', module.exports.runner, args.join(' '));
	return childProcess.exec(module.exports.runner, args, options);
}
