'use strict';

var http                = require( "http" ) ,
    https               = require( "https" ) ,
    _                   = require( "underscore" ) ,
    Url                 = require( "url" ) ,
    QueryString         = require( "querystring" ) ,
    requestBeforeEvents = [] ,
    requestAfterEvents  = [] ,
    requestErrorEvents  = [];

class Connect {
    constructor( opt ) {
        if( opt ) {
            this.preHttpStr = [
                "http://" ,
                opt.serverIp ,
                ":" ,
                opt.serverPort ,
                "/"
            ].join( "" );
        }
        this.__requestBeforeEvents = requestBeforeEvents;
        this.__requestAfterEvents = requestAfterEvents;
        this.__requestErrorEvents = requestErrorEvents;
    }

    /*!
     *  opt : Object { beforeEvents : [ fn , fn ] , afterEvents : [ fn , fn ] , errorEvents : [ fn , fn ] }
     *              { beforeEvents : fn , afterEvents : fn , errorEvents : fn }
     *  isGlobal : boolean
     */
    setRequestEvents( opt , isGlobal ) {
        typeof opt.beforeEvents === "function" && ( opt.beforeEvents = [ opt.beforeEvents ] );
        typeof opt.afterEvents === "function" && ( opt.afterEvents = [ opt.afterEvents ] );
        typeof opt.errorEvents === "function" && ( opt.errorEvents = [ opt.errorEvents ] );
        this.__requestBeforeEvents = this.__requestBeforeEvents.concat( opt.beforeEvents );
        this.__requestAfterEvents = this.__requestAfterEvents.concat( opt.afterEvents );
        this.__requestErrorEvents = this.__requestErrorEvents.concat( opt.errorEvents );
        if( isGlobal ) {
            requestBeforeEvents = requestBeforeEvents.concat( opt.beforeEvents );
            requestAfterEvents = requestAfterEvents.concat( opt.afterEvents );
            requestErrorEvents = requestErrorEvents.concat( opt.afterEvents );
        }
        return this;
    }

    requestEventsAction( events , ...args ) {
        for( let i = 0 , len = events.length; i < len; i++ ) {
            events[ i ].apply( this , args );
        }
        return this;
    }

    setupHttpRequest( opt , successFn , errorFn ) {
        let _self  = this ,
            _abort = setTimeout( ()=> {
                this.requestEventsAction( this.__requestErrorEvents , opt.path + " timeout" );
                _req && _req.abort();
                errorFn( opt.path + " timeout" );
            } , this.koa.cache.packageJSON.requestTimeout ) ,
            _http  = http ,
            _req;
        if( opt.port === 443 ) {
            opt.protocol = "https:";
            _http = https;
            delete opt.headers.host;
        }
        this.requestEventsAction( this.__requestBeforeEvents , opt );
        _req = _http.request( opt , ( res )=> {
            let _data = [] ,
                _size = 0;
            clearTimeout( _abort );
            res.on( "data" , ( chunk ) => {
                _data.push( chunk );
                _size += chunk.length;
            } ).on( "end" , ()=> {
                let _result = Buffer.concat( _data , _size ).toString();
                this.requestEventsAction( this.__requestAfterEvents , res , _result );
                if( res.statusCode === 200 ) {
                    this.keepCookieToServer( res );
                    successFn( _result );
                } else {
                    errorFn( opt.path + " : statusCode=" + res.statusCode + "\n" + _result );
                }
            } );
        } );
        _req.on( "error" , ( e )=> {
            this.requestEventsAction( this.__requestErrorEvents , e );
            errorFn( e )
        } );
        opt.method === "POST" && _req.write( opt.dataStr );
        _req.end();
        return _abort;
    }

    keepCookieToServer( res ) {
        var _cookie = this.koa.cookies;
        if( res.headers[ "set-cookie" ] ) {
            res.headers[ "set-cookie" ].map( v => {
                var _tmp = v.split( "=" );
                _cookie.set( _tmp[ 0 ] , _tmp[ 1 ] );
            } );
            this.koa.accept.headers.cookie += ";" + res.headers[ "set-cookie" ].join( ";" );
        }
    }

    /*!
     *  获取connect请求的headers参数
     *  @url        {string}    
     *  @type       {string}        POST | GET
     */
    getConnectOpts( url , type , opt ) {
        if( typeof opt !== "object" ) {
            opt = {}
        }
        opt = _.extend( {
            hostname : opt.host || this.koa.cache.packageJSON.serverIp ,
            port     : opt.port || this.koa.cache.packageJSON.serverPort ,
            path     : opt.path || url ,
            method   : type || "GET" ,
            headers  : _.extend( this.koa.accept.headers , {
                "Content-Type" : "application/x-www-form-urlencoded"
            } , opt.headers || {} )
        } , opt );
        opt.method === "GET" && ( delete opt.headers[ "content-length" ] );
        opt.path.indexOf( "/" ) != 0 && ( opt.path = "/" + opt.path );
        return opt;
    }

    /*!
     *  解析hostUrl 到opt header里
     *  @url        {string}    url字符串
     *  @opt        {object}    http->header信息
     *  return      {object}
     */
    getHostOpt( url , opt ) {
        var _url = Url.parse( url );
        return _.extend( {
            host : _url.hostname ,
            port : _url.protocol === "https:" ? 443 : 80 ,
            path : _url.path
        } , opt );
    }

    post( url , postData , opt ) {
        var _self    = this ,
            _cb ,
            _called ,
            _dataStr = QueryString.stringify( postData ) ,
            _done    = ( result )=> {
                if( !_called && result !== undefined && _cb ) {
                    try {
                        _cb.call( this , null , JSON.parse( result ) );
                    } catch( e ) {
                        _cb.call( this , null , result );
                    }
                    _called = true;
                }
            } ,
            _abort;
        opt = opt || {};
        opt.headers = opt.headers || {};
        opt.headers[ "Content-Length" ] = _dataStr.length;
        opt.dataStr = _dataStr;

        _abort = this.setupHttpRequest( this.getConnectOpts( url , "POST" , opt ) , _done , ( e )=> {
            clearTimeout( _abort );
            _done( JSON.stringify( { error : -9 } ) );
        } );

        return function( fn ) {
            _cb = fn;
            _done();
        }
    }

    getParamData( params ) {
        var _al = [];
        for( var a in params ) {
            _al.push( a + "=" + encodeURIComponent( params[ a ] ) );
        }
        return _al.join( "&" );
    }

    get( url , paramData , opt ) {
        var _self = this ,
            _cb ,
            _called ,
            _done = ( result )=> {
                if( !_called && result !== undefined && _cb ) {
                    try {
                        _cb.call( this , null , JSON.parse( result ) );
                    } catch( e ) {
                        _cb.call( this , null , result );
                    }
                    _called = true;
                }
            } ,
            _abort;
        if( typeof paramData === "object" && paramData !== null ) {
            url += "?" + this.getParamData( paramData );
        }
        if( /^https?:/.test( url ) ) {
            opt = this.getHostOpt( url , opt );
        } else if( !/^[\\|\/]/.test( url ) ) {
            url = "/" + url;
        }

        _abort = this.setupHttpRequest( this.getConnectOpts( url , "GET" , opt ) , _done , ( e )=> {
            clearTimeout( _abort );
            _done( JSON.stringify( { error : -9 } ) );
        } );

        return function( fn ) {
            _cb = fn;
            _done();
        }
    }
}

module.exports = Connect;