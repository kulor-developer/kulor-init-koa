'use strict';

const HandlerBase = require( "../common/handlerBase" );

class Index extends HandlerBase {
    *doPOST() {
        return JSON.stringify( { name : "John" } );
    }

    *doGET() {
        let _insert  = yield this.post( "index.html" ) ,
            _content = yield this.get( "get.html" ) ,
            _baidu   = yield this.get( "https://www.baidu.com/" ) ,
            _httpStr = yield this.jade.getHTML( _insert , "index" );
        return _httpStr;
    }
}

module.exports = Index;