var path    = require( "path" );
module.exports  = function( bower , grunt , tool , log , callback ) {
    var self    = this;
    log( "start load kulor-koa-app" );
    bower.commands
        .install( [ "zepto" ] , { save : true } )
        .on( "end" , function( installed ){
            log( "kulor-koa-app init success" );
            callback();
        } );
}