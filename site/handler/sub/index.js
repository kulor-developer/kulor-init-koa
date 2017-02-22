'use strict';
const HandlerBase = require( "../../common/handlerBase" );

class Index extends HandlerBase {
    *doPOST() {
        return { code : 200 };
    }

    *doGET() {
        let _insert = yield this.post( "sub/index.html" );
        return `Hi,world ${ JSON.stringify( _insert ) }}`;
    }
}
module.exports = Index;