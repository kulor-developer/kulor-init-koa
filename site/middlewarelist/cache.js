var Base        = require( "../common/base" ) ,
    _           = require( "underscore" ) ,
    path        = require( "path" ) ,
    Cache;

Cache    = Base.extend( function( opt ) {
    this.cacheData      = {
        handlersCache     : {}
    };
    this.koa            = false;
    this.packageJSON    = opt;
} , {
    get             : function(){
        return this.getCacheData.apply( this , arguments );
    } ,
    set             : function(){
        return this.setCacheData.apply( this , arguments );
    } ,
    getCacheData    : function( key ){
        return this.cacheData[ key ];
    } ,
    setCacheData    : function( key , value ){
        this.cacheData[ key ]   = value;
        return this;
    }
} );

module.exports  = function( opt ){
    var _cache   = new Cache( opt );
    return function *( next ){
        this.cache      = _cache;
        this.cache.koa  = this;
        yield next;
    }
};