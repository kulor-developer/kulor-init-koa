var fs      = require( "fs" ) ,
    Base    = require( "../common/base" ) ,
    path    = require( "path" ) ,
    Logger;

Logger = Base.extend( function( packageJSON ){
    this.logStr         = [];
    this.logFileFolder  = packageJSON.logFolderName;
    this.logCount       = packageJSON.tmpLogCount;
    this.packageJSON    = packageJSON;
} , {
    cleanLogCache   : function(){
        this.logStr.length  = 0;
        this.logCount       = this.packageJSON.tmpLogCount;
        return this;
    } ,
    /*!
     *  存放一条日志到内存中
     *  日志数量达到固定条目时，会写入到本地文件
     *  @str        {string}    日志内容
     */
    log         : function( str ){
        this.logStr.push( str );
        if( --this.logCount <= 0 ){
            this.saveToFile();
            this.cleanLogCache();
        };
    } ,
    /*!
     *  验证日志存放文件目录是否存在
     *  只做一次记录，将记录结果放置于内存中，后续直接调用结果处理
     */
    checkIsFileExists   : function( logFileName , callBack ){
        var _self   = this;
        if( this.fileExists ){
            callBack( null , true );
        } else {
            fs.exists( logFileName , function( err , _isFileExists ){
                if( !err ){
                    _self.fileExists    = true;
                }
                callBack.call( this , err , _isFileExists );
            } );
        }
    } ,
    /*!
     *  保存日志到硬盘中
     */
    saveToFile          : function(){
        var _logFileName    = path.join( this.logFileFolder , ( "sz-" + new Date().toLocaleDateString().replace( /[\\|\/]/g , "-" ) + ".txt" ) ),
            _logCache       = this.logStr.join( "\r\n" ) + "\r\n";
        this.checkIsFileExists( _logFileName , function( err , _isFileExists ){
            if( !err ){
                if( !_isFileExists ){
                    fs.writeFile( _logFileName , _logCache , function( err ){
                        if( err ){
                            console.log( "save log fail" );
                        }
                    });
                }
            } else {
                fs.appendFile( _logFileName , _logCache , "utf-8" , function( err ){
                    if( err ){
                        console.log( "save log fail" );
                    }
                } );
            }
        } );
    }
} );

module.exports  = function( opt ){
    var _log    = new Logger( opt );
    return function*( next ){
        this.log    = _log;
        yield next;
    }
};