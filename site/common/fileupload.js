'use strict';

const HandlerBase = require( "./handlerBase" ) ,
    Http    = require( "http" ) ,
    Url     = require( "url" );

class FileUpload extends HandlerBase {
    getFile( request , fn ) {
        let _data = [] ,
            _size = 0;
        request.on( "data" , ( chunk )=> {
            _data.push( chunk );
            _size += chunk.length;
        } ).on( "end" , ()=> {
            _data = Buffer.concat( _data , _size );
            typeof fn === "function" && fn( _data );
        } );
    }

    getFileStream() {
        let _cb ,
            _result ,
            _isCalled ,
            _done = ()=> {
                if( !_isCalled && _result ) {
                    _cb.call( this , null , _result );
                    _isCalled = true;
                }
            };
        this.getFile( this.koa.req , ( data )=> {
            _result = data;
            _done();
        } );
        return function( fn ) {
            _cb = fn;
            _done();
        }
    }
}

module.exports = FileUpload;