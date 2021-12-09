module.exports = function (app) {
    app.service('documentSecurityService', function (urlService,
                                                     $http,
                                                     $q,
                                                     _,
                                                     errorCode,
                                                     helper,
                                                     tokenService,
                                                     langService,
                                                     DocumentSecurity,
                                                     downloadService,
                                                     toast,
                                                     generator,
                                                     correspondenceService,
                                                     cmsTemplate,
                                                     ViewerLog,
                                                     dialog) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentSecurityService';

        self.documentSecurity = null;
        /**
         * @description Loads the document security and settings from database
         * @returns {*}
         */
        self.loadDocumentSecurity = function () {
            return $http.get(urlService.documentSecurity + '/setting')
                .then(function (result) {
                    if (result.data.rs) {
                        self.documentSecurity = generator.generateInstance(result.data.rs, DocumentSecurity, self._sharedMethods);
                        self.documentSecurity = generator.interceptReceivedInstance('DocumentSecurity', self.documentSecurity);
                        return self.documentSecurity;
                    }
                    self.documentSecurity = null;
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'NO_DOCUMENT_SECURITY')) {
                        self.documentSecurity = null;
                    }
                });
        };

        /**
         * @description Add new document security\\]\\
         * @param documentSecurity
         * @return {Promise|DocumentSecurity}
         */
        self.previewDocumentSecurity = function (documentSecurity) {
            var defer = $q.defer();
            var xhr = new XMLHttpRequest();
            xhr.open("POST", urlService.documentSecurity + '/previewSettings');
            xhr.setRequestHeader('tawasol-auth-header', encodeURI(tokenService.getToken()));
            xhr.setRequestHeader('Content-type', encodeURI('application/json;charset=UTF-8'));
            xhr.responseType = "blob";
            xhr.send(JSON.stringify(generator.interceptSendInstance('DocumentSecurity', documentSecurity)));
            xhr.onload = function (ev) {
                if (helper.browser.isIE()) {
                    window.navigator.msSaveOrOpenBlob(xhr.response);
                } else {
                    defer.resolve(xhr.response);
                }
            };
            return defer.promise;
        };

        /**
         * @description Adds the new document security and settings
         * @param documentSecurity
         * @returns {*}
         */
        self.addDocumentSecurity = function (documentSecurity) {
            return $http
                .post(urlService.documentSecurity,
                    generator.interceptSendInstance('DocumentSecurity', documentSecurity))
                .then(function (result) {
                    toast.success(langService.get('add_document_security_success'));
                    return documentSecurity;
                })
                .catch(function (error) {
                    //console.log(error);
                    return false;
                });
        };

        /**
         * @description Updates the document security and settings
         * @param documentSecurity
         * @returns {*}
         */
        self.saveDocumentSecurity = function (documentSecurity) {
            return $http
                .put(urlService.documentSecurity,
                    generator.interceptSendInstance('DocumentSecurity', documentSecurity))
                .then(function (result) {
                    toast.success(langService.get('update_document_security_success'));
                    return documentSecurity;
                })
                .catch(function (error) {
                    //console.log(error);
                    return false;
                });
        };


        /**
         * @description Opens the dialog to search documents to get logs
         * @param existingDocs
         * @param viewCorrespondenceCallback
         * @param $event
         */
        self.openSearchDocumentDialog = function (existingDocs, viewCorrespondenceCallback, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('search-linked-document'),
                    controller: 'searchLinkedDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        linkedDocs: existingDocs,
                        viewCallback: viewCorrespondenceCallback,
                        excludeVsId: null,
                        isAdminSearch: true,
                        multiSelect: true
                    },
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getAllOrganizationsStructure()
                                .then(function (organizations) {
                                    return _.filter(organizations, function (organization) {
                                        return organization.hasRegistry;
                                    })
                                });
                        },
                        lookups: function (correspondenceService) {
                            'ngInject';
                            return correspondenceService.loadCorrespondenceLookups('common');
                        },
                        correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                            'ngInject';
                            return correspondenceSiteTypeService.getCorrespondenceSiteTypes();
                        }
                    }
                }).then(function (correspondences) {
                    var vsIds = _.map(existingDocs, 'vsId'); // get current documents vsIds
                    correspondences = angular.isArray(existingDocs) ? existingDocs.concat(_filterExists(correspondences, vsIds)) : correspondences;
                    return correspondences;
                });
        };

        function _filterExists(correspondences, vsIds) {
            return _.filter(correspondences, function (correspondence) {
                return vsIds.indexOf(correspondence.getInfo().vsId) === -1;
            });
        }

        /**
         * @description Search for viewer log documents by watermark or vsId
         * @param watermark
         * @param vsIds
         * @returns {*}
         */
        self.loadDocumentsForViewerLogs = function (watermark, vsIds) {
            if (vsIds) {
                if (!angular.isArray(vsIds))
                    vsIds = [vsIds];

                if (vsIds.length && vsIds[0].hasOwnProperty('vsId')) {
                    vsIds = _.map(vsIds, function (record) {
                        return record.getInfo().vsId;
                    });
                }
            } else {
                vsIds = [];
            }
            return $http
                .post(urlService.documentSecurity + '/viewer-log/search', {
                    first: vsIds,
                    second: watermark ? watermark : ''
                }).then(function (result) {
                    result = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                    return result;
                })
        };

        /**
         * @description Get viewer logs by vsId
         * @param vsIds
         * @param $event
         * @returns {*}
         */
        self.loadViewerLogsByVsId = function (vsIds, $event) {
            if (vsIds) {
                if (!angular.isArray(vsIds))
                    vsIds = [vsIds];

                if (vsIds.length && vsIds[0].hasOwnProperty('vsId')) {
                    vsIds = _.map(vsIds, function (record) {
                        return record.getInfo().vsId;
                    });
                }
            }
            return $http
                .post(urlService.documentSecurity + '/viewer-log/vsid', vsIds)
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, ViewerLog, self._sharedMethods);
                    result = generator.interceptReceivedCollection('ViewerLog', result);
                    return result;
                })
        };

        /**
         * @description Returns the url to download the excel sheet after generating it.
         * @param heading
         * @param data
         * @returns {string}
         */
        self.exportViewerLogToExcel = function (heading, data) {
            var exportData = _getExportData(heading, data);
            if (!exportData.headerNames.length) {
                toast.info(langService.get('no_data_to_export'));
            } else {
                $http.post(urlService.exportToExcel, exportData)
                    .then(function (result) {
                        if (!result.data.rs)
                            toast.error(langService.get('error_export_to_excel'));
                        else
                            downloadService.controllerMethod.fileDownload(result.data.rs);
                    })
                    .catch(function (error) {
                        toast.error(langService.get('error_export_to_excel'));
                    });
            }
        };


        /**
         * @description Returns the url to download the pdf after generating it.
         * @param heading
         * @param data
         * @returns {string}
         */
        self.exportViewerLogToPDF = function (heading, data) {
            var exportData = _getExportData(heading, data);
            if (!exportData.headerNames.length) {
                toast.info(langService.get('no_data_to_print'));
            } else {
                return $http.post(urlService.exportToPdf, exportData)
                    .then(function (result) {
                        if (!result.data.rs)
                            toast.error(langService.get('error_print'));
                        else
                            downloadService.controllerMethod.fileDownload(result.data.rs);
                    })
                    .catch(function (error) {
                        toast.error(langService.get('error_print'));
                    });
            }
        };

        var _getExportData = function (heading, logsList) {
            var headerNames = [],
                data = [],
                i, record;
            if (logsList && logsList.length) {
                headerNames = [
                    langService.get('view_tracking_sheet_viewers'),
                    langService.get('action'),
                    langService.get('watermark')
                ];
                for (i = 0; i < logsList.length; i++) {
                    record = logsList[i];
                    data.push([
                        record.userInfo.getTranslatedName(),
                        record.itemTypeInfo.getTranslatedName(),
                        record.key
                    ]);
                }
            }
            return {
                headerText: heading,
                headerNames: headerNames,
                data: data
            };
        }
    })
};
