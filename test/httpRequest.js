const Http        = require( "http" ) ,
      Url         = require( "url" ) ,
      QueryString = require( "querystring" );

function httpRequest( fn ) {
    return function( res ) {
        let _data = [] ,
            _size = 0;
        res.on( "data" , ( chunk )=> {
            _data.push( chunk );
            _size += chunk.length;
        } ).on( "end" , ()=> {
            _data = Buffer.concat( _data , _size ).toString();
            typeof fn === "function" && fn( res , _data );
        } );
    }
}

module.exports = {
    post( url , params , fn ){
        let _opt = Url.parse( url ) ,
            _req;
        if( typeof params === "function" ) {
            fn = params;
            params = {};
        }
        _opt.method = "POST";
        _req = Http.request( _opt , httpRequest( fn ) );
        _req.write( QueryString.stringify( params ) );
        _req.end();
        _req.on( "error" , ( e )=> {
            typeof fn === "function" && fn( e );
        } );
    } ,
    get( url , fn ){
        Http.get( url , httpRequest( fn ) );
    }
};