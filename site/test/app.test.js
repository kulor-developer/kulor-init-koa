"use strict";

const assert  = require( "assert" ) ,
      http    = require( "./httpRequest" );

function E( x ){ return console.log( x ); }

describe( "app" , function() {
    describe( "server start" , ()=>{
        it( "server app start" , done => {
            http.get( "http://127.0.0.1:16001/index.html" , ( res )=>{
                assert( 200 , res.statusCode );
                done();
            } );
        } );
    } );
    describe( "biz test" , ()=> {
        let timeout;
        this.timeout( 15e3 );
        before( () =>{
            timeout     = setTimeout( ()=>{} , 1e9 );
        } );

        after( () =>{
            clearTimeout( timeout );
        } );

        it( "Get index.html" , done => {
            http.get( "http://127.0.0.1:16001/index.html" , ( res )=>{
                assert.equal( 200 , res.statusCode );
                done();
            } );
        } );

        it( "Get baidu.com" , done => {
            http.get( "http://baidu.com" , ( res )=>{
                assert.equal( 200 , res.statusCode );
                done()
            } );
        } );

        it( "Get get.html" , done => {
            http.get( "http://127.0.0.1:16001/get.html" , ( res )=>{
                assert.equal( 200 , res.statusCode );
                done();
            } );
        } );

        it( "Post index.html" , done => {
            http.post( "http://127.0.0.1:16001/index.html" , ( res , result )=>{
                assert.equal( JSON.stringify( { name : "John" } ) , result );
                setTimeout( done , 1e2 );
            } );
        } );

        it( "Get sub/index.html" , done => {
            http.get( "http://127.0.0.1:16001/sub/index.html" , ( res , result )=>{
                assert.equal( `Hi,world {"code":200}}` , result );
                done();
            } );
        } );

        it( "Post sub/index.html" , done => {
            http.post( "http://127.0.0.1:16001/sub/index.html" , ( res , result )=>{
                assert.equal( 200 , res.statusCode );
                setTimeout( done , 1e2 );
            } );
        } );
    } )
} );