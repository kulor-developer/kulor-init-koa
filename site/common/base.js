var _   = require( "underscore" );
var tool = {
    setSingleImplements : function( Base , protos ){
        for( var a in protos ){
            if( a != "__proto__" ){
                if( Base.prototype[ a ] && typeof protos[ a ] == "object" ){
                    Base.prototype[ a ] = _.extend( {} , Base.prototype[ a ] , protos[ a ] );
                } else {
                    Base.prototype[ a ] = protos[ a ];
                }
            }
        }
    },
    setImplements : function( Base , opts ){
        var _cls;
        if( opts.implements ){
            for( var a in opts.implements ){
                _cls = opts.implements[ a ];
                if ( _cls.__proto__ ) {
                    _cls = _cls.__proto__;
                } else if ( Object.getPrototypeOf ) {
                    _cls = Object.getPrototypeOf( _cls );
                };
                tool.setSingleImplements( Base , _cls );
            }
        }
        delete opts.implements;
    }
};

module.exports  = {
    extend  : function( constructor , opts ){
        var Base,
            _extend,
            _implements = opts.implements ,
            _do     = function(){
                constructor.apply( this , Array.prototype.slice.call( arguments ) );
                if ( _implements instanceof Array ) {
                    for( var i = 0 , len = _implements.length; i < len; i++ ){
                        _implements[ i ].constructor.call( this );
                    }
                }
            };
        if( typeof constructor != "function" ){
            return;
        } else {
            if( opts.extend && typeof opts.extend == "function" ){
                _extend = opts.extend;
                Base = function(){
                    var _args   = Array.prototype.slice.call( arguments );
                    _extend.prototype.constructor.apply( this , _args );
                    _do.apply( this , _args );
                }
                Base.prototype = Object.prototype.__proto__ ? { __proto__ : _extend.__proto__ } :
                    _.isFunction( _extend ) ? new _extend() : _extend;
                delete opts.extend;
            } else {
                Base = function(){
                    _do.apply( this , Array.prototype.slice.call( arguments ) );
                }
            }
            Base.prototype.constructor = constructor;
            tool.setImplements( Base , opts );
            tool.setSingleImplements( Base , opts );
            opts = null;
            return Base;
        }
    }
}