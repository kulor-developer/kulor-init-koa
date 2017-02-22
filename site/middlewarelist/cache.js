const _    = require( "underscore" ) ,
      path = require( "path" );

class Cache {
    constructor( opt ) {
        this.cacheData = {
            handlersCache : {}
        };
        this.koa = false;
        this.packageJSON = opt;
    }

    get() {
        return this.getCacheData.apply( this , arguments );
    }

    set() {
        return this.setCacheData.apply( this , arguments );
    }

    getCacheData( key ) {
        return this.cacheData[ key ];
    }

    setCacheData( key , value ) {
        this.cacheData[ key ] = value;
        return this;
    }
}

module.exports = function( opt ) {
    var _cache = new Cache( opt );
    return function *( next ) {
        this.cache = _cache;
        this.cache.koa = this;
        yield next;
    }
};