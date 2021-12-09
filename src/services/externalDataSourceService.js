module.exports = function (app) {
    app.service('externalDataSourceService', function (urlService,
                                                       generator,
                                                       dialog,
                                                       $q,
                                                       _,
                                                       $http,
                                                       cmsTemplate,
                                                       langService,
                                                       toast,
                                                       ExtImportStore,
                                                       userExternalDataSourceService) {
        'ngInject';
        var self = this;
        self.serviceName = 'externalDataSourceService';

        self.externalDataSources = [];

        /**
         * @description load external data sources from server.
         * @returns {Promise|externalDataSources}
         */
        self.loadExternalDataSources = function () {
            return $http.get(urlService.externalDataSource).then(function (result) {
                self.externalDataSources = generator.generateCollection(result.data.rs, ExtImportStore, self._sharedMethods);
                self.externalDataSources = generator.interceptReceivedCollection('ExtImportStore', self.externalDataSources);
                return self.externalDataSources;
            });
        };

        /**
         * @description get external data sources from self.externalDataSources if found and if not load it from server again.
         * @returns {Promise|externalDataSources}
         */
        self.getExternalDataSources = function () {
            return self.externalDataSources.length ? $q.when(self.externalDataSources) : self.loadExternalDataSources();
        };

        /**
         * @description load active external data sources from server.
         * @returns {Promise|externalDataSources}
         */
        self.loadActiveExternalDataSources = function () {
            return $http.get(urlService.externalDataSource + '/active').then(function (result) {
                return generator.interceptReceivedCollection('ExtImportStore', generator.generateCollection(result.data.rs, ExtImportStore, self._sharedMethods));
            });
        };

        /**
         * @description Contains methods for CRUD operations for externalDataSources
         */
        self.controllerMethod = {
            externalDataSourceAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('external-data-source'),
                        controller: 'externalDataSourcePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            externalDataSource: new ExtImportStore()
                        }
                    })
            },
            externalDataSourceEdit: function (externalDataSource, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('external-data-source'),
                        controller: 'externalDataSourcePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            externalDataSource: angular.copy(externalDataSource)
                        }
                    })
            },
            externalDataSourceDelete: function (externalDataSource, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: externalDataSource.getNames()}))
                    .then(function () {
                        return self.deleteExternalDataSource(externalDataSource).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: externalDataSource.getNames()}));
                            return true;
                        })
                    });
            },
            externalDataSourceDeleteBulk: function (externalDataSources, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.deleteBulkExternalDataSources(externalDataSources);
                    });
            }
        };

        /**
         * @description add new externalDataSource
         * @param externalDataSource
         * @return {Promise|externalDataSource}
         */
        self.addExternalDataSource = function (externalDataSource) {
            return $http
                .post(urlService.externalDataSource,
                    generator.interceptSendInstance('ExtImportStore', externalDataSource))
                .then(function (result) {
                    return generator.interceptReceivedInstance('ExtImportStore', generator.generateInstance(result.data.rs, ExtImportStore, self._sharedMethods));
                });
        };

        /**
         * @description make an update for given externalDataSource.
         * @param externalDataSource
         * @return {Promise|externalDataSource}
         */
        self.updateExternalDataSource = function (externalDataSource) {
            return $http
                .put(urlService.externalDataSource,
                    generator.interceptSendInstance('ExtImportStore', externalDataSource))
                .then(function () {
                    return externalDataSource;
                });
        };

        /**
         * @description delete given externalDataSource.
         * @param externalDataSource
         * @return {Promise|null}
         */
        self.deleteExternalDataSource = function (externalDataSource) {
            var id = externalDataSource.hasOwnProperty('id') ? externalDataSource.id : externalDataSource;
            return $http.delete(urlService.externalDataSource + '/' + id).then(function (result) {
                return result;
            });
        };

        /**
         * @description delete bulk externalDataSources.
         * @param externalDataSources
         * @return {Promise|null}
         */
        self.deleteBulkExternalDataSources = function (externalDataSources) {
            var bulkIds = externalDataSources[0].hasOwnProperty('id') ? _.map(externalDataSources, 'id') : externalDataSources;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.externalDataSource + '/bulk',
                data: bulkIds
            }).then(function (result) {
                return generator.getBulkActionResponse(result, externalDataSources, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };

        /**
         * @description activate externalDataSource
         * @param externalDataSource
         */
        self.activateExternalDataSource = function (externalDataSource) {
            return $http
                .put((urlService.externalDataSource + '/activate/' + externalDataSource.id))
                .then(function () {
                    return externalDataSource;
                });
        };

        /**
         * @description Deactivate externalDataSource
         * @param externalDataSource
         */
        self.deactivateExternalDataSource = function (externalDataSource) {
            return $http
                .put((urlService.externalDataSource + '/deactivate/' + externalDataSource.id))
                .then(function () {
                    return externalDataSource;
                });
        };

        /**
         * @description Activate bulk of externalDataSources
         * @param externalDataSources
         */
        self.activateBulkExternalDataSources = function (externalDataSources) {
            return $http
                .put((urlService.externalDataSource + '/activate/bulk'), _.map(externalDataSources, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, externalDataSources, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                    //return externalDataSources;
                });
        };

        /**
         * @description Deactivate bulk of externalDataSources
         * @param externalDataSources
         */
        self.deactivateBulkExternalDataSources = function (externalDataSources) {
            return $http
                .put((urlService.externalDataSource + '/deactivate/bulk'), _.map(externalDataSources, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, externalDataSources, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                    //    return externalDataSources;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param externalDataSource
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateExternalDataSource = function (externalDataSource, editMode) {
            var recordsToFilter = self.externalDataSources;
            if (editMode) {
                recordsToFilter = _.filter(recordsToFilter, function (record) {
                    return record.id !== externalDataSource.id;
                });
            }
            return _.some(_.map(recordsToFilter, function (existingRecord) {
                return existingRecord.arName === externalDataSource.arName
                    || existingRecord.enName.toLowerCase() === externalDataSource.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(null, self.updateExternalDataSource);
    });
};
