module.exports = function (app) {
    app.factory('Uploader', function (getDefaultRequest, $timeout, ajaxRequest, FileType, DataEncoding) {
        'ngInject';
        return function Uploader(CCToolkit, /*beginUploadUrl, uploadChunkUrl, endUploadUrl,*/ uploadErrorCallback, progressCallback, completeCallback) {

            var _uploadErrorCallback = uploadErrorCallback;
            var _completeCallback = completeCallback;
            var _progressCallback = progressCallback;
            var _beginUploadUrl = null;
            var _uploadChunkUrl = null;
            var _endUploadUrl = null;
            var arrayOfData = [];

            this.send = function (image) {
                arrayOfData = [];
                image.Offset = 0;
                if (!image.FileType) {
                    if (image.ImageInfo && image.ImageInfo.FileType) {
                        image.FileType = image.ImageInfo.FileType;
                    } else {
                        image.FileType = FileType.Tiff;
                    }
                }

                // image.ChunkSize = 65536; //64K
                image.ChunkSize = 614400; //600K
                _beginUpload.call(this, image);
            };

            var _beginUpload = function (image) {
                var self = this;
                var request = getDefaultRequest();
                request.url = _beginUploadUrl;
                request.type = 'POST';
                request.processData = false;
                request.dataType = 'json';
                request.error = _uploadErrorCallback;
                request.jsonp = null;
                request.data = '{ "imageID": "' + image.ImageID + '", "fileType":' + image.FileType + ' }';

                $timeout(function () {
                    _beginUploadCallback.call(self, {UploadID: 'BeSaRa'}, image)
                },200);

            };

            var _beginUploadCallback = function (data, image) {
                image.UploadID = data.UploadID;
                _getImageDataString.call(this, image);
            };

            var _getImageDataString = function (image) {
                var self = this;
                var request = getDefaultRequest();
                request.url = CCToolkit.getServiceUrl() + "getimagedatastring?session=" + CCToolkit.getSessionId() + "&imageID=" + image.ImageID + "&offset=" + image.Offset + "&size=" + image.ChunkSize + "&encoding=" + DataEncoding.Base64;
                request.$ignore = true;
                request.success = function (data) {
                    _getImageDataBytesCallback.call(self, data, image);
                };
                ajaxRequest(request);
            };

            var _getImageDataBytesCallback = function (data, image) {
                _sendImageDataBytes.call(this, data, image);
            };
            var _sendImageDataBytes = function (data, image) {
                var self = this;
                if (!data.Data || !data.Data.length) {
                    _endUpload.call(this, image);
                    return;
                }
                $timeout(function () {
                    arrayOfData.push(data.Data);
                    _sendImageDataBytesCallback.call(self, image);
                }, 200);
            };

            var _sendImageDataBytesCallback = function (image) {
                _progressCallback.call(this, image.Offset, image.FileSize);
                image.Offset += image.ChunkSize;
                _getImageDataString.call(this, image);
            };

            var _endUpload = function (image) {
                var typesArray = {
                    196608: 'tiff',
                    720896: 'jpeg',
                    1048576: 'pdf',
                    1245184: 'png',
                    1310720: 'jpeg2000'
                };

                var binary = [];
                for (var i = 0; i < arrayOfData.length; i++) {
                    binary.push(atob(arrayOfData[i]));
                }

                binary = binary.join('');
                var charCode = [];
                for (var x = 0; x < binary.length; x++) {
                    charCode[x] = binary.charCodeAt(x);
                }

                var type = image.FileType === FileType.Pdf ? 'application/pdf' : 'image/' + typesArray[image.FileType];
                // create blob
                var blob = new Blob([new Uint8Array(charCode)], {type: type});
                // create blob url
                var url = URL.createObjectURL(blob);

                var convertToFile = function (theBlob, fileName) {
                    var file = angular.copy(theBlob);
                    file.lastModifiedDate = new Date();
                    file.name = fileName;

                    return file;
                };

                _completeCallback(blob, convertToFile(blob, 'Scanner'), url, image);
            };
        };
    })
};
