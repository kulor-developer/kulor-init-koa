var Base        = require( "../common/base" ) ,
    HandlerBase = require( "../common/handlerBase" ) ,
    Index;

Index   = Base.extend( function(){} , {
    extend      : HandlerBase ,
    handlerName : "index" ,
    doJob       : function *(){
        return yield this.jade.getHTML( "index" );
    }
} );

module.exports  = Index;