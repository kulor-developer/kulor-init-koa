var koa                 = require( "koa" ),
    _                   = require( "underscore" ),
    cofs                = require( "co-fs" ) ,
    Url                 = require( "url" ) ,
    Path                = require( "path" ),
    session             = require( "koa-generic-session" ) ,
    koaRedis            = require( "koa-redis" ) ,
    koaBody             = require( "koa-body" ) ,
    log                 = require( "./middlewarelist/log" ) ,
    jade                = require( "./middlewarelist/jade" ),
    cache               = require( "./middlewarelist/cache" ),
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

    /*!
     *  处理对应的具体业务
     *  优先配置config.json中的busHandler中的文件匹配项
     *  如果未找到对应busHandler中的业务匹配  
     *  将开始搜索config.json中busHandlerFolder文件夹下的文件
     */
    app.use( function *( next ){
        var _url            = Url.parse( this.originalUrl ) ,
            _handler        = _url.pathname.replace( /[\\|\/](.*)\..*/ , "$1" ),
            _handlersCache  = this.cache.getCacheData( "handlersCache" ) ,
            _self           = this ,
            _handlerFilePath ,
            _requireClass ,
            _isFileExists;
        //  获取具体对应的业务 并实例化执行，对于已实例化的业务 直接进行业务处理
        if( !_handlersCache[ _handler ] || packageJSON.debug ){
            if( packageJSON.busHandlers[ _handler ] ){
                _handlerFilePath    = packageJSON.busHandlerFolder + packageJSON.busHandlers[ _handler ];
            } else {
                _handlerFilePath    = Path.join( packageJSON.busHandlerFolder , _handler + ".js" )
                _isFileExists       = yield cofs.exists( _handlerFilePath );
                if( !_isFileExists ){
                    return this.status  = 404;    
                }
            }
            if( packageJSON.debug ) {
                delete require.cache[ _handlerFilePath ];
            }
            _requireClass               = require( _handlerFilePath );
            _handlersCache[ _handler ]   = new _requireClass( this );
        }
        try {
            _self.body   = yield _handlersCache[ _handler ].setKoa( this ).doJob( koa );
            if( _self.body === undefined ){ 
                _self.redirect( "/" );
                _self.body   = "";
            }   
        } catch( e ){
            if( packageJSON.debug ){
                _self.body  = e.message;
            }
            _self.status             = 500;
        }
        yield next;
    } );

    app.listen( port );

    console.log( "server start at port " + port );
}