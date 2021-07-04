module.exports = function (app) {
    app.service('downloadService', function (urlService,
                                             $http,
                                             CMSModelInterceptor,
                                             AnnotationType,
                                             $q,
                                             tokenService,
                                             helper,
                                             langService,
                                             toast,
                                             $timeout,
                                             dialog,
                                             cmsTemplate,
                                             rootEntity,
                                             generator,
                                             $stateParams,
                                             errorCode,
                                             Information,
                                             $sce) {
        'ngInject';
        var self = this;
        self.serviceName = 'downloadService';
        var attachmentService;

        self.controllerMethod = {
            /**
             * @description Download the main document
             * @param record
             * @param $event
             * @param ignoreMAIP
             */
            mainDocumentDownload: function (record, $event, ignoreMAIP) {
                var info = record.getInfo();
                return self.selectMAIPLabels(ignoreMAIP)
                    .then(function (selectedLabel) {
                        var labelId = null;
                        if (!!selectedLabel && typeof selectedLabel === 'string') {
                            // download with labelId
                            labelId = selectedLabel;
                        }
                        return self.downloadMainDocument(info.vsId, info.docClassId, labelId).then(function (result) {
                            window.open(result);
                            //generator.checkIfBrowserPopupBlocked(window);
                            return true;
                        });
                    }).catch(function (error) {
                        errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                            dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                            //dialog.errorMessage(langService.get('certificate_missing'))
                        });
                        return false;
                    })
            },
            /**
             * @description Download Composite Document
             * @param record
             * @param $event
             */
            compositeDocumentDownload: function (record, $event) {
                var info = record.getInfo();
                return self.selectMAIPLabels()
                    .then(function (selectedLabel) {
                        var labelId = null;
                        if (!!selectedLabel && typeof selectedLabel === 'string') {
                            // download with labelId
                            labelId = selectedLabel;
                        }
                        return self.downloadCompositeDocument(info.vsId, info.docClassId, labelId).then(function (result) {
                            window.open(result);
                            return true;
                        });
                    }).catch(function (error) {
                        errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                            dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                            //dialog.errorMessage(langService.get('certificate_missing'))
                        });
                        return false;
                    });
            },
            /**
             * @description Download Attachment
             * @param attachmentVsId
             * @param docClassId
             * @param documentVsId
             * @param $event
             */
            attachmentDownload: function (attachmentVsId, docClassId, documentVsId, $event) {
                attachmentVsId = typeof attachmentVsId.getInfo === 'function' ? attachmentVsId.getInfo().vsId : attachmentVsId;
                return self.downloadAttachment(attachmentVsId, docClassId, documentVsId).then(function (result) {
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
            /**
             * @description Download Document Template
             * @param vsId
             * @param $event
             */
            documentTemplateDownload: function (vsId, $event) {
                vsId = vsId && vsId.hasOwnProperty('vsId') ? vsId.vsId : vsId;
                return self.downloadDocumentTemplate(vsId)
                    .then(function (result) {
                        window.open(result);
                        return true;
                    });
            },
            /**
             * @description Opens the popup to enter OTP by external user
             * @param $event
             * @returns {*}
             */
            externalDocOtpDialog: function ($event) {
                dialog.hide();
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('otp'),
                        controllerAs: 'ctrl',
                        bindToController: true,
                        controller: 'otpPopCtrl',
                        targetEvent: $event || null
                    });
            }
        };

        var _isEntityMaipEnabled = function () {
            return rootEntity.returnRootEntity().rootEntity.isMAIPEnabled;
        };

        var _generateQueryString = function (queryStringOptions) {
            var queryString = '?', keys = Object.keys(queryStringOptions), key, valid = false;
            for (var i = 0; i < keys.length; i++) {
                key = keys[i];
                valid = typeof queryStringOptions[key] !== 'undefined' && queryStringOptions[key] !== null && queryStringOptions[key] !== '';
                if (valid) {
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
        self.downloadMainDocument = function (vsId, docClassId, labelId) {
            var queryString = _generateQueryString({
                //'tawasol-auth-header': tokenService.getToken(),
                'labelId': labelId,
                'docClassId': docClassId
            });
            return $http
                .get(urlService.downloadDocument + '/' + vsId + queryString)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description download main document as PDF from server
         */
        self.getMainDocumentContentAsPDF = function (vsId, labelId) {
            var queryString = _generateQueryString({
                    //'tawasol-auth-header': tokenService.getToken(),
                    'labelId': labelId,
                    'with-protection': true
                }),
                url = urlService.downloadDocumentContentPDF.replace('{vsId}', vsId) + queryString;
            return $http.get(url, {
                responseType: 'blob'
            })
                .then(function (result) {
                    return result.data;
                })
        };

        /**
         * @description download attachment content as PDF from server
         */
        self.getAttachmentContentAsPDF = function (vsId, labelId) {
            var queryString = _generateQueryString({
                    //'tawasol-auth-header': tokenService.getToken(),
                    'labelId': labelId,
                    'with-protection': true
                }),
                url = urlService.downloadAttachmentContentPDF.replace('{vsId}', vsId) + queryString;
            return $http.get(url, {
                responseType: 'blob'
            })
                .then(function (result) {
                    return result.data;
                })
        };

        /**
         * @description download composite document from server
         */
        self.downloadCompositeDocument = function (vsId, docClassId, labelId) {
            var queryString = _generateQueryString({
                //'tawasol-auth-header': tokenService.getToken(),
                'labelId': labelId,
                'docClassId': docClassId
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
        self.downloadAttachment = function (attachmentVsId, docClassId, documentVsId) {
            var queryString = _generateQueryString({
                'corVsid': documentVsId,
                'docClassId': docClassId
            });
            return $http
                .get(urlService.downloadDocumentAttachment + '/' + attachmentVsId + queryString)
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
         * @param vsId
         * @param docClassId
         */
        self.getMainDocumentEmailContent = function (vsId, docClassId) {
            self.selectMAIPLabels()
                .then(function (selectedLabel) {
                    var labelId = null;
                    if (!!selectedLabel && typeof selectedLabel === 'string') {
                        // download with labelId
                        labelId = selectedLabel;
                    }
                    var queryString = _generateQueryString({
                        //'tawasol-auth-header' : tokenService.getToken(),
                        'labelId': labelId,
                        'docClassId': docClassId
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
                        .catch(function (error) {
                            if (errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES') === true) {
                                dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                                return $q.reject(error);
                            }
                            return $q.reject(error);
                        })
                });
        };

        /**
         * @description get composite document email content from server
         * @param vsId
         * @param docClassId
         */
        self.getCompositeDocumentEmailContent = function (vsId, docClassId) {
            self.selectMAIPLabels()
                .then(function (selectedLabel) {
                    var labelId = null;
                    if (!!selectedLabel && typeof selectedLabel === 'string') {
                        // download with labelId
                        labelId = selectedLabel;
                    }
                    var queryString = _generateQueryString({
                        //'tawasol-auth-header' : tokenService.getToken(),
                        'labelId': labelId,
                        'docClassId': docClassId
                    });

                    dialog.confirmThreeButtonMessage(langService.get('select_attachment_type_to_email'), '', langService.get('send_as_pdf_file'), langService.get('send_as_zip_file'))
                        .then(function (result) {
                            var pdfServiceUrl = urlService.getDocumentCompositeEmailContent.replace('email/', 'email/pdf/') + '/' + vsId;
                            var zipServiceUrl = urlService.getDocumentCompositeEmailContent + '/' + vsId + queryString;
                            $http
                                .get(result.button === 1 ? pdfServiceUrl : zipServiceUrl)
                                .then(function (result) {
                                    if (helper.browser.isFirefox()) {
                                        window.open(result.data.rs);
                                    } else {
                                        _download(result.data.rs, 'Tawasol.msg');
                                    }
                                })
                                .catch(function (error) {
                                    if (errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES') === true) {
                                        dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                                        return $q.reject(error);
                                    }
                                    return $q.reject(error);
                                })
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
        };

        /**
         * @description Gets the document url for external user and download/view the file
         * @param otp
         * @returns {*}
         */
        self.viewOTPDocument = function (otp) {
            if (!$stateParams.subscriberId || !$stateParams.entity || !otp) {
                toast.error(langService.get('otp_failed_to_download'));
                return $q.reject('INVALID_LINK_OTP');
            }
            //var url = urlService.documentLink + "/view-link/" + $stateParams.subscriberId + "/entity/" + $stateParams.entity + '?otp=' + otp;
            var url = urlService.viewDocumentLink.change({
                subscriberId: $stateParams.subscriberId,
                entity: $stateParams.entity,
                otp: otp
            });

            tokenService.excludeUrlInRuntime(url);

            return $http.get(url, {
                responseType: 'blob',
                ignore: true
            }).then(function (result) {
                var urlObj = window.URL.createObjectURL(result.data);
                var fileName = urlObj.substring(urlObj.lastIndexOf('/') + 1);
                if (helper.browser.isIE()) {
                    window.navigator.msSaveOrOpenBlob(result.data);
                } else {
                    dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-document-readonly'),
                        controller: 'viewDocumentReadOnlyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            escapeEmployeeCheck: true,
                            document: new Information({arName: fileName, enName: fileName}),
                            content: {viewURL: $sce.trustAsResourceUrl(urlObj)},
                            typeOfDoc: 'otp-doc'
                        }
                    });
                }

                return true;
            }).catch(function (error) {

                var reader = new FileReader();
                reader.onload = function () {
                    error.data = angular.fromJson(reader.result);
                    errorCode.checkIf(error, "INVALID_LINK", function () {
                        toast.error(langService.get('otp_failed_to_download'));
                    });
                    errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                        dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                    });
                };
                reader.readAsText(error.data);
                return $q.reject('INVALID_LINK');
            })
        };

        /**
         * @description open selected download dialog
         * @param correspondence
         * @param $event
         * @returns {promise}
         */
        self.openSelectedDownloadDialog = function (correspondence, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('selected-download'),
                controllerAs: 'ctrl',
                eventTarget: $event || null,
                controller: 'selectedDownloadPopCtrl',
                bindToController: true,
                locals: {
                    correspondence: correspondence
                }
            });
        };


        /**
         * @description downloadS elected options
         * @param downloadOptions
         * @param correspondence
         * @returns {*}
         */
        self.downloadSelectedOptions = function (downloadOptions, correspondence) {
            var info = correspondence.getInfo();
            return $http.put(urlService.downloadSelected.replace('{documentClass}', info.documentClass.toLowerCase()) + "/" + info.vsId, downloadOptions)
                .then(function (result) {
                    window.open(result.data.rs, '_blank');
                }).catch(function (error) {
                    errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                        dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                        //dialog.errorMessage(langService.get('certificate_missing'))
                    });
                    return false;
                });
        };
        /**
         * @description download all document with linked/attachment in one PDF
         * @param correspondence
         * @returns {*}
         */
        self.mergeAndDownload = function (correspondence) {
            var info = correspondence.getInfo();
            return $http.put(urlService.downloadSelected.replace('{documentClass}', info.documentClass.toLowerCase()) + "/" + info.vsId, {
                BOOK: true,
                ATTACHMENTS: [],
                RELATED_BOOKS: []
            }, {
                params: {
                    includeAll: true
                }
            }).then(function (result) {
                    window.open(result.data.rs, '_blank');
                }
            ).catch(function (error) {
                errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                    dialog.errorMessage(generator.getTranslatedError(error) || langService.get('certificate_missing'));
                    //dialog.errorMessage(langService.get('certificate_missing'))
                });
                return false;
            })
        };
        /**
         * @description download content without Water mark
         * @param correspondence = required correspondence or workItem to get from inside some information like vsId,documentClass
         * @param annotationType = optional param if it is exist and the value equal to AnnotationType.SIGNATURE
         * then we will use another service to get the content (openForApproval) to remove the signatureBox if exists.
         * @returns {*}
         */
        self.downloadContentWithOutWaterMark = function (correspondence, annotationType) {
            var method = annotationType === AnnotationType.SIGNATURE ? 'downloadDocumentContentForApproval' : 'downloadDocumentContentWithoutWaterMark';
            return attachmentService[method](correspondence);
        };
        /**
         * @description download content with waterMark.
         * @param correspondence
         * @param annotationType
         * @returns {*}
         */
        self.downloadContentWithWaterMark = function (correspondence, annotationType) {
            if (annotationType === AnnotationType.SIGNATURE) {
                return self.downloadContentWithOutWaterMark(correspondence, annotationType);
            }
            var info = correspondence.getInfo();
            var url = urlService.downloadDocumentContentPDF.replace('{vsId}', info.vsId);
            if (info.isAttachment) {
                url = url.replace('mobility', 'mobility/attachment');
            }
            return $http.get(url, {
                responseType: 'blob'
            }).then(function (result) {
                return result.data;
            })
        };

        self.setAttachmentService = function (service) {
            attachmentService = service;
            return self;
        };

        self.loadCustomFontPSPDF = function (fontFileName) {
            return $http.get('/dist/pspdf_fonts/' + fontFileName, {
                responseType: 'blob'
            })
                .then(result => {
                    if (result.status === 200) {
                        return result.data;
                    } else {
                        throw new Error();
                    }
                })
        }

        $timeout(function () {
            CMSModelInterceptor.runEvent('downloadService', 'init', self);
        }, 100);

    });
};
