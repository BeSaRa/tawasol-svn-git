module.exports = function (app) {
    app.controller('externalDataSourcesCtrl', function (lookupService,
                                                        externalDataSourceService,
                                                        externalDataSources,
                                                        $q,
                                                        $filter,
                                                        generator,
                                                        langService,
                                                        toast,
                                                        dialog,
                                                        errorCode,
                                                        gridService,
                                                        contextHelpService) {
        'ngInject';
        var self = this;

        self.controllerName = 'externalDataSourcesCtrl';
        contextHelpService.setHelpTo('external-data-sources');

        /**
         * @description All external data source
         * @type {*}
         */
        self.externalDataSources = externalDataSources;
        self.externalDataSourcesCopy = angular.copy(self.externalDataSources);

        /**
         * @description Contains the selected external data source
         * @type {Array}
         */
        self.selectedExternalDataSources = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            name: gridService.grids.administration.externalDataSources,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.externalDataSources) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.externalDataSources),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.externalDataSources, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                dataSourceJndi: 'dataSourceJndi',
                sourceName: 'sourceName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.externalDataSources = gridService.searchGridData(self.grid, self.externalDataSourcesCopy);
            }
        };

        /**
         *@description Contains methods for CRUD operations for external data sources
         */
        self.statusServices = {
            'activate': externalDataSourceService.activateBulkExternalDataSources,
            'deactivate': externalDataSourceService.deactivateBulkExternalDataSources,
            'true': externalDataSourceService.activateExternalDataSource,
            'false': externalDataSourceService.deactivateExternalDataSource
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.externalDataSources = $filter('orderBy')(self.externalDataSources, self.grid.order);
        };

        /**
         * @description Reload the grid of external data source
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadExternalDataSources = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return externalDataSourceService
                .loadExternalDataSources()
                .then(function (result) {
                    self.externalDataSources = result;
                    self.externalDataSourcesCopy = angular.copy(self.externalDataSources);
                    self.selectedExternalDataSources = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Opens dialog for add new external data source
         * @param $event
         */
        self.openAddExternalDataSourcesDialog = function ($event) {
            externalDataSourceService
                .controllerMethod
                .externalDataSourceAdd($event)
                .then(function (result) {
                    self.reloadExternalDataSources(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit external data source
         * @param $event
         * @param externalDataSource
         */
        self.openEditExternalDataSourcesDialog = function (externalDataSource, $event) {
            externalDataSourceService
                .controllerMethod
                .externalDataSourceEdit(externalDataSource, $event)
                .then(function (result) {
                    self.reloadExternalDataSources(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Delete single external data source
         * @param externalDataSource
         * @param $event
         */
        self.removeExternalDataSource = function (externalDataSource, $event) {
            externalDataSourceService
                .controllerMethod
                .externalDataSourceDelete(externalDataSource, $event)
                .then(function () {
                    self.reloadExternalDataSources(self.grid.page);
                })
            /*.catch(function (error) {
                if (!error)
                    return;
                errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                    dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                        lookup: langService.get('external_data_source'),
                        used: langService.get('other_users')
                    }), null, null, $event);
                });
            });*/
        };

        /**
         * @description Delete multiple selected external data sources
         * @param $event
         */
        self.removeBulkExternalDataSources = function ($event) {
            externalDataSourceService
                .controllerMethod
                .externalDataSourceDeleteBulk(self.selectedExternalDataSources, $event)
                .then(function () {
                    self.reloadExternalDataSources(self.grid.page);
                });
        };

        /**
         * @description Change the status of external data source from grid
         * @param externalDataSource
         */
        self.changeStatusExternalDataSource = function (externalDataSource) {
            self.statusServices[externalDataSource.status](externalDataSource)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    externalDataSource.status = !externalDataSource.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Change the status of selected external data sources
         * @param status
         */
        self.changeStatusBulkExternalDataSources = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedExternalDataSources, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }
            self.statusServices[status](self.selectedExternalDataSources).then(function () {
                self.reloadExternalDataSources(self.grid.page);
            });
        };
    });
};
