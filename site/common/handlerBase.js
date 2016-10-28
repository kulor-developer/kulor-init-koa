var Base        = require( "./base" ) ,
    Connect     = require( "./connect" ) ,
    HandlerBase;

HandlerBase     = Base.extend( function(){

} , {
    extend      : Connect,
    log         : function( str ){
        this.koa.log.log( str );
        return this;
    } ,
    /*!
     *  为业务类赋值一些通配属性
     */
    setKoa      : function( koa , handlerName ){
        this.koa                = koa;
        this.jade               = koa.jade;
        return this;
    } ,
    doJob   : function *(){
        return yield this[ "do" + this.koa.request.method ]();
    }
} );

module.exports  = HandlerBase;