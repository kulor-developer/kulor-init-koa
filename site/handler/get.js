'use strict';

const HandlerBase = require( "../common/handlerBase" );

class Get extends HandlerBase {
    *doGET() {
        return `{"code":200}`;
    }
}

module.exports = Get;