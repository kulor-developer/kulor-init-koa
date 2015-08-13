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
     *  记录一些基本的服务器响应信息日志
     */
    setlog      : function(){
        var _log    = [
                this.__urlResponseTime.toLocaleString() ,
                "Request-url:"  + this.koa.originalUrl ,
                "remote-host:"  + this.koa.req.headers[ "remote-host" ] ,
                "user-agent:"   + this.koa.req.headers[ "user-agent" ] ,
                "Response-time:" + ( new Date().getTime() - this.__urlResponseTime.getTime() ) + "ms"
            ].join( ";" );
        this.log( _log );
        return this;
    } ,
    /*!
     *  为业务类赋值一些通配属性
     */
    setKoa      : function( koa , handlerName ){
        this.koa                = koa;
        this.jade               = koa.jade;
        this.__urlResponseTime  = new Date();
        return this;
    } ,
    /*!
     *  验证用户登录
     */
    hasLogin    : function(){
        if( this.needLogin && !this.koa.session.user ){
            return false;
        }
        return true;
    }
} );

module.exports  = HandlerBase;