var jade        = require( "jade" ),
    Base        = require( "../common/base" ) ,
    cofs        = require( "co-fs" ) ,
    _           = require( "underscore" ) ,
    path        = require( "path" ) ,
    mResolution = require( "koa-mobile-resolution" ) ,
    Jade;

Jade    = Base.extend( function( opt , app ) {
    this.httpCache      = {};
    this.jadeFileFolder = path.join( path.resolve( opt.jadeFolderName ) , "/" );
    this.koa            = false;
    this.koaApp         = app;
    this.packageJSON    = opt;
    this.getResolutionMiddleware();
} , {
    getResolutionMiddleware     : function(){
        if( this.packageJSON.isMobile ){
            /*!
             *  提供屏幕分辨率相关的中间件
             */
            this.koaApp.use( mResolution() );
        }
    } ,
    /*!
     *  序列化一个template到内存中，
     *  并返还对于的jade加载器
     *  如果已加载过的template文件 从内存中读取
     *  @templateName       {string}    jade模板名称
     *  return              {jadeFn}    一个实例化的jade对象，可直接与json组装
     */
    getTemplate : function*( templateName ){
        var _jadeFilePath ,
            _httpStr,
            _isFileExists;
        if( this.packageJSON.debug === true ){
            delete this.httpCache[ templateName ];
        }
        if( this.httpCache[ templateName ] === undefined ){
            _jadeFilePath   = this.jadeFileFolder + templateName + ".jade";
            _isFileExists   = yield cofs.exists( _jadeFilePath );
            if( _isFileExists ){
                _httpStr    = yield cofs.readFile( _jadeFilePath , "utf-8" );
                this.httpCache[ templateName ] = jade.compile( _httpStr , {
                    filename    : this.jadeFileFolder + templateName
                } );
            } else {
                this.httpCache[ templateName ] = false;
            }
        }
        return this.httpCache[ templateName ] || false;
    } ,
    getResolution   : function(){
        var _rln    = this.koa.req.client.mResolution;
        _rln.pageScale  = 1 / _rln.dpr;
        return _rln;
    } ,
    /*!
     *  组装一个json到jade模板中
     *  @json           {json}      json数据
     *  @templateName   {string}    jade模板名称
     *  return          {string}    html字符串
     */
    getHTML     : function*( json , templateName ){
        var _jadeFn;
        if( typeof json === "string" ){
            templateName    = json;
            json            = {};
        }
        _jadeFn     = yield this.getTemplate( templateName );
        return _jadeFn ? _jadeFn( _.extend( this.getResolution() , json ) ) : "";
    }
} );

module.exports  = function( opt , app ){
    var _jade   = new Jade( opt , app );
    return function *( next ){
        this.jade    = _jade;
        this.jade.koa= this;
        yield next;
    }
};