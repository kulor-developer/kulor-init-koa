var Base = require( "../common/base" ) ,
    _    = require( "underscore" ) ,
    cofs = require( "co-fs" ) ,
    Url  = require( "url" ) ,
    Path = require( "path" ) ,
    Router;

Router = Base.extend( function( opt ) {
    this.handlersCache = {};
    this.packageJSON = opt;
    this.busHandlers = opt.busHandlers || {};
    this.busHandlersForRegExp   = {};
    this.initBusHandlersForRegExp();
} , {
    commonBusHandlerRegExp  : ".*" ,
    // 支持使用包含 .* 的基本正则匹配
    initBusHandlersForRegExp    : function(){
        for( var a in this.busHandlers ){
            if( a.indexOf( this.commonBusHandlerRegExp ) > -1 ){
                this.busHandlersForRegExp[ a.replace( this.commonBusHandlerRegExp , "" ) ]  = this.busHandlers[ a ];
                delete this.busHandlers[ a ];
            }
        }
        return this;
    } ,
    getRegExpBusHandler     : function( handlerName ){
        for( var a in this.busHandlersForRegExp ){
            if( handlerName.indexOf( a ) === 0 ){
                return this.busHandlersForRegExp[ a ];
            }
        }
        return handlerName;
    } ,
    deleteRequireCache : function( filePath ) {
        delete require.cache[ filePath ];
        delete require.cache[ filePath + ".js" ];
    } ,
    getRequireClass    : function*( handlerName , koa ) {
        var _handlerFilePath ,
            _handlerFolder ,
            _isFileExists ,
            _requireClass;
        if( !this.handlersCache[ handlerName ] ) {
            _handlerFolder = this.packageJSON.busHandlerFolder;
            if( this.busHandlers[ handlerName ] ) {
                handlerName = this.busHandlers[ handlerName ];
            } else {
                handlerName = this.getRegExpBusHandler( handlerName );
            }
            _handlerFilePath = Path.join( _handlerFolder , handlerName + ".js" );
            _isFileExists = yield cofs.exists( _handlerFilePath );
            if( !_isFileExists ) {
                return 404;
            }
            this.handlersCache[ handlerName ] = _handlerFilePath;
        } else if( this.packageJSON.debug ) {
            this.deleteRequireCache( this.handlersCache[ handlerName ] );
        }
        _requireClass = require( this.handlersCache[ handlerName ] );
        return new _requireClass( koa , this.packageJSON );
    }
} );

/*!
 *  处理对应的具体业务
 *  优先配置config.json中的busHandler中的文件匹配项
 *  如果未找到对应busHandler中的业务匹配
 *  将开始搜索config.json中busHandlerFolder文件夹下的文件
 */
module.exports = function( opt ) {
    var _router = new Router( opt );
    return function *( next ) {
        var _url            = Url.parse( this.originalUrl ) ,
            _handler        = _url.pathname.replace( /[\\|\/](.*)\..*/ , "$1" ) ,
            _self           = this ,
            _requireHanlder = yield _router.getRequireClass( _handler , this );
        this.appRouter      = _router;
        if( typeof _requireHanlder === "number" ){
            this.status     = _requireHanlder;
            opt[ "do" + _requireHanlder ] && opt[ "do" + _requireHanlder ]( _self );
            return;
        }
        try {
            _self.body = yield _requireHanlder.setKoa( this ).doJob();
            if( _self.body === undefined ) {
                _self.redirect( "/" );
                _self.body = "";
            }
        } catch( e ) {
            _self.logger && _self.logger.fatal( e );
            if( opt.debug ) {
                _self.body = e.message;
            }
            _self.status = 500;
            opt.do500 && opt.do500( _self );
        }
        _requireHanlder     = null;
        yield next;
    }
};
