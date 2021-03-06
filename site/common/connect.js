var Base        = require( "./base" ) ,
    http        = require( "http" ) ,
    https       = require( "https" ) ,
    _           = require( "underscore" ) ,
    Url         = require( "url" ) ,
    QueryString = require( "querystring" ) ,
    Connect;

Connect     = Base.extend( function( opt ){
    if( opt ){
        this.preHttpStr = [ 
                        "http://" ,
                        opt.serverIp ,
                        ":" ,
                        opt.serverPort ,
                        "/"
                        ].join( "" );
    }
} , {
    keepCookieToServer : function( res ){
        var _cookie     = this.koa.cookies;
        if( res.headers[ "set-cookie"] ) {
            res.headers["set-cookie"].map(function (v) {
                var _tmp = v.split("=");
                _cookie.set(_tmp[0], _tmp[1]);
            });
            this.koa.accept.headers.cookie  += ";" + res.headers["set-cookie"].join( ";" );
        }
    } ,
    /*! 
     *  获取connect请求的headers参数
     *  @url        {string}    
     *  @type       {string}        POST | GET
     */
    getConnectOpts  : function( url , type , opt ){
        if( typeof opt !== "object" ){
            opt         = {}
        }
        opt     = {
            hostname    : opt.host || this.koa.cache.packageJSON.serverIp ,
            port        : opt.port || this.koa.cache.packageJSON.serverPort ,
            path        : opt.path || url ,
            method      : type || "GET" ,
            headers     : _.extend( this.koa.accept.headers , {
                    "Content-Type"  : "application/x-www-form-urlencoded"
                } , opt.headers || {} )
        };
        return opt;
    } ,
    /*!
     *  解析hostUrl 到opt header里
     *  @url        {string}    url字符串
     *  @opt        {object}    http->header信息
     *  return      {object}
     */
    getHostOpt      : function( url , opt ){
        var _url    = Url.parse( url );
        return _.extend( {
                host    : _url.hostname ,
                port    : _url.port || 80 ,
                path    : _url.path
            } , opt );
    } ,
    post    : function ( url , postData , opt ){
        var _self       = this ,
            _cb ,
            _result ,
            _called ,
            _dataStr    = QueryString.stringify( postData ) ,
            _done   = function(){
                if( !_called && _result !== undefined && _cb ){
                    try {
                        _cb.call( this , null , JSON.parse( _result ) );
                    } catch( e ) {
                        _cb.call( this , null , _result );
                    }
                    _called = true;
                }
            } ,
            _error  = function( e ){
                clearTimeout( _abort );
                _self.log( e.massage || e );
                _result     = JSON.stringify( { error : -9 } );
                _done();
            } ,
            _req ,
            _abort;
        if( /^https?:/.test( url ) ){
            opt     = this.getHostOpt( url , opt );
        }
        opt     = opt || {};
        opt.headers     = opt.headers || {};
        opt.headers[ "Content-Length" ]     = _dataStr.length;
        this.koa.log.log( url );

        _abort      = setTimeout( function(){
            _req.abort();
            _error( url + " timeout" );
        } , this.koa.cache.packageJSON.requestTimeout );

        _req = http.request( _self.getConnectOpts( url , "POST" , opt ) , function( res ){
            var _data   = "";
            clearTimeout( _abort );
            res.on( "data" , function( chunk ){
                _data   += chunk;
            } ).on( "end" , function(){
                _result     = String( _data );
                if( res.statusCode === 200 ){
                    _self.keepCookieToServer( res );
                    _done();
                } else {
                    _error( url + " : statusCode=" + res.statusCode + "\n" + _result );
                }
            } );
        });
        _req.on( "error" , _error );
        _req.write( _dataStr );
        _req.end();
        return function( fn ){
            _cb     = fn;
            _done();
        }
    } ,
    getParamData    : function( params ){
        var _al     = [];
        for( var a in params ){
            _al.push( a + "=" + encodeURIComponent( params[ a ] ) );
        }
        return _al.join( "&" );
    } ,
    get     : function( url , paramData , opt ){
        var _self       = this ,
            _cb ,
            _result ,
            _called ,
            _done   = function(){
                if( !_called && _result !== undefined && _cb ){
                    try {
                        _cb.call( this , null , JSON.parse( _result ) );
                    } catch( e ) {
                        _cb.call( this , null , _result );
                    }
                    _called = true;
                }
            } ,
            _error  = function( e ){
                clearTimeout( _abort );
                _self.log( e );
                _result     = JSON.stringify( { error : -9 } );
                _done();
            } ,
            _req ,
            _abort;
        if( typeof paramData === "object" && paramData !== null ){
            url     += "?" + this.getParamData( paramData );
        }
        if( /^https?:/.test( url ) ){
            opt     = this.getHostOpt( url , opt );
        } else if( !/^[\\|\/]/.test( url ) ){
            url     = "/" + url;
        }
        this.koa.log.log( url );

        _abort      = setTimeout( function(){
            _req.abort();
            _error( url + " timeout" );
        } , this.koa.cache.packageJSON.requestTimeout );

        _req = http.request( _self.getConnectOpts( url , "GET" , opt ) , function( res ){
            var _data   = "";
            clearTimeout( _abort );
            res.on( "data" , function( chunk ){
                _data   += chunk;
            } ).on( "end" , function(){
                _result     = String( _data );
                if( res.statusCode === 200 ){
                    _self.keepCookieToServer( res );
                    _done();
                } else {
                    _error( url + " : statusCode=" + res.statusCode + "\n" + _result );
                }
            } );
        });
        _req.on( "error" , _error );
        _req.end();
        return function( fn ){
            _cb     = fn;
            _done();
        }
    }
} );

module.exports  = Connect;