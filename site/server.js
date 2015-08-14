var koa     	        = require( "koa" ),
    cofs                = require( "co-fs" ) ,
    app     	        = koa(),
    Url                 = require( "url" ) ,
    session             = require( "koa-generic-session" ) ,
    koaRedis            = require( "koa-redis" ) ,
    koaBody             = require( "koa-body" ) ,
    koaError            = require( "koa-onerror" ) ,
    log 		        = require( "./middlewarelist/log" ) ,
    jade                = require( "./middlewarelist/jade" ),
    cache 		        = require( "./middlewarelist/cache" ),
    //  业务流程缓存 避免反复读取业务文件
    packageJSON         = require( "./config.json" ),
    //  服务监听端口号
    port                = process.argv[ process.argv.length - 1 ];

app.keys     = [ "user app is a secret" ];

koaError( app );

app.use( log( packageJSON ) );

app.use( require( "./middlewarelist/redis" )( packageJSON.redis ) );

/*!
 *  启用session服务
 */
app.use( session( {
    store       : new koaRedis( packageJSON.redis ) ,
    cookie      : {
        maxAge  : packageJSON.sessionMaxAge
    }
} ) );

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
 *  初始化相关的配置信息
 */
( function(){
    var _cwd    = process.cwd() + "/";
    packageJSON.busHandlerFolder    = _cwd + packageJSON.busHandlerFolder + "/";
} )();

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
    if( !_handlersCache[ _handler ] ){
        if( packageJSON.busHandlers[ _handler ] ){
            _handlerFilePath    = packageJSON.busHandlerFolder + packageJSON.busHandlers[ _handler ];
        } else {
            _isFileExists   = yield cofs.exists( packageJSON.busHandlerFolder + _handler + ".js" );
            if( _isFileExists ){
                _handlerFilePath    = packageJSON.busHandlerFolder + _handler;
            } else {
                return this.status  = 404;    
            }
        }
        _requireClass               = require( _handlerFilePath );
        _handlersCache[ _handler ]   = new _requireClass( this );
    }
    //  用户登录
    if( !_handlersCache[ _handler].setKoa( this ).hasLogin() ){
        return this.redirect( "/?loginPanel=1&src=" + encodeURIComponent( this.originalUrl ) );
    }
    try {
        _self.body   = yield _handlersCache[ _handler ].setKoa( this ).doJob( koa );
        if( _self.body === undefined ){ 
            _self.redirect( "/" );
            _self.body   = "";
        }   
    } catch( e ){
        if( packageJSON.debug ){
            _self.log( e );
        }
        _self.status             = 500;
    } finally {
        _handlersCache[ _handler ].setlog();
    }
    yield next;
} );

app.listen( port );

console.log( "server start at port " + port );