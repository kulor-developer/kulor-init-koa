'use strict';

const HandlerBase = require( "../common/fileupload" );

class FileUpload extends HandlerBase {
    *doPOST() {
        let _file = yield this.getFileStream();
        return _file.toString();
    }
}

module.exports  = FileUpload;