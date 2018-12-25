module.exports = function (app) {
    app.factory('CCToolkit', function (getDefaultRequest,
                                       ImageCompression,
                                       networkErrorCallback,
                                       Document,
                                       Page,
                                       $q,
                                       TaskStatus,
                                       ajaxRequest,
                                       AsyncOperation,
                                       FileType,
                                       ISISWebErrorCode) {
        'ngInject';
        return function CCToolkit() {
            //initialize private fields
            var _host = "127.0.0.1:";
            var _baseServicePath = "/scanservice";
            var _servicePath = _baseServicePath + "/v2/";
            var _authServicePath = _baseServicePath + "/v2/auth/";
            var _cctSessionIdKey = "cct_session_id";
            var _httpPortNumbers = [49732/*, 49733, 49734*/];
            var _httpsPortNumbers = [49735, 49736, 49737];
            var _attemptsNumber = 0;
            var _serviceURL = null;
            var _authServiceURL = null;
            var _sessionID = null;
            var _scanJob = null;
            var _scanStartedCallback = null;
            var _pageScannedCallback = null;
            var _scanFinishedCallback = null;
            var _document = null;
            var _importing = null;

            //initialize public members
            this.getServiceUrl = function () {
                return _serviceURL;
            };

            this.getSessionId = function () {
                return _sessionID;
            };

            this.getDocument = function () {
                return _document;
            };

            this.setup = function (ajaxMethod, networkError) {
                networkErrorCallback = networkError;
                ajaxRequest = ajaxMethod;
            };

            this.loadScanner = function (params, callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "loadscanner?session=" + _sessionID + "&loadscanneroption=" + params.loadScannerOption;
                AsyncOperation(_serviceURL, _sessionID, request, function () {
                }, callback);
            };

            this.getScanners = function (params, callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "getscannerlist?session=" + _sessionID;
                AsyncOperation(_serviceURL, _sessionID, request, function () {
                }, callback);
            };

            this.loadScannerByName = function (scannerName, callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "loadscannerbyname?session=" + _sessionID + "&scannername=" + scannerName;
                AsyncOperation(_serviceURL, _sessionID, request, function () {
                }, callback);
            };

            this.endSession = function () {
                if (_sessionID) {
                    var request = getDefaultRequest();
                    request.url = _serviceURL + "endsession?session=" + _sessionID;
                    request.success = function () {
                    };
                    ajaxRequest(request);
                }
            };

            this.unloadScanner = function (callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "unloadscanner?session=" + _sessionID;
                request.success = callback;
                ajaxRequest(request);
            };

            this.showScannerConfigurationDialog = function (callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "showscannerui?session=" + _sessionID;
                AsyncOperation(_serviceURL, _sessionID, request, function () {
                }, callback);
            };

            this.existSession = function (callback, errorCallback) {
                var self = this;
                if (typeof (Storage) !== "undefined" && typeof (window.localStorage) !== "undefined") {
                    var lastSessionId = window.localStorage.getItem(_cctSessionIdKey);
                    if (lastSessionId === null || lastSessionId === 'undefined') {
                        callback(null, "");
                    } else {
                        _sessionID = lastSessionId;
                        _discoverService(function () {
                            // CCT service has been found so check if saved session still exists
                            _getStatus.call(self, _sessionID, "123", function (data) {
                                    // if invalid token error (-20 ) is returned then session exists so don't need to create new one
                                    if (data.Status === -20) {
                                        data.Status = 0;
                                        callback(data, _sessionID);
                                    } else {
                                        _sessionID = null;
                                        callback(data, "");
                                    }
                                },
                                function (data) {
                                    errorCallback(data);
                                });
                        });
                    }
                } else {
                    callback(null, "");
                }
            };

            this.createSession = function (params, callback, createSessionError) {
                if (!_serviceURL) {
                    var self = this;
                    _discoverService.call(this, function () {
                        _createSession.call(self, params, callback, createSessionError);
                    }, createSessionError);
                } else {
                    _createSession.call(this, params, callback, createSessionError);
                }
            };

            this.startScanning = function (scanStartedCallback, pageScannedCallback, scanFinishedCallback) {
                _scanStartedCallback = scanStartedCallback;
                _pageScannedCallback = pageScannedCallback;
                _scanFinishedCallback = scanFinishedCallback;
                _importing = false;
                var request = getDefaultRequest();
                request.url = _serviceURL + "createscanjob?session=" + _sessionID + "&pages=" + 0 + "&filetype=" + FileType.AutoDetect + "&compression=" + ImageCompression.AutoDetect;
                request.success = function (data) {
                    _onScanStarted(data, false);
                };
                ajaxRequest(request);
            };

            this.startImporting = function (fileContent, scanStartedCallback, pageScannedCallback, scanFinishedCallback) {
                _scanStartedCallback = scanStartedCallback;
                _pageScannedCallback = pageScannedCallback;
                _scanFinishedCallback = scanFinishedCallback;
                _importing = true;
                var request = getDefaultRequest();
                request.url = _serviceURL + "createimportjob?session=" + _sessionID;
                request.dataType = 'json';
                request.crossDomain = true;
                request.type = 'POST';
                request.jsonp = null;
                request.data = JSON.stringify({FileData: fileContent, PageSplitting: true});
                request.success = function (data) {
                    _onScanStarted(data, true);
                };
                ajaxRequest(request);
            };

            this.stopScanning = function (callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "stopscanning?scanjob=" + _scanJob.ScanJobID;
                request.success = callback;
                ajaxRequest(request);
            };

            this.stopImporting = function (callback) {
                this.stopScanning(callback);
            };

            this.getTag = function (tagID, index, callback) {
                var defer = $q.defer();
                var request = getDefaultRequest();
                request.url = _serviceURL + "gettag?session=" + _sessionID + "&tagid=" + tagID + "&index=" + index;
                request.success = function (data) {
                    callback(data);
                    defer.resolve(data);
                };
                ajaxRequest(request);
                return defer.promise;
            };

            this.setTagStringValue = function (tagID, value, callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "settagstringvalue?session=" + _sessionID + "&tagid=" + tagID + "&value=" + encodeURIComponent(value);
                request.success = callback;
                ajaxRequest(request);
            };

            this.setTagIntegerValue = function (tagID, value, index, callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "settagintegervalue?session=" + _sessionID + "&tagid=" + tagID + "&value=" + value + "&index=" + index;
                request.success = callback;
                ajaxRequest(request);
            };

            this.setTagRationalValue = function (tagID, numerator, denominator, index, callback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "settagrationalvalue?session=" + _sessionID + "&tagid=" + tagID + "&numerator=" + numerator + "&denominator=" + denominator + "&index=" + index;
                request.success = callback;
                ajaxRequest(request);
            };

            this.getImageURL = function (imageNumber, params) {
                return _serviceURL + "image/" + params.scanJobID + "/" + imageNumber + "?" + "filetype=" + params.filetype + "&compression=" + params.compression +
                    "&rotation=" + params.rotation + "&brightness=" + params.brightness + "&contrast=" + params.contrast + "&width=" + params.width + "&height=" + params.height;
            };

            //Begin private methods
            var _setScanJob = function (scanJob) {
                _scanJob = {
                    ScanJobID: scanJob.ScanJobID,
                    TokenID: scanJob.TokenID,
                    NumberOfScannedImages: scanJob.NumberOfScannedImages,
                    NumberOfReceivedImages: 0,
                    IsInImageLoading: false
                };
            };

            var _onScanStarted = function (data, importing) {
                //set scan job
                _setScanJob.call(this, data);

                _document = new Document(_serviceURL, _sessionID, _scanJob.ScanJobID, importing);
                //check job progress
                _pollScanner.call(this);

                if (_scanStartedCallback) {
                    _scanStartedCallback(data);
                }
            };

            var _getStatus = function (sessionId, tokenId, callback, errorCallback) {
                var request = getDefaultRequest();
                request.url = _serviceURL + "getstatus?session=" + sessionId + "&tokenid=" + tokenId;
                request.success = callback;
                if (errorCallback !== null) {
                    request.fail = errorCallback;
                }

                ajaxRequest(request);
            };

            var _pollScanner = function () {
                _getStatus(_sessionID, _scanJob.TokenID, _pollScannerCallback);
            };

            var _pollScannerCallback = function (data) {

                if (data.Status === 0 ||
                    data.Status === ISISWebErrorCode.ScanCancelError ||
                    data.Status === ISISWebErrorCode.InvalidLicenseScanRestriction) {
                    _scanJob.NumberOfScannedImages = data.NumberOfScannedImages;
                    if (_scanJob.NumberOfScannedImages > _scanJob.NumberOfReceivedImages) {
                        for (var i = _scanJob.NumberOfReceivedImages; i < _scanJob.NumberOfScannedImages; i++) {
                            var page = new Page(_serviceURL, _sessionID, _scanJob.ScanJobID, i, null, null);
                            _document.add(page);
                            _pageScannedCallback(data, page);
                            _scanJob.NumberOfReceivedImages++;
                        }
                    }
                }

                var self = this;
                if (data.Status === 0 && data.StatusCode === TaskStatus.InProgress) {
                    window.setTimeout(function () {
                        _pollScanner.call(self);
                    }, 1000);
                } else {
                    _scanFinishedCallback(data, _document);
                }
            };

            var _discoverService = function (callback) {

                _attemptsNumber = 0;
                var serviceURLs = _getServiceURLs.call(this);
                for (var i = 0; i < serviceURLs.length; i++) {
                    _checkServiceURL.call(this, serviceURLs[i], serviceURLs.length, callback);
                }
            };

            var _getServiceURLs = function () {
                var address = window.location.href;
                var protocol = (address.indexOf("https") === 0) ? "https://" : "http://";
                var portNumbers = (protocol === "https://") ? _httpsPortNumbers : _httpPortNumbers;
                var serviceURLs = [];
                for (var i = 0; i < portNumbers.length; i++) {
                    var serviceURL = protocol + _host + portNumbers[i] + _servicePath;
                    var authServiceURL = protocol + _host + portNumbers[i] + _authServicePath;
                    serviceURLs.push({
                        serviceURL: serviceURL,
                        authServiceURL: authServiceURL,
                        testURL: serviceURL + "getstatus"
                    });
                }
                return serviceURLs;
            };

            var _increaseAttemptsNumber = function (urlCount) {
                _attemptsNumber += 1;
                if (_attemptsNumber === urlCount) {
                    networkErrorCallback();
                }
            };

            var _checkServiceURL = function (url, urlCount, onPortDiscoverAction) {
                var request = getDefaultRequest();
                request.url = url.testURL;
                request.success = function () {
                    _authServiceURL = url.authServiceURL;
                    _serviceURL = url.serviceURL;
                    onPortDiscoverAction();
                };
                request.error = function () {
                    _increaseAttemptsNumber(urlCount)
                };
                ajaxRequest(request);
            };

            function getBase64Login(domain, login, pass) {
                return btoa(domain + ":" + login + ":" + pass);
            }

            var _createSession = function (params, callback, errorCallback) {
                var request = getDefaultRequest();
                if (params.useIWA === 'undefined') {
                    params.useIWA = false;
                }

                if (params.login !== undefined && params.password !== undefined && params.useIWA === false) {
                    request.beforeSend = function (req) {
                        var header = "Basic " + getBase64Login(params.domain, params.login, params.password);
                        req.setRequestHeader("Authorization", header);
                    };
                }

                var serviceURL;
                // use JSONP for IWA because otherwise preflight OPTION requests gets Unauthorized response which stops negotiation
                if (params.useIWA) {
                    request.dataType = 'jsonp';
                    request.jsonp = 'method';
                    serviceURL = _authServiceURL;
                } else {
                    request.dataType = 'json';
                    request.jsonp = null;
                    serviceURL = _serviceURL;
                }

                request.url = serviceURL + "createsession?license=" + params.licenseId + "&app=" + params.applicationId + "&closeexisting=" + params.closeExistingSessions + "&locale=" + params.locale + "&timeout=" + 0 + "&warndisableoption=" + params.warnDisableOption;
                request.success = function (data) {
                    if (data.SessionID && data.SessionID.length) {
                        _sessionID = data.SessionID;
                        if (typeof (Storage) !== "undefined" && typeof (window.localStorage) !== "undefined") {
                            window.localStorage.setItem(_cctSessionIdKey, _sessionID);
                        }
                    }
                    callback(data);
                };

                request.error = errorCallback;
                ajaxRequest(request);
            };

            //End private methods
        };


    });
};
