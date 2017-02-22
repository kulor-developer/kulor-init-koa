const Connect = require( "./connect" );

new Connect().setRequestEvents( {
    beforeEvents    : function( opt ){
        this.log( opt );
    } ,
    afterEvents     : function( res , result ){
        this.log( result );
    } ,
    errorEvents     : function( e ){
        this.log( e );
    }
} , true );

class HandlerBase extends Connect {
    log( str ){
        console.log( str );
        return this;
    }
    /*!
     *  为业务类赋值一些通配属性
     */
    setKoa( koa ) {
        this.koa = koa;
        this.jade = koa.jade;
        return this;
    }

    *doJob() {
        return yield this[ "do" + this.koa.request.method ]();
    }
}

module.exports = HandlerBase;