var koaRedis    = require( "koa-redis" );

module.exports  = function( opt ){
    var _redis   = new koaRedis( opt );
    return function *( next ){
        this.redis      = _redis;
        yield next;
    }
};