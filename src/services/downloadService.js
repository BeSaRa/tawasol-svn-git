module.exports = function (app) {
    app.service('downloadService', function (urlService,
                                             $http,
                                             $q,
                                             tokenService,
                                             helper,
                                             langService,
                                             toast,
                                             $timeout,
                                             dialog,
                                             cmsTemplate,
                                             rootEntity,
                                             generator) {
        'ngInject';
        var self = this;
        self.serviceName = 'downloadService';

        self.controllerMethod = {
            /**
             * @description Download the main document
             * @param vsId
             * @param $event
             * @param ignoreMAIP
             */
            mainDocumentDownload: function (vsId, $event, ignoreMAIP) {
                return self.selectMAIPLabels(ignoreMAIP)
                    .then(function (selectedLabel) {
                        var labelId = null;
                        if (!!selectedLabel && typeof selectedLabel === 'string') {
                            // download with labelId
                            labelId = selectedLabel;
                        }
                        vsId = typeof vsId.getInfo === 'function' ? vsId.getInfo().vsId : vsId;
                        return self.downloadMainDocument(vsId, labelId).then(function (result) {
                            window.open(result);
                            //generator.checkIfBrowserPopupBlocked(window);
                            return true;
                        });
                    })
            },
            /**
             * @description Download Composite Document
             * @param vsId
             * @param $event
             */
            compositeDocumentDownload: function (vsId, $event) {
                return self.selectMAIPLabels()
                    .then(function (selectedLabel) {
                        var labelId = null;
                        if (!!selectedLabel && typeof selectedLabel === 'string') {
                            // download with labelId
                            labelId = selectedLabel;
                        }
                        vsId = typeof vsId.getInfo === 'function' ? vsId.getInfo().vsId : vsId;
                        return self.downloadCompositeDocument(vsId, labelId).then(function (result) {
                            window.open(result);
                            return true;
                        });
                    })
            },
            /**
             * @description Download Attachment
             * @param vsId
             * @param $event
             */
            attachmentDownload: function (vsId, $event) {
                vsId = typeof vsId.getInfo === 'function' ? vsId.getInfo().vsId : vsId;
                return self.downloadAttachment(vsId).then(function (result) {
                    window.open(result);
                    return true;
                });
            },
            /**
             * @description Download File
             * @param path
             * @param $event
             */
            fileDownload: function (path, $event) {
                //var domain = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/";
                window.open(path);
            },
            documentTemplateDownload: function (vsId, $event) {
                vsId = vsId && vsId.hasOwnProperty('vsId') ? vsId.vsId : vsId;
                return self.downloadDocumentTemplate(vsId)
                    .then(function (result) {
                        window.open(result);
                        return true;
                    });
            }
        };

        var _isEntityMaipEnabled = function () {
            return rootEntity.returnRootEntity().rootEntity.isMAIPEnabled;
        };

        var _generateQueryString = function (queryStringOptions) {
            var queryString = '?', keys = Object.keys(queryStringOptions), key;
            for (var i = 0; i < keys.length; i++) {
                key = keys[i];
                if (queryStringOptions[key]) {
                    queryString += key + '=' + queryStringOptions[key] + '&';
                }
            }
            return queryString.substring(0, queryString.length - 1);
        };

        /**
         * @description Opens the dialog to select maip label
         * @returns {promise}
         */
        self.selectMAIPLabels = function (ignoreMAIP) {
            var defer = $q.defer();
            if (!_isEntityMaipEnabled() || ignoreMAIP) {
                // if entity is not using MAIP security
                $timeout(function () {
                    defer.resolve(true);
                })
            } else {
                dialog.confirmMessage(langService.get('confirm_protect_using_maip'))
                    .then(function () {
                        dialog
                            .showDialog({
                                templateUrl: cmsTemplate.getPopup('maip-label-selector'),
                                controller: function (dialog, maipLabels, _) {
                                    'ngInject';
                                    var self = this;
                                    var chunkSize = 3;
                                    self.maipLabels = maipLabels;
                                    /**
                                     * @description Hide dialog and return the selected label
                                     * @param selectedLabel
                                     * @param $event
                                     */
                                    self.setProtectionLabel = function (selectedLabel, $event) {
                                        if (!selectedLabel) {
                                            toast.info("Please select one label");
                                            return;
                                        }
                                        dialog.hide(selectedLabel.id)
                                    };

                                    /*self.setNoProtection = function ($event) {
                                        dialog.hide(true)
                                    };*/

                                    self.closePopup = function () {
                                        dialog.cancel();
                                    };
                                },
                                controllerAs: 'ctrl',
                                resolve: {
                                    maipLabels: function (MAIPLabel) {
                                        'ngInject';
                                        return $http.get(urlService.maipLabels)
                                            .then(function (result) {
                                                result = generator.generateCollection(result.data.rs, MAIPLabel);
                                                return generator.interceptReceivedCollection('MAIPLabel', result);
                                            })
                                    }
                                }
                            })
                            .then(function (result) {
                                defer.resolve(result);
                            })
                            .catch(function (error) {
                                defer.reject(false);
                            })
                    })
                    .catch(function () {
                        // no protection selected by user
                        defer.resolve(true);
                    });
            }
            return defer.promise;
        };

        /**
         * @description download main document from server
         */
        self.downloadMainDocument = function (vsId, labelId) {
            var queryString = _generateQueryString({
                //'tawasol-auth-header': tokenService.getToken(),
                'labelId': labelId
            });
            return $http
                .get(urlService.downloadDocument + '/' + vsId + queryString)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description download composite document from server
         */
        self.downloadCompositeDocument = function (vsId, labelId) {
            var queryString = _generateQueryString({
                //'tawasol-auth-header': tokenService.getToken(),
                'labelId': labelId
            });
            return $http
                .get(urlService.downloadDocumentComposite + '/' + vsId + queryString)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description download attachment from server
         */
        self.downloadAttachment = function (vsId) {
            return $http
                .get(urlService.downloadDocumentAttachment + '/' + vsId)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description download document template from server
         */
        self.downloadDocumentTemplate = function (vsId) {
            return $http
                .get(urlService.downloadDocumentTemplate + '/' + vsId)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description get main document email content from server
         */
        self.getMainDocumentEmailContent = function (vsId) {
            self.selectMAIPLabels()
                .then(function (selectedLabel) {
                    var labelId = null;
                    if (!!selectedLabel && typeof selectedLabel === 'string') {
                        // download with labelId
                        labelId = selectedLabel;
                    }
                    var queryString = _generateQueryString({
                        //'tawasol-auth-header' : tokenService.getToken(),
                        'labelId': labelId
                    });
                    $http
                        .get(urlService.getDocumentEmailContent + '/' + vsId + queryString)
                        .then(function (result) {
                            if (helper.browser.isFirefox()) {
                                window.open(result.data.rs);
                            } else {
                                _download(result.data.rs, 'Tawasol.msg');
                            }
                        })
                });
        };

        /**
         * @description get composite document email content from server
         */
        self.getCompositeDocumentEmailContent = function (vsId) {
            self.selectMAIPLabels()
                .then(function (selectedLabel) {
                    var labelId = null;
                    if (!!selectedLabel && typeof selectedLabel === 'string') {
                        // download with labelId
                        labelId = selectedLabel;
                    }
                    var queryString = _generateQueryString({
                        //'tawasol-auth-header' : tokenService.getToken(),
                        'labelId': labelId
                    });
                    $http
                        .get(urlService.getDocumentCompositeEmailContent + '/' + vsId + queryString)
                        .then(function (result) {
                            if (helper.browser.isFirefox()) {
                                window.open(result.data.rs);
                            } else {
                                _download(result.data.rs, 'Tawasol.msg');
                            }
                        })
                });
        };

        var _download = function (url, name) {
            var link = document.createElement('a');
            link.download = name || 'cms-download';
            link.href = url;
            //link.target = '_blank';
            link.click();
        };

        self.downloadRemoteFile = function (url, name) {
            return _download(url, name);
        }
    });
};
