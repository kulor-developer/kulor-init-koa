var cluster     = require( "cluster" ) ,
    server      = require( "./server" ) ,
    packageJSON = require( "./config.json" ) ,
    totalProccess   = packageJSON.clusterForkNum || require( "os" ).cpus().length;

function setupWorker(){
    var i = 0;
    for( var w in cluster.worker ){
        i++;
    }
    if( i < totalProccess ){
        cluster.fork().on( "exit" , function(){
            this.kill();
            this.destroy();
            setupWorker();
        } );
    }
}

if( cluster.isMaster ){
    if( packageJSON.debug ){
        setupWorker();
    } else {
        for( var i = totalProccess; i--; ){
            setupWorker();
        }
    }
} else if( cluster.isWorker ){
    server( packageJSON.serverListenPort || process.argv[ process.argv.length - 1 ] );
}