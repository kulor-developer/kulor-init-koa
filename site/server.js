var koa                 = require( "koa" ),
    _                   = require( "underscore" ),
    Path                = require( "path" ),
    session             = require( "koa-generic-session" ) ,
    koaRedis            = require( "koa-redis" ) ,
    koaBody             = require( "koa-body" ) ,
    log                 = require( "./middlewarelist/log" ) ,
    jade                = require( "./middlewarelist/jade" ),
    cache               = require( "./middlewarelist/cache" ),
    router              = require( "./middlewarelist/router" ),
    //  业务流程缓存 避免反复读取业务文件
    packageJSON         = require( "./config.json" ) ,
    app ;

// @port    {number}    监听端口号
module.exports = function( port ){
    app         = koa();
    app.keys    = [ "user app is a secret" ];
    app.proxy   = true;

    // 方便多开发环境进行切换
    if( packageJSON.debug && typeof packageJSON.debugHost === "object" && packageJSON.debugHost[ packageJSON.debug ] ){
        packageJSON     = _.extend( packageJSON , packageJSON.debugHost[ packageJSON.debug ] );
    }

    app.use( log( packageJSON ) );

    /*!
     *  初始化相关的配置信息
     *  对启动文件做相对应的路径处理
     */
    ( function( args ){
        var _cwd;
        for( var i = args.length; i--; ){
            if( /setup\.js$/.test( args[ i ] ) ){
                _cwd    = Path.resolve( args[ i ] , "../" );
                break;
            }
        }
        packageJSON.jadeFolderName  = Path.join( _cwd , packageJSON.jadeFolderName );
        packageJSON.logFolderName   = Path.resolve( _cwd , packageJSON.logFolderName );
        packageJSON.busHandlerFolder= Path.resolve( _cwd , packageJSON.busHandlerFolder );
    } )( process.argv );

    app.use( require( "./middlewarelist/redis" )( packageJSON.redis ) );

    /*!
     *  启用session服务
     */
    if( typeof packageJSON.sessionMaxAge === "number" && packageJSON.sessionMaxAge > 0 ){
        app.use( session( {
            store       : new koaRedis( packageJSON.redis ) ,
            cookie      : {
                maxAge  : packageJSON.sessionMaxAge
            }
        } ) );
    }

    /*!
     *  提供post 获取参数
     */
    app.use( koaBody() );

    /*!
     *  启动jade模板引擎
     */
    app.use( jade( packageJSON , app ) );

    /*!
     *  缓存一些全局变量
     *  全局hanlder等
     */
    app.use( cache( packageJSON ) );

    app.use( router( packageJSON ) );

    app.listen( port );

    console.log( "server start at port " + port );
}