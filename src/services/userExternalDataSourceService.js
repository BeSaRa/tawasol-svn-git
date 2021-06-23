module.exports = function (app) {
    app.service('userExternalDataSourceService', function (urlService,
                                                           generator,
                                                           $http,
                                                           $q,
                                                           dialog,
                                                           toast,
                                                           langService,
                                                           cmsTemplate,
                                                           UserExtImportStore) {
        'ngInject';
        var self = this;
        self.serviceName = 'userExternalDataSourceService';

        /**
         * @description load user external data sources.
         * @returns {*}
         */
        self.loadUserExternalDataSources = function () {
            return $http.get(urlService.userExternalDataSource).then(function (result) {
                return generator.interceptReceivedCollection('UserExtImportStore', generator.generateCollection(result.data.rs, UserExtImportStore, self._sharedMethods));
            });
        };
        /**
         * @description load user external data sources by data source id.
         * @returns {*}
         */
        self.loadUserExternalDataSourcesBySourceId = function (dataSourceId) {
            return $http.get(urlService.userExternalDataSource + '/ext-store-id/' + generator.getNormalizedValue(dataSourceId, 'id')).then(function (result) {
                return generator.interceptReceivedCollection('UserExtImportStore', generator.generateCollection(result.data.rs, UserExtImportStore, self._sharedMethods));
            });
        };

        /**
         * @description load active user external data sources.
         * @returns {*}
         */
        self.loadActiveUserExternalDataSources = function () {
            return $http.get(urlService.userExternalDataSource + '/active').then(function (result) {
                return generator.interceptReceivedCollection('UserExtImportStore', generator.generateCollection(result.data.rs, UserExtImportStore, self._sharedMethods));
            });
        };

        /**
         * @description load user external data sources by user id and ou id.
         * @returns {*}
         */
        self.loadUserExternalDataSourcesByOuAndUserId = function (ouId, userId) {
            if (!ouId || !userId) {
                return $q.resolve([]);
            }
            return $http.get(urlService.userExternalDataSource + '/user-id/' + generator.getNormalizedValue(userId) + '/ou/' + generator.getNormalizedValue(ouId))
                .then(function (result) {
                    return generator.interceptReceivedCollection('UserExtImportStore', generator.generateCollection(result.data.rs, UserExtImportStore, self._sharedMethods));
                });
        };

        /**
         * @description Saves the user external data source
         * @param data
         */
        self.saveUserExternalDataSource = function (data) {
            if (data.id) {
                return _updateUserExternalDataSource(data);
            } else {
                return _addUserExternalDataSource(data);
            }
        };

        /**
         * @description Deletes the user external data source
         * @param userExternalDataSourceId
         */
        self.deleteUserExternalDataSource = function (userExternalDataSourceId) {
            return $http.delete((urlService.userExternalDataSource + '/' + generator.getNormalizedValue(userExternalDataSourceId, 'id')));
        };

        var _addUserExternalDataSource = function (data) {
            return $http.post(urlService.userExternalDataSource, generator.interceptSendInstance('UserExtImportStore', data))
                .then(function (result) {
                    data.id = result.data.rs;
                    return data;
                });
        };

        var _updateUserExternalDataSource = function (data) {
            return $http.put(urlService.userExternalDataSource, generator.interceptSendInstance('UserExtImportStore', data))
                .then(function (result) {
                    return data;
                });
        };

        /**
         * @description load meta data by store id and identifier
         * @returns {*}
         */
        self.loadMetaData = function (storeId, identifier) {
            if (!storeId || !identifier) {
                return $q.reject(null);
            }
            return $http.get(urlService.userExternalDataSource + '/id/' + generator.getNormalizedValue(storeId) + '?paramValue=' + identifier)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description load meta data by store id and identifier
         * @returns {*}
         */
        self.loadContent = function (storeId, identifier, asBlob) {
            if (!storeId || !identifier) {
                return $q.reject(null);
            }
            var options = {};
            if (asBlob) {
                options.responseType = 'blob';
            }
            return $http.get(urlService.userExternalDataSource + '/content/' + generator.getNormalizedValue(storeId) + '?paramValue=' + identifier, options)
                .then(function (result) {
                    return result.data;
                });
        };

        self.openExternalImportDialog = function () {
            return this.loadActiveUserExternalDataSources()
                .then(function (result) {
                    if (!result.length) {
                        toast.info(langService.get('msg_no_external_data_source_found'));
                        return false;
                    }
                    return dialog
                        .showDialog({
                            templateUrl: cmsTemplate.getPopup('external-datasource-import'),
                            controllerAs: 'ctrl',
                            controller: 'externalDataSourceImportPopCtrl',
                            locals: {
                                dataSourcesList: result
                            }
                        })
                })
        }

        self.openContentDialog = function (storeId, identifier, metaData) {
            self.loadContent(storeId, identifier, true)
                .then(function (blobResult) {
                    var data = {
                        metaData: metaData,
                        content: {
                            viewURL: generator.changeBlobToTrustedUrl(blobResult)
                        }
                    };
                    dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-document-readonly'),
                        controller: 'viewDocumentReadOnlyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            document: data.metaData,
                            content: data.content,
                            typeOfDoc: 'external-import'
                        }
                    });
                })

        }
    });
};
