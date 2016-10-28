var path    = require( "path" );

module.exports  = function( bower , grunt , tool , log , callback ) {
    var self    = this ,
        _list   = [
            "common" ,
            "middlewarelist" ,
            "configDoc.json"  ,
            "package.json" ,
            "server.js" ,
            "setup.js"
        ];

    log( "start load kulor-koa-app" );
    if( grunt.file.isDir( path.resolve( self.cwd , "site" ) ) ){
        _list.map( function( filePath ){
            tool.file.copy( path.resolve( __dirname , "site/" + filePath ) , path.resolve( self.cwd , "site" ) );
        } );
    } else {
        tool.file.copy( path.resolve( __dirname , "site" ) , path.resolve( self.cwd ) );
    }

    log( "kulor-koa-app init success" );
    callback();
}