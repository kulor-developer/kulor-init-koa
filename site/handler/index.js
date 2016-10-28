var Base        = require( "../common/base" ) ,
    HandlerBase = require( "../common/handlerBase" ) ,
    Index;

Index   = Base.extend( function(){

} , {
    extend      : HandlerBase ,
    handlerName : "index" ,
    doPOST      : function *(){
        return { name : "John" };
    } ,
    doGET       : function *(){
        return yield this.jade.getHTML( "index" );
    }
} );

module.exports  = Index;