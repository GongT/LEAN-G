module.exports = function (cb, fail){
	if(!this._after_save_cblist){
		this._after_save_cblist = [];
		this._after_save_cblist_fail = [];
		this.__save = this.save;
		this.save = replaced_save_function;
	}
	if(cb){
		this._after_save_cblist.push(cb);
	}
	if(fail){
		this._after_save_cblist_fail.push(fail);
	}
};

function replaced_save_function(){
	var self = this;
	var ret = this.__save.apply(this, arguments);
	
	function call_clean(clist, argument){
		clist.forEach(function (cb){
			cb.apply(undefined, argument);
		});
		delete this.save;
		delete this._after_save_cblist;
		delete this._after_save_cblist_fail;
	}
	
	ret.then(function (){
		call_clean(self._after_save_cblist, arguments);
	}, function (){
		call_clean(self._after_save_cblist_fail, arguments);
	});
	
	return ret;
}
