var Base        = require( "./base" ) ,
    http        = require( "http" ) ,
    https       = require( "https" ) ,
    Connect;

Connect     = Base.extend( function( koa ){
    if( koa ){
        this.koa        = koa;
        this.preHttpStr = [ 
                        "http://" ,
                        koa.cache.packageJSON.serverIp ,
                        ":" ,
                        koa.cache.packageJSON.serverPort ,
                        "/"
                        ].join( "" );
    }
} , {
    keepCookieToServer : function( res ){
        if( res.headers[ "set-cookie" ] && res.headers[ "set-cookie" ][ 0 ] ){
            if( !this.koa.session.serverCookie ){
                this.koa.session.serverCookie     = res.headers[ "set-cookie" ][ 0 ];
            } else if( this.koa.session.serverCookie !== res.headers[ "set-cookie" ][ 0 ] ){
                this.koa.session.serverCookie = null;
            }   
        }
    } ,
    /*! 
     *  获取connect请求的headers参数
     *  @url        {string}    
     *  @type       {string}        POST | GET
     */
    getConnectOpts  : function( url , type ){
        return {
            hostname    : this.koa.cache.packageJSON.serverIp,
            port        : this.koa.cache.packageJSON.serverPort,
            path        : url,
            method      : type || "GET",
            headers: {
                "Content-Type"  : "application/x-www-form-urlencoded" ,
                "Cookie"        : this.koa.session && this.koa.session.serverCookie ? this.koa.session.serverCookie : ""
            }
        };
    } ,
    post    : function ( url , postData ){
        var _self       = this ,
            _cb ,
            _result ,
            _called ,
            _dataStr    = "data=" + JSON.stringify( postData ) ,
            _done   = function(){
                if( !_called && _result !== undefined && _cb ){
                    _cb.call( this , null , JSON.parse( _result ) );
                    _called = true;
                }
            } ,
            _req;
        _req = http.request( _self.getConnectOpts( url , "POST" ) , function( res ){
            var _data   = "";
            _self.keepCookieToServer( res );
            if( res.statusCode === 200 ){
                res.on( "data" , function( chunk ){
                    _data   += chunk;
                } ).on( "end" , function(){
                    _result     = String( _data );
                    _done();
                } );
            }
        });
        _req.on( "error" , function( e ){
            _self.log( e.massage || e );
            _result     = JSON.stringify( { error : -9 } );
            _done();
        } );
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
    get     : function( url , paramData ){
        var _self       = this ,
            _cb ,
            _result ,
            _called ,
            _done   = function(){
                if( !_called && _result !== undefined && _cb ){
                    _cb.call( this , null , ( _result ? JSON.parse( _result ) : _result ) );
                    _called = true;
                }
            } ,
            _getData = function( res ){
                var _data   = "";
                if( res.statusCode === 200 ){
                    res.on( "data" , function( chunk ){
                        _data   += chunk;
                    } ).on( "end" , function(){
                        _result     = String( _data );
                        _done();
                    } );
                }
            } ,
            _req ;
        if( typeof paramData === "object" ){
            url     += "?" + this.getParamData( paramData );
        }
        if( /^https/.test( url ) ){
            https.get( url , function( res ){
                _getData( res );
            } );
        } else if( /^http/.test( url ) ){
            http.get( url , function( res ){
                _getData( res );
            } ).on( "error" , function( e ){
                _self.log( e.massage );
                _result     = "\{error : -9\}";
                _done();
            } );
        } else {
            if( !/^[\\|\/]/.test( url ) ){
                url     = "/" + url;
            }
            _req = http.request( _self.getConnectOpts( url , "GET" ) , function( res ){
                _self.keepCookieToServer( res );
                _getData( res );
            });
            _req.on( "error" , function( e ){
                _self.log( e );
                _result     = JSON.stringify( { error : -9 } );
                _done();
            } );
            _req.end();
        }
        return function( fn ){
            _cb     = fn;
            _done();
        }
    }
} );

module.exports  = Connect;