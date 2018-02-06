module.exports = function (app) {
    app.factory('Document', function (FileType, _, ajaxRequest, getDefaultRequest, helper, Page, AsyncOperation) {
        'ngInject';
        return function Document(serviceUrl, sessionId, jobId, importing) {
            var _serviceUrl = serviceUrl;
            var _sessionId = sessionId;
            var _jobId = jobId;
            var _importing = importing;
            var _enhancePageNumber = -1;
            var _pageProcessedCallback = null;
            var _finishedProcessingCallback = null;

            this.pages = [];
            this.add = function (page) {
                this.pages.push(page);
            };

            this.getImportedFile = function () {
                var res = null;
                if (_importing)
                    res = _serviceUrl + _sessionId + "/" + _jobId;

                return res;
            };

            // this.getPage = function (number) {
            //     return this.pages[number];
            // };

            this.getPage = function (number) {
                return _.find(this.pages, function (page) {
                    return page.getPageNumber() === number;
                });
            };

            this.deletePage = function (selectedPage, callback) {
                var pageNumber = null;
                _.find(this.pages, function (page, index) {
                    if (selectedPage.getPageNumber() === page.getPageNumber()) {
                        pageNumber = index;
                    }
                });

                if (pageNumber !== null) {
                    this.pages.splice(pageNumber, 1);
                    callback(this.pages[pageNumber] || this.pages[--pageNumber]);
                }
            };

            this.insertPage = function (pos, page) {
                this.pages.splice(pos, 1, page);
            };

            this.movePageUp = function (pageNumber) {
                _.find(this.pages, function (page, index) {
                    if (pageNumber === page.getPageNumber()) {
                        pageNumber = index;
                    }
                });

                return this.canMove('up', pageNumber) ? this.pages = helper.move(this.pages, pageNumber, --pageNumber) : null;
            };
            this.movePageDown = function (pageNumber) {
                _.find(this.pages, function (page, index) {
                    if (pageNumber === page.getPageNumber()) {
                        pageNumber = index;
                    }
                });
                return this.canMove('down', pageNumber) ? this.pages = helper.move(this.pages, pageNumber, ++pageNumber) : null;
            };

            this.canMove = function (direction, pageNumber) {
                if (direction.toLowerCase() === 'up') {
                    return pageNumber > 0;
                } else if (direction.toLowerCase() === 'down') {
                    return pageNumber < (this.pages.length - 1);
                }
                return false;
            };


            this.save = function (fileType, pageSavedCallback, savingFinishedCallback) {
                if (!this.pages.length) {
                    return;
                }

                var idList = "";
                var self = this;
                var pageNumber = 0;
                this.pages[pageNumber].getImageInfo(function (page, data) {
                    onImageInfoReceived.call(self, pageNumber, data, idList, fileType, pageSavedCallback, savingFinishedCallback);
                });
            };

            this.addDocument = function (document) {
                for (var i in document.pages) {
                    this.pages.push(document.pages[i]);
                }
            };

            this.enhanceAndAnalize = function (filters, pageProcessedCallback, finishedCallback) {
                var self = this;
                _pageProcessedCallback = pageProcessedCallback;
                _finishedProcessingCallback = finishedCallback;
                _enhancePageNumber = 0;
                this.pages[_enhancePageNumber].enhanceAndAnalize(filters, function (page, data) {
                    onPageProcessed.call(self, page, data)
                });
            };

            this.clonePage = function (pageNumber, clonePageCallback) {
                var page = this.getPage(pageNumber);
                var imageID = page.getCurrentImageID();
                if (!imageID) {
                    return;
                }

                var self = this;
                var selfURL = _serviceUrl;
                var selfSessionID = _sessionId;
                var selfJobId = _jobId;

                var request = getDefaultRequest();
                request.url = _serviceUrl + _sessionId;
                request.type = 'POST';
                request.processData = false;
                request.dataType = 'json';
                request.data = JSON.stringify({Source: imageID, JobID: _jobId});
                request.jsonp = null;
                request.success = function (data) {
                    var page = new Page(selfURL, selfSessionID, selfJobId, data.Target, null, null);
                    self.add(page);
                    clonePageCallback(page);
                };
                ajaxRequest(request);
            };

            var onImageInfoReceived = function (pageNumber, data, idList, fileType, pageSavedCallback, savingFinishedCallback) {
                var self = this;
                if (pageNumber !== 0) {
                    idList += ',';
                }

                idList += data.ImageID;

                if (pageNumber === self.pages.length - 1) {
                    var request = getDefaultRequest();
                    request.url = _serviceUrl + "getmultipageid?session=" + _sessionId + "&idlist=" + idList + "&filetype=" + fileType;
                    AsyncOperation(_serviceUrl, sessionId, request, pageSavedCallback, savingFinishedCallback);
                }
                else {
                    pageNumber++;
                    self.pages[pageNumber].getImageInfo(function (page, data) {
                        pageSavedCallback(page, data);
                        onImageInfoReceived.call(self, pageNumber, data, idList, fileType, pageSavedCallback, savingFinishedCallback);
                    });
                }
            };

            var onPageProcessed = function (page, data) {
                var self = this;
                _pageProcessedCallback(page, data);
                _enhancePageNumber++;
                if (_enhancePageNumber >= self.pages.length) {
                    _finishedProcessingCallback();
                }
                else {
                    self.pages[_enhancePageNumber].enhanceAndAnalize(filters, function (page, data) {
                        onPageProcessed.call(self, page, data)
                    });
                }
            };
        };
    })
};