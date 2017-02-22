const cluster     = require( "cluster" ) ,
    server      = require( "./server" ) ,
    packageJSON = require( "./config.json" ) ,
    totalProccess   = packageJSON.clusterForkNum || require( "os" ).cpus().length;

function setupWorker(){
    var i = 0;
    for( let w in cluster.worker ){
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

function setupServer(){
    server( packageJSON.serverListenPort || process.argv[ process.argv.length - 1 ] );
}

if( cluster.isMaster ){
    if( packageJSON.debug ){
        setupServer();
    } else {
        for( var i = totalProccess; i--; ){
            setupWorker();
        }
    }
} else if( cluster.isWorker ){
    setupServer();
}