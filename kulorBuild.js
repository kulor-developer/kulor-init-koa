var path    = require( "path" );
module.exports  = function( bower , grunt , tool , log , callback ) {
    var self    = this;
    log( "start load kulor-koa-app" );
    bower.commands
        .install( [ "zepto" ] , { save : true } )
        .on( "end" , function( installed ){
            tool.file.copy( path.resolve( self.bowerDir , "zepto/zepto.min.js" ) , path.resolve( self.cwd , "src/js/lib/zepto.js" ) );
            tool.file.copy( path.resolve( __dirname , "grunt" ) , path.resolve( self.cwd ) );
            tool.file.copy( path.resolve( __dirname , "site" ) , path.resolve( self.cwd ) );
            tool.file.copy( path.resolve( __dirname , "src" ) , path.resolve( self.cwd ) );
            log( "kulor-koa-app init success" );
            callback();
        } );
    callback();
}