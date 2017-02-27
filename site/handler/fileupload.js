'use strict';

const HandlerBase = require( "../common/fileupload" );

class FileUpload extends HandlerBase {
    *doPOST() {
        let _file = yield this.getFileStream() ,
            _req  = yield this.post( "fileupload2.html" , _file );

        return _req;
    }
}

module.exports  = FileUpload;