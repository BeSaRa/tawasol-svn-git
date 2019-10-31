module.exports = function (app) {
    app.factory('Page', function (FileType, getDefaultRequest, ajaxRequest, ImageCompression, IPSettings) {
        'ngInject';
        return function Page(serviceUrl, sessionId, jobId, pageNumber, filters) {
            var _serviceUrl = serviceUrl;
            var _sessionId = sessionId;
            var _jobId = jobId;
            var _pageMetadata = null;
            var _pageNumber = pageNumber;
            var _filters = filters;


            this.getOriginal = function (w, h, inputFileFormat, inputCompression) {
                var width = w ? w : 0;
                var height = h ? h : 0;

                var format = (!inputFileFormat && inputFileFormat !== 0) ? FileType.Png : inputFileFormat;
                var compression = (!inputCompression && inputCompression !== 0) ? ImageCompression.AutoDetect : inputCompression;
                return _serviceUrl + "image/" + _jobId + "/" + _pageNumber + "?converttobinary=false&filetype=" + format + "&compression=" + compression + "&rotation=0&brightness=0&contrast=0&width=" + width + "&height=" + height;
            };

            this.getCurrentImageID = function () {
                if (_pageMetadata === null)
                    return null;

                return _pageMetadata.ImageID;
            };

            this.getCurrent = function (w, h, inputFileFormat, inputCompression) {
                if (_pageMetadata === null)
                    return null;

                var width = w ? w : 0;
                var height = h ? h : 0;

                var format = (!inputFileFormat && inputFileFormat !== 0) ? _getDefaultFileType.call(this) : inputFileFormat;
                var compression = (!inputCompression && inputCompression !== 0) ? _getDefaultCompression.call(this) : inputCompression;

                return _serviceUrl + _sessionId + "/" + _jobId + "/" + _pageMetadata.ImageID + "?filetype=" + format + "&compression=" + compression + "&width=" + width + "&height=" + height;
            };

            this.getThumbnail = function () {
                return this.getCurrent() ? this.getCurrent(100, 0) : this.getOriginal(100, 0);
            };

            this.getImageInfo = function (callback) {
                var self = this;
                if (_pageMetadata !== null) {
                    callback(self, _pageMetadata);
                    return true;
                }
                else {

                    var url = _serviceUrl + "getimageid?scanjob=" + _jobId + "&imagenumber=" + _pageNumber + "&filetype=0&compression=0&rotation=0&brightness=0&contrast=0&width=0&height=0";
                    $.ajax({
                        url: url,
                        success: function (data) {
                            _pageMetadata = data;
                            callback(self, data);
                        }
                    });
                }
            };

            this.getPageNumber = function () {
                return _pageNumber;
            };

            this.getCustomPageNumber = function () {
                return _sessionId + '_' + jobId + '_' + _pageNumber;
            };

            this.getFilters = function () {
                return _filters;
            };

            this.enhanceAndAnalize = function (filters, callback) {
                var self = this;
                var request = getDefaultRequest();
                request.url = _serviceUrl + _sessionId + "/" + _jobId + "/" + _pageNumber;
                request.type = 'POST';
                request.processData = false;
                request.dataType = 'json';
                request.data = JSON.stringify(filters);
                request.jsonp = null;
                request.success = function (data) {
                    _pageMetadata = data;
                    _filters = filters;
                    callback(self, data);
                };
                ajaxRequest(request);
            };

            this.save = function (filetype, compression, savingFinishedCallback) {
                var filters = _filters;
                if (!filters) {
                    filters = IPSettings(null);
                }

                filters.ImageOutput.FileType = filetype;
                filters.ImageOutput.Compression = compression;

                var self = this;
                var request = getDefaultRequest();
                request.url = _serviceUrl + _sessionId + "/" + _jobId + "/" + _pageNumber;
                request.type = 'POST';
                request.processData = false;
                request.dataType = 'json';
                request.data = JSON.stringify(filters);
                request.jsonp = null;
                request.success = function (data) {
                    _pageMetadata = data;
                    _filters = filters;
                    savingFinishedCallback(self, data);
                };
                ajaxRequest(request);
            };

            var _getDefaultCompression = function () {
                //jpeg for gray and color otherwise png
                return _isBinary.call(this) ? ImageCompression.None : ImageCompression.Jpeg; //png or jpeg compression
            };

            var _getDefaultFileType = function () {
                return _isBinary.call(this) ? FileType.Png : FileType.Jpeg;
            };

            var _isBinary = function () {
                return _pageMetadata.ImageInfo.ColorFormat.BitsPerSample !== 8;
            };
        };
    })
};
