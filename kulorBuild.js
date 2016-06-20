var path    = require( "path" );
module.exports  = function( bower , grunt , tool , log , callback ) {
    var self    = this;
    log( "start load kulor-koa-app" );
    tool.file.copy( path.resolve( __dirname , "site" ) , path.resolve( self.cwd ) );
    log( "kulor-koa-app init success" );
    callback();
}