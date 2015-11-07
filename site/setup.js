var cluster     = require( "cluster" ) ,
    server      = require( "./server" ) ,
    packageJSON = require( "./config.json" );

function setupWorker(){
    cluster.fork().on( "exit" , function(){
        console.log( "exit" );
    } );
}

if( cluster.isMaster ){
    if( packageJSON.debug ){
        setupWorker();
    } else {
        for( var i = packageJSON.clusterForkNum || require( "os" ).cpus().length; i--; ){
            setupWorker();
        }
    }
} else if( cluster.isWorker ){
    server( packageJSON.serverListenPort || process.argv[ process.argv.length - 1 ] );
}